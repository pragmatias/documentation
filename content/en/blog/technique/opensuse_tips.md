---
Categories : ["Linux","OpenSuse","Tips"]
Tags : ["Linux","OpenSuse","Tips"]
title : "Tips for OpenSUSE (Tumbleweed)"
date : 2019-05-01
draft : false
toc: true
---

You'll find in this article, somes tips about the [OpenSUSE Tumbleweed](https://www.opensuse.org/#Tumbleweed) distribution.

The tips cover :

- [Zypper](https://en.opensuse.org/Portal:Zypper) : Command line package management
- [KDE](https://en.wikipedia.org/wiki/KDE) : Desktop environment
- [Btrfs](https://en.wikipedia.org/wiki/Btrfs) : OpenSuse default file system
- [NFS](https://en.wikipedia.org/wiki/Network_File_System) : Network file system
- [VirtualBox](https://en.wikipedia.org/wiki/VirtualBox) : Virtualization software
- ...

 <!--more-->

# Tips about OpenSuse system

## Zypper

 1. Install a package : ` sudo zypper in --no-recommend package`
 2. Remove a package : ` sudo zypper rm --clean-deps package`
 3. Refresh repositories : `sudo zypper ref` or `sudo zypper ref -f`
 4. Update packages : `sudo zypper up`
 5. Upgrade Distribution : `sudo zypper dup`
 6. Search packages : `sudo zypper se package` or `sudo zypper se -is package`
 7. Lock packages : `sudo zypper al package`

> Note: replace **package** by the package name

Some usefull links :

- [Zypper Cheat Sheet 1](https://en.opensuse.org/images/1/17/Zypper-cheat-sheet-1.pdf)
- [Zypper Cheat Sheet 2](https://en.opensuse.org/images/3/30/Zypper-cheat-sheet-2.pdf)

Message :
```
Removal of ***********(@System) failed :
Error: Subprocess failed. Error: RPM failed: error: package ********** is not installed
```
You have to rebuild the RPM database : `sudo rpm --rebuilddb`

## File system btrfs

- If **btrfs-cleaner** use 100% of your CPU and freeze your computer, you can stop it with the command : `sudo btrfs quota disable /`
- To disable the btrfs service (if you don't use the filesystem) : `systemctl disable btrfsmaintenance-refresh`

## Service chrony

To disable chrony service startup : `systemctl disable chrony-wait`

## Manage update manually (remove PackageKit)

To remove PackageKit : `sudo zypper rm PackageKit* && sudo zypper al PackageKit*`

## Sound service (Pulseaudio)

To restart pulseaudio, use : `pulseaudio -k`

## Network service 

To restart network service use :` sudo rcnetwork restart network_interface`

> Note: replace **network_interface** by your interface name (used `ifconfig`)

## Configuration of the file fstab (with ntfs drive)

For each drive :

 1. Create the following folder : `mkdir /mnt/<name>`
 2. change the folder owner : `chown anybody:wheel /mnt/<name>` 
 3. update the fstab file `sudo vi /etc/fstab` with the following line : `/dev/<drive>          /mnt/<name>          ntfs     rw,nosuid,nodev,relatime   0  0` 

Some usefull command :
 - list partitions : `sudo fdisk -l`
 - list block devices : ` lsblk`
 - list uuid : `sudo blkid`


## Configuration of the NFS client

 - Discover the shared volumes on the NFS server : ` showmount -e <ip>`
 - Mount a shared volume from the NFS server (manually) : `sudo mount -t nfs <ip>:<repnfs> <replocal>`
 - Mount a shared volume from the NFS server (automatically) : `sudo vi /etc/fstab` and add the line `<ip>:<repnfs> <replocal> nfs rw,noauto,_netdev 0 0`
 - Mount all the fstab (reload) : `mount -a`

> - **ip** of the NFS server
> - **repnfs** : path/folder on the NFS server
> - **replocal** : path/folder on the NFS client

## Delete the boot screen (plymouth)
- Remove and lock the package **plymouth** : `sudo zypper rm plymouth* && sudo zypper al plymouth*`

## Systemd information
- Information on the duration of the start of services : `systemd-analyze blame`

# Some tips about the KDE desktop

## Configure Bind to Switch Desktop and Quick tile Window

1\. Go to System Settings > Shortcuts > Global Shortcuts > System Settings or Kwin

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

2\. Right Click on the desktop wallpaper > Configure Desktop > Mouse Actions > Remove action "Switch Desktop" for "Vertical-Scroll"


## Autostart (KDE)

- With command line : Copy a file **org.kde.\*.desktop** in the folder **~/.config/autostart**

> You could find them in the folder `/usr/share/applications`

- With GUI : Go in System Settings > Startup and Shutdown > Autostart

## Reset KDE Session

- Reset the current KDE session (kill all process & logout) : `pkill -kill -u username`

> Note : replace **username** by the name of the choosen one


# Some tips about software

## Konsole config

In Settings > Edit Current Profile

1. General > Profile name > Users
2. General > Command > /bin/bash
3. Appearance > Color Scheme & Background > Monokai-Flat
4. Keyboard > Linux console


## Firefox configuration
The file **places.sqlite** in **$HOME/.mozilla/firefox/%.default** contains bookmarks and history.

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


## Latte Dock configuration

List of interesting widgets :

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


## Polybar install error

If you can't install **Polybar** with Zypper (**libjsoncpp.so.19** error), you can try the following step :
 1. Install **libjsoncpp21**  : `sudo zypper in libjsoncpp21`
 2. Find where is the file **libjsoncpp.so.21** : `sudo find / -name "libjsoncpp.so.21"`
 3. Copy the file **libjsoncpp.so.21** with the name **libjsoncpp.so.19** : `sudo cp /usr/lib64/libjsoncpp.so.21 /usr/lib64/libjsoncpp.so.19`
 4. Install **Polybar** : `sudo zypper in polybar`

# Some tips about virtualization

## WMware
[Shared Folder](https://en.opensuse.org/SDB:VMware_Tools) :

- Listing of shared folder : `vmware-hgfsclient`
- Mount a shared folder : `vmhgfs-fuse -o allow_other .host: /mnt/`
- Unmount a shared folder : `fusermount -uz /mnt/`or `umount -f /mnt/`


## VirtualBox

Install VBoxGuestAdditions :

 1. insert file VBoxGuestAdditions*.iso in the cdrom
 2. `sudo mkdir -p /media/cdrom`
 3. `sudo mount -t iso9660 /dev/cdrom /media/cdrom`
 4. `cd /media/cdrom`
 5. `sudo ./VBoxLinuxAdditions.run`

Install VirtualBox package :

 1. `sudo zypper in virtualbox-guest-tools virtualbox-guest-x11`




