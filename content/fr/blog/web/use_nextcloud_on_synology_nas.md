---
Categories : ["Nextcloud","Cloud"]
Tags : ["Nextcloud","Cloud"]
title : "Mise en place de Nextcloud sur un NAS Synology"
date : 2019-10-20
draft : true
toc: true
---

Vous trouverez dans cet article, l'ensemble des éléments/étapes pour mettre en place l'application [Nextcloud](https://nextcloud.com) sur un [NAS Synology](https://www.synology.com/fr-fr/products/DS218+).

<!--more-->

# Qu'est ce que Nextcloud

[Nextcloud](https://fr.wikipedia.org/wiki/Nextcloud) est un logiciel (libre) offrant une plateforme de services de stockage et partage de fichiers ainsi que des applications en ligne.

# Objectif

Dans le cadre de cette installation, les informations suivantes sont à prendre en compte :
- Le NAS Synology est accessible à partir de l'adresse IP `192.168.51.54`
- L'application Nextcloud est en version 17
- L'application Nextcloud doit pouvoir être accessible à partir de l'exterieur en utilisant le sous domaine `nextcloud.alpha.osf`
- L'adresse IP du FAI étant aléatoire, le NAS Synology doit être configuré pour lier l'adresse `nc_alpha.synology.me` à l'adresse IP publique.
- Le compte administrateur du NAS Synology est `NasUsr`


# Installation des applications nécessaire sur le NAS

Sur le NAS Synology, il est nécessaire d'installer les applications suivantes (en utilisant le "centre de paquets" ) :

- PHP 7.2 : Langage de programmation
- MariaDB 10 : Base de données relationnel
- phpMyAdmin : Interface d'administration pour MariaDB
- Apache HTTP Server 2.4 : Serveur web
- Web Station : Application pour administrer le serveur web



# Configuration de l'acces SSH sur le NAS

L'accès [SSH](https://en.wikipedia.org/wiki/Secure_Shell) va permettre d'installer l'application Nextcloud en ligne de commande.
Pour activer l'accès, il faut suivre les étapes suivantes :

1. Allez dans "Panneau de configuration"
2. Cliquez sur "Terminal & SNMP"
3. Cliquez sur "Terminal"
4. Cochez l'option "Activer le service SSH"


# Se connecter au NAS par SSH

Récupérez l'application [Putty](https://www.putty.org/) et suivez les étapes suivantes :

1. Exécuter l'application [Putty](https://www.putty.org/)
2. Remplir "Host Name" avec l'adresse du NAS : `192.168.51.54`
3. Remplir "Port" avec le port défini sur le NAS : `21`
4. Cliquez sur "Open" pour vous connecter
5. Entrez le nom du user du NAS et son mot de passe : `NasUsr`


# Installation de Nextcloud sur le NAS

Une fois connecté en SSH sur le NAS, suivez les étapes suivantes :

1. Passez en mode admin : `sudo -i` et entrez le mot de passe du user `NasUsr`
2. Creer le dossier web pour l'application : `mkdir -p /volume1/web`
2. Creer le dossier Nextcloud pour les données : `mkdir -p /volume1/nextcloud`
3. Déplacez vous dans le répertoire web : `cd /volume1/web`
4. Téléchargez l'application Nextcloud sur le [site officielle](https://nextcloud.com/install/#) : `wget https://download.nextcloud.com/server/releases/nextcloud-17.0.0.zip`
5. Décompressez l'archive Nextcloud : `7z x nextcloud-17.0.0.zip`
6. Vérifiez que le répertoire suivant existe bien : `/volume1/web/nextcloud`
7. Mettez l'utilisateur "http" en tant que propriétaire des répertoires nécessaires 
```bash
chown -R http:http /volume1/web/nextcloud/
chown -R http:http /volume1/nextcloud/
chown http:http /volume1/web/nextcloud/.htaccess
```
8. Changez les droits des répertoires et des fichiers :
```bash
find /volume1/web/nextcloud/ -type f -print0 | xargs -0 chmod 777
find /volume1/web/nextcloud/ -type d -print0 | xargs -0 chmod 777
find /volume1/nextcloud/ -type d -print0 | xargs -0 chmod 777
chmod 777 /volume1/web/nextcloud/.htaccess
```
9. Modifiez le fichier de configuration de Nextcloud : `/volume1/web/nextcloud/config/config.php`




# Configuration de l'application Web Station

Configurez l'application Web Station en suivant les étapes suivantes :

1. Ouvrir l'application Web Station
2. Selectionnez l'onglet "Paramètres généraux" et renseignez les éléments suivants :
	- Apache HTTP Server 2.4
	- Default Profile ( PHP 7.2 )
3. Sélectionnez l'onglet "Paramètre PHP" et renseignez les éléments suivants :
	- Default Profile / PHP 7.2 / Default PHP 7.2 Profile
3. Sélectionnez l'onglet "Paramètre PHP" et renseignez les éléments suivants :
	- Default Profile / PHP 7.2 / Default PHP 7.2 Profile
4. Dans l'onglet "Paramètre PHP", sélectionnez "configuration" et renseignez les éléments suivants :
	- Activer le cache PHP
	- Personnaliser PHP open_basdir : /tmp:/var/services/tmp:/var/services/web:/var/services/homes:/volume1/nextcloud
	- Extensions : Tous
5. Sélectionnez l'onglet "Virtual Host" et créez le host "Virtual 1" avec les informations suivantes :
	- Normal 
	- Nom d'hote : nc_alpha.synology.me
	- Port : HTTPS 444
	- Racine du document : web/nextcloud
	- Serveur principal HTTP: Apache HTTP Server 2.4
	- PHP : Default Profile (PHP 7.2)
6. Sélectionnez l'onglet "Virtual Host" et créez le host "Virtual 2" avec les informations suivantes :
	- Normal 
	- Nom d'hote : nextcloud.alpha.osf
	- Port : HTTPS 444
	- Racine du document : web/nextcloud
	- Serveur principal HTTP: Apache HTTP Server 2.4
	- PHP : Default Profile (PHP 7.2)


# Configuration de MariaDB :

Ouvrir l'application phpMyAdmin :

1. Réinitialisez la base de données
2. Réinitialisez le mot de passe root (PasswordRootMariaDB)
3. Renseignez le port `3307`


# Initialisation de Nextcloud

1. Connectez vous à la page d'accueil en passant par le réseau local : `http://192.168.0.13/nextcloud/index.php`
2. Renseignez les informations suivantes :
	- Repertoire des donnees : /volume1/nextcloud/data
	- Configurer la base de données : mysql/MariaDB
	- User : root
	- Password : PasswordRootMariaDB
	- Base de données : nextcloud
	- Adresse : 127.0.0.1:3307



# Lier l'adresse publique du NAS sur l'url souhaité


Configurez le DDNS sur le NAS Synology en suivant les étapes suivantes :

1. Panneau de 

Configuration DDNS sur l:
Prendre une adresse sur synology.me


Mettre le "subdomain.domain.com 10800 IN CNAME domain.synology.me."



# Configuration du certificat pour https

Cerficat : (Securité > Certificat)

Ajouter > ... > Procurez-vous un certificat auprès de Let's Encrypt
	- Description : ....
	- Nom de domaine : cloud.pragmatias.fr
	- Courier : ....
	- Autre nom de l'objet : .....
Ajouter > ... > Procurez-vous un certificat auprès de Let's Encrypt
	- Description : ....
	- Nom de domaine : pragmatias.synology.me
	- Courier : ....
	- Autre nom de l'objet : .....
Configurer > 
	- Services = certificat ...










