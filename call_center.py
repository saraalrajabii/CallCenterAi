"""Palm Oasis Delivery: an AI voice call center built with Pipecat.

Based on the Pipecat OpenAI voice example (BSD 2-Clause, Daily).
"""


import os
from pathlib import Path

from dotenv import load_dotenv
from loguru import logger

from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.frames.frames import LLMRunFrame
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.worker import PipelineParams, PipelineWorker, ProcessorUnusablePolicy
from pipecat.processors.aggregators.llm_context import LLMContext
from pipecat.processors.aggregators.llm_response_universal import (
    LLMContextAggregatorPair,
    LLMUserAggregatorParams,
)
from pipecat.runner.types import RunnerArguments
from pipecat.runner.utils import create_transport
from pipecat.services.openai.llm import OpenAILLMService
from pipecat.services.openai.stt import OpenAIRealtimeSTTService
from pipecat.services.openai.tts import OpenAITTSService
from pipecat.transcriptions.language import Language
from pipecat.transports.base_transport import BaseTransport, TransportParams
from pipecat.workers.runner import WorkerRunner

load_dotenv(override=True)

# Load the company knowledge base (knowledge.md, next to this file).
KNOWLEDGE_FILE = Path(__file__).parent / "knowledge.md"
KNOWLEDGE = KNOWLEDGE_FILE.read_text(encoding="utf-8")

SYSTEM_PROMPT = f"""أنت موظف كول سنتر ودود ومحترف في "شركة واحة النخيل للتوصيل".

قواعد مهمة:
- جاوب فقط بالاعتماد على معلومات الشركة الموجودة بالأسفل. لا تخترع أي سعر أو رقم أو سياسة.
- إذا كان السؤال غير موجود في المعلومات، قل بلطف إنك ستحوّل المكالمة لموظف مختص.
- تكلم بالعربية بشكل افتراضي، وإذا تكلم العميل بالإنجليزية جاوب بالإنجليزية.
- إجاباتك ستُقرأ بصوت عالٍ: اجعلها قصيرة وواضحة (جملة أو جملتين)، وبدون رموز أو نقاط أو جداول أو إيموجي.
- اكتب الأرقام بطريقة سهلة النطق.
- لا تجاوب عن أي موضوع خارج خدمات الشركة.

معلومات الشركة:
{KNOWLEDGE}
"""

# We use lambdas to defer transport parameter creation until the transport
# type is selected at runtime.
transport_params = {
    "webrtc": lambda: TransportParams(
        audio_in_enabled=True,
        audio_out_enabled=True,
    ),
}


async def run_bot(transport: BaseTransport, runner_args: RunnerArguments):
    logger.info("Starting bot")

    stt = OpenAIRealtimeSTTService(
        api_key=os.environ["OPENAI_API_KEY"],
        settings=OpenAIRealtimeSTTService.Settings(language=Language.AR),
    )

    tts = OpenAITTSService(
        api_key=os.environ["OPENAI_API_KEY"],
        settings=OpenAITTSService.Settings(
            voice="ballad",
        ),
    )

    llm = OpenAILLMService(
        api_key=os.environ["OPENAI_API_KEY"],
        settings=OpenAILLMService.Settings(
            system_instruction=SYSTEM_PROMPT,
        ),
    )

    context = LLMContext()
    user_aggregator, assistant_aggregator = LLMContextAggregatorPair(
        context,
        user_params=LLMUserAggregatorParams(vad_analyzer=SileroVADAnalyzer()),
    )

    pipeline = Pipeline(
        [
            transport.input(),  # Transport user input
            stt,  # STT
            user_aggregator,  # User responses
            llm,  # LLM
            tts,  # TTS
            transport.output(),  # Transport bot output
            assistant_aggregator,  # Assistant spoken responses
        ]
    )

    worker = PipelineWorker(
        pipeline,
        params=PipelineParams(
            audio_out_sample_rate=24000,
            enable_metrics=True,
            enable_usage_metrics=True,
        ),
        idle_timeout_secs=runner_args.pipeline_idle_timeout_secs,
        processor_unusable_policy=ProcessorUnusablePolicy.END,
    )

    runner = WorkerRunner(handle_sigint=runner_args.handle_sigint)

    await runner.add_workers(worker)

    @transport.event_handler("on_client_connected")
    async def on_client_connected(transport, client):
        logger.info("Client connected")
        # Kick off the conversation.
        context.add_message(
            {"role": "developer", "content": "رحّب بالعميل باسم شركة واحة النخيل للتوصيل واسأله كيف تقدر تساعده."}
        )
        await worker.queue_frames([LLMRunFrame()])

    @transport.event_handler("on_client_disconnected")
    async def on_client_disconnected(transport, client):
        logger.info("Client disconnected")
        await runner.cancel()

    await runner.run()


async def bot(runner_args: RunnerArguments):
    """Main bot entry point compatible with Pipecat Cloud."""
    transport = await create_transport(runner_args, transport_params)
    await run_bot(transport, runner_args)


# --------------------------------------------------------------------------
# Web server: serves the UI and handles WebRTC signalling.
#
# Locally it uses a public STUN server. On a host like Hugging Face Spaces,
# set HF_TOKEN and it fetches free Cloudflare TURN credentials (via FastRTC's
# service) so audio can reach the bot from behind the host's firewall.
# --------------------------------------------------------------------------

import asyncio
import time

import httpx
import uvicorn
from fastapi import BackgroundTasks, FastAPI
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles

from pipecat.runner.types import SmallWebRTCRunnerArguments
from pipecat.transports.smallwebrtc.connection import IceServer
from pipecat.transports.smallwebrtc.request_handler import (
    SmallWebRTCPatchRequest,
    SmallWebRTCRequest,
    SmallWebRTCRequestHandler,
)

UI_DIR = Path(__file__).parent / "call-center-ui" / "dist"
STUN = [{"urls": ["stun:stun.l.google.com:19302"]}]
TURN_URL = "https://turn.fastrtc.org/credentials"
TURN_TTL = 3600

_ice_cache: dict = {"servers": None, "expires": 0.0}


def _normalize(servers) -> list[dict]:
    """Return ICE servers as a list of {urls, username?, credential?} dicts."""
    if isinstance(servers, dict):
        servers = servers.get("iceServers", [])
    out = []
    for s in servers or []:
        urls = s.get("urls")
        if isinstance(urls, str):
            urls = [urls]
        entry = {"urls": urls}
        if s.get("username"):
            entry["username"] = s["username"]
            entry["credential"] = s.get("credential")
        out.append(entry)
    return out


async def get_ice_servers() -> list[dict]:
    """STUN locally; free TURN (cached, refreshed before expiry) when HF_TOKEN is set."""
    token = os.getenv("HF_TOKEN")
    if not token:
        return STUN
    if _ice_cache["servers"] and time.time() < _ice_cache["expires"]:
        return _ice_cache["servers"]
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(
                TURN_URL, headers={"Authorization": f"Bearer {token}"}, params={"ttl": TURN_TTL}
            )
        if r.status_code != 200:
            logger.error(f"TURN request failed: HTTP {r.status_code}: {r.text[:300]}")
            return STUN
        servers = _normalize(r.json()) or STUN
        _ice_cache.update(servers=servers, expires=time.time() + TURN_TTL / 2)
        logger.info(f"Fetched {len(servers)} ICE server entries (TURN)")
        return servers
    except Exception as e:
        logger.error(f"TURN request error, falling back to STUN: {e!r}")
        return STUN


app = FastAPI()
webrtc_handler = SmallWebRTCRequestHandler()
_sessions: set[asyncio.Task] = set()


@app.get("/api/ice")
async def ice():
    """ICE servers for the browser (same ones the bot uses)."""
    return {"iceServers": await get_ice_servers()}


@app.post("/api/offer")
async def offer(request: SmallWebRTCRequest, background_tasks: BackgroundTasks):
    """WebRTC offer from the browser: start a bot for the new connection."""
    servers = await get_ice_servers()
    webrtc_handler.update_ice_servers([IceServer(**s) for s in servers])

    async def on_connection(connection):
        task = asyncio.create_task(bot(SmallWebRTCRunnerArguments(webrtc_connection=connection)))
        _sessions.add(task)
        task.add_done_callback(_sessions.discard)

    return await webrtc_handler.handle_web_request(
        request=request, webrtc_connection_callback=on_connection
    )


@app.patch("/api/offer")
async def ice_candidate(request: SmallWebRTCPatchRequest):
    """Trickle ICE candidates from the browser."""
    await webrtc_handler.handle_patch_request(request)
    return {"status": "success"}


@app.get("/health")
async def health():
    return {"ok": True}


if UI_DIR.exists():
    app.mount("/client", StaticFiles(directory=UI_DIR, html=True), name="ui")

    @app.get("/", include_in_schema=False)
    async def root():
        return RedirectResponse(url="/client/")
else:
    logger.warning(f"UI not found at {UI_DIR}")


logger.info(f"HF_TOKEN set: {'yes' if os.getenv('HF_TOKEN') else 'no'} (TURN {'enabled' if os.getenv('HF_TOKEN') else 'disabled, STUN only'})")
logger.info(f"OPENAI_API_KEY set: {'yes' if os.getenv('OPENAI_API_KEY') else 'no'}")


if __name__ == "__main__":
    host = os.getenv("HOST", "localhost")
    port = int(os.getenv("PORT", "7860"))
    print(f"\n   → Open: http://localhost:{port}\n")
    uvicorn.run(app, host=host, port=port)
