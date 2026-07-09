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

# ─── Helpers for UI interaction ───────────────────────────────────────────────
dump_ui() {
  rm -f /tmp/wd.xml
  adb -s "$DEVICE" shell rm -f /sdcard/wd.xml &>/dev/null
  
  local retry=0
  while (( retry < 3 )); do
    if adb -s "$DEVICE" shell uiautomator dump /sdcard/wd.xml &>/dev/null; then
      if adb -s "$DEVICE" pull /sdcard/wd.xml /tmp/wd.xml &>/dev/null; then
        if [[ -f /tmp/wd.xml ]]; then
          return 0
        fi
      fi
    fi
    sleep 1
    (( retry++ ))
  done
  return 1
}

wait_for_text() {
  local label="$1" text="$2" timeout="${3:-15}" elapsed=0
  log "Waiting for '${text}' to appear on screen…"
  while true; do
    if dump_ui; then
      if grep -q -i "text=\"${text}\"" /tmp/wd.xml 2>/dev/null; then
        break
      fi
      if grep -q 'text="This is the developer menu.' /tmp/wd.xml 2>/dev/null; then
        log "Expo Dev Menu onboarding detected. Clicking Continue & sending keyevents…"
        click_text "Continue"
        adb -s "$DEVICE" shell input keyevent 66 # KEYCODE_ENTER
        adb -s "$DEVICE" shell input keyevent 23 # KEYCODE_DPAD_CENTER
        sleep 2
        continue
      fi
      if grep -q 'text="Fast Refresh"' /tmp/wd.xml 2>/dev/null; then
        log "Developer Menu overlay detected. Sending BACK keyevent to dismiss…"
        adb -s "$DEVICE" shell input keyevent 4 # KEYCODE_BACK
        sleep 2
        continue
      fi
    fi
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
  dump_ui || { err "Failed to dump UI layout for click_text"; return 1; }
  
  local coords
  coords=$(python3 -c "
import sys, re
content = open('/tmp/wd.xml').read()
t = sys.argv[1]
t_esc = re.escape(t)
pattern = r'(?:text|content-desc)=\"' + t_esc + r'\"[^>]*bounds=\"\[([^\]]+\]\[[^\]]+)\]\"'
m = re.search(pattern, content, re.IGNORECASE)
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

click_edit_text() {
  dump_ui || { err "Failed to dump UI layout for click_edit_text"; return 1; }
  local coords
  coords=$(python3 -c "
import sys, re
content = open('/tmp/wd.xml').read()
pattern = r'class=\"android.widget.EditText\"[^>]*bounds=\"\[([^\]]+\]\[[^\]]+)\]\"'
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
" || true)

  if [[ -z "$coords" ]]; then
    err "Cannot find EditText on screen."
    return 1
  fi

  local cx cy
  read -r cx cy <<< "$coords"

  log "Clicking EditText at (${cx}, ${cy})"
  adb -s "$DEVICE" shell input tap "$cx" "$cy"
  sleep 0.5
}

clear_edit_text() {
  click_edit_text || return 1
  # Backspace 20 times to clear input
  for i in {1..20}; do
    adb -s "$DEVICE" shell input keyevent 67
  done
  sleep 0.5
}


type_into() {
  local text="$1"
  # Escape plus character which can be treated as modifier in some adb versions
  local escaped_text="${text//+/\\+}"
  adb -s "$DEVICE" shell input text "$escaped_text"
  sleep 0.5
}

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
TEST_FLOW="both"

for arg in "$@"; do
  case $arg in
    --no-build)   DO_BUILD=false ;;
    --build-only) DO_TEST=false  ;;
    --passkey)    TEST_FLOW="passkey" ;;
    --sna)        TEST_FLOW="sna" ;;
    --help|-h)
      echo "Usage: $0 [--no-build] [--build-only] [--passkey] [--sna]"
      echo "  --no-build    Skip Expo build; only run the test flow"
      echo "  --build-only  Build only; skip automated test"
      echo "  --passkey     Run Passkey tests only"
      echo "  --sna         Run SNA tests only"
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

log "Setting up adb port forwarding for Metro (port 8081)..."
adb -s "$DEVICE" reverse tcp:8081 tcp:8081 &>/dev/null || warn "Failed to setup adb reverse (expected if using wireless debugging)."

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

  cmd_timeout=""
  if command -v timeout >/dev/null 2>&1; then
    cmd_timeout="timeout"
  elif command -v gtimeout >/dev/null 2>&1; then
    cmd_timeout="gtimeout"
  fi

  if [[ -n "$cmd_timeout" ]]; then
    if ! $cmd_timeout "$BUILD_TIMEOUT" npm run android; then
      err "Build failed or timed out after ${BUILD_TIMEOUT}s."
      exit 1
    fi
  else
    if ! npm run android; then
      err "Build failed."
      exit 1
    fi
  fi

  ok "Build complete."
  log "Waiting ${APP_LAUNCH_WAIT}s for app to fully launch…"
  sleep "$APP_LAUNCH_WAIT"
else
  header "Step 2 — Build (skipped)"
  warn "Using existing installed APK on ${DEVICE}."
fi

if ! $DO_TEST; then
  header "Done"
  ok "Build-only mode. Exiting."
  exit 0
fi

log "Force-stopping package ${PACKAGE}…"
adb -s "$DEVICE" shell am force-stop "$PACKAGE"

log "Clearing app data for ${PACKAGE} to guarantee fresh state…"
adb -s "$DEVICE" shell pm clear "$PACKAGE"
sleep 1

# Ensure port forwarding is set up
adb -s "$DEVICE" reverse tcp:8081 tcp:8081

log "Launching app fresh…"
adb -s "$DEVICE" shell monkey -p "$PACKAGE" -c android.intent.category.LAUNCHER 1 &>/dev/null
sleep "$APP_LAUNCH_WAIT"

# If we see the Expo Go launcher screen, click http://localhost:8081
if dump_ui && grep -q 'text="http://localhost:8081"' /tmp/wd.xml; then
  log "Expo Go launcher detected. Clicking http://localhost:8081 server link to start bundle…"
  click_text "http://localhost:8081" || true
  sleep 2
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

# ─── Step 4: Navigate to Register screen ──────────────────────────────────────
if [[ "$TEST_FLOW" == "both" || "$TEST_FLOW" == "passkey" ]]; then
  header "Step 4 — Navigate to Register screen"

  # 1. Wait for the app to be loaded (either on Login or Dashboard/Home screen)
  log "Waiting for app to load..."
  wait_for_text "App loaded" "Continue with Passkey" 25 || {
    # If "Continue with Passkey" is not found, maybe we are already logged in?
    if dump_ui && grep -q 'text="Logout"' /tmp/wd.xml; then
      ok "App loaded (already logged in)"
    else
      err "App failed to load"
    fi
  }

  # 2. If on Home/Dashboard, log out first
  if dump_ui && grep -q 'text="Logout"' /tmp/wd.xml; then
    log "Currently logged in — logging out…"
    click_text "Logout"
    # Wait for the login screen to appear after logout
    wait_for_text "Login screen after logout" "Continue with Passkey" 15
  fi

  # 3. Click Register link on Login screen
  log "Navigating to Register screen..."
  # Dismiss keyboard just in case it is covering the register link
  adb -s "$DEVICE" shell input keyevent 111
  sleep 0.5
  click_text "Register"

  # 4. Wait for the Create Account screen to appear
  wait_for_text "Should be on Create Account screen" "Create Account" 15

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
  log "Waiting for native passkey registration flow to complete..."
  for i in {1..15}; do
    sleep 1
    if dump_ui; then
      if grep -q -i 'text="Continue"' /tmp/wd.xml; then
        log "Clicking 'Continue' button..."
        click_text "Continue" || true
      elif grep -q -i 'text="Create"' /tmp/wd.xml; then
        log "Clicking 'Create' button..."
        click_text "Create" || true
      elif grep -q -i "text=\"${TEST_USERNAME}\"" /tmp/wd.xml; then
        log "Clicking username '${TEST_USERNAME}' selector..."
        click_text "${TEST_USERNAME}" || true
      elif grep -q -i 'text="Use screen lock"' /tmp/wd.xml; then
        log "Clicking 'Use screen lock' button..."
        click_text "Use screen lock" || true
      elif grep -q -i 'text="Use fingerprint"' /tmp/wd.xml; then
        log "Clicking 'Use fingerprint' button..."
        click_text "Use fingerprint" || true
      elif grep -q -i 'text="Use"' /tmp/wd.xml; then
        log "Clicking 'Use' button..."
        click_text "Use" || true
      elif grep -q -i 'text="OK"' /tmp/wd.xml; then
        log "Clicking 'OK' button..."
        click_text "OK" || true
      fi
    fi
  done

  # ─── Step 7: Test Login Flow ──────────────────────────────────────────────────
  header "Step 7 — Test Login Flow"

  # 1. Log out from the registered session or go back to Login screen
  if dump_ui && grep -q 'text="Logout"' /tmp/wd.xml; then
    log "Registration succeeded! Logged in automatically. Logging out to test login flow…"
    click_text "Logout"
    sleep 3
  else
    warn "Logout button not found after registration — registration may have failed. Going back to Login screen..."
    # If not on Login screen, press back once
    if ! dump_ui || ! grep -q 'text="Continue with Passkey"' /tmp/wd.xml; then
      adb -s "$DEVICE" shell input keyevent 4
      sleep 1.5
      # If still not on Login screen, press back again
      if ! dump_ui || ! grep -q 'text="Continue with Passkey"' /tmp/wd.xml; then
        adb -s "$DEVICE" shell input keyevent 4
        sleep 2
      fi
    fi
  fi

  # 2. Fill login identifier and tap Continue with Passkey
  if dump_ui && grep -q 'text="Continue with Passkey"' /tmp/wd.xml; then
    log "Clearing and typing mobile number..."
    clear_edit_text
    type_into "$TEST_MOBILE"
    # Dismiss keyboard
    adb -s "$DEVICE" shell input keyevent 111
    sleep 1

    log "Tapping 'Continue with Passkey'…"
    click_text "Continue with Passkey"
    log "Waiting for native passkey login flow to complete..."
    for i in {1..15}; do
      sleep 1
      if dump_ui; then
        if grep -q -i 'text="Continue"' /tmp/wd.xml; then
          log "Clicking 'Continue' button..."
          click_text "Continue" || true
        elif grep -q -i 'text="Create"' /tmp/wd.xml; then
          log "Clicking 'Create' button..."
          click_text "Create" || true
        elif grep -q -i "text=\"${TEST_USERNAME}\"" /tmp/wd.xml; then
          log "Clicking username '${TEST_USERNAME}' selector..."
          click_text "${TEST_USERNAME}" || true
        elif grep -q -i 'text="Use screen lock"' /tmp/wd.xml; then
          log "Clicking 'Use screen lock' button..."
          click_text "Use screen lock" || true
        elif grep -q -i 'text="Use fingerprint"' /tmp/wd.xml; then
          log "Clicking 'Use fingerprint' button..."
          click_text "Use fingerprint" || true
        elif grep -q -i 'text="Use"' /tmp/wd.xml; then
          log "Clicking 'Use' button..."
          click_text "Use" || true
        elif grep -q -i 'text="OK"' /tmp/wd.xml; then
          log "Clicking 'OK' button..."
          click_text "OK" || true
        fi
      fi
    done
  else
    err "Continue with Passkey button not found on Login screen."
  fi
fi

if [[ "$TEST_FLOW" == "both" || "$TEST_FLOW" == "sna" ]]; then
  header "SNA Verification Flow"
  log "Waiting for app to load..."
  wait_for_text "App loaded" "Continue with Passkey" 25 || {
    if dump_ui && grep -q 'text="Logout"' /tmp/wd.xml; then
      log "Currently logged in — logging out first…"
      click_text "Logout"
      wait_for_text "Login screen after logout" "Continue with Passkey" 15
    fi
  }

  log "Clearing and typing mobile number..."
  clear_edit_text
  type_into "$TEST_MOBILE"
  adb -s "$DEVICE" shell input keyevent 111
  sleep 1

  log "Tapping 'Sign in with Mobile Network'…"
  click_text "Sign in with Mobile Network"

  # Wait for the confirmation dialog and tap 'Verify'
  log "Waiting for Mobile Network Verification popup…"
  wait_for_text "Popup visible" "Verify" 5 || true
  if dump_ui && grep -q 'text="Verify"' /tmp/wd.xml; then
    click_text "Verify"
  fi

  log "Waiting for SNA flow to complete (approx 10s)..."
  sleep 10
fi

# ─── Step 8: Kill logcat and analyse ──────────────────────────────────────────
header "Step 8 — Analyse results"
kill "$LOGCAT_PID" 2>/dev/null || true; LOGCAT_PID=0
sleep 1

# Declare test outcome tracking
PASS=0; FAIL=0; RESULTS=()

check() {
  local label="$1" pattern="$2"
  if grep -q "$pattern" "$LOGCAT_FILE" 2>/dev/null; then
    ok "  PASS  ${label}"
    RESULTS+=("PASS: ${label}")
    (( PASS++ )) || true
  else
    err "  FAIL  ${label}"
    RESULTS+=("FAIL: ${label}")
    (( FAIL++ )) || true
  fi
}

if [[ "$TEST_FLOW" == "both" || "$TEST_FLOW" == "passkey" ]]; then
  log "--- PASSKEY CHECKS ---"
  check "Token obtained"                       "Token received"
  check "GenerateKey request sent"             "Requesting registration challenge"
  check "GenerateKey 200 OK"                   "Registration challenge received"
  check "create() invoked"                     "Calling create"
  check "Credential returned"                  "Credential received"
  check "registerKey API called"               "Calling registerKey API"
  check "Registration successful"              "registerKey response"
  check "Loaded credentials from SecureStore" "Loaded credentials"
  check "Login challenge requested"           "Requesting login challenge"
  check "get() invoked"                        "Calling get"
fi

if [[ "$TEST_FLOW" == "both" || "$TEST_FLOW" == "sna" ]]; then
  log "--- SNA CHECKS ---"
  check "Token obtained"                       "Token received"
  check "SNA login flow started"               "Starting SNA login flow"
  check "POST auth/request sent"               "POST.*sna/auth/request"
  check "Challenge URL received"               "SNA Challenge URL received"
  check "Cellular GET triggered"               "triggering native cellular request"
  check "Cellular network request completed"   "Cellular network request completed"
  check "POST pin/verify sent"                 "POST.*sna/pin/verify"
fi

# Check for unexpected errors
if grep -q "405" "$LOGCAT_FILE"; then
  warn "  WARN  405 Method Not Allowed still present in logs — check endpoint paths"
  RESULTS+=("WARN: 405 error still in logs")
fi

if grep -q "assetlinks\|NotAllowedError\|SecurityError\|DomError" "$LOGCAT_FILE"; then
  warn "  WARN  Digital Asset Link / domain error detected (assetlinks.json may be missing)"
  RESULTS+=("WARN: Asset link / RP ID association error")
fi

# ─── Step 9: Generate report ──────────────────────────────────────────────────
header "Step 9 — Test report"
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
