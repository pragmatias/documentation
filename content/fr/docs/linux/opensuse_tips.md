---
title: OpenSUSE Tips
linktitle: OpenSUSE (Astuces)
description: 
date: 2019-04-01
publishdate: 2019-04-01
lastmod: 2019-04-02
categories: []
keywords: [Linux,Distribution,OS]
menu:
  docs:
    parent: "linux"
    weight: 2
weight: 2
aliases: []
toc: true
---

Vous trouverez l'ensemble des scripts et configuration pour installer [OpenSUSE Tumbleweed](https://www.opensuse.org/#Tumbleweed) dans ce [Dépôt Github](https://github.com/pragmatias/opensuse).

# Zypper

 1. Installation d'un package : ` sudo zypper in --no-recommend package`
 2. Suppression d'un package : ` sudo zypper rm --clean-deps package`
 3. Mise à jour des dépôts : `sudo zypper ref` ou `sudo zypper ref -f`
 4. Mise à jour des packages : `sudo zypper up`
 5. Mise à niveau de la distribution : `sudo zypper dup`
 6. Recherche d'un package : `sudo zypper se package` ou `sudo zypper se -is package`

> Note: remplacer **package** par le nom du package


# Système de fichier btrfs

Si btrfs-cleaner utilise 100% du CPU and bloque votre pc, vous pouvez l'arrêter avec la commande suivante : `sudo btrfs quota disable /`

# Service son (Pulseaudio)

Pour redémarrer pulseaudio, utilisez : `pulseaudio -k`

# Service réseau 

Pour redémarrer le service réseau, utilisez :` sudo rcnetwork restart network_interface`

> Note: remplacer **network_interface** par votre nom d'interface (utilisez `ifconfig`)

# Configuration Fstab (with ntfs drive)
For each drive :

 1. Create the following folder : `mkdir /mnt/<name>`
 2. change the folder owner : `chown anybody:wheel /mnt/<name>` 
 3. update the fstab file `sudo vi /etc/fstab` with the following line : `/dev/<drive>          /mnt/<name>          ntfs     rw,nosuid,nodev,relatime   0  0` 

Tips :
 - list partitions : `sudo fdisk -l`
 - list block devices : ` lsblk`
 - list uuid : `sudo blkid`


# Configuration the NFS client

 - Discover the shared volumes on the NFS server : ` showmount -e <ip>`
 - Mount a shared volume from the NFS server (manually) : `sudo mount -t nfs <ip>:<repnfs> <replocal>`
 - Mount a shared volume from the NFS server (automatically) : `sudo vi /etc/fstab` and add the line `<ip>:<repnfs> <replocal> nfs rw,noauto,_netdev 0 0`
 - Mount all the fstab (reload) : `mount -a`

> - **ip** of the NFS server
> - **repnfs** : path/folder on the NFS server
> - **replocal** : path/folder on the NFS client


# Configure Bind to Switch Desktop and Quick tile Window

1. Go to System Settings > Shortcuts > Global Shortcuts > System Settings or Kwin

 >| Action | Global |
 >|--|--|
 >| Quick Tile Window to the Bottom | Meta+Num+2 |
 >| Quick Tile Window to the Bottom Left | Meta+Num+1 |
 >| Quick Tile Window to the Bottom Right | Meta+Num+3 |
 >| Quick Tile Window to the Left | Meta+Num+4 |
 >| Quick Tile Window to the Right | Meta+Num+6 |
 >| Quick Tile Window to the Top | Meta+Num+8 |
 >| Quick Tile Window to the Top Left | Meta+Num+7 |
 >| Quick Tile Window to the Top Right | Meta+Num+9 |
 >| Switch One Desktop Down | Meta+Down |
 >| Switch One Desktop to the Left | Meta+Left |
 >| Switch One Desktop to the Right | Meta+Right |
 >| Switch One Desktop Up | Meta+Up |
 >| Full screen Window | Meta+f |

2. Right Click on the desktop wallpaper > Configure Desktop > Mouse Actions > Remove action "Switch Desktop" for "Vertical-Scroll"


# Autostart (KDE)
Copy a file **org.kde.*.desktop** in the folder **~/.config/autostart**

> You could find them in the folder */usr/share/applications*

Or use System Settings > Startup and Shutdown > Autostart

# Reset KDE Session
Reset the current KDE session (kill all process & logout) : `pkill -kill -u username`

> Note : replace **username** by the name of the choosen one


# Konsole configuration
In Settings > Edit Current Profile

1. General > Profile name > Users
2. General > Command > /bin/bash
3. Appearance > Color Scheme & Background > Monokai-Flat
4. Keyboard > Linux console


# Firefox configuration
The file **places.sqlite** in **$HOME/.mozilla/firefox/%.default** contains bookmarks and history

List of interesting addons :

 - Ublock Origin
 - HTTPS Everywhere
 - Canvasblocker
 - Cookie autodelete
 - Css exfil protection
 - DecentralEyes
 - Redirector
 - Select context search
 - Awesome RSS
 - Privacy Badger
 - No Coin


# Latte Dock
List of widgets :

 - Application Menu
 - Pager
 - Justify Splitter
 - Latte plasmoid
 - Justify Splitter
 - System Tray
 - Digital Clock
 - Lock/Logout

> You need to download and add manually the widget "redshift"


To restore plasma config (panel) :

 1. `kquitapp plasmashell`
 2. `sleep 10s`
 3. `cp <plasma_files_backup> $HOME/.config/.`
 4. `plasmashell &`


# WMware tips
[Shared Folder](https://en.opensuse.org/SDB:VMware_Tools) :

- Listing of shared folder : `vmware-hgfsclient`
- Mount a shared folder : `vmhgfs-fuse -o allow_other .host: /mnt/`
- Unmount a shared folder : `fusermount -uz /mnt/`or `umount -f /mnt/`


# VirtualBox tips

Install VBoxGuestAdditions :

 1. insert file VBoxGuestAdditions*.iso in the cdrom
 2. `sudo mkdir -p /media/cdrom`
 3. `sudo mount -t iso9660 /dev/cdrom /media/cdrom`
 4. `cd /media/cdrom`
 5. `sudo ./VBoxLinuxAdditions.run`

Install VirtualBox package :

 1. `sudo zypper in virtualbox-guest-tools virtualbox-guest-x11`




