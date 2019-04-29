---
Categories : ["Web","Hugo"]
Tags : ["Web","Hugo"]
title : "Mise en place d'un site avec Hugo, Github et Travis"
date : 2019-04-29
draft : false
toc: true
---

Vous trouverez dans cet article, l'ensemble des éléments permettant de mettre en place un site web static en se basant sur les outils suivants :

- [Hugo](https://gohugo.io) : Générateur de site web static
- [Github](https://github.com) : Service web d'hébergement et de gestion des sources de développements (utilisant l'outil [Git](https://en.wikipedia.org/wiki/Git)) 
- [Travis CI](https://travis-ci.com) : Service web permettant de tester et deployer les développements
- [Gandi](https://www.gandi.net) : Fournisseur du nom de domaine

 <!--more-->

# Objectif

Afin de mettre en place un site web static avec un nom de domaine personnel, j'ai mis en place les éléments suivants :

- Création d'un dépôt [Github](https://github.com) pour stocker les sources permettant de générer le site web static (**documentation**)
- Création d'un dépôt [Github](https://github.com) pour stocker les éléments du site web static (**pragmatias.github.io**)
- Configurer [Travis CI](https://travis-ci.com) pour déclencher la génération du site web static dans le dépôt **pragmatias.github.io** lors d'un commit dans la branche **master** du dépôt **documentation**
- Gestion du nom de domaine personnel chez [Gandi](https://www.gandi.net/fr) pour afficher le site web static avec l'adresse [pragmatias.fr](https://pragmatias.fr)


# Code source

L'ensemble du code source de ce site se trouve sur mon [dépôt github](https://github.com/pragmatias/documentation)


# Création des dépôts sur Github

## Création du dépôt documentation
*Pré-requis : avoir un compte sur [Github](https://github.com)*

1\. Sur la page listant vos dépôts, cliquez sur **New** 

[![1ère étape](/blog/web/20190429_create_repository_step1.png)](/blog/web/20190429_create_repository_step1.png)

2\. Renseignez le nom de votre dépôt qui contiendra les sources permettant de générer le site web et cliquez sur **Create repository**

[![2ème étape](/blog/web/20190429_create_repository_step2.png)](/blog/web/20190429_create_repository_step2.png)

3\. Github vous affichera les étapes pour initialiser votre dépôt

[![3ème étape](/blog/web/20190429_create_repository_step3.png)](/blog/web/20190429_create_repository_step3.png)

## Création du dépôt pragmatias.github.io

Il faut faire les mêmes étapes que pour la création du dépôt **documentation** mais cette fois avec le nom **pragmatias.github.io**.

Il faut créer au moins un fichier dans le dépôt **pragmatias.github.io** pour la suite de la configuration du dépôt.

Vous trouverez plus d'information sur le systeme **Pages** de Github sur le [site officiel](https://pages.github.com)

Si vous voulez modifier la configuration par défaut :

1\. Allez dans la page **Settings** du dépôt **pragmatias.github.io**

[![4ème étape](/blog/web/20190429_create_repository_step4.png)](/blog/web/20190429_create_repository_step4.png)

2\. Allez dans la section **GitHub Pages** pour configurer les informations nécessaires *(custom domain, enforces HTTPS, ...)*

[![5ème étape](/blog/web/20190429_create_repository_step5.png)](/blog/web/20190429_create_repository_step5.png)




# Lier Travis CI avec un dépôt Github

1\. Connectez vous sur [Travis CI](https://travis-ci.com) avec votre compte [Github](https://github.com)

[![1ère étape](/blog/web/20190429_travis_step1.png)](/blog/web/20190429_travis_step1.png)

2\. Allez dans **Settings**, puis dans **Repositories** et cliquez sur **Manage repositories on Github**

[![2ème étape](/blog/web/20190429_travis_step2.png)](/blog/web/20190429_travis_step2.png)

3\. Sur Github, dans la section **Repository access**, ajoutez le dépôt **documentation** et cliquez sur **Approve and install**

[![3ème étape](/blog/web/20190429_travis_step3.png)](/blog/web/20190429_travis_step3.png)


# Configuration des actions de Travis CI sur les dépôts Github

## Gestion d'un tocken Github
Il faut commencer par créer un jeton Github permettant de donner le droit à [Travis CI](https://travis-ci.com) de faire la mise à jour du dépot cible.

1\. Connectez vous sur votre compte [Github](https://github.com), allez dans **settings** et cliquez sur **Developer settings**

[![1ère étape](/blog/web/20190429_github_token_step1.png)](/blog/web/20190429_github_token_step1.png)

2\. Cliquez sur **Personal access tokens**, puis cliquez sur **Generate new token**

[![2ème étape](/blog/web/20190429_github_token_step2.png)](/blog/web/20190429_github_token_step2.png)

3\. Remplissez le champ **Tocken description**, puis selectionnez les droits nécessaires *(repo et gist)* et cliquez sur **Generate token**

[![3ème étape](/blog/web/20190429_github_token_step3.png)](/blog/web/20190429_github_token_step3.png)


4\. Copiez le code indiqué après la génération du jeton *(il ne s'affichera qu'une seule fois)*

[![4ème étape](/blog/web/20190429_github_token_step4.png)](/blog/web/20190429_github_token_step4.png)

5\. Allez sur [Travis CI](https://travis-ci.com) et ajoutez le jeton avec le nom **GITHUB_TOKEN** et la valeur notée lors de l'étape précédente.

[![5ème étape](/blog/web/20190429_github_token_step5.png)](/blog/web/20190429_github_token_step5.png)


## Création du fichier de configuration pour Travis CI

Pour pouvoir déployer automatiquement le site web à partir du dépôt **documentation** vers le dépôt **pragmatias.github.com**, il faut créer un fichier **.travis.yml** à la racine du dépôt **documentation**

```yml
# https://docs.travis-ci.com/user/deployment/pages/
# https://docs.travis-ci.com/user/reference/trusty/
# https://docs.travis-ci.com/user/customizing-the-build/

dist: trusty

install:
  - wget -O /tmp/hugo.deb https://github.com/gohugoio/hugo/releases/download/v0.54.0/hugo_0.54.0_Linux-64bit.deb
  - sudo dpkg -i /tmp/hugo.deb

before_script:
    - rm -rf public 2> /dev/null

# script - run the build script
script:
    - hugo

deploy:
  provider: pages
  skip-cleanup: true
  github-token: $GITHUB_TOKEN
  verbose: true
  keep-history: true
  local-dir: public
  repo: pragmatias/pragmatias.github.io
  target_branch: master  # branch contains blog content
  on:
    branch: master  # branch contains Hugo generator code
``` 

Le contenu du fichier est le suivant :

- Utilisation de la distribution Ubuntu Trusty `dist: trusty`
- Recuperation et installation de l'outil Hugo pour Linux `install: ...`
- Suppression du répertoire **public** qui est le répertoire par défaut de génération de l'outil Hugo `before_script: ...`
- Exécution de l'outil Hugo `script: ...`
- Pour la partie déploiement :
 - On défini que l'on souhaite déployer le contenu du répertoire **public** après exécution de la partie **script** dans le dépôt **pragmatias/pragmatias.github.io**
 - On défini que l'on souhaite utiliser la branche **master** pour les deux dépôts *(source et cible)*
 - On défini que la cible est **Github Pages** `provider: pages`
 


# Utilisation d'un domaine personnel avec Github Pages

*Note : J'utilise le nom de domaine* ***pragmatias.fr*** *chez [Gandi](https://www.gandi.net)*

1\. Dans les paramètres du dépôt **pragmatias.github.io**, renseignez la section **Custom domain**

[![parametre github](/blog/web/20190429_create_repository_step5.png)](/blog/web/20190429_create_repository_step5.png)

> pour forcer l'utilisation du **https**, sélectionnez l'option **Enforce HTTPS**

2\. Modifier la section **script** du fichier **.travis.yml**

```yml
# script - run the build script
script:
    - hugo
    - echo "pragmatias.fr" > public/CNAME
```

3\. Configurez votre domaine pour rediriger les utilisateurs vers le contenu des **Pages** du dépôt **pragmatias.github.io**

3\.1\. Allez sur le site de Gandi, cliquez sur **Nom de domaine**, puis sur le nom de domaine souhaité

[![Gandi 1](/blog/web/20190429_pages_github_domaine_gandi_p1.png)](/blog/web/20190429_pages_github_domaine_gandi_p1.png)


3\.2\. Allez dans **Enregistrement DNS** pour modifier les enregistrements

[![Gandi 1](/blog/web/20190429_pages_github_domaine_gandi_p2.png)](/blog/web/20190429_pages_github_domaine_gandi_p2.png)

3\.3\. Ajouter les enregistrements DNS suivants *(pour faire la redirection entre le service Pages de Github et votre nom de domaine)*

```makefile
@ 1800 IN A 185.199.108.153
@ 1800 IN A 185.199.109.153
@ 1800 IN A 185.199.110.153
@ 1800 IN A 185.199.111.153
www 10800 IN CNAME pragmatias.github.io
```

> Attention à ne pas avoir d'autres lignes commençant par *@ 1800 IN A* ou par *www*

La modification des enregistrements peut mettre plusieurs heures à se propager pour être prise en compte.
