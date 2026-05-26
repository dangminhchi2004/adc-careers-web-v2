<?php

require_once __DIR__ . '/../config/env.php';
require_once __DIR__ . '/http.php';

const GRAPH_BASE_URL = 'https://graph.microsoft.com/v1.0';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_DRIVE_BASE_URL = 'https://www.googleapis.com/drive/v3';
const GOOGLE_DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3';

function store_cv_file(array $file): array
{
    $storage = strtolower(trim(env_value('CV_STORAGE', 'local')));
    if ($storage === 'onedrive') {
        return upload_to_onedrive($file);
    }
    if ($storage === 'sharepoint') {
        return upload_to_sharepoint($file);
    }
    if (in_array($storage, ['google_drive', 'googledrive', 'google-drive', 'gdrive'], true)) {
        return upload_to_google_drive($file);
    }
    return save_to_local_disk($file);
}

function delete_stored_cv(?array $storage): void
{
    if (!$storage) {
        return;
    }

    try {
        if (in_array($storage['provider'] ?? '', ['onedrive', 'sharepoint'], true) && !empty($storage['driveId']) && !empty($storage['driveItemId'])) {
            graph_delete_item($storage['driveId'], $storage['driveItemId']);
        }
        if (($storage['provider'] ?? '') === 'google_drive' && !empty($storage['externalId'])) {
            google_delete_file($storage['externalId']);
        }
    } catch (Throwable $error) {
        error_log('Could not cleanup stored CV: ' . $error->getMessage());
    }
}

function load_cv_binary(array $application): array
{
    $provider = $application['cvStorageProvider'] ?? 'local';
    if ($provider === 'onedrive' || $provider === 'sharepoint') {
        return graph_download_file($application);
    }
    if ($provider === 'google_drive') {
        return google_download_file($application);
    }
    return local_download_file($application);
}

function save_to_local_disk(array $file): array
{
    $uploadsDir = __DIR__ . '/../uploads/cvs';
    if (!is_dir($uploadsDir)) {
        mkdir($uploadsDir, 0775, true);
    }

    $fileName = build_storage_file_name($file['name']);
    $target = $uploadsDir . '/' . $fileName;
    if (!move_uploaded_file($file['tmp_name'], $target)) {
        throw new RuntimeException('Could not save CV locally.');
    }

    return [
        'provider' => 'local',
        'fileName' => $fileName,
        'filePath' => '/api/uploads/cvs/' . $fileName,
        'mimeType' => $file['type'] ?: 'application/octet-stream',
        'size' => (int) $file['size'],
    ];
}

function local_download_file(array $application): array
{
    $filePath = $application['cvFilePath'] ?? '';
    $fileName = $application['cvFileName'] ?? '';
    $absolutePath = __DIR__ . '/../uploads/cvs/' . basename($fileName ?: $filePath);
    if (!$fileName && $filePath) {
        $absolutePath = __DIR__ . '/../' . ltrim(str_replace('/api/', '', $filePath), '/');
    }

    $root = realpath(__DIR__ . '/../uploads');
    $resolved = realpath($absolutePath);
    if (!$root || !$resolved || strpos($resolved, $root) !== 0 || !is_file($resolved)) {
        throw new RuntimeException('CV_NOT_FOUND');
    }

    return [
        'body' => file_get_contents($resolved),
        'fileName' => $application['cvOriginalName'] ?: ($application['cvFileName'] ?: 'cv'),
        'mimeType' => $application['cvMimeType'] ?: 'application/octet-stream',
    ];
}

function upload_to_google_drive(array $file): array
{
    require_env(['GOOGLE_DRIVE_FOLDER_ID', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REFRESH_TOKEN']);

    $token = google_access_token();
    $now = new DateTimeImmutable('now');
    $year = $now->format('Y');
    $month = $now->format('m');
    $fileName = build_storage_file_name($file['name']);
    $yearFolderId = google_ensure_folder($token, env_value('GOOGLE_DRIVE_FOLDER_ID'), $year);
    $monthFolderId = google_ensure_folder($token, $yearFolderId, $month);
    $metadata = ['name' => $fileName, 'parents' => [$monthFolderId]];
    $boundary = 'adc-careers-' . bin2hex(random_bytes(12));
    $body = "--{$boundary}\r\n"
        . "Content-Type: application/json; charset=UTF-8\r\n\r\n"
        . json_encode($metadata)
        . "\r\n--{$boundary}\r\n"
        . "Content-Type: " . ($file['type'] ?: 'application/octet-stream') . "\r\n\r\n"
        . file_get_contents($file['tmp_name'])
        . "\r\n--{$boundary}--";

    $response = http_request(
        'POST',
        GOOGLE_DRIVE_UPLOAD_URL . '/files?uploadType=multipart&fields=id,name,mimeType,size,webViewLink,parents&supportsAllDrives=true',
        [
            'Authorization: Bearer ' . $token,
            'Content-Type: multipart/related; boundary=' . $boundary,
            'Content-Length: ' . strlen($body),
        ],
        $body
    );
    $result = http_json_or_error($response, 'Could not upload CV to Google Drive');

    return [
        'provider' => 'google_drive',
        'fileName' => $fileName,
        'filePath' => null,
        'mimeType' => $file['type'] ?: 'application/octet-stream',
        'size' => (int) $file['size'],
        'driveItemId' => $result['id'] ?? null,
        'webUrl' => $result['webViewLink'] ?? null,
        'externalId' => $result['id'] ?? null,
        'externalParentId' => $monthFolderId,
        'externalUrl' => $result['webViewLink'] ?? null,
        'storagePath' => "{$year}/{$month}/{$fileName}",
    ];
}

function google_access_token(): string
{
    static $cache = null;
    if ($cache && $cache['expiresAt'] > time() + 60) {
        return $cache['token'];
    }

    $response = http_request(
        'POST',
        GOOGLE_TOKEN_URL,
        ['Content-Type: application/x-www-form-urlencoded'],
        http_build_query([
            'client_id' => env_value('GOOGLE_CLIENT_ID'),
            'client_secret' => env_value('GOOGLE_CLIENT_SECRET'),
            'refresh_token' => env_value('GOOGLE_REFRESH_TOKEN'),
            'grant_type' => 'refresh_token',
        ])
    );
    $result = http_json_or_error($response, 'Could not authenticate with Google Drive OAuth');
    $cache = [
        'token' => $result['access_token'],
        'expiresAt' => time() + (int) ($result['expires_in'] ?? 3600),
    ];
    return $cache['token'];
}

function google_ensure_folder(string $token, string $parentId, string $folderName): string
{
    $existing = google_find_folder($token, $parentId, $folderName);
    if ($existing) {
        return $existing['id'];
    }

    $response = http_request(
        'POST',
        GOOGLE_DRIVE_BASE_URL . '/files?fields=id,name,webViewLink&supportsAllDrives=true',
        [
            'Authorization: Bearer ' . $token,
            'Content-Type: application/json',
        ],
        json_encode([
            'name' => $folderName,
            'mimeType' => 'application/vnd.google-apps.folder',
            'parents' => [$parentId],
        ])
    );
    $result = http_json_or_error($response, 'Could not create Google Drive folder');
    return $result['id'];
}

function google_find_folder(string $token, string $parentId, string $folderName): ?array
{
    $query = "mimeType = 'application/vnd.google-apps.folder' and name = '"
        . google_query_escape($folderName)
        . "' and '"
        . google_query_escape($parentId)
        . "' in parents and trashed = false";
    $params = http_build_query([
        'q' => $query,
        'fields' => 'files(id,name)',
        'spaces' => 'drive',
        'pageSize' => '1',
        'supportsAllDrives' => 'true',
        'includeItemsFromAllDrives' => 'true',
    ]);
    $response = http_request('GET', GOOGLE_DRIVE_BASE_URL . '/files?' . $params, [
        'Authorization: Bearer ' . $token,
    ]);
    $result = http_json_or_error($response, 'Could not inspect Google Drive folder');
    return $result['files'][0] ?? null;
}

function google_download_file(array $application): array
{
    $fileId = $application['cvExternalId'] ?: $application['cvDriveItemId'];
    if (!$fileId) {
        throw new RuntimeException('CV_NOT_FOUND');
    }
    $response = http_request('GET', GOOGLE_DRIVE_BASE_URL . '/files/' . rawurlencode($fileId) . '?alt=media&supportsAllDrives=true', [
        'Authorization: Bearer ' . google_access_token(),
    ]);
    if ($response['status'] < 200 || $response['status'] >= 300) {
        http_json_or_error($response, 'Could not download CV from Google Drive');
    }
    return [
        'body' => $response['body'],
        'fileName' => $application['cvOriginalName'] ?: ($application['cvFileName'] ?: 'cv'),
        'mimeType' => $application['cvMimeType'] ?: 'application/octet-stream',
    ];
}

function google_delete_file(string $fileId): void
{
    $response = http_request('DELETE', GOOGLE_DRIVE_BASE_URL . '/files/' . rawurlencode($fileId) . '?supportsAllDrives=true', [
        'Authorization: Bearer ' . google_access_token(),
    ]);
    if ($response['status'] !== 404 && ($response['status'] < 200 || $response['status'] >= 300)) {
        http_json_or_error($response, 'Could not delete CV from Google Drive');
    }
}

function upload_to_onedrive(array $file): array
{
    require_env(['MS_TENANT_ID', 'MS_CLIENT_ID', 'MS_CLIENT_SECRET', 'ONEDRIVE_USER_ID']);
    $token = graph_access_token();
    $storagePath = build_dated_path(env_value('ONEDRIVE_BASE_PATH', 'ADC-Careers/CVs'), $file['name']);
    $userId = rawurlencode(env_value('ONEDRIVE_USER_ID'));
    graph_ensure_user_drive_folders($token, $userId, dirname_posix($storagePath));

    $response = http_request(
        'PUT',
        GRAPH_BASE_URL . "/users/{$userId}/drive/root:/" . graph_encode_path($storagePath) . ':/content',
        [
            'Authorization: Bearer ' . $token,
            'Content-Type: ' . ($file['type'] ?: 'application/octet-stream'),
        ],
        file_get_contents($file['tmp_name'])
    );
    $result = http_json_or_error($response, 'Could not upload CV to OneDrive');
    return graph_storage_result('onedrive', $file, $result, $storagePath);
}

function upload_to_sharepoint(array $file): array
{
    require_env(['MS_TENANT_ID', 'MS_CLIENT_ID', 'MS_CLIENT_SECRET', 'SHAREPOINT_DRIVE_ID']);
    $token = graph_access_token();
    $storagePath = build_dated_path(env_value('SHAREPOINT_BASE_PATH', 'ADC-Careers/CVs'), $file['name']);
    $driveId = rawurlencode(env_value('SHAREPOINT_DRIVE_ID'));
    graph_ensure_drive_folders($token, $driveId, dirname_posix($storagePath));

    $response = http_request(
        'PUT',
        GRAPH_BASE_URL . "/drives/{$driveId}/root:/" . graph_encode_path($storagePath) . ':/content',
        [
            'Authorization: Bearer ' . $token,
            'Content-Type: ' . ($file['type'] ?: 'application/octet-stream'),
        ],
        file_get_contents($file['tmp_name'])
    );
    $result = http_json_or_error($response, 'Could not upload CV to SharePoint');
    return graph_storage_result('sharepoint', $file, $result, $storagePath);
}

function graph_access_token(): string
{
    static $cache = null;
    if ($cache && $cache['expiresAt'] > time() + 60) {
        return $cache['token'];
    }

    $tenant = rawurlencode(env_value('MS_TENANT_ID'));
    $response = http_request(
        'POST',
        "https://login.microsoftonline.com/{$tenant}/oauth2/v2.0/token",
        ['Content-Type: application/x-www-form-urlencoded'],
        http_build_query([
            'client_id' => env_value('MS_CLIENT_ID'),
            'client_secret' => env_value('MS_CLIENT_SECRET'),
            'scope' => 'https://graph.microsoft.com/.default',
            'grant_type' => 'client_credentials',
        ])
    );
    $result = http_json_or_error($response, 'Could not authenticate with Microsoft Graph');
    $cache = [
        'token' => $result['access_token'],
        'expiresAt' => time() + (int) ($result['expires_in'] ?? 3600),
    ];
    return $cache['token'];
}

function graph_storage_result(string $provider, array $file, array $result, string $storagePath): array
{
    $parent = $result['parentReference'] ?? [];
    return [
        'provider' => $provider,
        'fileName' => basename($storagePath),
        'filePath' => null,
        'mimeType' => $file['type'] ?: 'application/octet-stream',
        'size' => (int) $file['size'],
        'driveId' => $parent['driveId'] ?? null,
        'driveItemId' => $result['id'] ?? null,
        'webUrl' => $result['webUrl'] ?? null,
        'oneDrivePath' => $provider === 'onedrive' ? $storagePath : null,
        'externalId' => $result['id'] ?? null,
        'externalParentId' => $parent['id'] ?? null,
        'externalUrl' => $result['webUrl'] ?? null,
        'storagePath' => $storagePath,
    ];
}

function graph_download_file(array $application): array
{
    if (empty($application['cvDriveId']) || empty($application['cvDriveItemId'])) {
        throw new RuntimeException('CV_NOT_FOUND');
    }
    $response = http_request(
        'GET',
        GRAPH_BASE_URL . '/drives/' . rawurlencode($application['cvDriveId']) . '/items/' . rawurlencode($application['cvDriveItemId']) . '/content',
        ['Authorization: Bearer ' . graph_access_token()]
    );
    if ($response['status'] < 200 || $response['status'] >= 300) {
        http_json_or_error($response, 'Could not download CV from Microsoft Graph');
    }
    return [
        'body' => $response['body'],
        'fileName' => $application['cvOriginalName'] ?: ($application['cvFileName'] ?: 'cv'),
        'mimeType' => $application['cvMimeType'] ?: 'application/octet-stream',
    ];
}

function graph_delete_item(string $driveId, string $itemId): void
{
    $response = http_request('DELETE', GRAPH_BASE_URL . '/drives/' . rawurlencode($driveId) . '/items/' . rawurlencode($itemId), [
        'Authorization: Bearer ' . graph_access_token(),
    ]);
    if ($response['status'] !== 404 && ($response['status'] < 200 || $response['status'] >= 300)) {
        http_json_or_error($response, 'Could not delete CV from Microsoft Graph');
    }
}

function graph_ensure_user_drive_folders(string $token, string $userId, string $folderPath): void
{
    $parts = normalize_path($folderPath) ? explode('/', normalize_path($folderPath)) : [];
    $parentId = null;
    $current = '';
    foreach ($parts as $part) {
        $current = $current ? $current . '/' . $part : $part;
        $existing = graph_get_user_drive_item_by_path($token, $userId, $current);
        if ($existing) {
            $parentId = $existing['id'];
            continue;
        }
        $url = $parentId
            ? GRAPH_BASE_URL . "/users/{$userId}/drive/items/" . rawurlencode($parentId) . '/children'
            : GRAPH_BASE_URL . "/users/{$userId}/drive/root/children";
        $result = graph_create_folder($token, $url, $part);
        $parentId = $result['id'];
    }
}

function graph_ensure_drive_folders(string $token, string $driveId, string $folderPath): void
{
    $parts = normalize_path($folderPath) ? explode('/', normalize_path($folderPath)) : [];
    $parentId = null;
    $current = '';
    foreach ($parts as $part) {
        $current = $current ? $current . '/' . $part : $part;
        $existing = graph_get_drive_item_by_path($token, $driveId, $current);
        if ($existing) {
            $parentId = $existing['id'];
            continue;
        }
        $url = $parentId
            ? GRAPH_BASE_URL . "/drives/{$driveId}/items/" . rawurlencode($parentId) . '/children'
            : GRAPH_BASE_URL . "/drives/{$driveId}/root/children";
        $result = graph_create_folder($token, $url, $part);
        $parentId = $result['id'];
    }
}

function graph_create_folder(string $token, string $url, string $name): array
{
    $response = http_request('POST', $url, [
        'Authorization: Bearer ' . $token,
        'Content-Type: application/json',
    ], json_encode([
        'name' => $name,
        'folder' => new stdClass(),
        '@microsoft.graph.conflictBehavior' => 'fail',
    ]));
    return http_json_or_error($response, 'Could not create Microsoft Graph folder');
}

function graph_get_user_drive_item_by_path(string $token, string $userId, string $itemPath): ?array
{
    $response = http_request('GET', GRAPH_BASE_URL . "/users/{$userId}/drive/root:/" . graph_encode_path($itemPath), [
        'Authorization: Bearer ' . $token,
    ]);
    if ($response['status'] === 404) {
        return null;
    }
    return http_json_or_error($response, 'Could not inspect OneDrive folder');
}

function graph_get_drive_item_by_path(string $token, string $driveId, string $itemPath): ?array
{
    $response = http_request('GET', GRAPH_BASE_URL . "/drives/{$driveId}/root:/" . graph_encode_path($itemPath), [
        'Authorization: Bearer ' . $token,
    ]);
    if ($response['status'] === 404) {
        return null;
    }
    return http_json_or_error($response, 'Could not inspect SharePoint folder');
}

function require_env(array $keys): void
{
    $missing = [];
    foreach ($keys as $key) {
        if (!env_value($key)) {
            $missing[] = $key;
        }
    }
    if ($missing) {
        throw new RuntimeException('Missing configuration: ' . implode(', ', $missing));
    }
}

function build_storage_file_name(string $originalName): string
{
    $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
    $base = pathinfo($originalName, PATHINFO_FILENAME);
    $base = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $base) ?: $base;
    $base = strtolower(preg_replace('/[^a-zA-Z0-9]+/', '-', $base));
    $base = trim($base, '-');
    if ($base === '') {
        $base = 'cv';
    }
    $base = substr($base, 0, 80);
    $suffix = $extension ? '.' . $extension : '';
    return time() . '-' . bin2hex(random_bytes(12)) . '-' . $base . $suffix;
}

function build_dated_path(string $basePath, string $originalName): string
{
    $base = normalize_path($basePath);
    $now = new DateTimeImmutable('now');
    return $base . '/' . $now->format('Y') . '/' . $now->format('m') . '/' . build_storage_file_name($originalName);
}

function normalize_path(string $value): string
{
    $value = str_replace('\\', '/', $value);
    $value = preg_replace('#/+#', '/', $value);
    return trim($value, '/');
}

function dirname_posix(string $path): string
{
    return str_replace('\\', '/', dirname($path));
}

function graph_encode_path(string $path): string
{
    return implode('/', array_map('rawurlencode', array_filter(explode('/', $path), function ($part) {
        return $part !== '';
    })));
}

function google_query_escape(string $value): string
{
    return str_replace(["\\", "'"], ["\\\\", "\\'"], $value);
}
