#!/usr/bin/env bash
# Standalone Bash Proof-of-Concept (POC) for SNA Verification Flow

CLIENT_ID="JH474A23J5eJLDOr"
CLIENT_SECRET="2Sk1H7808NpbYDgGr0KtTRak3qs0eGGO"
PHONE_NUMBER="+639178032215"
SENDER_ID="M360"
BASE_URL="https://stg-verify.m360.com.ph/v1"

echo "=== STEP 1: Fetching OAuth Access Token ==="
TOKEN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/token" \
  -u "$CLIENT_ID:$CLIENT_SECRET" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "Accept: application/json" \
  -d "grant_type=client_credentials")

ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('access_token', ''))" 2>/dev/null)

if [ -z "$ACCESS_TOKEN" ]; then
  echo "ERROR: Failed to fetch token. Response: $TOKEN_RESPONSE"
  exit 1
fi
echo "SUCCESS: Access token obtained: $ACCESS_TOKEN"
echo ""

echo "=== STEP 2: Requesting SNA Check URL ==="
SNA_RESPONSE=$(curl -s -X POST "$BASE_URL/sna/auth/request" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "{\"to\": \"$PHONE_NUMBER\", \"from\": \"$SENDER_ID\"}")

CHECK_URL=$(echo "$SNA_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('check_url', ''))" 2>/dev/null)

if [ -z "$CHECK_URL" ]; then
  echo "ERROR: SNA Request failed. Response: $SNA_RESPONSE"
  exit 1
fi
echo "SUCCESS: SNA Challenge URL generated:"
echo "$CHECK_URL"
echo ""

# Set DIRECT_ROUTE to true to test directly over mobile data (bypassing staging gateway proxy)
DIRECT_ROUTE=true

if [ "$DIRECT_ROUTE" = true ]; then
  TARGET_URL="$CHECK_URL"
else
  # Normalize staging redirect paths through the gateway URL
  TARGET_URL=$(echo "$CHECK_URL" | sed 's|stg-sna.m360.com.ph/api/auth/check/|stg-verify.m360.com.ph/v1/sna/auth/check/|g')
fi

echo "=== STEP 3: Simulating Carrier Redirection (Forcing Gateway Path) ==="
echo "Routing GET to: $TARGET_URL"
echo ""

# Execute GET and follow redirects, capturing the final effective URL
echo "Executing cellular GET and following redirect chain..."
FINAL_URL=$(curl -s -L -o /dev/null -w "%{url_effective}" -X GET "$TARGET_URL" -H "Accept: application/json")

echo "Final Redirect URL: $FINAL_URL"
echo ""

# Extract pin_code and ref_code from the query parameters of the final URL
PIN=$(echo "$FINAL_URL" | grep -o -E "pin_code=[a-zA-Z0-9]+" | cut -d'=' -f2)
REF=$(echo "$FINAL_URL" | grep -o -E "ref_code=[a-zA-Z0-9]+" | cut -d'=' -f2)

if [ -z "$PIN" ] || [ -z "$REF" ]; then
  echo "WARNING: Could not parse pin_code or ref_code from final URL."
  echo "         This is expected if testing over Wi-Fi, or if the carrier redirection fails."
else
  echo "SUCCESS: Parsed Verification Parameters:"
  echo "  pin_code: $PIN"
  echo "  ref_code: $REF"
  echo ""
  
  echo "=== STEP 4: Verifying Identity (PIN Check) ==="
  VERIFY_RES=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/sna/pin/verify" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -H "Accept: application/json" \
    -d "{\"pin_code\": \"$PIN\", \"ref_code\": \"$REF\"}")
  
  V_CODE=$(echo "$VERIFY_RES" | tail -n1)
  V_BODY=$(echo "$VERIFY_RES" | sed '$d')
  echo "SNA verification finished with status $V_CODE"
  echo "Response: $V_BODY"
fi
echo ""
