<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: *');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    if ($action === 'proxy_globe_call') {
        $targetUrl = $_POST['target_url'] ?? '';
        if (!$targetUrl) {
            echo json_encode(['error' => 'Missing target_url']);
            exit;
        }

        // Normalize URL if it goes through the gateway
        if (strpos($targetUrl, 'stg-sna.m360.com.ph/api/auth/check/') !== false) {
            $targetUrl = str_replace('stg-sna.m360.com.ph/api/auth/check/', 'stg-verify.m360.com.ph/v1/sna/auth/check/', $targetUrl);
        } elseif (strpos($targetUrl, 'sna/api/auth/check/') !== false) {
            $targetUrl = str_replace('sna/api/auth/check/', 'verify/v1/sna/auth/check/', $targetUrl);
        }

        $ch = curl_init($targetUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        // Set mock CloudFront headers in case we are calling the dev server from Wi-Fi
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Accept: application/json',
            'cloudfront-viewer-asn: 4775',
            'cloudfront-viewer-country: PH',
            'cloudfront-viewer-address: 1.1.1.1:1234'
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200) {
            echo json_encode([
                'error' => 'HTTP_ERROR',
                'status' => $httpCode,
                'response' => json_decode($response, true) ?? $response
            ]);
        } else {
            echo $response;
        }
        exit;
    }
}

echo json_encode(['error' => 'Invalid action or request method']);
