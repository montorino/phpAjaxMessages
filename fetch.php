<?php

require_once ("pdo.php");

$db = new Database();

$windowLoaded = $_POST["windowLoaded"];

function post_data($field)
{
    $_POST[$field] ?? '';
    return htmlspecialchars(stripslashes($_POST[$field]));
}

if(isset($_POST['postMessage'])){
    $title = post_data('title');
    $author = post_data('author');
    $shortDescription = post_data('shortDescription');
    $fullDescription = post_data('message');

    echo json_encode($_POST['postMessage']);

    $query = "INSERT INTO `messages` SET `title`= ?, `author` = ?, `description` = ?, `message` = ?";
    $paramArr = ["1"=>$title, "2"=>$author, "3"=>$shortDescription, "4"=>$fullDescription];
    $db->execute($query, $paramArr);


}

if($windowLoaded){
    $data = $db->query("SELECT * FROM `messages` ORDER BY id DESC", []);
    echo json_encode($data);
}


