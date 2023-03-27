---
Categories : ["Linux","OpenSuse"]
Tags : ["Linux","OpenSuse"]
title : "Installation de OpenSUSE (Tumbleweed)"
date : 2019-02-05
draft : false
toc: true
---

Afin de faciliter l'installation de la distribution GNU/LINUX OpenSuse Tumbleweed par rapport à mes besoins, vous trouverez dans cet article les étapes pour avoir un système opérationnel rapidement à partir d'une nouvelle installation.

L'objectif était de pouvoir avoir rapidement un système me permettant de travailler  (docker/sublimtext/etc ...) et me divertir (Streaming/Video/etc ...)

Toutes les sources se trouvent dans ce dépôt [Github](https://github.com/pragmatias/opensuse).

 <!--more-->

# Installation

## Sommaire
1. [Pré-requis](#pré-requis)
2. [Étapes](#étapes)
3. [Actions manuelles après installation](#actions-manuelles-après-installation)

## Pré-requis
 1. Installez [OpenSUSE Tumbleweed](https://software.opensuse.org/distributions/tumbleweed) avec [KDE/Plasma Desktop](https://www.kde.org/plasma-desktop)
 2. Installez [GIT](https://git-scm.com/) : `sudo zypper in --no-recommend git`
 3. Récupérez ce [dépôt git](https://github.com/pragmatias/OpenSUSE) : `git clone https://github.com/pragmatias/OpenSUSE.git ~/tmp_install`
 4. Allez dans le répertoire **scripts** : `cd ~/tmp_install/scripts`

>  **Proxy** : quelques informations si vous voulez installer OpenSUSE Tumbleweed derrière un proxy
> ##### Avec Yast
> 1. Allez dans Yast > Network Services > Proxy
> 2. Cliquez sur  **Enable Proxy** et renseignez les informations nécessaires dans **Proxy Setting** et **Proxy Authentification**

> ##### Avec Bashrc
> 1. Ajoutez les informations http : `echo "export http_proxy=http://proxy_ip:proxy_port" >> ~/.bashrc`
> 2. Ajouter les informations https : `echo "export https_proxy=http://proxy_ip:proxy_port" >> ~/.bashrc`
> 3. Ajoutez les informations no proxy : `echo "export no_proxy=localhost,127.0.0.1" >> ~/.bashrc`
> 4. Ajoutez les informations ftp : `echo "export ftp_proxy=http://proxy_ip:proxy_port" >> ~/.bashrc`

## Étapes

 1. Configurez la liste des dépôts : `sudo ./01_TW_config_repository.sh`

> *Note* : You devez retirer le dépôt nvidia si you n'avez pas de carte graphique nvidia

 2. Supprimez les paquets non souhaités : `sudo ./02_TW_remove_package.sh`
 3. Installez les paquets souhaités : `sudo ./03_TW_install_package.sh`

> *Note* : si l'installation du paquet "vlc-codecs" n'est pas [OK], vous devez l'installer manuellement avec la commande `sudo zypper in --no-recommend vlc-codecs` and choisir l'option **with vendor change for the libraries**

 4. Installez les fonts **truetype** propriétaires : `sudo ./04_TW_install_fonts_truetype.sh`
 5. Personnalisez lesutilisateurs : `sudo ./05_TW_customize_users.sh` 
 6. Installez les drivers de la carte graphique (manuellement) : `sudo zypper in nvidia-glG05`
 7. Redémarrez votre ordinateur : `sudo shutdown -r 0`
 8. Supprimez le répertoire temporaire **tmp_install** : `rm -rf ~/tmp_install`


## Actions manuelles après installation

 - Firefox Config (bookmarks)
 - Thunderbird Config (account)
 - NFS Config (NAS)
 - KeepassXC Config (file)
 - Add "Redshift Widget" in Latte-Dock (before System Tray)



# Personnalisation (KDE/Plasma Desktop)

Un exemple de personnalisation utilisée : 
* KDE System (System settings)
	*	Workspace Theme > Look And Feel > Breeze Dark
	*	Workspace Theme > Desktop Theme > Breeze Dark
	*	Splash Screen > openSUSE
	*   Icons > Icons > Papirus-Dark
	*	Fonts > Fonts > Ubuntu (Hack for "Fixed  width")
	*	Application Style > Window Decorations > Border size : No Borders
	*	Application Style > Window Decorations > Breeze (Customize : "Small" Button Size, cochez seulement "Draw window background gradient")
	*	Desktop Behavior > Workspace > Click behavior > Double-click : pour ouvrir les fichiers et répertoirs (en double cliquant au lieu d'un clique simple)
	*	Desktop Behavior > Screen Locking > deactivation Lock screen automatically
	*	Desltop Behavior > Virtual Desktop > Desktop (Customize : Nombre de bureau = 4 et Nombre de lignes = 1)
	*	Input Devices > Keyboard > NumLock on Plasma Startup > Turn on
* KDE Desktop
    * Clique droit sur le fond d'écran du bureau > Configure Desktop > Tweask > Uncheck Show the desktop toolbox
    * Clique droit sur le fond d'écran du bureau > Configure Desktop > Filter > Show Files Matching
    * Clique droit sur le fond d'écran du bureau > Configure Desktop > Wallpaper > Add Image > Choose your wallpaper



# Ressources

Ce travail est basé sur les ressources suivantes :

 - [blog.microlinux.fr](https://blog.microlinux.fr) *([OpenSUSE](https://blog.microlinux.fr/tag/opensuse/))*
 - [www.volted.net](https://www.volted.net/) *([ZSH](un-prompt-zsh-au-poil18555.html)/[VIM](https://www.volted.net/un-vimrc-remis-au-propre18752.html))*
 - [KDE Tips](https://zren.github.io/kde/#configuration) 
