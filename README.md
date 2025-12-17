# New-Game-Theory — Prisoner's Dilemma Tournament

This repo contains a small AI ethics demo and a new Prisoner's Dilemma tournament feature.

## How it works

- A new server endpoint `/pd-move` lets the AI (via OpenRouter) play Prisoner's Dilemma decisions. It expects a JSON body `{ history: [{ role: 'self'|'opponent', move: 'C'|'D' }, ...] }` and returns `{ move: 'C'|'D', raw: '...' }`.
- The frontend includes a Tournament UI that runs round-robin matches between several strategies, including the Chatbot. The Chatbot strategy will make HTTP calls to `/pd-move` for each decision.

## Setup

1. Create a `.env` file with your OpenRouter key and optional model:

```
OPENROUTER_API_KEY=your_api_key_here
OPENROUTER_MODEL=gpt-4o-mini # optional
PD_SYSTEM_PROMPT=... # optional, overrides default PD system prompt
```

2. Start the server:

```
npm install
npm start
```

3. Open `index.html`, scroll to "Prisoner's Dilemma Tournament" and click "Run Tournament".

Notes:
- Each Chatbot move incurs an external API call to OpenRouter; be mindful of rate limits and API costs.
- Without a configured `OPENROUTER_API_KEY`, the Chatbot strategy will not be able to query the model and will default to cooperating for safety.
