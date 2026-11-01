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


if __name__ == "__main__":
    from fastapi.staticfiles import StaticFiles

    from pipecat.runner.run import app, main

    # Serve the custom call center UI (call-center-ui/dist) at /client,
    # in place of the default Pipecat Playground.
    UI_DIR = Path(__file__).parent / "call-center-ui" / "dist"
    if UI_DIR.exists():
        app.mount("/client", StaticFiles(directory=UI_DIR, html=True), name="call-center-ui")
    else:
        logger.warning(f"Custom UI not found at {UI_DIR}, using the default Playground.")

    main()
