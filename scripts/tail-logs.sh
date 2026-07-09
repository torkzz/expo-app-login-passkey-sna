#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  tail-logs.sh  — live-tail ReactNativeJS logs from the connected Android
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ── Colours ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

ok()   { echo -e "${GREEN}[OK]${RESET}    $*"; }
info() { echo -e "${CYAN}[INFO]${RESET}  $*"; }
err()  { echo -e "${RED}[ERROR]${RESET} $*" >&2; }
warn() { echo -e "${YELLOW}[WARN]${RESET}  $*"; }

# ── Defaults ─────────────────────────────────────────────────────────────────
FILTER="ReactNativeJS"   # logcat tag(s) — override with --tag
CLEAR_BUF=false          # clear logcat buffer before tailing
PRIORITY="I"             # I=Info, V=Verbose, D=Debug, W=Warn, E=Error

# ── Arg parsing ──────────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --tag|-t)   FILTER="$2";     shift 2 ;;
    --clear|-c) CLEAR_BUF=true;  shift   ;;
    --verbose)  PRIORITY="V";    shift   ;;
    --help|-h)
      echo "Usage: $0 [--tag TAG] [--clear] [--verbose]"
      echo "  --tag TAG    logcat tag to filter (default: ReactNativeJS)"
      echo "  --clear      clear the logcat buffer before tailing"
      echo "  --verbose    show Verbose priority (default: Info+)"
      exit 0 ;;
    *) err "Unknown argument: $1"; exit 1 ;;
  esac
done

# ── Preflight ─────────────────────────────────────────────────────────────────
command -v adb &>/dev/null || { err "adb not found. Add Android SDK platform-tools to PATH."; exit 1; }

DEVICE=$(adb devices | awk 'NR>1 && $2=="device" {print $1; exit}')
if [[ -z "$DEVICE" ]]; then
  err "No Android device/emulator connected. Start one first."
  exit 1
fi

echo ""
echo -e "${BOLD}══════════════════════════════════════════${RESET}"
echo -e "${BOLD}  Android Log Tail${RESET}"
echo -e "${BOLD}══════════════════════════════════════════${RESET}"
ok "Device : ${DEVICE}"
ok "Filter : ${FILTER}:${PRIORITY}"
echo ""

# ── Ensure Metro port forwarding is set up ───────────────────────────────────
adb -s "$DEVICE" reverse tcp:8081 tcp:8081 &>/dev/null || true

# ── Clear buffer if requested ─────────────────────────────────────────────────
if $CLEAR_BUF; then
  info "Clearing logcat buffer…"
  adb -s "$DEVICE" logcat -c
fi

info "Streaming logs — press Ctrl+C to stop"
echo ""

# ── Tail ──────────────────────────────────────────────────────────────────────
# Pipe through sed to colour-code common patterns for readability
adb -s "$DEVICE" logcat -s "${FILTER}:${PRIORITY}" 2>/dev/null \
  | sed \
      -e "s/\(PASS\|success\|SUCCESS\|registered\|verified\)/$(echo -e "${GREEN}")\1$(echo -e "${RESET}")/g" \
      -e "s/\(ERROR\|FAILED\|error\|failed\|exception\|Exception\)/$(echo -e "${RED}")\1$(echo -e "${RESET}")/g" \
      -e "s/\(WARN\|warn\|WARNING\)/$(echo -e "${YELLOW}")\1$(echo -e "${RESET}")/g" \
      -e "s/\(\[STEP\|STEP\|Step\)/$(echo -e "${CYAN}")\1$(echo -e "${RESET}")/g"
