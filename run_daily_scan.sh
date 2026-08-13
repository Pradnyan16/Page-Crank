#!/bin/bash
# Page Crank — Daily scan + score + deploy automation
# Runs every morning via cron to collect fresh data and push to GitHub.
# Vercel picks up the push and automatically redeploys the site.

# ─── Fix PATH for cron (cron runs in a minimal env without Homebrew) ───────────
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

set -e

SCANNER_DIR="/Users/pradnyan.wadekar/Page Crank/scanner"
SCORING_DIR="/Users/pradnyan.wadekar/Page Crank/scoring"
WEB_DIR="/Users/pradnyan.wadekar/Page Crank/web"
DATA_DIR="/Users/pradnyan.wadekar/Page Crank/data/editions/latest"
LOG_FILE="/Users/pradnyan.wadekar/Page Crank/scan_log.txt"
ROOT_DIR="/Users/pradnyan.wadekar/Page Crank"

echo "=====================================" >> "$LOG_FILE"
echo "Page Crank Scan — $(date)" >> "$LOG_FILE"
echo "=====================================" >> "$LOG_FILE"

# Step 1: Run the scanner (visits each website with stealth browser)
echo "Starting scan..." >> "$LOG_FILE"
cd "$SCANNER_DIR"
npm run scan >> "$LOG_FILE" 2>&1
echo "Scan complete." >> "$LOG_FILE"

# Step 2: Run scoring + AI explanations
echo "Starting scoring..." >> "$LOG_FILE"
cd "$SCORING_DIR"
npm run score:all >> "$LOG_FILE" 2>&1
echo "Scoring complete." >> "$LOG_FILE"

# Step 3: Copy fresh scores into web/public/data/ so Vercel picks them up
echo "Copying scores to web..." >> "$LOG_FILE"
mkdir -p "$WEB_DIR/public/data"
cp "$DATA_DIR/scores.json" "$WEB_DIR/public/data/scores.json"
echo "✓ scores.json updated in web/public/data/" >> "$LOG_FILE"

# Step 4: Copy fresh screenshots into web/public/screenshots/
echo "Copying screenshots to web..." >> "$LOG_FILE"
mkdir -p "$WEB_DIR/public/screenshots"
if ls "$SCORING_DIR/output/screenshots/"*.png 1>/dev/null 2>&1; then
  cp "$SCORING_DIR/output/screenshots/"*.png "$WEB_DIR/public/screenshots/" 2>/dev/null || true
  echo "✓ Screenshots copied" >> "$LOG_FILE"
else
  echo "⚠ No screenshots found to copy" >> "$LOG_FILE"
fi

# Step 5: Git commit + push → triggers Vercel auto-redeploy
echo "Pushing to GitHub..." >> "$LOG_FILE"
cd "$ROOT_DIR"
git add web/public/data/scores.json web/public/screenshots/ >> "$LOG_FILE" 2>&1
git commit -m "chore: daily scan update $(date '+%Y-%m-%d')" >> "$LOG_FILE" 2>&1
git push >> "$LOG_FILE" 2>&1
echo "✓ Pushed to GitHub — Vercel will redeploy automatically" >> "$LOG_FILE"

echo "Done at $(date)" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"
