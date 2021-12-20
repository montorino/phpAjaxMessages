<?php
//include_once("fetch.php");
?>


<!DOCTYPE html>
<html lang="ru" xmlns="http://www.w3.org/1999/html">
<head>
    <meta charset="UTF-8">
    <title>Title</title>
    <link rel="stylesheet" href="css/main.min.css">
</head>
<body>


<header class="header">
    <div class="logo"><a href="index.php">Articles with comments</a></div>
    <nav class="navbar">
        <ul>
            <li><a href="#" class="messagePost">Post a message</a></li>
        </ul>
    </nav>
</header>


<main class="main">

    <div class="fade-out-effect"></div>

    <div class="popup-form">
        <div class="container form">
            <div class="close-form-menu outer-shadow hover-in-shadow">
                ×
            </div>
            <div class="popup-form-inner">

                <form>
                    <div class="popup-form-item">
                        <input type="text" class="popup-form-item-control title" placeholder="Enter the title of the message"
                               required="required" name="title">
                    </div>
                    <div class="popup-form-item">
                        <input type="text" class="popup-form-item-control author"
                               placeholder="Who is the author?" required="required" name="author">
                    </div>
                    <div>
                        <textarea class="short_description" placeholder="Short description" name="shortDescription"></textarea>
                    </div>
                    <div>
                        <textarea class="full_description" placeholder="Your message here" name="message"></textarea>
                    </div>
                    <div>
                        <button class="btnPost" type="button" name="postBtn">Post the message</button>
                    </div>
                </form>
            </div>
        </div>
        <p class="copyright-text">© 2021 Rinat studio</p>


    </div>
    <div class="popup-comment-form">
        <div class="container form">
            <div class="close-form-menu outer-shadow hover-in-shadow">
                ×
            </div>
            <div class="popup-form-inner">

                <form>
                    <div class="popup-form-item">
                        <input type="text" class="popup-form-item-control firstName" placeholder="Your name, please"
                               required="required" name="firstName">
                    </div>
                    <div>
                        <textarea class="comment" placeholder="Your comment here, please" name="comment"></textarea>
                    </div>
                    <div>
                        <button class="addCommentBtn" type="button" name="commentBtn">Post the comment</button>
                    </div>
                    <input type="number" class="popup-form-item-control idField hide" name="messageID">
                </form>
            </div>
        </div>
        <p class="copyright-text">© 2021 Rinat studio</p>


    </div>
    <div class="popup-edit-form">
        <div class="container form">
            <div class="close-form-menu outer-shadow hover-in-shadow">
                ×
            </div>
            <div class="popup-form-inner">

                <form>
                    <div class="popup-form-item">
                        <input type="text" class="popup-form-item-control title" placeholder="Enter the title of the message"
                               required="required" name="title">
                    </div>
                    <div class="popup-form-item">
                        <input type="text" class="popup-form-item-control author"
                               placeholder="Who is the author?" required="required" name="author">
                    </div>
                    <div>
                        <textarea class="short_description" placeholder="Short description" name="shortDescription"></textarea>
                    </div>
                    <div>
                        <textarea class="full_description" placeholder="Your message here" name="message"></textarea>
                    </div>
                    <div>
                        <button class="btnEdit" type="button" name="editBtn">Save the changes</button>
                    </div>
                    <input type="number" class="popup-form-item-control idField hide" name="messageID">
                </form>
            </div>
        </div>
        <p class="copyright-text">© 2021 Rinat studio</p>


    </div>


    <div class="message_list"></div>

<div class="pagenumbers" id="pagination"></div>


</main>

<footer>

</footer>


<script src="js/main.js"></script>

</body>
</html>
