# Lumen Quest — visual-preservation rebuild

This Vercel-ready build preserves the original Lumen Quest visual language while adding the expanded region/monster system and the requested study behavior.

## Included
- Original-style Lumen Quest home/header/hero presentation
- 6 rotating regions, 5 named creature variants per region
- One persistent subject game per note package
- Update Notes replaces the package without replacing the quest/stats
- Searchable PDF/TXT/Markdown extraction in browser
- Scientific calculator from every question
- Wrong answers deal damage but do not reveal the correct answer
- Wrong-answer explanation is delivered by the enemy
- Missed concepts return 3–5 questions later
- Retries use fresh wording/examples via the AI prompt
- OpenAI + Gemini + local fallback
- IndexedDB note storage to avoid localStorage-size failures
- PWA install support

## Vercel environment variables
Recommended:
- `OPENAI_API_KEY`
- optional `OPENAI_MODEL` (defaults to `gpt-5.6-luna`)
- optional `GEMINI_API_KEY`
- optional `GEMINI_MODEL`

Do not commit API keys into GitHub.
