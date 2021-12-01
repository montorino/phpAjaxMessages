-- phpMyAdmin SQL Dump
-- version 4.9.0.1
-- https://www.phpmyadmin.net/
--
-- Хост: 127.0.0.1:3306
-- Время создания: Дек 01 2021 г., 12:35
-- Версия сервера: 5.7.23
-- Версия PHP: 7.0.33

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- База данных: `smallblog`
--

-- --------------------------------------------------------

--
-- Структура таблицы `comments`
--

CREATE TABLE `comments` (
  `id` int(11) NOT NULL,
  `messageID` int(11) NOT NULL,
  `commentator` text NOT NULL,
  `commentText` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Дамп данных таблицы `comments`
--

INSERT INTO `comments` (`id`, `messageID`, `commentator`, `commentText`) VALUES
(1, 1, 'Rinat', 'Comment 1'),
(2, 3, 'Rinat', 'Comment 2'),
(3, 3, 'Rinat', 'Comment 1'),
(4, 7, 'Rinat', 'Comment 1'),
(5, 7, 'Author 7', 'Comment 2'),
(6, 4, 'Author 4', 'Comment 2'),
(7, 9, 'Author 9', 'Comment 1'),
(8, 10, 'Rinat', 'First comment'),
(9, 8, 'Rinat', 'First comment'),
(10, 14, 'Rinat', 'First message comment'),
(11, 15, 'Rinat', 'Comment 1');

-- --------------------------------------------------------

--
-- Структура таблицы `messages`
--

CREATE TABLE `messages` (
  `id` int(11) NOT NULL,
  `title` varchar(40) NOT NULL,
  `author` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `message` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Дамп данных таблицы `messages`
--

INSERT INTO `messages` (`id`, `title`, `author`, `description`, `message`) VALUES
(1, 'Title 1', 'Author 1', 'Description 1', 'Message 1'),
(2, 'Title 2', 'Author 2', 'Description 2', 'Message 2'),
(3, 'Title 3', 'Author 3', 'Description 3', 'Message 3'),
(4, 'Title 4', 'Author 4', 'Description 4', 'Message 4'),
(5, 'Title 5', 'Author 5', 'Description 5', 'Message 5'),
(6, 'Title 6', 'Author 6', 'Description 6', 'Message 6'),
(7, 'Title 7', 'Author 7', 'Description 7', 'Message 7'),
(8, 'Title 8', 'Author 8', 'Description 8', 'Message 8'),
(9, 'Title 9', 'Author 9', 'Description 9', 'Message 9'),
(10, 'Title 10', 'Author 10', 'Description 10', 'Message 10'),
(11, 'Title 11', 'Author 11', 'Description 11', 'Message 11'),
(12, 'Title 13', 'Author 12', 'Description 12', 'Message 12'),
(13, 'Title 13', 'Author 13', 'Description 13', 'Message 13'),
(14, 'Title 14', 'Author 14', 'Description 14', 'Message 14'),
(15, 'Title 15', 'Author 15', 'Description 15', 'Message 15');

--
-- Индексы сохранённых таблиц
--

--
-- Индексы таблицы `comments`
--
ALTER TABLE `comments`
  ADD PRIMARY KEY (`id`);

--
-- Индексы таблицы `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT для сохранённых таблиц
--

--
-- AUTO_INCREMENT для таблицы `comments`
--
ALTER TABLE `comments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT для таблицы `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
