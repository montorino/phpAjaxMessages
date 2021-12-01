<?php

require_once ("pdo.php");

$db = new Database();

$windowLoaded = $_POST["windowLoaded"];

function post_data($field)
{
    $_POST[$field] ?? '';
    return htmlspecialchars(stripslashes($_POST[$field]));
}

if(isset($_POST['postCommentBtn'])){
    $id = (int)post_data('messageID');
    $commentator = post_data('commentator');
    $comment = post_data('comment');
    $commentPosted = post_data('comment');


    $query = "INSERT INTO `comments` SET `messageID`= ?, `commentator` = ?, `commentText` = ?";
    $paramArr = ["1"=>$id, "2"=>$commentator, "3"=>$comment];
    $db->execute($query, $paramArr);



}

if(isset($_POST['viewCommentBtn'])){
    $id = (int)$_POST['itemID'];
    $commentPosted = $_POST['commentPosted'];


    if($commentPosted){
        $comments = $db->query("SELECT * FROM `comments` WHERE `messageID` = ?", ["1"=>$id]);
        echo json_encode($comments);
    }
}


