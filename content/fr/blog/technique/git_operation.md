---
Categories : ["Git"]
Tags : ["Git"]
title : "Git : Opérations"
date : 2019-06-24
draft : false
toc: true
---

Vous trouverez dans cet article, quelques opérations/commandes à connaitre pour travailler avec l'outil [Git](https://en.wikipedia.org/wiki/Git).

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
- Unmodified : Le fichier a déjà était commit sur Git et n'a pas encore été modifié
- Modified : Le fichier a déjà était commit sur Git et a été modifié
- Staged : L'état actuel du fichier est pris en compte dans Git mais n'a pas été commit

Schéma :
[![schema](/blog/web/20190528_git_lifecycle.png)](/blog/web/20190528_git_lifecycle.png) 

## Configuration de Git

Vous pourrez trouver plus d'information sur le [site officiel](https://git-scm.com/book/en/v2/Customizing-Git-Git-Configuration).

Recupération de la liste des paramètres de configuration :

- Tous les paramètres :  `$ git config --list` 
- tous les paramètres globaux : `$ git config --list --global` 
- Tous les paramètres et leur origine : `$ git config --list --show-origin` 

Définition des paramètre utilisateurs :

- Le nom de l'utilisateur : `$ git config --global user.name "user"`
- L'adresse mail de l'utilisateur : `$ git config --global user.email "user@mail"`

Définition des paramètres systèmes :

- Pour ne pas modifier automatiquement le formatage des fins de ligne entre Windows (CRLF) et Linux (LF) : `$ git config --global core.autocrlf false`


# Mise en place d'un dépôt Git (Github)

1/ [Initialisation](https://git-scm.com/docs/git-init) de Git dans un répertoire existant

Pour initialiser Git dans un nouveau répertoire : `$ git init`
Pour faire le lien avec un dépôt distant : `$ git remote add <remote_name> <remote_url>`


2/ [Clonage](https://git-scm.com/docs/git-clone) d'un dépot existant (exemple avec github)
Pour récupérer un dépôt distant sur son espace de travail : `$ git clone <url> <folder>`


# Gestion des fichiers avec Git

Vous trouverez ci-dessous une liste des opérations à connaitre pour pouvoir gérer les fichiers avec Git.

| Commande | Commentaire |
|:--|:--|
| `$ git status` | Analyse de l'état de l'ensemble des éléments |
| `$ git status -s` | Analyse de l'état de l'ensemble des éléments avec un affichage synthétique |
| `$ git add <fichier ou pattern>` | Ajout ou prise en compte des modifications d'un fichier |
| `$ git add -f <fichier ou pattern>` | Force l'ajout ou la prise en compte des modifications d'un fichier (gitignore) |
| `$ git add -A` | Ajout ou prise en compte des modifications de l'ensemble des fichiers |
| `$ git commit -m "<message>"` | Enregistrement de l'ensemble des éléments se trouvant dans l'espace _staged_ avec un message |
| `$ git commit --amend"` | Ajout de l'ensemble des éléments se trouvant dans l'espace _staged_ dans le _commit_ précent |
| `$ git rm <fichier ou pattern>` | Suppression d'un fichier dans le répertoire courant si il a déjà était _commit_ |
| `$ git rm --cached <fichier ou pattern>` | Suppression d'un fichier de l'espace _staged_ mais pas du répertoire courant |
| `$ git checkout -- <fichier ou pattern>` | Annulation des modifications d'un fichier non présent dans l'état _staged_ |


# Gestion d'un dépôt distant

Vous trouverez ci-dessous une liste des opérations à connaitre pour pouvoir gérer un [dépôt distant](https://git-scm.com/book/en/v2/Git-Branching-Remote-Branches) avec Git

| Commande | Commentaire |
|:--|:--|
| `$ git remote -v` | Lister les dépôts distants |
| `$ git remote add <remote_name> <remote_url>` | Ajout d'un dépôt distant |
| `$ git fetch <remote_name>` | Récupération des métadonnées d'un dépôt distant |
| `$ git chekout <remote_name>/<branch>` | Récupération de l'ensemble des éléments d'une branche d'un dépôt distant |
| `$ git push <remote_name> <branhc>` | Envoi des nouveaux _commit_ sur une branche d'un dépôt distant |
| `$ git remote show <remote_name>` | Inspecter un dépôt distant |
| `$ git remote rename <remote_name_old> <renomte_name_new>` | Modifier le nom local utiliser pour définir un dépôt distant |
| `$ git remote remove <remote_name>` | Suppression d'un dépôt distant |



# Définision d'un fichier .gitignore

Il est possible d'ignorer certain fichier/répertoire avec Git en utilisant un fichier [.gitignore](https://git-scm.com/docs/gitignore).

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


# Récupération des différences et de l'historique des changements

Quelques opérations possibles pour voir les [différences](https://git-scm.com/docs/git-diff) entre les _commit_ :

| Commande | Commentaire |
|:--|:--|
| `$ git diff` | Différence entre le répertoire de travail et le dernier _commit_ |
| `$ git diff --cached` | Différence entre les fichiers ajouter pour le prochain _commit_ et le dernier _commit_ |
| `$ git diff <commit_1> <commit_2> <pattern>` | Liste des différences entre deux _commit_ pour l'ensemble des fichiers correspondants au pattern souhaité |


Quelques opérations possibles pour lire [l'historique des _commit_](https://git-scm.com/docs/git-log) :

| Commande | Commentaire |
|:--|:--|
| `$ git log` | Voir l'historique des _commit_ |
| `$ git log -2` | Voir l'historique des deux derniers _commit_ |
| `$ git log -p -1` | Voir l'historique du dernier _commit_ avec le détail des différences entre les _commit_ |
| `$ git log -stat -1` | Voir l'historique du dernier _commit_ avec les statistiques sur les éléments |
| `$ git log --pretty=format:"<format>"` | Voir l'historique des _commit_ dans le format souhaité |
| `$ git log --oneline --decorate"` | Exemple de commande ... |
| `$ git log --oneline --decorate --graph --all"` | Exemple de commande ... |


Exemple des options pouvant être utilisés comme format :
| Option | Description |
|:--|:--|
| %H | Commit hash |
| %h | Abbreviated commit hash |
| %T | Tree hash |
| %t | Abbreviated tree hash |
| %P | Parent hashes |
| %p | Abbreviated parent hashes |
| %an | Author name |
| %ae | Author email |
| %ad | Author date (format respects the --date=option) |
| %ar | Author date, relative |
| %cn | Committer name |
| %ce | Committer email |
| %cd | Committer date |
| %cr | Committer date, relative |
| %s | Subject |


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

Vous pouvez définir des alias pour accéder aux commandes git plus rapidement.

```git
$ git config --global alias.co checkout
$ git config --global alias.br branch
$ git config --global alias.ci commit
$ git config --global alias.st status
$ git config --global alias.unstage 'reset HEAD --'
$ git config --global alias.last 'log -1 HEAD'
```


# Gestion des branches avec Git

| Commande | Commentaire |
|:--|:--|
| `$ git branch` | Liste des branches |
| `$ git branch -v` | Liste des branches avec le dernier _commit_ |
| `$ git branch --merged` | Liste des branches fusionner avec la branche courante |
| `$ git branch test` | Création d'une nouvelle branche nommée _test_ |
| `$ git branch -d corf1` | Suppression de la branche _corf1_  |
| `$ git checkout master` | Changer de branche (sur la branche _master_) |
| `$ git checkout -b devf1` | Création de la branche _devf1_ et changement de branche sur _devf1_ |
| `$ git merge corf1` | Fusionner la branche _corf1_ sur la branche courante |


# Autres opérations 

L'opération de **rebase** pour appliquer l'ensembler des modifications d'une branche en réécrivant l'historique : [documentation](https://git-scm.com/docs/git-rebase).