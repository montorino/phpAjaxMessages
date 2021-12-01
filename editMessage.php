<?php

require_once ("pdo.php");

$db = new Database();

function post_data($field)
{
    $_POST[$field] ?? '';
    return htmlspecialchars(stripslashes($_POST[$field]));
}


if(isset($_POST['editMessage'])){
    $id = (int)post_data('messageEditID');
    $editMessage = post_data('editMessage');


    if($editMessage){
    $fieldValues = $db->query("SELECT * FROM `messages` WHERE `id` = ?", ["1"=>$id]);
    echo json_encode($fieldValues);
}





}

if(isset($_POST['updateInfoBtn'])){
    $updateInfo = post_data('updateInfo');
    $id = (int)post_data('messageUpdateID');
    $title = post_data('titleUpdate');
    $author = post_data('authorUpdate');
    $description = post_data('descriptionUpdate');
    $message = post_data('messageUpdate');


    if($updateInfo){
        $query = "UPDATE `messages` SET `title`=?,`author`=?,`description`=?,`message`=? WHERE `id` = ?";

        $paramArr = ["1"=>$title, "2"=>$author, "3"=>$description, "4"=>$message, "5"=>$id];

        $result = $db->execute($query, $paramArr);

        if($result){
            echo "The data has been chanded";
        }

    }





}


