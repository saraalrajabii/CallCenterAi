---
title: CallCenterAi
emoji: 📞
colorFrom: green
colorTo: yellow
sdk: docker
app_port: 7860
pinned: false
short_description: AI voice call center for a fictional delivery company
---

# CallCenterAi

An AI **voice call center** for *Palm Oasis Delivery* (واحة النخيل للتوصيل), a fictional delivery company.
Customers talk to the assistant from the browser in Arabic or English, and it answers **only** from the
company knowledge base in [`knowledge.md`](knowledge.md).

> ⚠️ The company, phone numbers, emails and prices are fictional and for learning purposes only.

## How it works

```
Browser (React UI)  ⇄  WebRTC  ⇄  Pipecat bot (call_center.py)
                                   ├─ Speech-to-text   OpenAI Realtime STT (Arabic)
                                   ├─ LLM              OpenAI, system prompt = knowledge.md
                                   └─ Text-to-speech   OpenAI TTS
```

- **`call_center.py`**: the Pipecat voice pipeline plus a small FastAPI server. It loads
  `knowledge.md` into the system prompt, serves the UI at `http://localhost:7860`, and handles
  WebRTC signalling (`/api/offer`, `/api/ice`).
- **`knowledge.md`**: everything the assistant knows: services, prices, hours, returns, FAQs.
  Edit it and restart the bot to "teach" it new information.
- **`call-center-ui/`**: custom React + TypeScript + Tailwind interface built on
  `@pipecat-ai/client-react`. `dist/` is the ready-built version the bot serves.

## Features

- Voice calls from the browser: call / hang up, mute, microphone picker
- Audio-reactive agent orb, live transcript (bot text highlights as it is spoken)
- Shipment tracking box (validates `PO` + 8 digits) and one-tap FAQ buttons that start a call and ask
- Type a question instead of speaking
- Services & prices, contact info, Arabic RTL, responsive

## Run it

Requirements: [uv](https://docs.astral.sh/uv/) (it installs Python for you) and an OpenAI API key.

```bash
git clone https://github.com/saraalrajabii/CallCenterAi.git
cd CallCenterAi
cp .env.example .env        # then put your OpenAI key in .env
uv sync
uv run call_center.py
```

Open **http://localhost:7860** and press **اتصل بخدمة العملاء**.

## Deploy free on Hugging Face Spaces

The repo is ready for a **Docker Space** (see `Dockerfile` and the header of this README).

1. Create a Space on huggingface.co → SDK **Docker** → Blank.
2. In the Space **Settings → Variables and secrets**, add secrets:
   - `OPENAI_API_KEY`: your OpenAI key
   - TURN credentials so WebRTC audio works from behind the host's firewall, either:
     - `CLOUDFLARE_TURN_KEY_ID` + `CLOUDFLARE_TURN_KEY_API_TOKEN` (Cloudflare Realtime TURN,
       1,000 GB/month free; recommended), or
     - `METERED_APP` (e.g. `myapp` from `myapp.metered.live`) + `METERED_API_KEY`
       (Metered Open Relay, 20 GB/month free), or
     - `HF_TOKEN` (free TURN via FastRTC/Hugging Face).
3. Deploy: push this repo to the Space, or let the GitHub Action
   (`.github/workflows/deploy-huggingface.yml`) do it on every push to `main`. It needs a
   GitHub secret `HF_TOKEN` (write access) and a variable `HF_SPACE` (`username/space-name`).

> Anyone with the link can call the bot and spend your OpenAI credit. Set a usage limit in
> your OpenAI account.

## Edit the UI (needs Node.js)

```bash
cd call-center-ui
npm install
npm run dev      # live preview on http://localhost:5173 (keep the bot running)
npm run build    # rebuild dist/ so the bot serves your changes
```

## Tech

[Pipecat](https://github.com/pipecat-ai/pipecat) · OpenAI (STT, LLM, TTS) · React 19 · TypeScript · Vite · Tailwind CSS 4
