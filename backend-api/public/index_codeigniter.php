<?php

/**
 * CodeIgniter 4 Bootstrap File
 * 
 * This file serves as the entry point for the CodeIgniter 4 application.
 * Make sure to install dependencies via Composer before running.
 */

// Check if CodeIgniter is installed
if (!file_exists(__DIR__ . '/../vendor/autoload.php')) {
    die('
    <h1>CodeIgniter 4 Backend Setup Required</h1>
    <p>Please install the dependencies first:</p>
    <ol>
        <li>Ensure PHP has the OpenSSL extension enabled</li>
        <li>Install Composer if not already installed</li>
        <li>Run: <code>composer install</code> in the backend-api directory</li>
        <li>Import the database schema: <code>mysql -u root -p &lt; database_setup.sql</code></li>
        <li>Configure your .env file with database credentials</li>
    </ol>
    <p>Current status: Dependencies not installed</p>
    ');
}

// Path to the front controller
define('FCPATH', __DIR__ . DIRECTORY_SEPARATOR);

// Ensure the current directory is pointing to the front controller's directory
chdir(FCPATH);

/*
 *---------------------------------------------------------------
 * BOOTSTRAP THE APPLICATION
 *---------------------------------------------------------------
 * This process sets up the path constants, loads and registers
 * our autoloader, along with Composer's, loads our constants
 * and fires up an environment-specific bootstrapping.
 */

// Load our paths config file
// This is the line that might need to be changed, depending on your folder structure.
require FCPATH . '../app/Config/Paths.php';
// ^^^ Change this line if you move your application folder

$paths = new Config\Paths();

// Location of the framework bootstrap file.
require rtrim($paths->systemDirectory, '\\/ ') . DIRECTORY_SEPARATOR . 'bootstrap.php';

// Load environment settings from .env files into $_SERVER and $_ENV
require_once SYSTEMPATH . 'Config/DotEnv.php';
(new CodeIgniter\Config\DotEnv(ROOTPATH))->load();

/*
 * ---------------------------------------------------------------
 * GRAB OUR CODEIGNITER INSTANCE
 * ---------------------------------------------------------------
 *
 * The CodeIgniter class contains the core functionality to make
 * the application run, and does all the dirty work for us.
 */
$app = Config\Services::codeigniter();
$app->initialize();
$context = is_cli() ? 'php-cli' : 'web';
$app->setContext($context);

/*
 *---------------------------------------------------------------
 * LAUNCH THE APPLICATION
 *---------------------------------------------------------------
 * Now that everything is setup, it's time to actually fire
 * up the engines and make this app do its thang.
 */
$app->run();