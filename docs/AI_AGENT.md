# AI Agent Deployment

SkillSpace uses a two-layer agent:

1. **Local deterministic parser** in `src/ai/SceneAction.ts` for offline/demo reliability.
2. **Remote agent** in `api/agent.mjs` for natural-language requests that the local parser does not recognize.

The server function calls the OpenAI Responses API and requests a strict JSON schema, so the browser receives an executable scene action rather than arbitrary model-generated code.

## Vercel setup

Add these environment variables to the Vercel project:

- `OPENAI_API_KEY` — server-side API key.
- `OPENAI_MODEL` — optional model override; the example defaults to `gpt-6-luna`.

Do not put `OPENAI_API_KEY` in `VITE_*` variables or client-side source.

Without the key, the app remains usable through the deterministic local agent.

## Demo flow

Use **RUN DEMO** to play the scripted competition sequence:

career role focus → spatial career-path arrangement → SQL mission creation.

Then use the copilot text box or microphone for an additional scene command.
