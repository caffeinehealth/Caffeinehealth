# Caffeine Health — Local Run Instructions

This small scaffold provides an environment to run `caffeine.jsx` as a React app using Vite.

Quick start (Windows PowerShell):

```powershell
cd "c:\Users\aditya kumar\OneDrive\Documents\CAFFINE NEW\caffeine-health"
npm install
npm run dev
```

Open the printed local URL (likely http://localhost:5173) in your browser.

Notes:
- The original `caffeine.jsx` expects `window.storage` (some platforms provide a storage API). This scaffold uses `localStorage` as a fallback when `window.storage` is not available.
- The UI uses Tailwind-like classes but we didn't add full Tailwind; the app will render just fine without the exact styling.
 - New: You can now import a previously exported report (.txt or .json) from the Settings tab. The import will merge entries — updating existing dates or adding new ones.

Deploying to Vercel (public URL, works with mobile when laptop is off)
---------------------------------------------------------------
There are two main ways to deploy the project to Vercel:

1) Connect your GitHub repo via the Vercel Dashboard (recommended)
	- Push the `caffeine-health` directory to a GitHub repository (create one if needed):
	  ```powershell
	  # From the project folder
	  git init
	  git add .
	  git commit -m "Initial commit"
	  # create repo on github and replace URL below
	  git remote add origin https://github.com/<your-user>/caffeine-health.git
	  git branch -M main
	  git push -u origin main
	  ```
	- Sign in to Vercel (https://vercel.com/) and click "Import Project" → GitHub
	- Select your repo, set build command to `npm run build` (Vite), and output directory `dist`.
	- Deploy. Vercel will provide a URL where the app is served (e.g., https://my-caffeine-health.vercel.app). This URL is accessible from mobile — your laptop can be off.

2) Deploy via Vercel CLI (manual)
	- Install Vercel globally `npm i -g vercel` and login: `vercel login`.
	- Run the included script: `.\	ools\deploy.ps1` or `.\deploy.ps1` (PowerShell)
	- Or use `npx vercel --prod` to deploy to production and get a site URL.

	Important: If your project is inside a subfolder (e.g., `caffeine-health`), Vercel needs to build from that subfolder. We already added a `vercel.json` config to point to `caffeine-health/package.json`. If you imported the project and the site shows a blank screen, redeploy the project after confirming the following in the Vercel Dashboard:

	 - Build Command: `npm run build`
	 - Output Directory: `dist`
	 - (If you didn't rely on `vercel.json`) Root Directory: set to `caffeine-health`

	Then re-deploy the latest commit to rebuild the static site.

Notes:
- If you want continuous automatic deploys on push to `main`, set up the Vercel GitHub integration or use the GitHub Action workflow that we included (`.github/workflows/deploy-vercel.yml`) — set the following repo secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` (obtainable from Vercel Dashboard).
- The Vercel config `vercel.json` is included and configures your app as a static build with SPA routing.

