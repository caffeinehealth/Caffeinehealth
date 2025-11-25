<#
Simple PowerShell deploy script using the Vercel CLI.
Install the CLI first (one-time):
  npm i -g vercel
Then login: vercel login

Usage:
  .\deploy.ps1            # prompts for vercel login and deploy (preview)
  .\deploy.ps1 -Prod     # deploy production (vercel --prod)
#>
[CmdletBinding()]
param(
  [switch]$Prod
)

Write-Host "Starting Vercel deploy (prod: $Prod)" -ForegroundColor Cyan

if (!(Get-Command vercel -ErrorAction SilentlyContinue)) {
  Write-Host "Vercel CLI not found. Installing globally..." -ForegroundColor Yellow
  npm i -g vercel
}

Write-Host "Make sure you're logged into Vercel (you will be prompted if not)." -ForegroundColor Green
npx vercel login

if ($Prod) {
  npx vercel --prod
} else {
  npx vercel
}
