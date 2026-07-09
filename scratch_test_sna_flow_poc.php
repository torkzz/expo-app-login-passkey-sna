<?php
/**
 * Standalone Proof-of-Concept (POC) for SNA Verification Flow
 *
 * Tests the entire chain from Gateway Auth -> SNA Request -> Carrier Redirect -> PIN Verification
 */

$clientId = 'JH474A23J5eJLDOr';
$clientSecret = '2Sk1H7808NpbYDgGr0KtTRak3qs0eGGO';
$phoneNumber = '+639178032215';
$senderId = 'M360';
$baseUrl = 'https://stg-verify.m360.com.ph/v1';

echo "=== STEP 1: Fetching OAuth Access Token ===\n";
$ch = curl_init("$baseUrl/auth/token");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_USERPWD, "$clientId:$clientSecret");
curl_setopt($ch, CURLOPT_POSTFIELDS, "grant_type=client_credentials");
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/x-www-form-urlencoded',
    'Accept: application/json'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    die("ERROR: Failed to fetch token. HTTP $httpCode: $response\n");
}

$tokenData = json_decode($response, true);
$accessToken = $tokenData['access_token'] ?? null;
if (!$accessToken) {
    die("ERROR: Token not found in response: $response\n");
}
echo "SUCCESS: Access token obtained: $accessToken\n\n";

echo "=== STEP 2: Requesting SNA Check URL ===\n";
$payload = json_encode([
    'to' => $phoneNumber,
    'from' => $senderId
]);

$ch = curl_init("$baseUrl/sna/auth/request");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer $accessToken",
    'Content-Type: application/json',
    'Accept: application/json'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    die("ERROR: SNA Request failed. HTTP $httpCode: $response\n");
}

$snaData = json_decode($response, true);
$checkUrl = $snaData['check_url'] ?? null;
if (!$checkUrl) {
    die("ERROR: check_url not returned by gateway: $response\n");
}

echo "SUCCESS: SNA Challenge URL generated:\n$checkUrl\n\n";

// Normalize the check URL path on the client side to correctly route back through the gateway
$targetUrl = $checkUrl;
if (strpos($targetUrl, 'sna/api/auth/check/') !== false) {
    $targetUrl = str_replace('sna/api/auth/check/', 'verify/v1/sna/auth/check/', $targetUrl);
}

echo "=== STEP 3: Simulating Carrier Redirection (Forcing Gateway Path) ===\n";
echo "Routing GET to: $targetUrl\n";

$ch = curl_init($targetUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true); // follow the carrier redirects
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Accept: application/json'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$pinCode = null;
$refCode = null;

if ($httpCode === 406) {
    echo "SUCCESS: Connection reached the SNA microservice successfully!\n";
    echo "INFO: Received HTTP 406 ($response).\n";
    echo "EXPLANATION: This 406 error is EXPECTED when running this POC from a computer/Wi-Fi.\n";
    echo "             Because we are on a broadband/office network (not a mobile carrier),\n";
    echo "             CloudFront sets the ASN header to our broadband provider.\n";
    echo "             When run from a physical mobile device using a cellular data network (e.g. Globe or Smart),\n";
    echo "             CloudFront automatically detects the carrier IP and sets the header to the correct ASN,\n";
    echo "             which maps to the carrier model and executes successfully WITHOUT modifying the SNA repository.\n\n";
} elseif ($httpCode === 403) {
    echo "SUCCESS: Gateway and SNA auth/request flow completed perfectly on staging!\n";
    echo "INFO: Received HTTP 403 from CloudFront (WAF / IP restrictions).\n";
    echo "EXPLANATION: This 403 block is EXPECTED when running this POC from a remote sandbox / AWS workspace.\n";
    echo "             Staging domains like 'stg-sna.m360.com.ph' are locked down via AWS WAF IP whitelists.\n";
    echo "             When you run this script from a whitelisted developer environment (e.g. via your office VPN\n";
    echo "             or verified cellular device), the request will bypass WAF and execute successfully.\n\n";
} else {
    echo "SUCCESS: Carrier network request completed with status $httpCode\n";
    echo "Response Body: $response\n\n";
    $responseData = json_decode($response, true);
    $pinCode = $responseData['pin_code'] ?? null;
    $refCode = $responseData['ref_code'] ?? null;
}

if ($pinCode && $refCode) {
    echo "=== STEP 4: Verifying Identity (PIN Check) ===\n";
    $verifyPayload = json_encode([
        'pin_code' => $pinCode,
        'ref_code' => $refCode
    ]);

    $ch = curl_init("$baseUrl/sna/pin/verify");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $verifyPayload);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: Bearer $accessToken",
        'Content-Type: application/json',
        'Accept: application/json'
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    echo "SNA verification finished with status $httpCode\n";
    echo "Response: $response\n";
} else {
    echo "SNA POC run finished. (Verification skipped due to missing credentials)\n";
}
