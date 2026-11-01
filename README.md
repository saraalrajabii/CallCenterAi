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

- **`call_center.py`**: the Pipecat voice pipeline. It loads `knowledge.md` into the system prompt
  and also serves the UI at `http://localhost:7860`.
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

## Edit the UI (needs Node.js)

```bash
cd call-center-ui
npm install
npm run dev      # live preview on http://localhost:5173 (keep the bot running)
npm run build    # rebuild dist/ so the bot serves your changes
```

## Tech

[Pipecat](https://github.com/pipecat-ai/pipecat) · OpenAI (STT, LLM, TTS) · React 19 · TypeScript · Vite · Tailwind CSS 4
