<?php

namespace Config;

use CodeIgniter\Config\BaseConfig;

class App extends BaseConfig
{
    public string $baseURL = 'http://localhost:8080/';
    public string $allowedHostnames = '';
    public string $indexPage = '';
    public string $uriProtocol = 'REQUEST_URI';
    public string $defaultLocale = 'en';
    public bool $negotiateLocale = false;
    public array $supportedLocales = ['en'];
    public string $appTimezone = 'UTC';
    public string $charset = 'UTF-8';
    public bool $forceGlobalSecureRequests = false;
    public bool $proxyIPs = false;
    public array $CSPEnabled = [];
}