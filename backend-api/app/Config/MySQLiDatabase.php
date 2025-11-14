<?php

namespace App\Config;

class MySQLiDatabase
{
    private $connection;
    private $host = 'localhost';
    private $username = 'root';
    private $password = '';
    private $database = 'accounting_app';
    private $port = 3306;

    public function __construct()
    {
        $this->connect();
    }

    private function connect()
    {
        $this->connection = new \mysqli(
            $this->host,
            $this->username,
            $this->password,
            $this->database,
            $this->port
        );

        if ($this->connection->connect_error) {
            throw new \Exception("Connection failed: " . $this->connection->connect_error);
        }

        // Set charset to utf8mb4
        $this->connection->set_charset('utf8mb4');
    }

    public function getConnection()
    {
        return $this->connection;
    }

    public function query($sql)
    {
        $result = $this->connection->query($sql);
        if (!$result) {
            throw new \Exception("Query failed: " . $this->connection->error);
        }
        return $result;
    }

    public function prepare($sql)
    {
        $stmt = $this->connection->prepare($sql);
        if (!$stmt) {
            throw new \Exception("Prepare failed: " . $this->connection->error);
        }
        return $stmt;
    }

    public function escape($string)
    {
        return $this->connection->real_escape_string($string);
    }

    public function lastInsertId()
    {
        return $this->connection->insert_id;
    }

    public function affectedRows()
    {
        return $this->connection->affected_rows;
    }

    public function close()
    {
        if ($this->connection) {
            $this->connection->close();
        }
    }

    public function __destruct()
    {
        $this->close();
    }
}