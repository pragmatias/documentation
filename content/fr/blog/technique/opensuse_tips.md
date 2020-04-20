---
Categories : ["Linux","OpenSuse","Astuces"]
Tags : ["Linux","OpenSuse","Astuces"]
title : "Astuces pour OpenSUSE (Tumbleweed)"
date : 2020-04-20
draft : false
toc: true
---

Vous trouverez dans cet article, quelques astuces concernant l'utilisation de la distribution [OpenSUSE Tumbleweed](https://www.opensuse.org/#Tumbleweed).

Les astuces portent sur :

- [Zypper](https://en.opensuse.org/Portal:Zypper) : Gestionnaire de paquet en ligne de commande
- [KDE](https://en.wikipedia.org/wiki/KDE) : Environnement de bureau Linux
- [Btrfs](https://en.wikipedia.org/wiki/Btrfs) : Système de fichier par défaut sur OpenSUSE
- [NFS](https://en.wikipedia.org/wiki/Network_File_System) : Système de fichier distribué
- [VirtualBox](https://en.wikipedia.org/wiki/VirtualBox) : Logiciel de virtualisation
- ...

 <!--more-->

# Quelques astuces concernant le système OpenSUSE

## Zypper

 1. Installation d'un package : ` sudo zypper in --no-recommend package`
 2. Suppression d'un package : ` sudo zypper rm --clean-deps package`
 3. Mise à jour des dépôts : `sudo zypper ref` ou `sudo zypper ref -f`
 4. Mise à jour des packages : `sudo zypper up`
 5. Mise à niveau de la distribution : `sudo zypper dup`
 6. Recherche d'un package : `sudo zypper se package` ou `sudo zypper se -is package`
 7. Verouillage d'un package : `sudo zypper al package`

> Note: remplacez **package** par le nom du package

Quelques liens utiles :

- [Zypper Cheat Sheet 1](https://en.opensuse.org/images/1/17/Zypper-cheat-sheet-1.pdf)
- [Zypper Cheat Sheet 2](https://en.opensuse.org/images/3/30/Zypper-cheat-sheet-2.pdf)

Message :
```
Removal of ***********(@System) failed :
Error: Subprocess failed. Error: RPM failed: error: package ********** is not installed
```
Il faut reconstruire la base RPM : `sudo rpm --rebuilddb`


## Système de fichier btrfs

- Si **btrfs-cleaner** utilise 100% du CPU and bloque votre pc, vous pouvez l'arrêter avec la commande : `sudo btrfs quota disable /`
- Pour desactiver le service de maintenance btrfs (si vous n'utilisez pas le système de fichier) : `systemctl disable btrfsmaintenance-refresh`

## Service chrony

Pour desactiver le démarrage du service chrony : `systemctl disable chrony-wait`

## Gestion des mises à jour manuellement

Pour supprimer PackageKit : `sudo zypper rm PackageKit* && sudo zypper al PackageKit*`

## Service son (Pulseaudio)

Pour redémarrer pulseaudio, vous pouvez utiliser : `pulseaudio -k`

## Service réseau 

Pour redémarrer le service réseau, vous pouvez utiliser :` sudo rcnetwork restart network_interface`

> Note: remplacer **network_interface** par votre nom d'interface. (vous pouvez utiliser `ifconfig` pour la connaitre)

## Configuration du fichier /etc/fstab (avec un disque ntfs)

Pour chaque disque :

 1. Création du répertoire suivant : `mkdir /mnt/<name>`
 2. Modification du propriétaire du répertoire : `chown anybody:wheel /mnt/<name>` 
 3. Modification du fichier fstab `sudo vi /etc/fstab` avec la ligne suivante : `/dev/<drive>          /mnt/<name>          ntfs     rw,nosuid,nodev,relatime   0  0` 

Quelques commandes utiles concernant les disques :
 - Pour lister les partitions : `sudo fdisk -l`
 - Pour lister les blocs : ` lsblk`
 - Pour lister les uuid : `sudo blkid`


## Configuration du client NFS

- Rechercher les répertoires partagés sur le serveur NFS : ` showmount -e <ip>`
- Monter le répertoire partagé sur le serveur NFS (manuellement) : `sudo mount -t nfs <ip>:<repnfs> <replocal>`
- Monter le répertoire partagé à partir du server NFS (automatiquement) en modifiant le fichier fstab : `sudo vi /etc/fstab` et en ajoutant la ligne `<ip>:<repnfs> <replocal> nfs rw,noauto,_netdev 0 0`
- Monter les répertoires connus dans le fichier fstab (rechargement) : `mount -a`

> - **ip** : adresse du serveur NFS
> - **repnfs** : chemin/repertoire sur le serveur NFS
> - **replocal** : chemin/repertoire sur le client NFS

## Supprimer l'écran de démarrage (plymouth)
- Suppression et verouillage des paquets **plymouth** : `sudo zypper rm plymouth* && sudo zypper al plymouth*`

## Information sur systemd
- Information concernant la durée du démarrage des services : `systemd-analyze blame`

## Modification de la configuration de la souris

- Rechercher la liste des périphériques : `xinput list`
- Récupération de la configuration d'un périphérique : `xinput list-props <number>`
- Modification d'une propriété d'un périphérique : `xinput set-prop <number> <prop> <values>`
- Exemple pour ajuster la vitesse de la souris : `xinput set-prop 8 157 0.500000, 0.000000, 0.000000, 0.000000, 0.500000, 0.000000, 0.000000, 0.000000, 1.000000`

> - **number** : Numero du périphérique
> - **prop** : Numero ou nom  de la propriété
> - **values** : Nouvelles valeurs

# Astuces concernant le bureau KDE

## Configuration des raccourcis pour changer de bureau (Quick tile Window)

1\. Allez dans System Settings > Shortcuts > Global Shortcuts > System Settings or Kwin

| Action | Global |
|:--|:--|
| Quick Tile Window to the Bottom | Meta+Num+2 |
| Quick Tile Window to the Bottom Left | Meta+Num+1 |
| Quick Tile Window to the Bottom Right | Meta+Num+3 |
| Quick Tile Window to the Left | Meta+Num+4 |
| Quick Tile Window to the Right | Meta+Num+6 |
| Quick Tile Window to the Top | Meta+Num+8 |
| Quick Tile Window to the Top Left | Meta+Num+7 |
| Quick Tile Window to the Top Right | Meta+Num+9 |
| Switch One Desktop Down | Meta+Down |
| Switch One Desktop to the Left | Meta+Left |
| Switch One Desktop to the Right | Meta+Right |
| Switch One Desktop Up | Meta+Up |
| Full screen Window | Meta+f |

2\. Clique droit sur le papier peint du bureau > Configure Desktop > Mouse Actions > Remove action "Switch Desktop" for "Vertical-Scroll"


## Autostart (KDE)

- En ligne de commande : Copiez le fichier **org.kde.\*.desktop** dans le répertoire `~/.config/autostart`

> Vous pouvez les trouver dans le répertoire `/usr/share/applications`

- Par interface graphique : Allez dans System Settings > Startup et Shutdown > Autostart

## Redémarrer la session KDE

- Commande pour redémarrer la session courante de KDE (Tue tous les process et déconnecte l'utilisateur) : `pkill -kill -u username`

> Note : remplacer **username** par le nom de l'utilisateur choisi


# Quelques astuces concernant les logiciels

## Konsole configuration

Dans Settings > Edit Current Profile

1. General > Profile name > Users
2. General > Command > /bin/bash
3. Appearance > Color Scheme & Background > Monokai-Flat
4. Keyboard > Linux console


## Configuration de Firefox
Le fichier **places.sqlite** dans **$HOME/.mozilla/firefox/%.default** contient les favoris et l'historique.

Liste des modules intéressant :

 - Ublock Origin
 - HTTPS Everywhere
 - Canvasblocker
 - Cookie autodelete
 - Css exfil protection
 - DecentralEyes
 - Firefox Containers
 - Redirector
 - Select context search
 - Awesome RSS
 - Privacy Badger
 - No Coin


## Configuration de Latte Dock

Liste des widgets intéressant :

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


## Erreur lors de l'installation de Polybar

Si vous ne pouvez pas installer **Polybar** (erreur avec **libjsoncpp.so.19**), vous pouvez essayer les étapes suivantes :

 1. Installez la librairie **libjsoncpp21**  : `sudo zypper in libjsoncpp21`
 2. Cherchez l'emplacement du fichier **libjsoncpp.so.21** : `sudo find / -name "libjsoncpp.so.21"`
 3. Copiez le fichier **libjsoncpp.so.21** avec le nom **libjsoncpp.so.19** : `sudo cp /usr/lib64/libjsoncpp.so.21 /usr/lib64/libjsoncpp.so.19`
 4. Installez **Polybar** : `sudo zypper in polybar`


# Astuces concernant les outils de virtualisation

## WMware
[Répertoire partagé](https://en.opensuse.org/SDB:VMware_Tools) :

- Lister les répertoires partagés : `vmware-hgfsclient`
- Monter un répertoire partagé : `vmhgfs-fuse -o allow_other .host: /mnt/`
- Démonter un répertoire partagé : `fusermount -uz /mnt/`or `umount -f /mnt/`


## VirtualBox

Installation de VBoxGuestAdditions :

 1. insérez le fichier VBoxGuestAdditions*.iso dans le cdrom de la machine virtuel
 2. `sudo mkdir -p /media/cdrom`
 3. `sudo mount -t iso9660 /dev/cdrom /media/cdrom`
 4. `cd /media/cdrom`
 5. `sudo ./VBoxLinuxAdditions.run`

Installation du package VirtualBox sur OpenSUSE :

 1. `sudo zypper in virtualbox-guest-tools virtualbox-guest-x11`

Nettoyage de l'image disque **vdi** :

 1. `vboxmanage modifymedium disk "./opensuse.vdi" --compact`



