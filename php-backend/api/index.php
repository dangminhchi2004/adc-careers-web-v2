<?php

require_once __DIR__ . '/lib/response.php';
require_once __DIR__ . '/config/schema.php';
require_once __DIR__ . '/controllers/api.php';

cors_headers();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

try {
    ensure_schema();

    $method = $_SERVER['REQUEST_METHOD'];
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/';
    $scriptDir = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'])), '/');
    if ($scriptDir && strpos($path, $scriptDir) === 0) {
        $path = substr($path, strlen($scriptDir));
    }
    $path = '/' . trim($path, '/');

    if ($method === 'GET' && $path === '/jobs') {
        get_active_jobs();
    }

    if ($method === 'POST' && $path === '/apply') {
        submit_application();
    }

    if ($method === 'POST' && $path === '/auth/login') {
        login_admin();
    }

    if ($method === 'GET' && $path === '/admin/jobs') {
        admin_get_jobs();
    }

    if ($method === 'POST' && $path === '/admin/jobs') {
        admin_create_job();
    }

    if (preg_match('#^/admin/jobs/(\d+)$#', $path, $matches)) {
        if ($method === 'PUT') {
            admin_update_job((int) $matches[1]);
        }
        if ($method === 'DELETE') {
            admin_delete_job((int) $matches[1]);
        }
    }

    if ($method === 'GET' && $path === '/admin/applications') {
        admin_get_applications();
    }

    if ($method === 'GET' && preg_match('#^/admin/applications/(\d+)/cv$#', $path, $matches)) {
        admin_download_cv((int) $matches[1]);
    }

    json_response(['success' => false, 'message' => 'API endpoint not found.'], 404);
} catch (Throwable $error) {
    error_log($error->getMessage());
    json_response(['success' => false, 'message' => 'Khong the xu ly yeu cau luc nay.'], 500);
}
