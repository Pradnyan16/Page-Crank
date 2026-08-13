# PageCrank — The Reader Respect Index

PageCrank is an independent benchmark measuring how respectfully major news websites treat their visitors. It scores sites on intrusion, privacy, performance, and accessibility. 

We do not judge business models. We measure what readers experience.

## Project Structure

This repository is split into three main components:

1. **`scanner/`** — A Node.js/TypeScript automated crawler that visits websites using a stealth browser, captures screenshots, measures layout shifts, intercepts network requests to count trackers, and runs Lighthouse audits.
2. **`scoring/`** — A processing engine that takes the raw scanner data, calculates grades (A to F) across 4 pillars, determines an "Attention Tax" rating, and uses AI to write a human-readable verdict.
3. **`web/`** — A Next.js 16 web application that presents the rankings and scorecards in a beautiful, newspaper-inspired interface.

## How it works (Automation)

The project includes a `run_daily_scan.sh` script designed to run on a schedule (e.g., via cron). 
Every morning it automatically:
- Runs the `scanner` to collect fresh data
- Runs the `scoring` engine to calculate new grades
- Copies the resulting `scores.json` and screenshots into the `web/public/` folder
- Commits and pushes the updates to GitHub

## Deployment

The `web/` application is deployed on Vercel. 
Because the daily scan script automatically pushes data updates to GitHub, Vercel automatically triggers a redeploy, meaning the live website is updated every day without any manual intervention.

## Local Development

To run the web application locally:

```bash
cd web
npm install
npm run dev
```

Open [https://page.pradnyan.xyz](https://page.pradnyan.xyz) with your browser to see the live site.
