#!/bin/bash
set -a
source /home/enio/852/.env
set +a
npx tsx /home/enio/852/scripts/generate-comprehensive-report.ts
