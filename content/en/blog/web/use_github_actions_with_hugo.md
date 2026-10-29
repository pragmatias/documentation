---
Categories : ["Web","Hugo"]
Tags : ["Web","Hugo"]
title : "Setting up a website with Hugo and Github Actions"
date : 2022-05-29
draft : false
toc: true
---

You'll find in this article, all the element to setting up a website based on the following tools :

- [Hugo](https://gohugo.io) : Static website generator
- [Github](https://github.com) : Web hosting and development source management service (using [Git](https://en.wikipedia.org/wiki/Git)) 
- [Github Actions](https://github.com/features/actions) : Github service to test and deploy developments
- [Gandi](https://www.gandi.net) : Domain name provider

 <!--more-->

# Objective

- Create a [Github](https://github.com) repository to store the source code to generate the static website (**documentation**)
- Create a [Github](https://github.com) repository to store the generated static website elements (**pragmatias.github.io**)
- Configure [Github Actions](https://github.com/features/actions) to trigger the static website generation in the repository **pragmatias.github.io** after a commit in the branch **master** from the repository **documentation**
- Management of a personal domain name from [Gandi](https://www.gandi.net/fr) to display the static website with url [pragmatias.fr](https://pragmatias.fr)


# Source code

All the source code of this website can be found on my [dépôt github](https://github.com/pragmatias/documentation) repository.


# Create a Github repository

## Create the repository documentation
*Prerequisites : have an account at [Github](https://github.com)*

1\. On your repository listing page, click on **New** 

[![step 1](/blog/web/20190429_create_repository_step1.png)](/blog/web/20190429_create_repository_step1.png)

2\. Fill the name of your repository that will contain the sources code to generate the website and click on **Create repository**

[![step 2](/blog/web/20190429_create_repository_step2.png)](/blog/web/20190429_create_repository_step2.png)

3\. Github will show you the steps to initialize your repository

[![step 3](/blog/web/20190429_create_repository_step3.png)](/blog/web/20190429_create_repository_step3.png)

## Create the repository pragmatias.github.io

You have to do the same step as for the creation of the repository **documentation** but this time with the name **pragmatias.github.io**.

You need to create at least one file in the repository **pragmatias.github.io** to configure the repository.

You will find more information about Github **Pages** system on the [official website](https://pages.github.com).

If you want to change the default configuration :

1\. Go on the **Settings** page of the repository **pragmatias.github.io**

[![step 4](/blog/web/20190429_create_repository_step4.png)](/blog/web/20190429_create_repository_step4.png)

2\. Go in the **GitHub Pages** section to configure the needed informations *(custom domain, enforces HTTPS, ...)*

[![step 5](/blog/web/20220530_create_repository_step5.png.png)](/blog/web/20220530_create_repository_step5.png.png)



# Configure the actions on the Github repositories

## Manage a Github personal token
First, you have to create a Github token allowing to give the right at [Github Actions](https://github.com/features/actions) to do the commit action on the target repository.

1\. Login on your [Github](https://github.com) account, go in **settings** and click on **Developer settings**

[![step 1](/blog/web/20190429_github_token_step1.png)](/blog/web/20190429_github_token_step1.png)

2\. Click on **Personal access tokens**, then click on **Generate new token**

[![step 2](/blog/web/20190429_github_token_step2.png)](/blog/web/20190429_github_token_step2.png)

3\. Fill the **Token description** field, then select the necessary rights *(repo et gist)* and click on **Generate token**

[![step 3](/blog/web/20190429_github_token_step3.png)](/blog/web/20190429_github_token_step3.png)


4\. Copy the code displayed after the token generation *(it will only be displayed once)*

[![step 4](/blog/web/20190429_github_token_step4.png)](/blog/web/20190429_github_token_step4.png)

5\. Go in the **Settings** of the repository, select the **Actions** option in the **General > Security > Secrets** menu 

[![step 5](/blog/web/20220530_github_documentation_personal_token.png)](/blog/web/20220530_github_documentation_personal_token.png)

6\. Click on the **New repository secret** button and fill the **Name** field with the value `PERSONAL_TOKEN` and the **Value** field with the token value retrieved at step 4

[![step 6](/blog/web/20220530_github_documentation_personal_token_add.png)](/blog/web/20220530_github_documentation_personal_token_add.png)

## Create the configuration file for Github Actions

To be able to automatically deploy the website from the repository **documentation** to the repository **pragmatias.github.io**, you must create a file **main.yml** in the directory **.github/workflows** of the repository **documentation**

```yaml
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
          publish_branch: master  # default: gh-pages
          publish_dir: ./public

``` 

The content of this file is :

- Use the Ubuntu distribution `runs-on: ubuntu-latest`
- Download and installation of the Hugo tool for Linux `name: Setup Hugo`
- delete the folder **public** which is the default generation folder for Hugo `name: Cleaning`
- Run the Hugo tool `name: Build`
- For the deployment part :
    - We define that we want to deploy the content of the directory **public** in the **master** branch of the repository **pragmatias/pragmatias.github.io**
 


# Using a personal domain with Github Pages

*Note : i use the domain name * ***pragmatias.fr*** *at [Gandi](https://www.gandi.net)*

1\. In the **pragmatias.github.io** repository parameters, fill then **Custom domain** section

[![github settings](/blog/web/20220530_create_repository_step5.png.png)](/blog/web/20220530_create_repository_step5.png.png)

> to force the **https**, selection the **Enforce HTTPS** option.

2\. Configure your domain to redirect users to the content of the **Pages** of the repository **pragmatias.github.io**

2\.1\. Go to Gandi's website, click on **Domain name**, then on the desired domain name

[![Gandi 1](/blog/web/20190429_pages_github_domaine_gandi_p1.png)](/blog/web/20190429_pages_github_domaine_gandi_p1.png)


2\.2\. Go to **Enregistrement DNS** to modify the records

[![Gandi 1](/blog/web/20190429_pages_github_domaine_gandi_p2.png)](/blog/web/20190429_pages_github_domaine_gandi_p2.png)

2\.3\. Add the following DNS records *(to redirect between the Github Pages service and your domain name)*

```plaintext
@ 1800 IN A 185.199.108.153
@ 1800 IN A 185.199.109.153
@ 1800 IN A 185.199.110.153
@ 1800 IN A 185.199.111.153
www 10800 IN CNAME pragmatias.github.io
```

> Be careful not to have any other lines starting with *@ 1800 IN A* ou par *www*

It may take several hours for the modification of records to be propagate before they are taken into account.


