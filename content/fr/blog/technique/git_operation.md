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

Une documentation complète est accessible à partir du [site officiel](https://git-scm.com/doc).


# Mise en place de Git

## Installation de Git

Sur OpenSUSE : 

- Exécutez la commande suivante : `$ sudo zypper in --no-recommend git`

Sur Windows : 

- Allez sur le [site officiel](https://git-scm.com/download/win) pour récupérer l'exécutable d'installation et exécutez le sur votre poste de travail. 

## Définition du vocabulaire

Les différents états :

- Untracked : Le fichier n'est pas pris en compte par Git
- Unmodified : Le fichier a déjà était "commit" sur Git
- Modified : Le fichier a déjà était "commit" sur Git et a été modifié (mais non)
- Staged : L'état actuel du fichier est pris en compte dans Git mais n'a pas été "commit"

Schéma :

[![schema](/blog/web/20190528_git_lifecycle.png)](/blog/web/20190528_git_lifecycle.png) 

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
git init + git remote si besoin

Pour initialiser Git dans un nouveau répertoire : `$ git init`
Pour faire le lien avec un dépôt distant : `$ git remote add <remote_name> <remote_url>`


2/ Clonage d'un dépot existant (exemple avec github)
Pour récupérer un dépôt existant sur son espace personnel : `$ git clone <url> <folder>`


# Gestion des fichiers avec Git

Vous trouverez ci-dessous une liste des opérations à connaitre pour pouvoir gérer les fichiers avec Git.

| Commande | Commentaire |
|:--|:--|
| `$ git status` | Analyse de l'état de l'ensemble des éléments |
| `$ git status -s` | Analyse de l'état de l'ensemble des éléments avec l'option "short" |
| `$ git add <fichier ou pattern>` | Ajout ou prise en compte des modifications d'un fichier |
| `$ git add -A` | Ajout ou prise en compte des modifications de l'ensemble des fichiers |
| `$ git commit -m "<message>"` | Enregistrement de l'ensemble des éléments se trouvant dans l'espace "staged" avec un message |
| `$ git commit --amend"` | Ajout de l'ensemble des éléments se trouvant dans l'espace "staged" dans l'enregistrement précent |
| `$ git rm <fichier ou pattern>` | Suppression d'un fichier dans le répertoire courant si il a déjà était "commit" |
| `$ git rm --cached <fichier ou pattern>` | Suppression d'un fichier de l'espace "staged" mais pas du répertoire courant |
| `$ git checkout -- <fichier ou pattern>` | Annulation des modifications d'un fichier non présent dans l'état "staged" |


# Gestion des "remote"

Vous trouverez ci-dessous une liste des opérations à connaitre pour pouvoir gérer les remote avec Git

| Commande | Commentaire |
|:--|:--|
| `$ git remote -v` | Lister les adresses remote |
| `$ git remote add <remote_name> <remote_url>` | Ajout d'une adresse remote |
| `$ git fetch <remote_name>` | Récupération des métadonnées d'une adresse remote |
| `$ git chekout <remote_name>/<branch>` | Récupération des fichiers à partir d'une branche de l'adresse remote |
| `$ git push <remote_name> <branhc>` | Enregistrement des informations vers l'adresse remote |
| `$ git remote show <remote_name>` | Inspecter les adresses remotes |
| `$ git remote rename <remote_name_old> <renomte_name_new>` | Modifier le nom d'une adresse remote |
| `$ git remote remove <remote_name>` | Suppression d'une adresse remote |



# Définision d'un fichier .gitignore

Il est possible d'ignorer certain fichier/répertoire avec Git en utilisant un fichier ".gitignore".

Exemple de contenu d'un fichier **.gitignore**

```git
# ignore all .a files
*.a

# ignore all .a or .o files
*.[oa]

# ignore all files ending by ~
*~

# but do track lib.a, even though you're ignoring .a files above
!lib.a

# only ignore the TODO file in the current directory, not subdir/TODO
/TODO

# ignore all files in any directory named build
build/

# ignore doc/notes.txt, but not doc/server/arch.txt
doc/*.txt

# ignore all .pdf files in the doc/ directory and any of its subdirectories
doc/**/*.pdf
```


# Recherche des différences et des logs
`$ git diff`
`$ git diff --cached`

# Gestion des tags
| Commande | Commentaire |
|:--|:--|
| `$ git tag` | Lister les tags existants |
| `$ git tag -l <pattern>` | Lister les tags correspondant à un pattern |
| `$ git tag -a <tag> -m "<message>"` | Création d'un tag annoté |
| `$ git tag <tag>` | Création d'un tag allégé |
| `$ git tag -d <tag>` | Suppression d'un tag |
| `$ git show <tag>` | Récupérer la decription d'un tag annoté |
| `$ git tag -a <tag> <checksum>` | Création d'un tag sur un commit déja existant (checksum) |
| `$ git push <remote> <tag>` | Enregistrer le tag sur le dépôt distant  |
| `$ git push <remote> --tags` | Enregistrer l'ensemble des tags sur le dépôt distant  |
| `$ git push <remote> --delete <tag>` | Suppression d'un tag sur le dépôt distant |
| `$ git checkout <tag>` | Récupération du contenu d'un tag dans une branch détachée |
| `$ git checkout -b <branch> <tag>` | Récupération du contenu d'un tag dans une nouvelle branche |


# Gestion des alias

Vous pouvez définir des alias pour accéder aux commandes git.

```git
$ git config --global alias.co checkout
$ git config --global alias.br branch
$ git config --global alias.ci commit
$ git config --global alias.st status
$ git config --global alias.unstage 'reset HEAD --'
$ git config --global alias.last 'log -1 HEAD'
```



# Gestion des branches avec Git

1/ Creation d'une branche
2/ Suppression d'une branche
3/ Merge de deux branches
4/ Navigation dans une branche (checkout)
5/ Recuperation des données d'une branche  (pull)
6/ Mise a jour d'une branche (push)



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