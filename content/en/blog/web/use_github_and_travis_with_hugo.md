---
Categories : ["Web","Hugo"]
Tags : ["Web","Hugo"]
title : "Setting up a website with Hugo, Github and Travis"
date : 2019-04-28
draft : false
toc: true
---

You'll find in this article, all the element to setting up a website based on the following tools :

- [Hugo](https://gohugo.io) : Static website generator
- [Github](https://github.com) : Web hosting and development source management service (using [Git](https://en.wikipedia.org/wiki/Git)) 
- [Travis CI](https://travis-ci.com) : Web service to test and deploy developments
- [Gandi](https://www.gandi.net) : Domain name provider

 <!--more-->

# Objective

- Create a [Github](https://github.com) repository to store the source code to generate the static website (**documentation**)
- Create a [Github](https://github.com) repository to store the generated static website elements (**pragmatias.github.io**)
- Configure [Travis CI](https://travis-ci.com) to trigger the static website generation in the repository **pragmatias.github.io** after a commit in the branch **master** from the repository **documentation**
- Management of a personal domain name from [Gandi](https://www.gandi.net/fr) to display the static website with url [pragmatias.fr](https://pragmatias.fr)


# Source code

All the source code of this website can be found on my [dépôt github](https://github.com/pragmatias/documentation) repository.


# Create a Github repository

## Create the repository documentation
*Prerequisites : have an account at [Github](https://github.com)*

1\. On your repository listing page, click on **New** 

[![1ère étape](/blog/web/20190429_create_repository_step1.png)](/blog/web/20190429_create_repository_step1.png)

2\. Fill the name of your repository that will contain the sources code to generate the website and click on **Create repository**

[![2ème étape](/blog/web/20190429_create_repository_step2.png)](/blog/web/20190429_create_repository_step2.png)

3\. Github will show you the steps to initialize your repository

[![3ème étape](/blog/web/20190429_create_repository_step3.png)](/blog/web/20190429_create_repository_step3.png)

## Create the repository pragmatias.github.io

You have to do the same step as for the creation of the repository **documentation** but this time with the name **pragmatias.github.io**.

You need to create at least one file in the repository **pragmatias.github.io** to configure the repository.

You will find more information about Github **Pages** system on the [official website](https://pages.github.com).

If you want to change the default configuration :

1\. Go on the **Settings** page of the repository **pragmatias.github.io**

[![4ème étape](/blog/web/20190429_create_repository_step4.png)](/blog/web/20190429_create_repository_step4.png)

2\. Go in the **GitHub Pages** section to configure the needed informations *(custom domain, enforces HTTPS, ...)*

[![5ème étape](/blog/web/20190429_create_repository_step5.png)](/blog/web/20190429_create_repository_step5.png)




# Linking Travis CI with a Github repository

1\. Login on [Travis CI](https://travis-ci.com) with your [Github](https://github.com) account

[![1ère étape](/blog/web/20190429_travis_step1.png)](/blog/web/20190429_travis_step1.png)

2\. Go in **Settings**, then in **Repositories** and click on **Manage repositories on Github**

[![2ème étape](/blog/web/20190429_travis_step2.png)](/blog/web/20190429_travis_step2.png)

3\. On Github, in the **Repository access** section, add the repository **documentation** and click on **Approve and install**

[![3ème étape](/blog/web/20190429_travis_step3.png)](/blog/web/20190429_travis_step3.png)


# Configure Travis CI actions on a Github repository

## Manage a Github token
First, you have to create a Github token allowing to give the right at [Travis CI](https://travis-ci.com) to do the commit action on the target repository.

1\. Login on your [Github](https://github.com) account, go in **settings** and click on **Developer settings**

[![1ère étape](/blog/web/20190429_github_token_step1.png)](/blog/web/20190429_github_token_step1.png)

2\. Click on **Personal access tokens**, then click on **Generate new token**

[![2ème étape](/blog/web/20190429_github_token_step2.png)](/blog/web/20190429_github_token_step2.png)

3\. Fill the **Tocken description** field, then select the necessary rights *(repo et gist)* and click on **Generate token**

[![3ème étape](/blog/web/20190429_github_token_step3.png)](/blog/web/20190429_github_token_step3.png)


4\. Copy the code displayed after the token generation *(it will only be displayed once)*

[![4ème étape](/blog/web/20190429_github_token_step4.png)](/blog/web/20190429_github_token_step4.png)

5\. Go on [Travis CI](https://travis-ci.com) and add the token with the name **GITHUB_TOKEN** and the value from the previous step.

[![5ème étape](/blog/web/20190429_github_token_step5.png)](/blog/web/20190429_github_token_step5.png)


## Create the configuration file for Travis CI

To be able to automatically deploy the website from the repository  **documentation** to the repository **pragmatias.github.com**, you must create a file **.travis.yml** at the root of the repository **documentation**

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

The content of this file is :

- Use the Ubuntu Trusty distribution `dist: trusty`
- Download and installation of the Hugo tool for Linux `install: ...`
- delete the folder **public** which is the default generation folder for Hugo `before_script: ...`
- Run the Hugo tool `script: ...`
- For the deployment part :
 - We define that we want to deploy the content of the directory **public** after executing the part **script** in the repository **pragmatias/pragmatias.github.io**
 - We define that we want to use the **master** branch for both repositories *(source and target)*
 - We define that the target is **Github Pages** `provider: pages`
 


# Using a personal domain with Github Pages

*Note : i use the domain name * ***pragmatias.fr*** *at [Gandi](https://www.gandi.net)*

1\. In the **pragmatias.github.io** repository parameters, fill then **Custom domain** section

[![parametre github](/blog/web/20190429_create_repository_step5.png)](/blog/web/20190429_create_repository_step5.png)

> to force the **https**, selection the **Enforce HTTPS** option.

2\. Modify the **script** section of the **.travis.yml** file

```yml
# script - run the build script
script:
    - hugo
    - echo "pragmatias.fr" > public/CNAME
```

3\. Configure your domain to redirect users to the content of the **Pages** of the repository **pragmatias.github.io**

3\.1\. Go to Gandi's website, click on **Domain name**, then on the desired domain name

[![Gandi 1](/blog/web/20190429_pages_github_domaine_gandi_p1.png)](/blog/web/20190429_pages_github_domaine_gandi_p1.png)


3\.2\. Go to **Enregistrement DNS** to modify the records

[![Gandi 1](/blog/web/20190429_pages_github_domaine_gandi_p2.png)](/blog/web/20190429_pages_github_domaine_gandi_p2.png)

3\.3\. Add the following DNS records *(to redirect between the Github Pages service and your domain name)*

```makefile
@ 1800 IN A 185.199.108.153
@ 1800 IN A 185.199.109.153
@ 1800 IN A 185.199.110.153
@ 1800 IN A 185.199.111.153
www 10800 IN CNAME pragmatias.github.io
```

> Be careful not to have any other lines starting with *@ 1800 IN A* ou par *www*

It may take several hours for the modification of records to be propagate before they are taken into account.
