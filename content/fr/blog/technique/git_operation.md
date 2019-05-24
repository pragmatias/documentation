---
Categories : ["Git"]
Tags : ["Git"]
title : "Git : Operations"
date : 2019-05-23
draft : true
toc: true
---

Vous trouverez dans cet article, les opérations utilent à connaitre pour travailler avec l'outil [Git](https://en.wikipedia.org/wiki/Git).

<!--more-->

# Qu'est ce que Git

Git est un logiciel de gestion de versions décentralisé créé par Linus Torvalds en 2005.

Une documentation complète est accessible à partir de ce [lien](https://git-scm.com/doc).


# Mise en place de Git

## Installation de Git

Sur OpenSUSE : 

- Exécutez la commande suivante : `$ sudo zypper in --no-recommend git`

Sur Windows : 

- Allez sur le [site officiel](https://git-scm.com/download/win) pour récupérer l'exécutable d'installation et exécutez le sur votre poste de travail. 

## Définition du vocabulaire

Les différents états d'une fichier ou d'une branche ? (avec schéma)

## Configuration de Git

Recupération de la liste des paramètres de configuration :

- Tous les paramètres :  `$ git config --list` 
- tous les paramètres globaux : `$ git config --list --global` 
- Tous les paramètres et leur origine : `$ git config --list --show-origin` 

Définition des paramètre utilisateurs :

- Le nom de l'utilisateur : `$ git config --global user.name "pragmatias"`
- L'adresse mail de l'utilisateur : `$ git config --global user.email "git@pragmatias.fr"`

Définition des paramètres systèmes :

- Pour ne pas modifier automatiquement le formatage des fins de ligne entre Windows (CRLF) et Linux (LF) : `$ git config --global core.autocrlf false`


# Mise en place d'un dépôt Git (Github)

1/ Initialisation de Git dans un répertoire existant + lien du répertoire avec un dépôt git

2/ Clonage d'un dépot existant (exemple avec github)


## gitignore file

Creation et gestion d'un fichier gitignore


# Gestion des branches avec Git

1/ Creation d'une branche
2/ Suppression d'une branche
3/ Merge de deux branches
4/ Navigation dans une branche (checkout)
5/ Recuperation des données d'une branche  (pull)
6/ Mise a jour d'une branche (push)



# Gestion des fichiers avec Git

## Récupération de l'état des fichiers
`$ git status`
`$ git status -s`

## Ajout d'un fichier dans l'espace "staging"
`$ git add <fichier>`
`$ git add -A`

## Ajout d'un fichier dans la branch actuelle
commit ?


## Annulation d'un fichier commiter (pour le repasser en staging ?)


## Annulation d'un fichier dans l'espace "Staging" ?



## Recherche différence entre les versions d'un fichier
git diff
git diff --staged
git diff --cached






# Lecture de l'historique sous Git (Log)



# Commande wikipedia 
git init​ crée un nouveau dépôt ;
git clone​ clone un dépôt distant ;
git add​ ajoute de nouveaux objets blobs dans la base des objets pour chaque fichier modifié depuis le dernier commit. Les objets précédents restent inchangés ;
git commit​ intègre la somme de contrôle SHA-1 d'un objet tree et les sommes de contrôle des objets commits parents pour créer un nouvel objet commit ;
git branch​ liste les branches ;
git merge​ fusionne une branche dans une autre ;
git rebase​ déplace les commits de la branche courante devant les nouveaux commits d’une autre branche ;
git log​ affiche la liste des commits effectués sur une branche ;
git push​ publie les nouvelles révisions sur le remote. (La commande prend différents paramètres) ;
git pull​ récupère les dernières modifications distantes du projet (depuis le Remote) et les fusionner dans la branche courante ;
git stash​ stocke de côté un état non commité afin d’effectuer d’autres tâches.