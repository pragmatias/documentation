---
Categories : ["Web","Hugo"]
Tags : ["Web","Hugo"]
title : "Mise en place d'un site avec Hugo et Github Actions"
date : 2022-05-29
draft : false
toc: true
---

Vous trouverez dans cet article, l'ensemble des éléments permettant de mettre en place un site web static en se basant sur les outils suivants :

- [Hugo](https://gohugo.io) : Générateur de site web static
- [Github](https://github.com) : Service web d'hébergement et de gestion des sources de développements (utilisant l'outil [Git](https://en.wikipedia.org/wiki/Git)) 
- [Github Actions](https://github.com/features/actions) : Service Github permettant de tester et deployer les développements
- [Gandi](https://www.gandi.net) : Fournisseur du nom de domaine

 <!--more-->

# Objectif

- Création d'un dépôt [Github](https://github.com) pour stocker les sources permettant de générer le site web static (**documentation**)
- Création d'un dépôt [Github](https://github.com) pour stocker les éléments du site web static (**pragmatias.github.io**)
- Configurer [Github Actions](https://github.com/features/actions) pour déclencher la génération du site web static dans le dépôt **pragmatias.github.io** lors d'un commit dans la branche **master** du dépôt **documentation**
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

Vous trouverez plus d'information sur le systeme **Pages** de Github sur le [site officiel](https://pages.github.com).

Si vous voulez modifier la configuration par défaut :

1\. Allez dans la page **Settings** du dépôt **pragmatias.github.io**

[![4ème étape](/blog/web/20190429_create_repository_step4.png)](/blog/web/20190429_create_repository_step4.png)

2\. Allez dans la section **GitHub Pages** pour configurer les informations nécessaires *(custom domain, enforces HTTPS, ...)*

[![5ème étape](/blog/web/20220530_create_repository_step5.png.png)](/blog/web/20220530_create_repository_step5.png.png)



# Configuration des actions sur les dépôts Github

## Gestion d'un jeton personnel Github
Il faut commencer par créer un jeton Github permettant de donner le droit à [Github Actions](https://github.com/features/actions) de faire la mise à jour du dépot cible.

1\. Connectez vous sur votre compte [Github](https://github.com), allez dans **settings** et cliquez sur **Developer settings**

[![1ère étape](/blog/web/20190429_github_token_step1.png)](/blog/web/20190429_github_token_step1.png)

2\. Cliquez sur **Personal access tokens**, puis cliquez sur **Generate new token**

[![2ème étape](/blog/web/20190429_github_token_step2.png)](/blog/web/20190429_github_token_step2.png)

3\. Remplissez le champ **Tocken description**, puis selectionnez les droits nécessaires *(repo et gist)* et cliquez sur **Generate token**

[![3ème étape](/blog/web/20190429_github_token_step3.png)](/blog/web/20190429_github_token_step3.png)


4\. Copiez le code indiqué après la génération du jeton *(il ne s'affichera qu'une seule fois)*

[![4ème étape](/blog/web/20190429_github_token_step4.png)](/blog/web/20190429_github_token_step4.png)

5\. Allez dans **Settings** du dépôt, sélectionnez l'option **Actions** dans le menu **General > Security > Secrets** 

[![5ème étape](/blog/web/20220530_github_documentation_personal_token.png)](/blog/web/20220530_github_documentation_personal_token.png)

6\. Cliquez sur le bouton  **New repository secret** et renseignez le champ **Name** avec la valeur `PERSONAL_TOKEN` et le champ **Value** avec la valeur du jeton récupéré à l'étape n°4

[![6ème étape](/blog/web/20220530_github_documentation_personal_token_add.png)](/blog/web/20220530_github_documentation_personal_token_add.png)

## Création du fichier de configuration pour Github Actions

Pour pouvoir déployer automatiquement le site web à partir du dépôt **documentation** vers le dépôt **pragmatias.github.io**, il faut créer un fichier **main.yml** dans le répertoire **.github/workflows** du dépôt **documentation**

```yml
# This is a basic workflow to help you get started with Actions

name: main

# Controls when the workflow will run
on:
  # Triggers the workflow on push or pull request events but only for the master branch
  push:
    branches: [ master ]
  pull_request:
    branches: [ master ]
  
  # Allows you to run this workflow manually from the Actions tab
  workflow_dispatch:
  
# A workflow run is made up of one or more jobs that can run sequentially or in parallel
jobs:
  # This workflow contains a single job called "build"
  build:
    # The type of runner that the job will run on
    runs-on: ubuntu-latest

    # Steps represent a sequence of tasks that will be executed as part of the job
    steps:
      # Checks-out your repository under $GITHUB_WORKSPACE, so your job can access it
      - uses: actions/checkout@v3
      # Runs a single command using the runners shell
      - name: Setup Hugo
        uses: peaceiris/actions-hugo@v2
        with:
          hugo-version: 'latest'

      - name: Cleaning
        run: rm -rf public 2> /dev/null

      - name: Build
        run: hugo --minify

      - name: AfterBuild
        run: echo "www.pragmatias.fr" > public/CNAME
 
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          personal_token: ${{ secrets.PERSONAL_TOKEN }}
          external_repository: pragmatias/pragmatias.github.io
          publish_branch: master  # default: gh-pages
          publish_dir: ./public

``` 

Le contenu du fichier est le suivant :

- Utilisation de la distribution Ubuntu `runs-on: ubuntu-latest`
- Recuperation et installation de l'outil Hugo pour Linux `name: Setup Hugo`
- Suppression du répertoire **public** qui est le répertoire par défaut de génération de l'outil Hugo `name: Cleaning`
- Exécution de l'outil Hugo `name: Build`
- Pour la partie déploiement :
 - On défini que l'on souhaite déployer le contenu du répertoire **public**  dans la branche **master** du dépôt **pragmatias/pragmatias.github.io**
 


# Utilisation d'un domaine personnel avec Github Pages

*Note : J'utilise le nom de domaine* ***pragmatias.fr*** *chez [Gandi](https://www.gandi.net)*

1\. Dans les paramètres du dépôt **pragmatias.github.io**, renseignez la section **Custom domain**

[![parametre github](/blog/web/20220530_create_repository_step5.png.png)](/blog/web/20220530_create_repository_step5.png.png)

> pour forcer l'utilisation du **https**, sélectionnez l'option **Enforce HTTPS**

2\. Configurez votre domaine pour rediriger les utilisateurs vers le contenu des **Pages** du dépôt **pragmatias.github.io**

2\.1\. Allez sur le site de Gandi, cliquez sur **Nom de domaine**, puis sur le nom de domaine souhaité

[![Gandi 1](/blog/web/20190429_pages_github_domaine_gandi_p1.png)](/blog/web/20190429_pages_github_domaine_gandi_p1.png)


2\.2\. Allez dans **Enregistrement DNS** pour modifier les enregistrements

[![Gandi 1](/blog/web/20190429_pages_github_domaine_gandi_p2.png)](/blog/web/20190429_pages_github_domaine_gandi_p2.png)

2\.3\. Ajouter les enregistrements DNS suivants *(pour faire la redirection entre le service Pages de Github et votre nom de domaine)*

```makefile
www 10800 IN CNAME pragmatias.github.io
```

> Attention à ne pas avoir d'autres lignes commençant par *@ 1800 IN A* ou par *www*

La modification des enregistrements peut mettre plusieurs heures à se propager pour être prise en compte.


