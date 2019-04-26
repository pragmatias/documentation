---
Categories : ["Web"]
Tags : ["Web"]
title : "Création d'un site avec Hugo"
date : 2019-04-25
draft : true
toc: true
---

**En cours de rédaction**

Vous trouverez dans cet article, l'ensemble des éléments permettant de mettre en place un site web static en se basant sur les outils suivants :

- [Hugo](https://gohugo.io) : Générateur de site web static
- [Github](https://github.com) : Service web d'hébergement et de gestion des sources de développements (utilisant l'outil [Git](https://en.wikipedia.org/wiki/Git)) 
- [Travis CI](https://travis-ci.com) : Service web permettant de tester et deployer les développements

Les sujets abordés sont la structuration du site, la création d'un thème, la gestion d'un flux rss, la mise en place du multi-langue, ...

 <!--more-->

# Qu'est ce que Hugo  

[Hugo](https://gohugo.io) est un générateur de site web static écrit en Go et créé par Steve Francia en 2013 ([wikipedia](https://en.wikipedia.org/wiki/Hugo_\(software\)))

La [documentation](https://gohugo.io/documentation/) est très bien faite pour prendre en main rapidement les bases de l'outil.

# Objectif

Pour mettre en place ce premier site, je me suis fixé les objectifs suivants :

- Avoir un système de blog lié avec des tags permettant de naviguer sur les sujets et avoir un esprit "documentation" sans être un "wiki"
- Ne pas avoir de dépendance inutile avec des ressources extérieurs (google,facebook,javascript,...)
- Ne pas récupérer/gérer d'information des visiteurs (trackers,cookies,commentaires,...)
- Mettre en place l'ensemble des sources de manière publique
- Faire le maximum de chose par moi même

# Code source

L'ensemble du code source de ce site se trouve sur mon [dépôt github](https://github.com/pragmatias/documentation)

# Démarrage

## Recupération de l'outil

J'ai principalement travaillé avec la version 0.55.4.

Les exécutables peuvent être récupérés sur le dépôt [officiel des releases](https://github.com/gohugoio/hugo/releases).

Pour Windows10 (en 64bit), l'exécutable se trouve [ici](https://github.com/gohugoio/hugo/releases/download/v0.55.4/hugo_0.55.4_Windows-64bit.zip)


## 1er pas avec Hugo

Pour créer le socle, vous pouvez suivre la [documentation officielle](https://gohugo.io/getting-started/quick-start/).

Les étapes sont relativements simples et bien expliquées


# Structuration du site

## Définition des répertoires du socle

Hugo gère les répertoires de la manière suivante :
```html
/documentation
  +-- /archetypes
  +-- /config
  |   +-- /_default
  +-- /content
  +-- /ressources
  +-- /themes
```

- Le répertoire "archetypes" permet de stocker le template des articles de blogs
- Le répertoire "config" permet de stocket les fichiers de configurations
- Le répertoire "content" permet de stocker le contenant du site (articles du blog)
- Le répertoire "ressources" permet de stocker l'ensemble des ressources générés (le site)
- Le répertoire "themes" permet de stocker le theme utilisé


## Définition des répertoires d'un thème

J'ai voulu créer un thème spécifique (et simple) pour mon besoin.

Pour se faire, j'ai créé l'architecture suivantes dans le répertoire "themes" :
```html
/themes
  +-- /pragmatias
  |   +-- /i18n
  |   +-- /layouts
  |   |   +-- /_default
  |   |   +-- /partials
  |   |   +-- 404.html
  |   |   +-- index.html
  |   +-- /static
  |   |   +-- /css
  |   |   +-- /fonts
  |   |   +-- /images
  |   |   +-- /js
  |   +-- LICENSE
  |   +-- theme.toml
```

Le theme se nomme "pragmatias" et les informations se trouve dans le fichier "theme.toml"
Un exemple de contenu du fichier "theme.toml" peut être trouvé [ici](https://github.com/gohugoio/hugoThemes#themetoml)

Les répertoires importants sont :
- i18n : permettant gérer la partie multi-langue (vocabulaire)
- layouts : permettant de gérer l'affichage du site
- static : permettant de stocker l'ensemble des ressources (js,fonts,css,images)


## Définition du squelette du site
Création du fichier `baseof.html` dans le répertoire `/themes/pragmatias/layouts/_default`

```html 
<html lang="{{ with $.Site.LanguageCode }}{{ . }}{{ else }}fr{{ end }}">
    {{- partial "head.html" . -}}
    <body>
        {{- partial "header.html" . -}}
        <div id="content">
        {{- block "main" . }}{{- end }}
        </div>
        {{- partial "footer.html" . -}}
    </body>
</html>
```



Cette page est le squelette par défaut de chaque page du site.

Elle nécessite la création des fichiers suivants dans le répertoire `/themes/pragmatias/layouts/partial` :
- head.html : permet de définir l'entête de chaque page HTML (les balises meta, javascript, css, etc ...)
- header.html : permet de définir le menu de navigation en haut du site
- footer.html : permet de définir le pied de page du site

## Gestion du menu de navigation

Utilisation de bootstrap pour gérer le multiecran pour le site et spécifiquement le menu
Ajout du javascript dans le head.html
Ajout de la navbar dans header.html
Gestion des liens dans le fichier de configuration


# Définition d'une section /blog

Ajout d'un lien dans config

Creation d'une page "list.html"
Creation d'une page "Single.html"

Creation d'un repertoire "blog" dans "content" 



# Définition d'une section /tags

Modification du fichier de configuration

Creation des fichiers Layout


# Définition d'une section /Archive

Modification du fichier de configuration

Creation des fichiers Layout


# Mise en place du multilingue
Modification du fichier de configuration
Creation des fichiers i18n
Modification des dates
Modification des textes

*Note : pas de gestion de la page 404 par pays*



# Ajout d'un RSS concernant les articles uniquements
 
Modification du fichier de configuration

Creation/modification des fichiers Layout


# Gestion du fichier CSS principal

Gestion des variables pour la couleur
Gestion des fonts











