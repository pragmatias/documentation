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

[Nextcloud](https://fr.wikipedia.org/wiki/Nextcloud) est un logiciel (libre) offrant une plateforme de services de stockage et partage de fichiers et d'applications en ligne.

# Objectif

Installation de Nextcloud sur un NAS Synology dont l'ip interne est "192.168.51.54" et le rendre accessible depuis internet par le domaine "alpha.com" et plus spécifiquement par le sous domaine "nextcloud.alpha.com".

Le compte administrateur du NAS se nomme "NasUser".


# Installation des applications nécessaire sur le NAS

Sur le NAS Synology, il est nécessaire d'installation les applications suivantes (en utilisant le "centre de paquets" ) :

- PHP 7.2 : Langage de programmation
- MariaDB 10 : Base de données relationnel
- phpMyAdmin : Interface d'administration pour MariaDB
- Apache HTTP Server 2.4 : Serveur web
- Web Station : Application pour administrer le serveur web



# Configuration de l'acces SSH sur le NAS

L'asccès SSH va nous permettre d'installer l'application Nextcloud en ligne de commande.
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
5. Entrez le nom du user du NAS et son mot de passe : `NasUser`


# Installation de Nextcloud sur le NAS

Une fois connecté en SSH sur le NAS, suivez les étapes suivantes :

1. Passez en mode admin : `sudo -i` et entrez votre mot de passe
2. Creer le dossier web pour l'application : `mkdir -p /volume1/web`
2. Creer le dossier Nextcloud pour les données : `mkdir -p /volume1/nextcloud`
3. Déplacez vous dans le répertoire web : `cd /volume1/web`
4. Téléchargé l'application nextcloud sur le [site officielle](https://nextcloud.com/install/#) : `wget https://download.nextcloud.com/server/releases/nextcloud-17.0.0.zip`
5. Décompresser l'archive Nextcloud : `7z x nextcloud-17.0.0.zip`
6. Vérifier que vous avez bien un répertoire **nextcloud** dans le répertoire /volume1/web
7. Mettez le user "http" en tant que propriétaire des répertoires nécessaires 
```bash
chown -R http:http /volume1/web/nextcloud/
chown -R http:http /volume1/nextcloud/
chown http:http /volume1/web/nextcloud/.htaccess
```
8. Changer les droits des repertoires et des fichiers :
```bash
find /volume1/web/nextcloud/ -type f -print0 | xargs -0 chmod 777
find /volume1/web/nextcloud/ -type d -print0 | xargs -0 chmod 777
find /volume1/nextcloud/ -type d -print0 | xargs -0 chmod 777
chmod 777 /volume1/web/nextcloud/.htaccess
```



# Configuration de l'application Web Station


Pour configurer l'application Web Station, suivez les étapes suivantes :
	- Parametètres généraux
		- Apache HTTP Server 2.4
		- Default Profile ( PHP 7.2 )
	- Paramètre PHP : Default Profile / PHP 7.2 / Default PHP 7.2 Profile
		- Activer le cache PHP
		- Personnaliser PHP open_basdir : /tmp:/var/services/tmp:/var/services/web:/var/services/homes:/volume1/NextCloud
		- Extensions : tous?
	- Virtual Host
		- Virtual 1
			- Normal 
			- Nom d'hote : pragmatias.synology.me
			- Port : HTTPS 444
			- Racine du document : web/nextcloud
			- Serveur principal HTTP: Apache HTTP Server 2.4
			- PHP : Default Profile (PHP 7.2)
		- Virtual 2
			- Normal 
			- Nom d'hote : cloud.pragmatias.fr
			- Port : HTTPS 444
			- Racine du document : web/nextcloud
			- Serveur principal HTTP: Apache HTTP Server 2.4
			- PHP : Default Profile (PHP 7.2)



# Configuration de MariaDB :

Configuration de phpMyAdmin :
	- Réinitialiser la base de données / réinitialiser le mot de passe root
	- port : 3307



# Initialisation de Nextcloud

Allez sur l'écran d'accueil :
http://192.168.0.13/nextcloud/index.php

Repertoire des donnees
/volume1/NextCloud/data

Configurer la base de données : mysql/MariaDB

root
PasswordMariaDB
nextcloud
127.0.0.1:3307


# Configuration de l'acces à Nextcloud
Fichier config : /volume1/web/Nextcloud/config/config.php



# Rendre accessible votre cloud lorsque vous avez une adresse ip non fixe
Configuration DNS :
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










