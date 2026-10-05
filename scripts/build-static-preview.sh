#!/usr/bin/env bash
# Builds a static frontend bundle for sandbox previews. API routes are excluded from this bundle and
# must be served by a separate `next start` process (see README → Preview). Not used on Vercel.
set -euo pipefail
cd "$(dirname "$0")/.."
API_BASE="${1:-__PORT_3000__}"
trap 'if [ -d .api-hidden ]; then rm -rf app/api; mv .api-hidden app/api; fi' EXIT
mv app/api .api-hidden
STATIC_EXPORT=1 NEXT_PUBLIC_STATIC_PREVIEW=1 NEXT_PUBLIC_API_BASE="$API_BASE" npx next build
echo "static bundle → .next-export/  (note: this also rewrites .next — run \`npm run build\` afterwards before \`next start\`)"
