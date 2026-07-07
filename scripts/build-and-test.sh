#!/usr/bin/env bash
# =============================================================================
# build-and-test.sh
# Expo Android — build, deploy, and run the passkey registration test flow
# Usage:
#   ./scripts/build-and-test.sh             # build + full test
#   ./scripts/build-and-test.sh --no-build  # skip build, test only
#   ./scripts/build-and-test.sh --build-only
# =============================================================================

set -euo pipefail
if command -v ggrep >/dev/null 2>&1; then
    GREP="ggrep"
else
    GREP="grep"
fi
# ─── Colours ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

log()    { echo -e "${CYAN}[INFO]${RESET}  $*"; }
ok()     { echo -e "${GREEN}[OK]${RESET}    $*"; }
warn()   { echo -e "${YELLOW}[WARN]${RESET}  $*"; }
err()    { echo -e "${RED}[ERROR]${RESET} $*" >&2; }
header() { echo -e "\n${BOLD}${CYAN}══════════════════════════════════════════${RESET}"; \
           echo -e "${BOLD}${CYAN}  $*${RESET}"; \
           echo -e "${BOLD}${CYAN}══════════════════════════════════════════${RESET}"; }

# ─── Configuration ────────────────────────────────────────────────────────────
PACKAGE="com.torkzz.expoapploginpasskeysna"
LOG_DIR="$(pwd)/test-logs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOGCAT_FILE="${LOG_DIR}/logcat_${TIMESTAMP}.txt"
REPORT_FILE="${LOG_DIR}/test-report_${TIMESTAMP}.txt"

# Test credentials (override via env vars)
TEST_USERNAME="${TEST_USERNAME:-tester}"
TEST_MOBILE="${TEST_MOBILE:-+639178032215}"

# Timing
BUILD_TIMEOUT=300   # 5 min max for build
APP_LAUNCH_WAIT=8   # seconds after install before interacting
FLOW_WAIT=10        # seconds to wait for passkey flow to complete

# ─── Flags ────────────────────────────────────────────────────────────────────
DO_BUILD=true
DO_TEST=true

for arg in "$@"; do
  case $arg in
    --no-build)   DO_BUILD=false ;;
    --build-only) DO_TEST=false  ;;
    --help|-h)
      echo "Usage: $0 [--no-build] [--build-only]"
      echo "  --no-build    Skip Expo build; only run the test flow"
      echo "  --build-only  Build only; skip automated test"
      exit 0 ;;
  esac
done

mkdir -p "$LOG_DIR"

# ─── Step 1: Preflight checks ─────────────────────────────────────────────────
header "Step 1 — Preflight checks"

# Check adb
if ! command -v adb &>/dev/null; then
  err "adb not found. Add Android SDK platform-tools to PATH."
  exit 1
fi
ok "adb found: $(adb version | head -1)"

# Check emulator/device
DEVICE=$(adb devices | awk 'NR>1 && $2=="device" {print $1; exit}')
if [[ -z "$DEVICE" ]]; then
  err "No Android device/emulator connected. Start an emulator first."
  exit 1
fi
ok "Device: ${DEVICE}"

# Check node / npm
command -v node &>/dev/null || { err "node not found."; exit 1; }
command -v npm  &>/dev/null || { err "npm not found.";  exit 1; }
ok "Node $(node -v), npm $(npm -v)"

# Check .env
[[ -f ".env" ]] || { err ".env file not found."; exit 1; }
ok ".env present"

# ─── Step 2: Build ────────────────────────────────────────────────────────────
if $DO_BUILD; then
  header "Step 2 — Build (expo run:android)"
  log "Starting build — this may take a few minutes…"

  if ! timeout "$BUILD_TIMEOUT" npm run android -- --device "$DEVICE"; then
    err "Build failed or timed out after ${BUILD_TIMEOUT}s."
    exit 1
  fi

  ok "Build complete."
  log "Waiting ${APP_LAUNCH_WAIT}s for app to fully launch…"
  sleep "$APP_LAUNCH_WAIT"
else
  header "Step 2 — Build (skipped)"
  warn "Using existing installed APK on ${DEVICE}."

  # Make sure the app is running; launch it if not
  if ! adb -s "$DEVICE" shell pidof "$PACKAGE" &>/dev/null; then
    log "App not running — launching…"
    adb -s "$DEVICE" shell monkey -p "$PACKAGE" -c android.intent.category.LAUNCHER 1 &>/dev/null
    sleep "$APP_LAUNCH_WAIT"
  fi
fi

if ! $DO_TEST; then
  header "Done"
  ok "Build-only mode. Exiting."
  exit 0
fi

# ─── Step 3: Start logcat capture ─────────────────────────────────────────────
header "Step 3 — Start logcat capture"
adb -s "$DEVICE" logcat -c          # clear buffer
log "Capturing to: ${LOGCAT_FILE}"

adb -s "$DEVICE" logcat -s ReactNativeJS:I 2>&1 | tee "$LOGCAT_FILE" &
LOGCAT_PID=$!

cleanup() {
  kill "$LOGCAT_PID" 2>/dev/null || true
}
trap cleanup EXIT

ok "Logcat PID: ${LOGCAT_PID}"
sleep 1

# ─── Helpers for UI interaction ───────────────────────────────────────────────
wait_for_text() {
  local label="$1" text="$2" timeout="${3:-15}" elapsed=0
  log "Waiting for '${text}' to appear on screen…"
  while ! adb -s "$DEVICE" shell uiautomator dump /sdcard/wd.xml &>/dev/null \
    && adb -s "$DEVICE" pull /sdcard/wd.xml /tmp/wd.xml &>/dev/null \
    && grep -q "text=\"${text}\"" /tmp/wd.xml 2>/dev/null; do
    sleep 1; (( elapsed++ ))
    if (( elapsed >= timeout )); then
      warn "Timed out waiting for '${text}'"
      return 1
    fi
  done
  ok "${label} visible"
}

# Dump UI, find element bounds by text or content-desc, click centre
click_text() {
  local text="$1"
  adb -s "$DEVICE" shell uiautomator dump /sdcard/wd.xml &>/dev/null
  adb -s "$DEVICE" pull /sdcard/wd.xml /tmp/wd.xml &>/dev/null
  
  local coords
  coords=$(python3 -c "
import sys, re
content = open('/tmp/wd.xml').read()
t = sys.argv[1]
t_esc = re.escape(t)
pattern = r'(?:text|content-desc)=\"' + t_esc + r'\"[^>]*bounds=\"\[([^\]]+\]\[[^\]]+)\]\"'
m = re.search(pattern, content)
if m:
    bounds = m.group(1)
    c = re.match(r'(\d+),(\d+)\]\[(\d+),(\d+)', bounds)
    if c:
        x1, y1, x2, y2 = map(int, c.groups())
        cx = (x1 + x2) // 2
        cy = (y1 + y2) // 2
        print(f'{cx} {cy}')
        sys.exit(0)
sys.exit(1)
" "$text" || true)

  if [[ -z "$coords" ]]; then
    err "Cannot find or parse bounds for '${text}' on screen."
    return 1
  fi

  local cx cy
  read -r cx cy <<< "$coords"

  log "Clicking '${text}' at (${cx}, ${cy})"
  adb -s "$DEVICE" shell input tap "$cx" "$cy"
  sleep 0.5
}

type_into() {
  local text="$1"
  adb -s "$DEVICE" shell input text "$text"
  sleep 0.5
}

# ─── Step 4: Navigate to Register screen ──────────────────────────────────────
header "Step 4 — Navigate to Register screen"

# If on Home/Dashboard, log out first
adb -s "$DEVICE" shell uiautomator dump /sdcard/wd.xml &>/dev/null
adb -s "$DEVICE" pull /sdcard/wd.xml /tmp/wd.xml &>/dev/null
if grep -q 'text="Logout"' /tmp/wd.xml; then
  log "Currently logged in — logging out…"
  click_text "Logout"
  sleep 2
fi

# Click Register link on Login screen
if grep -q 'text="Register"' /tmp/wd.xml || \
   (adb -s "$DEVICE" shell uiautomator dump /sdcard/wd.xml &>/dev/null && \
    adb -s "$DEVICE" pull /sdcard/wd.xml /tmp/wd.xml &>/dev/null && \
    grep -q 'text="Register"' /tmp/wd.xml); then
  click_text "Register"
  sleep 2
fi

ok "Should be on Create Account screen"

# ─── Step 5: Fill registration form ───────────────────────────────────────────
header "Step 5 — Fill registration form"
log "Username: ${TEST_USERNAME}"
log "Mobile:   ${TEST_MOBILE}"

click_text "Choose a username"
type_into "$TEST_USERNAME"

click_text "e.g. +639..."
type_into "$TEST_MOBILE"

sleep 1

# Dismiss keyboard
adb -s "$DEVICE" shell input keyevent 111

# ─── Step 6: Tap Register with Passkey ────────────────────────────────────────
header "Step 6 — Tap 'Register with Passkey'"
click_text "Register with Passkey"
log "Waiting ${FLOW_WAIT}s for passkey flow to complete…"
sleep "$FLOW_WAIT"

# ─── Step 7: Kill logcat and analyse ──────────────────────────────────────────
header "Step 7 — Analyse results"
kill "$LOGCAT_PID" 2>/dev/null || true; LOGCAT_PID=0
sleep 1

# Declare test outcome tracking
PASS=0; FAIL=0; RESULTS=()

check() {
  local label="$1" pattern="$2"
  if grep -q "$pattern" "$LOGCAT_FILE" 2>/dev/null; then
    ok "  PASS  ${label}"
    RESULTS+=("PASS: ${label}")
    (( PASS++ ))
  else
    err "  FAIL  ${label}"
    RESULTS+=("FAIL: ${label}")
    (( FAIL++ ))
  fi
}

check "Step 1: Token obtained"                       "\[TOKEN\] SUCCESS"
check "Step 2: GenerateKey request sent"             "GENERATE KEY"
check "Step 2: GenerateKey 200 OK (no 405 error)"    "passkey_generated"
check "Step 3: Challenge decoded"                    "ANDROID.*STEP 3"
check "Step 4: create() invoked"                     "ANDROID.*STEP 4.*Calling create"
check "Step 4: Credential returned"                  "Credential received"
check "Step 5: registerKey payload built"            "ANDROID.*STEP 5"
check "Step 6: registerKey API called"               "REGISTER KEY"
check "Step 6: Registration successful"              "passkey_registered\|success.*true"

# Check for unexpected errors
if grep -q "405" "$LOGCAT_FILE"; then
  warn "  WARN  405 Method Not Allowed still present in logs — check endpoint paths"
  RESULTS+=("WARN: 405 error still in logs")
fi

if grep -q "assetlinks\|NotAllowedError\|SecurityError\|DomError" "$LOGCAT_FILE"; then
  warn "  WARN  Digital Asset Link / domain error detected (assetlinks.json may be missing)"
  RESULTS+=("WARN: Asset link / RP ID association error")
fi

# ─── Step 8: Generate report ──────────────────────────────────────────────────
header "Step 8 — Test report"
{
  echo "==============================="
  echo " Build-and-Test Report"
  echo " $(date)"
  echo " Device: ${DEVICE}"
  echo " Package: ${PACKAGE}"
  echo "==============================="
  echo ""
  echo "Test Credentials:"
  echo "  Username: ${TEST_USERNAME}"
  echo "  Mobile:   ${TEST_MOBILE}"
  echo ""
  echo "Results:"
  for r in "${RESULTS[@]}"; do echo "  ${r}"; done
  echo ""
  echo "Passed: ${PASS}  Failed: ${FAIL}"
  echo ""
  echo "Log file: ${LOGCAT_FILE}"
} | tee "$REPORT_FILE"

echo ""
if (( FAIL == 0 )); then
  ok "All checks passed ✓"
  echo -e "\n${GREEN}${BOLD}  PASS (${PASS}/${PASS})${RESET}\n"
  exit 0
else
  err "${FAIL} check(s) failed"
  echo -e "\n${RED}${BOLD}  FAIL (${PASS} passed, ${FAIL} failed)${RESET}"
  echo -e "  Full logs: ${LOGCAT_FILE}\n"
  exit 1
fi
