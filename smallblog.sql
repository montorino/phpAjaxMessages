-- phpMyAdmin SQL Dump
-- version 4.9.0.1
-- https://www.phpmyadmin.net/
--
-- Хост: 127.0.0.1:3306
-- Время создания: Дек 20 2021 г., 05:04
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
  `commentText` text NOT NULL,
  `commentDate` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Дамп данных таблицы `comments`
--

INSERT INTO `comments` (`id`, `messageID`, `commentator`, `commentText`, `commentDate`) VALUES
(1, 1, 'Rinat', 'Comment 1', '2021-12-13 02:10:36'),
(2, 3, 'Rinat', 'Comment 2', '2021-12-13 02:10:36'),
(3, 3, 'Rinat', 'Comment 1', '2021-12-13 02:10:36'),
(4, 7, 'Rinat', 'Comment 1', '2021-12-13 02:10:36'),
(5, 7, 'Author 7', 'Comment 2', '2021-12-13 02:10:36'),
(6, 4, 'Author 4', 'Comment 2', '2021-12-13 02:10:36'),
(7, 9, 'Author 9', 'Comment 1', '2021-12-13 02:10:36'),
(8, 10, 'Rinat', 'First comment', '2021-12-13 02:10:36'),
(9, 8, 'Rinat', 'First comment', '2021-12-13 02:10:36'),
(10, 14, 'Rinat', 'First message comment', '2021-12-13 02:10:36'),
(11, 15, 'Rinat', 'Comment 1', '2021-12-13 02:10:36'),
(12, 15, 'Andrey', 'Very interesting scientific article', '2021-12-13 02:14:29');

-- --------------------------------------------------------

--
-- Структура таблицы `messages`
--

CREATE TABLE `messages` (
  `id` int(11) NOT NULL,
  `title` varchar(400) NOT NULL,
  `author` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `message` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Дамп данных таблицы `messages`
--

INSERT INTO `messages` (`id`, `title`, `author`, `description`, `message`) VALUES
(1, 'Ink analysis reveals Marie Antoinette’s letters’ hidden words and who censored them', 'Carolyn Gramling', 'The analysis reveals whether the doomed French queen spilled state secrets or bon mots', 'In a world torn apart by the French Revolution, doomed Queen Marie Antoinette exchanged secret letters with a rumored lover. Someone later censored them — and now scientists know who.\n\nChemical analyses of the ink reveal not only the obscured words, but also the identity of the censor, researchers report October 1 in Science Advances.\n\nFrom June 1791 to August 1792, as Marie Antoinette and the rest of the royal family were confined to Paris’ Tuileries Palace following an escape attempt, the queen managed a clandestine correspondence with Swedish Count Axel von Fersen.\n\nWhether the correspondents exchanged words of love or state secrets was a longstanding mystery, says Anne Michelin, a chemist at the National Museum of Natural History in Paris. Michelin and colleagues unraveled this mystery using X-ray fluorescence spectroscopy.\n\nXRF, a noninvasive technique, works by shooting an X-ray beam at a sample, kicking the atoms in the sample into a higher-energy state. The sample then emits its own X-rays along a spectrum characteristic of its elemental makeup. With XRF, paleontologists have scrutinized fossils and art restorers have found hidden paintings (SN: 5/10/10; SN: 8/4/16).'),
(2, 'Lithium-ion batteries made with recycled materials can outlast newer counterparts', 'Carolyn Wilke', 'Proving performance could boost battery manufacturers’ confidence in reused materials', 'Lithium-ion batteries with recycled cathodes can outperform batteries with cathodes made from pristine materials, lasting for thousands of additional charging cycles, a study finds. \n\nGrowing demand for these batteries — which power devices from smartphones to electric vehicles — may outstrip the world’s supply of some crucial ingredients, such as cobalt (SN: 5/7/19). Ramping up recycling could help avert a potential shortage. But some manufacturers worry that impurities in recycled materials may cause battery performance to falter.\n\n“Based on our study, recycled materials can perform as well as, or even better than, virgin materials,” says materials scientist Yan Wang of Worcester Polytechnic Institute in Massachusetts.\n\nUsing shredded spent batteries, Wang and colleagues extracted the electrodes and dissolved the metals from those battery bits in an acidic solution. By tweaking the solution’s pH, the team removed impurities such as iron and copper and recovered over 90 percent of three key metals: nickel, manganese and cobalt. The recovered metals formed the basis for the team’s cathode material.'),
(3, 'Wildfire smoke may ramp up toxic ozone production in cities', 'Ariana Remmel', 'A new study reveals what happens when urban pollution mixes with smoke’s chemical cocktail', 'Wildfire smoke and urban air pollution bring out the worst in each other.\n\nAs wildfires rage, they transform their burned fuel into a complex chemical cocktail of smoke. Many of these airborne compounds, including ozone, cause air quality to plummet as wind carries the smoldering haze over cities. But exactly how — and to what extent — wildfire emissions contribute to ozone levels downwind of the fires has been a matter of debate for years, says Joel Thornton, an atmospheric scientist at the University of Washington in Seattle.\n\nA new study has now revealed the elusive chemistry behind ozone production in wildfire plumes. The findings suggest that mixing wildfire smoke with nitrogen oxides — toxic gases found in car exhaust — could pump up ozone levels in urban areas, researchers report December 8 in Science Advances.\n\nAtmospheric ozone is a major component of smog that can trigger respiratory problems in humans and wildlife (SN: 1/4/21). Many ingredients for making ozone — such as volatile organic compounds and nitrogen oxides — can be found in wildfire smoke, says Lu Xu, an atmospheric chemist currently at the National Oceanographic and Atmospheric Administration Chemical Sciences Laboratory in Boulder, Colo. But a list of ingredients isn’t enough to replicate a wildfire’s ozone recipe. So Xu and colleagues took to the sky to observe the chemistry in action.'),
(4, 'This eco-friendly glitter gets its color from plants, not plastic', 'Maria Temming', 'Minuscule arrangements in cellulose reflect light in specific ways to give rise to vibrant hues', 'All that glitters is not green. Glitter and shimmery pigments are often made using toxic compounds or pollutive microplastics (SN: 4/15/19). That makes the sparkly stuff, notoriously difficult to clean up in the house, a scourge on the environment too.\n\nA new, nontoxic, biodegradable alternative could change that. In the material, cellulose — the main building block of plant cell walls — creates nanoscale patterns that give rise to vibrant structural colors (SN: 9/28/21). Such a material could be used to make eco-friendly glitter and shiny pigments for paints, cosmetics or packaging, researchers report November 11 in Nature Materials.\n\nThe inspiration to harness cellulose came from the African plant Pollia condensata, which produces bright, iridescent blue fruits called marble berries. Tiny patterns of cellulose fibers in the berries’ cell walls reflect specific wavelengths of light to create the signature hue. “I thought, if the plants can make it, we should be able to make it,” says chemist Silvia Vignolini of the University of Cambridge. \n\nVignolini and colleagues whipped up a watery mixture containing cellulose fibers and poured it onto plastic. As the liquid dried into a film, the rodlike fibers settled into helical structures resembling spiral staircases. Tweaking factors such as the steepness of those staircases changed which wavelengths of light the cellulose arrangements reflected, and therefore the color of the film.'),
(5, 'The only known pulsar duo sheds new light on general relativity and more', 'Emily Conover', 'For 16 years, scientists have been observing a one-of-a-kind system of two pulsating dead stars', 'The only known duo of pulsars has just revealed a one-of-a-kind heap of cosmic insights.\n\nFor over 16 years, scientists have been observing the pair of pulsars, neutron stars that appear to pulsate. The measurements confirm Einstein’s theory of gravity, general relativity, to new levels of precision, and hint at subtle effects of the theory, physicists report in a paper published December 13 in Physical Review X.\n\nPulsars, spinning dead stars made of densely packed neutrons, appear to blink on and off due to their lighthouse-like beams of radiation that sweep past Earth at regular intervals. Variations in the timing of those pulses can expose pulsars’ movements and effects of general relativity. While physicists have found plenty of individual pulsars, there’s only one known pair orbiting one another. The 2003 discovery of the double-pulsar system, dubbed J0737-3039, opened up a new world of possible ways to test general relativity.\n\nOne of the pulsars whirls around roughly 44 times per second while the other spins about once every 2.8 seconds. The slower pulsar went dark in 2008, due to a quirk of general relativity that rotated its beams out of view. But researchers kept monitoring the remaining visible pulsar, combining that new data with older observations to improve the precision of their measurements.'),
(6, '50 years ago, scientists were genetically modifying mosquitoes', 'Maria Temming', 'Disease-spreading mosquitoes thrive in wet environments. Fifty years ago, scientists sought a new way to wipe out the pests: genetic engineering.', 'Scientists are working hard to find a substitute for DDT in the control of malaria vector mosquitoes.… Two experiments with mosquitoes breeding in old tires in New Delhi point to an answer: a gene for sterility that would be passed to offspring.\n\nUpdate\nToday, scientists are testing a variety of pesticide-free ways to control mosquito populations that spread malaria, Zika, dengue and yellow fever. One approach involves infecting male bloodsuckers with a strain of Wolbachia bacteria (SN: 6/10/17, p. 10). When the infected males mate with females, their offspring die before hatching. Another method tweaks mosquito DNA so that males pass on a daughter-killing trait and all female offspring die, shrinking populations over time. The mosquitoes, bred by the England-based biotech company Oxitec, took their first U.S. flight in May following a years-long debate about the safety of such organisms.'),
(7, 'Why it matters that health agencies finally said the coronavirus is airborne', 'Tina Hesman Saey', 'Recognizing that the virus spreads through the air reinforced the importance of wearing masks', 'This year, health experts around the world revised their views about how the coronavirus spreads. Aerosol scientists, virologists and other researchers had determined in 2020 that the virus spreads through the air, but it took until 2021 for prominent public health agencies to acknowledge the fact. The admission could have wide-ranging consequences for everything from public health recommendations and building codes to marching band practices (SN: 8/14/21, p. 24).\n\nFor decades, doctors and many researchers have thought that respiratory viruses such as cold and flu viruses spread mainly by people touching surfaces contaminated by mucus droplets and then touching their faces. That’s why, in the early days of the pandemic, disinfectant wipes flew off store shelves.\n\nSurface-to-face transfer is still a probable route of infection for some cold-causing viruses, such as respiratory syncytial virus, or RSV. But it turns out that the coronavirus spreads mainly through fine aerosol particles that may hang in the air for hours, particularly indoors.\n\nPeople spread such aerosols when coughing or sneezing, but also when talking, singing, shouting and even quietly breathing, allowing infected people to spread the disease even before they know they’re sick. Some evidence suggests that the coronavirus may be evolving to spread more easily through the air (SN: 9/25/21, p. 6).\n\nIt took collecting reams of data and more than 200 scientists pushing the World Health Organization and other public health agencies to acknowledge airborne spread of the coronavirus. In April 2021, both the WHO and U.S. Centers for Disease Control and Prevention updated their recommendations to note that airborne spread is a major route of infection (SN Online: 5/18/21).'),
(8, 'In 2021, COVID-19 vaccines were put to the test. Here’s what we learned', 'Science News Staff', 'Although the shots proved effective, they can’t single-handedly end the pandemic', '2021 was the year the COVID-19 vaccines had to prove their mettle. We started the year full of hope: With vaccines in hand in record-breaking time and their rollout ramping up, we’d get shots in arms, curb this pandemic and get life back to normal. That was too optimistic.\n\nRoughly 200 million people in the United States — and billions globally — have now been fully vaccinated. Three vaccines — one from Pfizer and its partner BioNTech, and the other two from Moderna and Johnson '),
(9, 'What we know and don’t know about the omicron coronavirus variant', 'Erin Garcia de Jesús', 'Guesses about the new variant abound, but only time will tell if it can compete with delta', 'Another coronavirus variant has emerged, and with it comes a new wave of uncertainty and unanswered questions. Days after the news broke, we remain in an information vacuum, and in a prognostication whirlwind with even vaccine makers contradicting each other. Finding answers like whether vaccines can thwart new variants takes time.\n\nTo quickly recap, late last week, researchers in South Africa and Botswana raised the alarm that they had detected a coronavirus variant with myriad mutations, many of which are in the part of the virus that helps it enter and infect cells. The World Health Organization quickly gave this highly mutated variant its own Greek letter — omicron — officially signifying it as a variant of concern. \n\n“Omicron’s very emergence is another reminder that although many of us might think we are done with COVID-19, it is not done with us,” WHO Director-General Tedros Adhanom Ghebreyesus said at a special session of the World Health Assembly on November 29. \n\nOmicron’s detection sparked a flurry of controversial travel bans to and from South Africa and surrounding countries, angering African leaders. Yet these quick decisions are based more on disquiet than data.\n\nHere’s what we know, and what we don’t know.'),
(10, 'Ingenuity is still flying on Mars. Here’s what the helicopter is up to', 'Lisa Grossman', 'NASA’s Ingenuity helicopter (shown in the foreground of this artist’s illustration) is now helping the Perseverance rover (background) scout driving routes and pick out areas for further study on Mars.', 'The Ingenuity Mars helicopter was never supposed to last this long. NASA engineers built and tested the first self-powered aircraft to fly on another planet to answer a simple question: Could the helicopter fly at all? The goal was to take five flights in 30 Martian days or break the aircraft trying.\n\nBut more than 120 Martian days past that experiment window, Ingenuity is still flying and doing things no one ever expected. The helicopter, which took its first flight on April 19, is breaking its own records for distance and speed (SN: 4/19/21). It’s helping the Perseverance rover explore Jezero crater, near an ancient river delta that may hold signs of past Martian life (SN: 2/17/21). And Ingenuity is coping with changing seasons and navigating over rough terrain, two things that the flier wasn’t designed to do.\n\n“It’s gotten into a good groove,” says Ingenuity’s original chief engineer Bob Balaram NASA’s Jet Propulsion Lab in Pasadena, Calif. “It’s in its element and having fun.”\n\nHere’s what Ingenuity has been up to on Mars.'),
(11, 'A massive 8-year effort finds that much cancer research can’t be replicated', 'Tara Haelle', 'Unreliable preclinical studies could impede drug development later on', 'After eight years, a project that tried to reproduce the results of key cancer biology studies has finally concluded. And its findings suggest that like research in the social sciences, cancer research has a replication problem.\n\nResearchers with the Reproducibility Project: Cancer Biology aimed to replicate 193 experiments from 53 top cancer papers published from 2010 to 2012. But only a quarter of those experiments were able to be reproduced, the team reports in two papers published December 7 in eLife.\n\nThe researchers couldn’t complete the majority of experiments because the team couldn’t gather enough information from the original papers or their authors about methods used, or obtain the necessary materials needed to attempt replication.\n\nWhat’s more, of the 50 experiments from 23 papers that were reproduced, effect sizes were, on average, 85 percent lower than those reported in the original experiments. Effect sizes indicate how big the effect found in a study is. For example, two studies might find that a certain chemical kills cancer cells, but the chemical kills 30 percent of cells in one experiment and 80 percent of cells in a different experiment. The first experiment has less than half the effect size seen in the second one. '),
(12, 'Physicists have coaxed ultracold atoms into an elusive form of quantum matter', 'JON CHASE', 'A new experiment produces a material with properties of a ‘quantum spin liquid’', 'An elusive form of matter called a quantum spin liquid isn’t a liquid, and it doesn’t spin — but it sure is quantum.\n\nPredicted nearly 50 years ago, quantum spin liquids have long evaded definitive detection in the laboratory. But now, a lattice of ultracold atoms held in place with lasers has shown hallmarks of the long-sought form of matter, researchers report in the Dec. 3 Science.\n\nQuantum entanglement goes into overdrive in the newly fashioned material. Even atoms on opposite sides of the lattice share entanglement, or quantum links, meaning that the properties of distant atoms are correlated with one another. “It’s very, very entangled,” says physicist Giulia Semeghini of Harvard University, a coauthor of the new study. “If you pick any two points of your system, they are connected to each other through this huge entanglement.” This strong, long-range entanglement could prove useful for building quantum computers, the researchers say.\n\nThe new material matches predictions for a quantum spin liquid, although its makeup strays a bit from conventional expectations. While the traditional idea of a quantum spin liquid relies on the quantum property of spin, which gives atoms magnetic fields, the new material is based on different atomic quirks.'),
(13, 'Gut bacteria let vulture bees eat rotting flesh without getting sick', 'Sharon Oosthoek', 'Specialized microbes help the insects avoid food poisoning', 'Mention foraging bees and most people will picture insects flitting from flower to flower in search of nectar. But in the jungles of Central and South America, “vulture bees” have developed a taste for decaying flesh.\n\nThey are “the weirdos of the bee world,” says insect biologist Jessica Maccaro of the University of California, Riverside. Most bees are vegetarian.\n\nScientists have puzzled over why the stingless buzzers seem to prefer rotting carcasses to nectar (SN: 2/11/04). Now, Maccaro and colleagues think they have cracked the riddle by looking into the bees’ guts.\n\nVulture bees (Trigona spp.) have a lot more acid-producing gut bacteria than their vegetarian counterparts do, Maccaro and colleagues report November 23 in mBio. And those bacteria are the same types that protect carrion feeders such as vultures and hyenas from getting sick on rotting meat.'),
(14, 'Cleared tropical forests can regain ground surprisingly fast', 'RENS BROUWER', 'Abandoned agricultural lands can recover by nearly 80 percent on average in just 20 years', 'Tropical forests are disappearing at an alarming clip across the globe. As lush land is cleared for agriculture, climate-warming carbon gets released and biodiversity declines. But when farmland is left alone, nature can make a surprisingly quick comeback.\n\nAfter just 20 years, forests can recover by nearly 80 percent in certain key areas, including biodiversity and soil health, researchers report in the Dec. 10 Science. \n\nKeeping existing forests intact is crucial for curbing climate change and stemming species loss (SN: 7/13/21), says ecologist Lourens Poorter of Wageningen University in the Netherlands. But this research shows “there’s tremendous [climate] mitigation potential” in letting forests regenerate.\n\nLand cleared of tropical forests often is abandoned after a few years of low-intensity agricultural use, Poorter says, allowing nature to creep back in. To see how such areas recover, he and colleagues studied 77 sites across the Americas and West Africa that are regrowing forests that vary in age. Using 51 old-growth sites, those that show no signs of human use in at least 100 years, as a baseline, the researchers investigated 12 forest attributes related to soil health, ecosystem functioning, forest structure and plant biodiversity, analyzing how quickly those things recovered.'),
(15, 'For 50 years, CT scans have saved lives, revealed beauty and more', 'Emily Conover', 'In 1971, the first CT scan of a patient laid bare the human brain. That was just the beginning of a whole new way to view human anatomy.', 'One grainy, gray-scale image of a brain changed science and medicine forever.\n\nHalf a century ago, the first CT image of a patient lifted the veil of invisibility that cloaks the interior of the human body, providing scientists a window on our innards unlike any before.\n\nToday, doctors in the United States alone order more than 80 million scans per year. X-ray computed tomography, or CT, is frequently the quickest way of getting a handle on what’s causing a mysterious woe. CT scans can ferret out heart disease, tumors, blood clots, fractures, internal bleeding and more. The technique can give surgeons a heads-up about what they will encounter inside a patient, and guide treatment for cancer and other diseases.');

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT для таблицы `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
