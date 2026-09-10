<?php
/* Server-side Data API Engine for Jago Corporation PLC */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$dataDir = __DIR__ . '/data';
$dataFile = $dataDir . '/database.json';

if (!file_exists($dataDir)) {
    @mkdir($dataDir, 0755, true);
}

$action = isset($_GET['action']) ? $_GET['action'] : (isset($_POST['action']) ? $_POST['action'] : 'load');

if ($action === 'load') {
    if (file_exists($dataFile)) {
        echo file_get_contents($dataFile);
    } else {
        echo json_encode(['status' => 'empty', 'message' => 'No database file initialized yet']);
    }
    exit();
}

if ($action === 'save') {
    $input = file_get_contents('php://input');
    if (!empty($input)) {
        $json = json_decode($input, true);
        if ($json !== null) {
            file_put_contents($dataFile, json_encode($json, JSON_PRETTY_PRINT));
            echo json_encode(['status' => 'success', 'message' => 'Server database updated successfully!']);
            exit();
        }
    }
    echo json_encode(['status' => 'error', 'message' => 'Invalid JSON payload']);
    exit();
}

echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
