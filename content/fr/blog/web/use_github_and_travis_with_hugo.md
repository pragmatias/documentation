---
Categories : ["Web"]
Tags : ["Web"]
title : "Mise en place d'un site avec Hugo, Github et Travis"
date : 2019-04-28
draft : true
toc: true
---

Vous trouverez dans cet article, l'ensemble des éléments permettant de mettre en place un site web static en se basant sur les outils suivants :

- [Hugo](https://gohugo.io) : Générateur de site web static
- [Github](https://github.com) : Service web d'hébergement et de gestion des sources de développements (utilisant l'outil [Git](https://en.wikipedia.org/wiki/Git)) 
- [Travis CI](https://travis-ci.com) : Service web permettant de tester et deployer les développements

 <!--more-->

# Objectif

- Utilisation de l'adresse github.io pour mettre en place le site web
- Utilisation d'un dépôt pour la gestion des sources du site web
- Utilisation de Travis pour générer le site web automatiquement
- Mettre en place d'un nom de domaine spécifique

# Code source

L'ensemble du code source de ce site se trouve sur mon [dépôt github](https://github.com/pragmatias/documentation)


# Création de deux dépôts sur github

1\. Créer un premier dépôt pour stocker les fichiers liés à [Hugo](https://gohugo.io)

1. Github.com > Repositories > New 
2. Repository name : "Documentation"

2\. Créer un second dépôt pour stocker le résultat de la génération du site avec [Hugo](https://gohugo.io)
(*exemple avec le nom pragmatias*)

1. Github.com > Repositories > New 
2. Repository name : "pragmatias.github.io"
3. Public : Yes

# Liaison de Travis avec votre compte Github

