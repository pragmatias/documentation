---
Categories : ["Web"]
Tags : ["Web"]
title : "Mise en place d'un site avec Hugo"
date : 2019-04-25
draft : false
toc: true
---

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

- Avoir un système de **blog** lié avec des tags permettant de naviguer sur les sujets et avoir un esprit **documentation** sans être un **wiki**
- Ne pas avoir de dépendance inutile avec des ressources extérieurs *(google,facebook,javascript,...)*
- Ne pas récupérer/gérer d'information des visiteurs *(trackers,cookies,commentaires,...)*
- Mettre en place l'ensemble des sources sur github
- Faire le maximum de chose par moi même
- Générer automatiquement les pages html

# Code source

L'ensemble du code source de ce site se trouve sur mon [dépôt github](https://github.com/pragmatias/documentation)

# Démarrage

## Téléchargement

J'ai principalement travaillé avec la version 0.54.0, en récupérant l'exécutable sur le dépôt [officiel des releases](https://github.com/gohugoio/hugo/releases).

Lien direct vers la version [Windows10 (en 64bit)](https://github.com/gohugoio/hugo/releases/download/v0.55.4/hugo_0.55.4_Windows-64bit.zip) ou la version [Linux (en 64bit)](https://github.com/gohugoio/hugo/releases/download/v0.54.0/hugo_0.54.0_Linux-64bit.deb)

## Découverte d'Hugo

Pour créer un premier site, vous pouvez suivre la [documentation officielle](https://gohugo.io/getting-started/quick-start/).
Les étapes sont bien expliquées et il existe un grand nombre de choix de [theme](https://themes.gohugo.io) pour commencer à manipuler l'outil et partir d'un visuel existant.


# Structuration du site

## Définition des répertoires du socle

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

Les répertoires possibles pour un theme *(en prenant exemple sur mon propre theme)* :
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

Le theme se nomme "pragmatias" et les metadonnées se trouvent dans le fichier "theme.toml"
Un exemple de contenu pour le fichier "theme.toml" peut être récupéré sur le [site officiel](https://github.com/gohugoio/hugoThemes#themetoml)

Les répertoires importants sont :

- i18n : permettant gérer la partie multi-langue (vocabulaire)
- layouts : permettant de gérer l'affichage du site
- static : permettant de stocker l'ensemble des ressources (js,fonts,css,images)


## Définition du squelette du site
Création du fichier **baseof.html** dans le répertoire `/themes/pragmatias/layouts/_default`

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

Cette page sera le squelette par défaut de chaque page du site.

Elle nécessite la création des fichiers suivants dans le répertoire `/themes/pragmatias/layouts/partials` : 

- head.html : permet de définir l'entête de chaque page HTML (les balises meta, javascript, css, etc ...)
- header.html : permet de définir le menu de navigation en haut du site
- footer.html : permet de définir le pied de page du site

Pour l'entête et le pied de page, l'invocation des fichiers **\*.html** se fait en utilisant la syntaxe suivantes :
```html 
{{- partial "*.html" . -}}
```


Pour le corps, l'invocation des fichiers \*.html se fait de manière plus complexe. Vous trouverez les informations dans les chapitres concernants la création des différentes section/pages du site. *(blog, tags, archives, ...)*


## Gestion du menu de navigation

Afin de gérer un menu de navigation en fonction de la taille de l'écran (mobile/desktop), j'ai utilisé la librairie javascript [bootstrap](https://getbootstrap.com/).

Les étapes de mise en place sont les suivantes :

1\. Télécharger les fichiers javascript [bootstrap](https://getbootstrap.com/docs/4.3/getting-started/download/),[jquery](https://jquery.com/download/) et [popper](https://popper.js.org) dans les répertoires `/themes/pragmatias/static/js` et `/themes/pragmatias/static/css`

  - js/bootstrap.min.js
  - js/bootstrap.min.js.map
  -	js/jquery-3.4.0.slim.min.js
  -	js/jquery-3.4.0.slim.min.js.map
  -	js/popper.min.js
  -	js/popper.min.js.map
  - css/bootstrap.min.css
  - css/bootstrap.min.css.map

2\. Ajout des informations suivantes dans le fichier `/themes/pragmatias/layouts/partial/head.html` pour charger les fichiers JS et CSS nécessaires
```html
    <!-- Bootstrap CSS -->
    <link rel="stylesheet" href="{{ .Site.BaseURL }}/css/bootstrap.min.css">

    <!-- Optional JavaScript -->
    <!-- jQuery first, then Popper.js, then Bootstrap JS -->
    <script src="{{ .Site.BaseURL }}/js/jquery-3.4.0.slim.min.js"></script>
    <script src="{{ .Site.BaseURL }}/js/popper.min.js"></script>
    <script src="{{ .Site.BaseURL }}/js/bootstrap.bundle.min.js"></script>
```


3\. Création du menu de navigation `/themes/pragmatias/layouts/partial/header.html`
```html
	<div class="navbar navbar-expand-md prag-bg-primary prag-header" role="navigation">
        <div class="container-fluid  justify-content-center">

            <button class="navbar-toggler justify-content-end prag-navbar" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
            </button>

            <div class="collapse navbar-collapse" id="navbarSupportedContent">
                <ul class="navbar-nav text-center">
                    {{ $currentPage := . }}
                    {{ range .Site.Menus.global }}
                    <li class="nav-item">
                        <a class="nav-link" href="{{ .URL | absLangURL }}">{{ .Name }}</a>
                    </li>
                    {{ end }}
                </ul>
            </div>

        </div>
    </div>
```

4\. Création des entrées dans le menu global, en ajoutant les informations suivantes dans le fichier de configuration principal `config\_default\config.toml`
```makefile
[[menus]]
	[[menu.global]]
		name = "Test"
		weight = 1
		identifier = "test"
		url = "/test"
```



# Définition d'une section Blog

Afin de pouvoir créer des articles, il faut mettre en place la gestion de la section **Blog**.

1\. Création d'une entrée **blog** dans le menu global du fichier de configuration principal `config\_default\config.toml`

```makefile
	[[menu.global]]
		name = "Blog"
		weight = 1
		identifier = "blog"
		url = "/blog"
```

2\. Création du répertoire `/content/blog`

Ce répertoire sera utilisé pour stocker l'ensemble des articles de la section **Blog** sous forme de fichier **\*.md**.

Exemple du contenu d'un fichier \*.md définissant un article :
```makefile
---
Categories : [""]
Tags : [""]
title : "Premier article avec hugo"
date : 2019-01-01
draft : false
---

Welcome !
```

3\. Création du fichier `/themes/pragmatias/layouts/blog/list.html`

Ce fichier sera appelé par défaut par le fichier **baseof.html** lorsque l'url **/blog** sera appelé.
```html
{{ define "main" }}
<div class="container">
	{{ range (where .Site.Pages "Type" "blog") }}
	<article class="list-blog-post">
	    <header>
	        <h2 class="list-blog-post-title">
	            <a href="{{ .RelPermalink }}">{{ .Title }}</a>
	        </h2>
	    </header>
	    <div class="list-blog-post-summary">
	        {{ .Summary | safeHTML }}
	    </div>
	</article>
	{{ end}}
</div>
{{ end }}
```
> Remarque : le fait d'utiliser la syntaxe `{{ define "main" }} ... {{ end }}` aura pour effet de remplacer le block `{{- block "main" . }}{{- end }}` du fichier **baseof.html**

4\. Création du fichier `/themes/pragmatias/layouts/blog/single.html`

Ce fichier sera appelé par défaut par le fichier **baseof.html** lorsque l'url **/blog/titre_article.html** sera appelé pour afficher le contenu d'un article.
Un article étant défini par le contenu d'un fichier **\*.md** du répertoire `/content/blog`
```html
{{ define "main" }}
<div class="container">
	<article class="blog-post">
	    <header>
	        <h2 class="blog-post-title">
	            {{ .Title }}
	        </h2>
	    </header>
	    <main class="blog-post-main">
	    	{{ .Content }}
	  	</main>
	</article>
</div>
{{ end }}
```



# Définition d'une section Tags

Pour pouvoir lister les articles par **Tags** avec Hugo.

1\. Ajouter une entrée **Tags** dans le menu global du fichier de configuration principal `config\_default\config.toml`
```makefile
	[[menu.global]]
		name = "Tags"
		weight = 2
		identifier = "tags"
		url = "/tags"
```

2\. Ajouter le parametre suivant dans le fichier de configuration principal `config\_default\config.toml` pour activer la gestion des **Tags**
```makefile
[taxonomies]
  tag = "tags"
```

3\. Ajouter dans les fichiers **\*.md** du répertoire `content/blog` le paramètre **Tags** avec les mots clés souhaités
```makefile
---
Tags : ["Tags1","Tags2"]
---
```

4\. Création du fichier `/themes/pragmatias/layouts/_default/terms.html` pour gérer l'affichage de l'url **/Tags**
```html
{{ define "main" }}
<div class="container prag-tags">
  {{ $type := .Type }}
  {{ range $key, $value := .Data.Terms.ByCount }}
    {{ $name := .Name }}
    {{ $count := .Count }}
    {{ with $.Site.GetPage (printf "/%s/%s" $type $name) }}
    <p>
      <a class="" href="{{ .Permalink }}">
        {{ $name | humanize }}
      </a>
    </p>
    {{ end }}
  {{ end }}
</div>
{{ end }}
```

5\. Création du fichier `/themes/pragmatias/layouts/_default/taxonomy.html` pour gérer l'affichage du contenu d'un **Tags**
```html
{{ define "main" }}
<div class="container">
  {{ range (where .Site.Pages "Type" "blog") }}
  <article class="list-blog-post">
      <header>
          <h2 class="list-blog-post-title">
              <a href="{{ .RelPermalink }}">{{ .Title }}</a>
          </h2>
      </header>
      <div class="list-blog-post-summary">
          {{ .Summary | safeHTML }}
      </div>
  </article>
  {{ end}}
</div>
{{ end }}
```


# Définition d'une section Archives

Afin de pouvoir lister les articles pour voir les archives, il faut créer une section **Archives**.

1\. Ajouter une entrée **Archives** dans le menu global du fichier de configuration principal `config\_default\config.toml`
```makefile
[[menus]]
	[[menu.global]]
		name = "Archives"
		weight = 3
		identifier = "archives"
		url = "/archives"

```

2\. Création du répertoire `content\archives` et d'un fichier **_index.md** avec le contenu suivant
```makefile
---
Title : "Archives"
date : 2019-01-01
---
```

3\. Création du fichier `/themes/pragmatias/layouts/_default/list.html` pour gérer l'affichage de l'url **/Archives**
```html
{{ define "main" }}
<div class="container">
    {{ $v1 := where .Site.RegularPages "Type" "blog" }}
    {{ range ($v1.GroupByDate "2006") }}
    <div class="arch-posts-group">
        <div class="arch-post-year">{{ .Key }}</div>
        <ul class="arch-post-list">
            {{ range (where .Pages "Type" "blog") }}
            <li class="arch-post-item">
                <a href="{{ .RelPermalink }}">
                    <span class="arch-post-title">{{ .Title }}</span>
                </a>
            </li>
            {{ end }}
        </ul>
    </div>
    {{ end }}
</div>
{{ end }}
```


# Mise en place du multilingue

## Mise en place de deux langues (fr/en)

1\. Définir la langue par défaut en ajoutant les paramètres suivants au début du fichier de configuration principal `/config/_default/config.toml`
```makefile
languageCode = "en"
DefaultContentLanguage = "en"
```

2\. Définir les différentes langues en ajoutant les paramètres suivants à la fin du fichier de configuration principal `/config/_default/config.toml`
```makefile
[languages]
  [languages.en]
    weight = 10
    languageName = "English"
    contentDir = "content/en"
    languageCode = "en"
    [languages.en.params]
    imagePNG = "united-kingdom-flag-round-xs.png"

  [languages.fr]
      weight = 20
      languageName = "Français"
      contentDir = "content/fr"
      languageCode = "fr"
      [languages.fr.params]
      imagePNG = "france-flag-round-xs.png"
```

3\. Définition du dictionnaire anglais en créant le fichier **en.toml** dans le répertoire `/themes/pragmatias/i18n`
```makefile
[more_read]
other = "Read more"
```

4\. Définition du dictionnaire français en créant le fichier **fr.toml** dans le répertoire `/themes/pragmatias/i18n`
```makefile
[more_read]
other = "Continer la lecture"
```

5\. Pour utiliser les termes des dictionnaries dans les fichiers html du répertoire `/themes/pragmatias/layouts`, il faut utiliser la syntaxe suivante :
```makefile
{{ i18n "more_read" }}
```



## Gestion des mois en fonction de la langue

1\. Ajouter la traduction des 12 mois dans le dictionnaire Anglais `/themes/pragmatias/i18n/en.toml`
```makefile
[January]
other = "January"
[February]
other = "February"
[March]
other = "March"
[April]
other = "April"
[May]
other = "May"
[June]
other = "June"
[July]
other = "July"
[August]
other = "August"
[September]
other = "September"
[October]
other = "October"
[November]
other = "November"
[December]
other = "December"
```

2\. Ajouter la traduction des 12 mois dans le dictionnaire Français `/themes/pragmatias/i18n/fr.toml`
```makefile
[January]
other = "Janvier"
[February]
other = "Février"
[March]
other = "Mars"
[April]
other = "Avril"
[May]
other = "Mai"
[June]
other = "Juin"
[July]
other = "Juillet"
[August]
other = "Aout"
[September]
other = "Septembre"
[October]
other = "Octobre"
[November]
other = "Novembre"
[December]
other = "Décembre"
```

3\. Utiliser la syntaxe suivante pour afficher les dates dans les fichiers html du répertoire `/themes/pragmatias/layouts`
```html
{{.Date.Day}} {{i18n .Date.Month}} {{.Date.Year}}
```


# Ajout d'un flux RSS concernant la section Blog
 
1\. Ajout des informations de sortie dans le fichier de configuration principal `/config/_default/config.toml`
```makefile
[outputs]
  home = [ "HTML", "RSS" ]
  section = [ "HTML"] 
  taxonomy = [ "HTML"]
```

2\. Création de la définition du flux RSS dans le fichier `/themes/pragmatias/layouts/_default/rss.xml`
```xml
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>{{ .Site.Title }}</title>
    <link>{{ "/blog" | absLangURL }}</link>
    <description>{{ i18n "rss_content" }} {{ .Site.Title }}</description>
    <generator>Hugo {{ .Hugo.Version }}</generator>
    {{ with .Site.LanguageCode }}
      <language>{{.}}</language>
    {{end}}
    {{ with $.Site.Author.name }}
      <webMaster>{{.}}</webMaster>
    {{end}}
    {{ with .Site.Copyright }}
      <copyright>{{.}}</copyright>
    {{end}}
    <lastBuildDate>{{ .Date.Format "Mon, 02 Jan 2006 15:04:05 -0700" | safeHTML }}</lastBuildDate>
    <atom:link href="{{ "/feed.xml" | absLangURL }}" rel="self" type="application/rss+xml" />
    {{ range first 10 (where .Data.Pages "Type" "blog") }}
    <item>
      <title>{{ .Title }}</title>
      <link>{{ .Permalink }}</link>
      <pubDate>
          {{ .Date.Format "Mon, 02 Jan 2006 15:04:05 -0700" | safeHTML }}
      </pubDate>
      <lastModDate>
          {{ .Lastmod.Format "Mon, 02 Jan 2006 15:04:05 -0700" | safeHTML }}
      </lastModDate>
      <guid>{{ .Permalink }}</guid>
      <description>{{ .Summary | html }}</description>
    </item>
    {{ end }}
  </channel>
</rss>
```

3\. Ajout des informations dans le fichier `/themes/pragmatias/layouts/partials/head.html` :
```html
    <!-- Flux RSS -->
    <link rel="alternate" type="application/rss+xml" href="{{ "/feed.xml" | absLangURL }}" />
```


4\. Ajout de l'icone RSS dans le fichier `/themes/pragmatias/layouts/partials/header.html` :
```html
   <li class="nav-item">
      <a href="{{ "/feed.xml" | absLangURL }}" title="{{ .Site.Title}}" class="prag_header_svg mr-1 ml-1">
        {{ partial "svg/social-rss-circle-internet.svg" (dict "size" "24px") }}
      </a>
    </li>
```



# Gestion du fichier CSS principal

## Gestion des couleurs
Afin de pouvoir gérer plus facilement les couleurs.

1\. Définir l'ensemble des variables nécessaire au début du fichier CSS
```css
:root {
  --color-bg-primary:#fdfaee;
  --color-fg-head-titre:#03416d;
}
```

2\. Utiliser la syntaxe suivante pour appeler la variable définissant la couleur attendue
```css
body {
  background-color: var(--color-bg-primary);
  color: var(--color-fg-blog-texte);
}
```


## Gestion des fonts

Pour ajouter une font spécifique.

1\. Copier les fichiers de la font choisie au format woff et woff2 dans le répertoire `/themes/pragmatias/static/fonts`

- OpenSans-Regular.woff
- OpenSans-Regular.woff2
- OpenSans-Bold.woff
- OpenSans-Bold.woff2
- OpenSans-Italic.woff
- OpenSans-Italic.woff2
- OpenSans-BoldItalic.woff
- OpenSans-BoldItalic.woff2


2\. Définir les fonts pouvant être utiliser dans le CSS
```css
@font-face {
  font-family: 'OpenSans';
  src: url('/fonts/OpenSans-Regular.woff2') format('woff2'), url('/fonts/OpenSans-Regular.woff') format('woff');
  font-weight: 400;
  font-style: normal;
}

@font-face {
  font-family: 'OpenSans';
  src: url('/fonts/OpenSans-Bold.woff2') format('woff2'), url('/fonts/OpenSans-Bold.woff') format('woff');
  font-weight: 700;
  font-style: normal;
}

@font-face {
  font-family: 'OpenSans';
  src: url('/fonts/OpenSans-Italic.woff2') format('woff2'), url('/fonts/OpenSans-Italic.woff') format('woff');
  font-weight: 400;
  font-style: italic;
}

@font-face {
  font-family: 'OpenSans';
  src: url('/fonts/OpenSans-BoldItalic.woff2') format('woff2'), url('/fonts/OpenSans-BoldItalic.woff') format('woff');
  font-weight: 700;
  font-style: italic;
}
```


3\. Utiliser le nom de la font dans les propriétés du CSS
```css
body {
  font-family: 'OpenSans';
}
```











