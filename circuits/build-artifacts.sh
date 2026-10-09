#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
if [[ -x "$ROOT_DIR/.tools/noir/bin/nargo" ]]; then
  NARGO_BIN="${NARGO_BIN:-$ROOT_DIR/.tools/noir/bin/nargo}"
else
  NARGO_BIN="${NARGO_BIN:-nargo}"
fi
export NARGO_HOME="${NARGO_HOME:-$ROOT_DIR/.tools/noir}"

EXPECTED_NARGO_VERSION="$(cat "$ROOT_DIR/NARGO_VERSION")"
ACTUAL_NARGO_VERSION="$("$NARGO_BIN" --version | sed -n 's/^nargo version = //p')"
if [[ "$ACTUAL_NARGO_VERSION" != "$EXPECTED_NARGO_VERSION" ]]; then
  echo "Expected nargo $EXPECTED_NARGO_VERSION, found ${ACTUAL_NARGO_VERSION:-unknown}." >&2
  exit 1
fi

for circuit in invoice credit; do
  (
    cd "$ROOT_DIR/circuits/$circuit"
    "$NARGO_BIN" compile --deny-warnings
  )
done

mkdir -p "$ROOT_DIR/apps/web/public/circuits"
cp "$ROOT_DIR/circuits/invoice/target/invoice.json" "$ROOT_DIR/apps/web/public/circuits/invoice.json"
cp "$ROOT_DIR/circuits/credit/target/credit.json" "$ROOT_DIR/apps/web/public/circuits/credit.json"
