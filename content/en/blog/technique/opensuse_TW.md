---
Categories : ["Linux","OpenSuse"]
Tags : ["Linux","OpenSuse"]
title : "Install of OpenSUSE (Tumbleweed)"
date : 2019-02-05
draft : false
toc: true
---

In order to facilitate the installation of the GNU/LINUX  OpenSuse Tumbleweed distribution for my needs, you will find in this article the steps to have a fully operational system from a new installation in few minutes.

The goal was to have quickly a full system allowing me to work  (docker/sublimtext/and more ...), to use entertainment media (Streaming/Video/and more ...) and to play games.

All the sources are in this repository [Github](https://github.com/pragmatias/opensuse).

 <!--more-->

# Install

## Summary

1. [Requirement](#requirement)
2. [Steps](#steps)
3. [Things to do manually after install](#things-to-do-manually-after-install)

## Requirement

1. Install [OpenSUSE Tumbleweed](https://software.opensuse.org/distributions/tumbleweed) with the [KDE/Plasma Desktop](https://www.kde.org/plasma-desktop)
2. Install [GIT](https://git-scm.com/) : `sudo zypper in --no-recommend git`
3. Get this git [repository](https://github.com/pragmatias/OpenSUSE) : `git clone https://github.com/pragmatias/OpenSUSE.git ~/tmp_install`
4. Go to the **scripts** folder : `cd ~/tmp_install/scripts`

> **Proxy** : somes information if you want to install OpenSUSE Tumbleweed behind a proxy

> **With Yast** :
> 1. Open Yast > Network Services > Proxy
> 2. Click on **Enable Proxy** and fill all the needed information in **Proxy Setting** and **Proxy Authentification**

> **With Bashrc** :
> 1. Add http information : `echo "export http_proxy=http://proxy_ip:proxy_port" >> ~/.bashrc`
> 2. Add https information : `echo "export https_proxy=http://proxy_ip:proxy_port" >> ~/.bashrc`
> 3. Add no proxy information : `echo "export no_proxy=localhost,127.0.0.1" >> ~/.bashrc`
> 4. Add ftp information : `echo "export ftp_proxy=http://proxy_ip:proxy_port" >> ~/.bashrc`

## Steps

1. Configure the repositories list : `sudo ./01_TW_config_repository.sh`

> *Note* : you need to remove the nvidia repository if you don't have a nvidia graphic card

2. Remove the listed packages : `sudo ./02_TW_remove_package.sh`
3. Install the listed packages : `sudo ./03_TW_install_package.sh`

> *Note* : if the "vlc-codecs" installation isn't [OK], you need to install it manually with the command `sudo zypper in --no-recommend vlc-codecs` and choose options with vendor change for the libraries

4. Install of truetype proprietary fonts : `sudo ./04_TW_install_fonts_truetype.sh`
5. Customization of users : `sudo ./05_TW_customize_users.sh` 
6. Install the graphic card driver (manually) : `sudo zypper in nvidia-glG05`
7. Restart your computer : `sudo shutdown -r 0`
8. Remove the tmp_install folder : `rm -rf ~/tmp_install`


## Things to do manually after install
 - Firefox Config (bookmarks)
 - Thunderbird Config (account)
 - NFS Config (NAS)
 - KeepassXC Config (file)
 - Add "Redshift Widget" in Latte-Dock (before System Tray)



# Customization (KDE/Plasma Desktop)

* KDE System (System settings)
	*	Workspace Theme > Look And Feel > Breeze Dark
	*	Workspace Theme > Desktop Theme > Breeze Dark
	*	Splash Screen > openSUSE
	*   Icons > Icons > Papirus-Dark
	*	Fonts > Fonts > Ubuntu (Hack for "Fixed  width")
	*	Application Style > Window Decorations > Border size : No Borders
	*	Application Style > Window Decorations > Breeze (Customize : "Small" Button Size, check only "Draw window background gradient")
	*	Desktop Behavior > Workspace > Click behavior > Double-click to open files and folders
	*	Desktop Behavior > Screen Locking > deactivation Lock screen automatically
	*	Desltop Behavior > Virtual Desktop > Desktop (Customize : Number of desktops = 4 and Number of rows = 1)
	*	Input Devices > Keyboard > NumLock on Plasma Startup > Turn on
* KDE Desktop
    * Right Click on the desktop wallpaper > Configure Desktop > Tweask > Uncheck Show the desktop toolbox
    * Right Click on the desktop wallpaper > Configure Desktop > Filter > Show Files Matching
    * Right Click on the desktop wallpaper > Configure Desktop > Wallpaper > Add Image > Choose your wallpaper



# Resources

This work is based on the following resources :

 - [blog.microlinux.fr](https://blog.microlinux.fr) *([OpenSUSE](https://blog.microlinux.fr/tag/opensuse/))*
 - [www.volted.net](https://www.volted.net/) *([ZSH](un-prompt-zsh-au-poil18555.html)/[VIM](https://www.volted.net/un-vimrc-remis-au-propre18752.html))*
 - [KDE Tips](https://zren.github.io/kde/#configuration) 
