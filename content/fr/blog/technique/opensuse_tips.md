---
Author : ""
Description : ""
Categories : [""]
Tags : ["Linux","OpenSuse","Tips"]
title : "Astuces pour OpenSUSE (Tumbleweed)"
date : 2019-04-20
draft : false
toc: true
---

Après plusieurs mois à manipuler la distribution GNU/Linux [OpenSUSE Tumbleweed](https://www.opensuse.org/#Tumbleweed), d'abord sur des machines virtuelles ([VirtualBox](https://www.virtualbox.org) / [VMWare](https:www.vmware.com)) puis sur mon poste principal, il était temps de rassembler les astuces quelques parts.

Les astuces portent sur zypper, btrfs, nfs, konsole, virtualbox, vmware, etc ...
 <!--more-->

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

# Configuration Fstab (avec un disque ntfs)
Pour chaque disque :

 1. Creatiob du repertoire suivant : `mkdir /mnt/<name>`
 2. Modification du propriétaire du répertoire : `chown anybody:wheel /mnt/<name>` 
 3. Modification du fichier fstab `sudo vi /etc/fstab` avec la ligne suivante : `/dev/<drive>          /mnt/<name>          ntfs     rw,nosuid,nodev,relatime   0  0` 

Astuces :
 - Pour lister les partitions : `sudo fdisk -l`
 - Pour lister les blocs : ` lsblk`
 - Pour lister les uuid : `sudo blkid`


# Configuration du client NFS

 - Rechercher les répertoires partager sur le serveur NFS : ` showmount -e <ip>`
 - Monter un repertoire partagé sur le serveur NFS (manuellement) : `sudo mount -t nfs <ip>:<repnfs> <replocal>`
 - Monter un repertoire partagé à partir du server NFS (automatiquement) en modifier le fichier fstab : `sudo vi /etc/fstab` et en ajoutant la ligne `<ip>:<repnfs> <replocal> nfs rw,noauto,_netdev 0 0`
 - Monter les repertoires connus dans le fichier fstab (rechargement) : `mount -a`

> - **ip** : adresse du serveur NFS
> - **repnfs** : chemin/repertoire sur le serveur NFS
> - **replocal** : chemin/repertoire sur le client NFS


# Configuration des raccourcis pour changer de bureau (Quick tile Window)

1. Aller dans System Settings > Shortcuts > Global Shortcuts > System Settings or Kwin

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

2. Clique droit sur le papier peint du bureau > Configure Desktop > Mouse Actions > Remove action "Switch Desktop" for "Vertical-Scroll"


# Autostart (KDE)
Copier un fichier **org.kde.*.desktop** dans le répertoire **~/.config/autostart**

> Vous pouvez les trouver dans le répertoire */usr/share/applications*

Ou utilisez System Settings > Startup et Shutdown > Autostart

# Redémarrer la session KDE
Redémarrer la session courante de KDE (Tue tous les process et déconnecte l'utilisateur) : `pkill -kill -u username`

> Note : remplacer **username** par le nom de l'utilisateur choisi


# Konsole configuration
Dans Settings > Edit Current Profile

1. General > Profile name > Users
2. General > Command > /bin/bash
3. Appearance > Color Scheme & Background > Monokai-Flat
4. Keyboard > Linux console


# Configuration de Firefox
Le fichier **places.sqlite** dans **$HOME/.mozilla/firefox/%.default** contient les favoris et l'historique.

Liste des modules intéressant :

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


# Configuration de Latte Dock
Liste des widgets :

 - Application Menu
 - Pager
 - Justify Splitter
 - Latte plasmoid
 - Justify Splitter
 - System Tray
 - Digital Clock
 - Lock/Logout

> Vous devez télécharger et ajouter manuellement le widget "redshift"


Pour restaurer la configuration de plasma (panneau) :

 1. `kquitapp plasmashell`
 2. `sleep 10s`
 3. `cp <plasma_files_backup> $HOME/.config/.`
 4. `plasmashell &`


# WMware tips
[Répertoire partagé](https://en.opensuse.org/SDB:VMware_Tools) :

- Lister les répertoires partagés : `vmware-hgfsclient`
- Monter un répertoire partagé : `vmhgfs-fuse -o allow_other .host: /mnt/`
- Démonter un répertoire partagé : `fusermount -uz /mnt/`or `umount -f /mnt/`


# VirtualBox tips

Installation de VBoxGuestAdditions :

 1. inserez le fichier VBoxGuestAdditions*.iso dans le cdrom de la machine virtuel
 2. `sudo mkdir -p /media/cdrom`
 3. `sudo mount -t iso9660 /dev/cdrom /media/cdrom`
 4. `cd /media/cdrom`
 5. `sudo ./VBoxLinuxAdditions.run`

Installation du package VirtualBox :

 1. `sudo zypper in virtualbox-guest-tools virtualbox-guest-x11`




