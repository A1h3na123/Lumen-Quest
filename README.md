# Lumen Quest — Vercel Ready

This folder is ready to deploy on Vercel through a Git-connected project.

## Required files in the repository root
- `index.html`
- `styles.css`
- `app.js`
- `api/config.js`
- `api/generate.js`
- `package.json`
- `vercel.json`

## AI configuration
The app works without an AI key by falling back to note-based local questions.
For OpenAI-generated questions, add `OPENAI_API_KEY` as a Vercel Environment Variable.
Optional: `OPENAI_MODEL` (defaults to `gpt-5.6-luna`).
For Gemini, add `GEMINI_API_KEY`; optional `GEMINI_MODEL` defaults to `gemini-2.5-flash`.

Never commit API keys to GitHub.
