# CarbonSynq UMS Backend

Backend-only starter structure for the CarbonSynq University Management System.

## Initial stack
- Node.js
- Express
- TypeScript
- PostgreSQL (to be connected)
- Prisma (to be added in the database phase)

## Run locally

1. Open this folder in VS Code.
2. Open terminal in this folder.
3. Run:
   npm install
4. Copy `.env.example` to `.env`.
5. Run:
   npm run dev
6. Open:
   http://localhost:5000/api/health

## Module order
Auth -> University -> Campus -> Building -> Floor -> Assets -> Activity Data -> Baseline -> Emission Factors -> Calculations -> Scope 1 -> Scope 2 -> Verification -> Reports -> Targets -> AI.
