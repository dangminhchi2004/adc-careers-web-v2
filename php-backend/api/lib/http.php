<?php

function http_request(string $method, string $url, array $headers = [], ?string $body = null): array
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HEADER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_TIMEOUT => 60,
    ]);

    if ($body !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    }

    $raw = curl_exec($ch);
    if ($raw === false) {
        $message = curl_error($ch);
        curl_close($ch);
        throw new RuntimeException($message);
    }

    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $responseHeaders = substr($raw, 0, $headerSize);
    $responseBody = substr($raw, $headerSize);
    curl_close($ch);

    return [
        'status' => $status,
        'headers' => $responseHeaders,
        'body' => $responseBody,
        'json' => json_decode($responseBody, true),
    ];
}

function http_json_or_error(array $response, string $message): array
{
    if ($response['status'] >= 200 && $response['status'] < 300) {
        return is_array($response['json']) ? $response['json'] : [];
    }

    $detail = $response['json']['error']['message']
        ?? $response['json']['error_description']
        ?? $response['json']['error']
        ?? $response['body']
        ?? 'Unknown error';
    throw new RuntimeException($message . ': ' . $detail);
}

