<?php

Class Database
{

    private $conn;


    public function __construct()
    {
        $this->connect();
    }


    private function connect()
    {
        $config = require_once('config.php');
        $dsn = 'mysql:host=' . $config['host'] . ';dbname=' . $config['db_name'] . ';charset=' . $config['charset'];
        $this->conn = new PDO($dsn, $config['username'], $config['password']);
        return $this;
    }


    public function execute($sql, $arr)
    {
        $sth = $this->conn->prepare($sql);
        foreach ($arr as $key => $value) {
            $sth->bindValue($key, $value);
        };

        return $sth->execute();
    }


    public function query($sql, $arr)
    {
        $sth = $this->conn->prepare($sql);
        foreach ($arr as $key => $value) {
            $sth->bindValue($key, $value);
        };
        $sth->execute();
        $result = $sth->fetchAll(PDO::FETCH_ASSOC);

        if ($result === false) {
            return [];
        }

        return $result;
    }

}

