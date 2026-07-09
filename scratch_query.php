<?php
$token = 'GD0kEX3lchPOZCauaQMEF3BejttXCLar';
$url = 'https://dev.m360.com.ph/verify/v1/passkey/login/request';

$payload = [
    'pin_code' => '122899',
    'ref_code' => 'XS6Xuk'
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json',
    'Authorization: Bearer ' . $token
]);

$response = curl_exec($ch);
$info = curl_getinfo($ch);
curl_close($ch);

echo "HTTP Status: " . $info['http_code'] . "\n";
echo "Response: " . $response . "\n";
