<?php

require_once __DIR__ . '/../config/env.php';

function jwt_base64url_encode(string $value): string
{
    return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
}

function jwt_base64url_decode(string $value): string
{
    $padding = 4 - (strlen($value) % 4);
    if ($padding < 4) {
        $value .= str_repeat('=', $padding);
    }
    return base64_decode(strtr($value, '-_', '+/')) ?: '';
}

function jwt_secret_or_fail(): string
{
    $secret = env_value('JWT_SECRET');
    if (!$secret) {
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'Server misconfigured: JWT_SECRET is not set.']);
        exit;
    }
    return $secret;
}

function jwt_sign(array $payload, int $ttlSeconds = 28800): string
{
    $secret = jwt_secret_or_fail();
    $header = ['alg' => 'HS256', 'typ' => 'JWT'];
    $payload['iat'] = time();
    $payload['exp'] = time() + $ttlSeconds;

    $unsigned = jwt_base64url_encode(json_encode($header)) . '.' . jwt_base64url_encode(json_encode($payload));
    $signature = hash_hmac('sha256', $unsigned, $secret, true);
    return $unsigned . '.' . jwt_base64url_encode($signature);
}

function jwt_verify(string $token): ?array
{
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        return null;
    }

    [$header, $payload, $signature] = $parts;
    $secret = jwt_secret_or_fail();
    $expected = jwt_base64url_encode(hash_hmac('sha256', $header . '.' . $payload, $secret, true));
    if (!hash_equals($expected, $signature)) {
        return null;
    }

    $data = json_decode(jwt_base64url_decode($payload), true);
    if (!is_array($data) || !isset($data['exp']) || $data['exp'] < time()) {
        return null;
    }

    return $data;
}

function require_admin(): array
{
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!$header && function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        $header = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    }

    if (!preg_match('/^Bearer\s+(.+)$/i', $header, $matches)) {
        json_response(['success' => false, 'message' => 'Vui long dang nhap de tiep tuc.'], 401);
    }

    $payload = jwt_verify($matches[1]);
    if (!$payload) {
        json_response(['success' => false, 'message' => 'Phien dang nhap da het han.'], 401);
    }

    return $payload;
}

