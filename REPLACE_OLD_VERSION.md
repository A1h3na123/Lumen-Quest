# Replace the current GitHub/Vercel version

You do NOT need a new GitHub repository or a new Vercel project.

Use the same repository already connected to the Vercel project `lumen-quest`.

## 1. Open the GitHub repo
In Vercel: open `lumen-quest` and click the GitHub icon in the upper-right corner.

## 2. Remove the old app files
In the GitHub repository, delete the OLD versions of these app files/folders if present:
- `api/`
- `assets/`
- `app.js`
- `index.html`
- `styles.css`
- `package.json`
- `vercel.json`
- `manifest.webmanifest`
- `sw.js`
- old README files

Do not delete `.git` (you will not see it on GitHub anyway).

## 3. Upload THIS build
Extract the ZIP on your computer. Upload the CONTENTS of the extracted `Lumen_Quest_Original_Style_Rebuild` folder to the repository root.

Important: `index.html` must be at the repository root, not inside an extra nested folder.

Commit the upload directly to the `main` branch.

## 4. Vercel deploys automatically
Because the Vercel project is already connected to the repository, the new commit to `main` should trigger a Production Deployment automatically.

In Vercel -> Deployments, wait for the newest deployment to show `Ready`.

## 5. Keep the OpenAI key
Your Vercel environment variable should remain in the project when code is replaced.
Check Vercel -> Settings -> Environment Variables and make sure `OPENAI_API_KEY` is still present for Production.

If you add or change an environment variable, redeploy the newest deployment afterward.

## 6. Test the new version
Open the production URL and verify:
- Original Lumen-style home screen
- Upload notes and create a subject
- Entering a subject selects a region
- Encounter art and monster display
- Answer screen and calculator
- Wrong answer deals damage and explains the mistake without revealing the right answer
- The missed concept returns later with different wording

If anything fails, send ChatGPT a screenshot of the Vercel Deployment page or the screen that looks wrong.
