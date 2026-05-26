<?php

function env_load(): void
{
    static $loaded = false;
    if ($loaded) {
        return;
    }
    $loaded = true;

    $candidates = [];
    if (getenv('ADC_ENV_FILE')) {
        $candidates[] = getenv('ADC_ENV_FILE');
    }

    $dir = __DIR__;
    for ($i = 0; $i < 6; $i++) {
        $candidates[] = $dir . DIRECTORY_SEPARATOR . '.env';
        $dir = dirname($dir);
    }

    foreach ($candidates as $file) {
        if ($file && is_readable($file)) {
            foreach (file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
                $line = trim($line);
                if ($line === '' || strpos($line, '#') === 0 || strpos($line, '=') === false) {
                    continue;
                }
                [$key, $value] = explode('=', $line, 2);
                $key = trim($key);
                $value = trim($value);
                if (
                    (substr($value, 0, 1) === '"' && substr($value, -1) === '"') ||
                    (substr($value, 0, 1) === "'" && substr($value, -1) === "'")
                ) {
                    $value = substr($value, 1, -1);
                }
                if (getenv($key) === false) {
                    putenv($key . '=' . $value);
                    $_ENV[$key] = $value;
                }
            }
            return;
        }
    }
}

function env_value(string $key, ?string $default = null): ?string
{
    env_load();
    $value = getenv($key);
    return $value === false ? $default : $value;
}
