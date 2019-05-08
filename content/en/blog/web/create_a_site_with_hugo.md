---
Categories : ["Web","Hugo"]
Tags : ["Web","Hugo"]
title : "Create a website with Hugo"
date : 2019-04-25
draft : false
toc: true
---

You'll find in this article, All the element to create a website based on [Hugo](https://gohugo.io) generator tool.

The topics covered are website architecture, theme creation, rss feed output definition, setting up the multilingual properties, ...

 <!--more-->

# What's Hugo

[Hugo](https://gohugo.io) is a static website generator written in Go and created by Steve Francia in 2013 ([wikipedia](https://en.wikipedia.org/wiki/Hugo_\(software\)))

The [documentation](https://gohugo.io/documentation/) is pretty complete and well written to handle the tool.

# Objective

- Created a **blog** system linnked with a **tags** system allowing an eeasy navigation in a **documentation** spirit (wihtout using a **wiki**)
- Do not use external ressource *(google,facebook,javascript,...)*
- Do not retrieve visitor information *(trackers,cookies,comments,...)*
- Do as much as i can by myself
- Automatically generate html pages

# Source code

All the source code of this website can be found on my [github repository](https://github.com/pragmatias/documentation).

# Starting up

## Download

I mainly worked with the version 0.54.0, by retrieving the executable from the [official release](https://github.com/gohugoio/hugo/releases) repository.

Direct link to the [Windows10 (en 64bit)](https://github.com/gohugoio/hugo/releases/download/v0.55.4/hugo_0.55.4_Windows-64bit.zip) version or the [Linux (en 64bit)](https://github.com/gohugoio/hugo/releases/download/v0.54.0/hugo_0.54.0_Linux-64bit.deb) version.

## Handle Hugo

To create a first website, you can follow the [official documentation](https://gohugo.io/getting-started/quick-start/).
The steps are well explained and you will find a large number of [themes](https://themes.gohugo.io) choices to start handle the tool.


# Website architecture

## Base directories definition

```html
/documentation
  +-- /archetypes
  +-- /config
  |   +-- /_default
  +-- /content
  +-- /ressources
  +-- /themes
```

- The folder "archetypes" allow to store the blog articles template
- The folder "config" allow to store global config files
- The folder "content" allow to store the content of the website (with **\*.md** files)
- The foder "ressources" allow to store all the ressources elements generated
- The folder "themes" allow to store the theme files


## Theme directories definition

The folders used for a theme *(example with my own theme)* :
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

The theme is named **pragmatias** and the meta-data will be find in the file **theme.toml**
An example of the file **theme.toml** content can be found in the [officiel website](https://github.com/gohugoio/hugoThemes#themetoml).

Important folders :

- i18n : manage the multilingue parts (vocabulary)
- layouts : manage the display of the website
- static : store all the needed ressources (js,fonts,css,images)


## Website structure definition
Create the file **baseof.html** in the folder `/themes/pragmatias/layouts/_default`

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

This page will be the default skeleton of each website page.

You need to create the following files in the folder `/themes/pragmatias/layouts/partials` : 

- head.html : allow to define the **header** part of each html page
- header.html : allow to define the **navigation menu** part (on top of the website)
- footer.html : allow to define the **footer** part of each html page

For the header and footer, the invocation of the files **\*.html** is done using the following syntax :
```html 
{{- partial "*.html" . -}}
```


For the body, the invocation of the files **\*.html** is done in a more complex way. You will find all the information in the chapter about the creation of the website sections. *(blog, tags, archives, ...)*


## Navigation menu management

To manage the navigation menu Afin de gérer un menu de navigation depending on the screen size (mobile/desktop), i used the [bootstrap](https://getbootstrap.com/) javascript library .

Implementation steps are :

1\. Download the [bootstrap](https://getbootstrap.com/docs/4.3/getting-started/download/),[jquery](https://jquery.com/download/) et [popper](https://popper.js.org) javascripts files in the folders `/themes/pragmatias/static/js` and `/themes/pragmatias/static/css`

  - js/bootstrap.min.js
  - js/bootstrap.min.js.map
  -	js/jquery-3.4.0.slim.min.js
  -	js/jquery-3.4.0.slim.min.js.map
  -	js/popper.min.js
  -	js/popper.min.js.map
  - css/bootstrap.min.css
  - css/bootstrap.min.css.map

2\. Add the following information in the file `/themes/pragmatias/layouts/partial/head.html` to load the needed Javascript and CSS files
```html
    <!-- Bootstrap CSS -->
    <link rel="stylesheet" href="{{ .Site.BaseURL }}/css/bootstrap.min.css">

    <!-- Optional JavaScript -->
    <!-- jQuery first, then Popper.js, then Bootstrap JS -->
    <script src="{{ .Site.BaseURL }}/js/jquery-3.4.0.slim.min.js"></script>
    <script src="{{ .Site.BaseURL }}/js/popper.min.js"></script>
    <script src="{{ .Site.BaseURL }}/js/bootstrap.bundle.min.js"></script>
```


3\. Create the navigation menu `/themes/pragmatias/layouts/partial/header.html`
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

4\. Create entries in the global menu, by adding the following information to the main configuration file `config\_default\config.toml`
```makefile
[[menus]]
	[[menu.global]]
		name = "Test"
		weight = 1
		identifier = "test"
		url = "/test"
```



# Blog section definition

To create articles, you need to define and manage a **blog** section.

1\. Create a **blog** entrie in the global menu in the main configuration file `config\_default\config.toml`

```makefile
	[[menu.global]]
		name = "Blog"
		weight = 1
		identifier = "blog"
		url = "/blog"
```

2\. Create the folder `/content/blog`

This folder will be used to store all the articles content of the **blog** section in the **\*.md** format.

Example of a article content :
```makefile
---
Categories : [""]
Tags : [""]
title : "First article with Hugo"
date : 2019-01-01
draft : false
---

Welcome !
```

3\. Create the file `/themes/pragmatias/layouts/blog/list.html`

This file will be called by default by the file **baseof.html** when the url **/blog** will be called.
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
> Note : the syntax `{{ define "main" }} ... {{ end }}` will replace the block `{{- block "main" . }}{{- end }}` of the file **baseof.html**

4\. Create the file `/themes/pragmatias/layouts/blog/single.html`

This file will be called by default by the file **baseof.html** when the url **/blog/titre_article.html** will be called to display the article content.
Un article being defined by the content of a file **\*.md** in the folder `/content/blog`
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



# Tags section definition

To list the articles by **Tags** with Hugo.

1\. Add an entrie **Tags** in the global menu in the main configuration file `config\_default\config.toml`
```makefile
	[[menu.global]]
		name = "Tags"
		weight = 2
		identifier = "tags"
		url = "/tags"
```

2\. Add the following parameter in the main configuration file `config\_default\config.toml` to activate the **Tags** management
```makefile
[taxonomies]
  tag = "tags"
```

3\. Add in the **\*.md** files of the foler `content/blog`, the parameter **Tags** with the desired keywords
```makefile
---
Tags : ["Tags1","Tags2"]
---
```

4\. Create the file `/themes/pragmatias/layouts/_default/terms.html` to manage the display of the url **/Tags**
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

5\. Create the file `/themes/pragmatias/layouts/_default/taxonomy.html` to manage the display of a **Tags** content *(articles listing)*
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


# Archives section definition

To list all the articles by year, you need to create an **Archives** section.

1\. Add an entrie **Archives** in the global menu in the main configuration file `config\_default\config.toml`
```makefile
[[menus]]
	[[menu.global]]
		name = "Archives"
		weight = 3
		identifier = "archives"
		url = "/archives"

```

2\. Create the folder `content\archives` and the file **_index.md** with the following content
```makefile
---
Title : "Archives"
date : 2019-01-01
---
```

3\. Create the file `/themes/pragmatias/layouts/_default/list.html` to manage the display of the url **/Archives**
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


# Implementation of multilingual

## Definition of two language (fr/en)

1\. Define the default language by adding the following parameter at the beginning of the main configuration file `/config/_default/config.toml`
```makefile
languageCode = "en"
DefaultContentLanguage = "en"
```

2\. Define other language by adding the following parameters at the end of the main configuration file `/config/_default/config.toml`
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

3\. Define the english dictionary by creating the file **en.toml** in the folder `/themes/pragmatias/i18n`
```makefile
[more_read]
other = "Read more"
```

4\. Define the french dictionary by creating the file **fr.toml** in the folder `/themes/pragmatias/i18n`
```makefile
[more_read]
other = "Continer la lecture"
```

5\. To use the dictionary term in the html files of the folder `/themes/pragmatias/layouts`, you need to use the following syntax :
```makefile
{{ i18n "more_read" }}
```



## Management of months according to language

1\. Add the translation of the months in the english dictionary `/themes/pragmatias/i18n/en.toml`
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

2\. Add the translation of the months in the french dictionary `/themes/pragmatias/i18n/fr.toml`
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

3\. Use the following syntax to display the dates in the html files in the folder `/themes/pragmatias/layouts`
```html
{{.Date.Day}} {{i18n .Date.Month}} {{.Date.Year}}
```


# Added an RSS feed for the Blog section
 
1\. Add output information in the main configuration file `/config/_default/config.toml`
```makefile
[outputs]
  home = [ "HTML", "RSS" ]
  section = [ "HTML"] 
  taxonomy = [ "HTML"]
```

2\. Create the RSS feed definition in the file `/themes/pragmatias/layouts/_default/rss.xml`
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

3\. Add the following information in the file `/themes/pragmatias/layouts/partials/head.html` :
```html
    <!-- Flux RSS -->
    <link rel="alternate" type="application/rss+xml" href="{{ "/feed.xml" | absLangURL }}" />
```


4\. Add a svg RSS icon in the file `/themes/pragmatias/layouts/partials/header.html` :
```html
   <li class="nav-item">
      <a href="{{ "/feed.xml" | absLangURL }}" title="{{ .Site.Title}}" class="prag_header_svg mr-1 ml-1">
        {{ partial "svg/social-rss-circle-internet.svg" (dict "size" "24px") }}
      </a>
    </li>
```



# Manage the main CSS file

## Utilisation d'un fichier CSS

1\. Create the main CSS file in the folder `/themes/pragmatias/static/css`
```css
html {}

body {}
```


2\. Add the call of the CSS file in the file `/themes/pragmatias/layouts/partials/head.html`
```html
    <link rel="stylesheet" href="{{ .Site.BaseURL }}/css/pragmatias.css">
```

## Manage colors
To manage all the website colors in one place.

1\. Define all the needed variables at the beginning of the CSS file
```css
:root {
  --color-bg-primary:#fdfaee;
  --color-fg-head-titre:#03416d;
}
```

2\. Use the following syntax to call the wanted color variable
```css
body {
  background-color: var(--color-bg-primary);
  color: var(--color-fg-blog-texte);
}
```


## Fonts management

To be able to use a specific font without using an external webservice.

1\. Copy the files of the chosen font in woff and woff2 format in the folder `/themes/pragmatias/static/fonts`

- OpenSans-Regular.woff
- OpenSans-Regular.woff2
- OpenSans-Bold.woff
- OpenSans-Bold.woff2
- OpenSans-Italic.woff
- OpenSans-Italic.woff2
- OpenSans-BoldItalic.woff
- OpenSans-BoldItalic.woff2


2\. Define the fonts in the CSS file
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


3\. Use the name of the font in the CSS properties
```css
body {
  font-family: 'OpenSans';
}
```
