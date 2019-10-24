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

- Le NAS Synology est accessible à partir de l'adresse IP **192.168.51.54**
- L'application Nextcloud est en version **17.0**
- L'application Nextcloud doit pouvoir être accessible à partir de l'exterieur en utilisant le sous domaine **nextcloud.alpha.osf**
- L'adresse IP fournis par le FAI n'est pas fixe, par conséquent le NAS Synology doit être configuré pour lier l'adresse **ncalpha.synology.me** à l'adresse IP publique.
- Le compte administrateur du NAS Synology est **NasUsr**


# Applications nécessaire sur le NAS Synology

Sur le NAS Synology, il est nécessaire d'installer les applications suivantes en passant par le **centre de paquets** :

- **PHP 7.2** : Langage de programmation
- **MariaDB 10** : Base de données relationnel
- **phpMyAdmin** : Interface d'administration pour MariaDB
- **Apache HTTP Server 2.4** : Serveur web
- **Web Station** : Application pour administrer le serveur web



# Activation de l'acces SSH sur le NAS Synology

L'accès [SSH](https://en.wikipedia.org/wiki/Secure_Shell) va permettre d'installer l'application Nextcloud en ligne de commande.

Pour activer l'accès, il faut suivre les étapes suivantes :

1. Allez dans **Panneau de configuration**
2. Cliquez sur **Terminal & SNMP**
3. Cliquez sur **Terminal**
4. Cochez l'option **Activer le service SSH**

[![Activation SSH](/blog/web/20191020_nextcloud_activation_ssh.png)](/blog/web/20191020_nextcloud_activation_ssh.png) 


# Connexion au NAS Synology par SSH

Récupérez l'application [Putty](https://www.putty.org/) et suivez les étapes suivantes :

1. Exécuter l'application [Putty](https://www.putty.org/)
2. Renseignez le **Host Name** avec l'adresse du NAS : `192.168.51.54`
3. Renseignez le **Port** avec le port défini sur le NAS : `22`
4. Cliquez sur le bouton **Open** pour vous connecter
5. Entrez le nom du user du NAS et son mot de passe : `NasUsr`

[![Connexion SSH](/blog/web/20191020_nextcloud_connexion_ssh.png)](/blog/web/20191020_nextcloud_connexion_ssh.png) 

# Installation de l'application Nextcloud

Une fois connecté en SSH sur le NAS, suivez les étapes suivantes :

1. Passez en mode admin : `sudo -i` et entrez le mot de passe du user **NasUsr**
2. Creer le dossier **web** : `mkdir -p /volume1/web`
2. Creer le dossier **nextcloud** pour le stockage des données : `mkdir -p /volume1/nextcloud`
3. Déplacez-vous dans le répertoire **web** : `cd /volume1/web`
4. Téléchargez l'application **Nextcloud** sur le [site officielle](https://nextcloud.com/install/#) : `wget https://download.nextcloud.com/server/releases/nextcloud-17.0.0.zip`
5. Décompressez l'archive de l'application **Nextcloud** : `7z x nextcloud-17.0.0.zip`
6. Vérifiez que le répertoire **web/nextcloud** existe : `/volume1/web/nextcloud`
7. Renseignez l'utilisateur **http** en tant que propriétaire des répertoires créés 
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
9. Modifiez le fichier de configuration de l'application **Nextcloud** concernant les deux paramètres suivants : `/volume1/web/nextcloud/config/config.php`
```bash
'trusted_domains' =>
	array (
		0 => '192.168.51.54'
		1 => 'nextcloud.alpha.osf'
	),
'overwrite.cli.url' => 'https://nextcloud.alpha.osf'
```


# Configuration de l'application Web Station

Configurez l'application Web Station en suivant les étapes suivantes :

1. Ouvrir le **Centre des paquets**
2. Selectionnez l'option **Installé**
3. Selectionnez l'option **Open** pour l'application Web Station
4. Selectionnez l'onglet **Paramètres généraux** et renseignez les éléments suivants :
	- Serveur pincipal HTTP : `Apache HTTP Server 2.4`
	- PHP : `Default Profile ( PHP 7.2 )`

[![Web Station Step 1](/blog/web/20191020_nextcloud_webstation_step1.png)](/blog/web/20191020_nextcloud_webstation_step1.png) 

5. Sélectionnez l'onglet **Paramètre PHP** et cliquez sur le bouton **Créer**
6. Sélectionnez l'onglet **Paramètres généraux** et renseignez les éléments suivants :
	- Nom du profil : `Default Profile`
	- Description : `Default PHP 7.2 Profile`
	- Version PHP : `PHP 7.2`
	- Cochez la case `Activer le cache PHP`
	- Cochez la case `Personnaliser PHP open_basedir` et renseignez la valeur suivante `/tmp:/var/services/tmp:/var/services/web:/var/services/homes:/volume1/nextcloud`
	- Selectionnez les extensions souhaitées
	- Cliquez sur le bouton **OK**

[![Web Station Step 2](/blog/web/20191020_nextcloud_webstation_step2.png)](/blog/web/20191020_nextcloud_webstation_step2.png) 

7. Sélectionnez l'onglet **Virtual Host**, cliquez sur le bouton **Créer** et renseignez les éléments suivants :
	- Cliquez sur l'option `Basé sur le nom`
	- Nom d'hote : `ncalpha.synology.me`
	- Port : `HTTPS 444`
	- Racine du document : `web/nextcloud`
	- Serveur principal HTTP: `Apache HTTP Server 2.4`
	- PHP : `Default Profile (PHP 7.2)`
	- Cliquez sur le bouton **OK**

[![Web Station Step 3](/blog/web/20191020_nextcloud_webstation_step3.png)](/blog/web/20191020_nextcloud_webstation_step3.png) 

# Configuration de MariaDB :

Configurez la base de données MariaDB en suivant les étapes suivantes :

1. Ouvrir le **Centre des paquets**
2. Selectionnez l'option **Installé**
3. Selectionnez l'option **Open** pour l'application MariaDB
4. Cliquez sur le bouton **Réinitialisez la base de données**
5. Cliquez sur le bouton **Réinitialiser le mot de passe root** *(PasswordRootMariaDB)*
6. Renseignez le port `3307`


[![MariaDB](/blog/web/20191020_nextcloud_mariaDB10_reinitialisation.png)](/blog/web/20191020_nextcloud_mariaDB10_reinitialisation.png) 


# Initialisation de Nextcloud

1. Connectez vous à la page d'accueil en passant par le réseau local : `http://192.168.51.54/nextcloud/index.php`
2. Renseignez les informations suivantes :
	- Repertoire des donnees : `/volume1/nextcloud/data`
	- Configurer la base de données : `mysql/MariaDB`
	- User : `root`
	- Password : `PasswordRootMariaDB`
	- Base de données : `nextcloud`
	- Adresse : `127.0.0.1:3307`


# Lier l'adresse publique du NAS sur l'url souhaité


Configurez le DDNS sur le NAS Synology en suivant les étapes suivantes :

1. Ouvrir le **Panneau de configuration**
2. Selectionnez le menu **Accès externe**
3. Selectionnez l'option **DDNS**
4. Cliquez sur le bouton **Ajouter**
5. Cochez l'option **Activer la prise en charge DDNS** et renseignez les informations suivantes :
	- Fournisseur de service : `Synology`
	- Nom d'hôte : `ncalpha.synology.me`
	- Heartbeat : `Activer`
	- Cliquez sur le bouton **OK**

[![DDNS](/blog/web/20191020_nextcloud_ddns_synology.png)](/blog/web/20191020_nextcloud_ddns_synology.png) 


Configurez votre domaine "alpha.osf" pour utiliser le domaine "synology.me" :

1. Ajoutez la ligne suivante dans l'enregistrement DNS du domaine `alpha.osf` :
	-  `nc 10800 IN CNAME ncalpha.synology.me.`

*Note : cela peut mettre plusieurs heures avant prise en compte des modifications des enregistrements DNS*


# Configuration du certificat (https)

Configurez un certificat **Let's Encrypt** sur le NAS Synology en suivant les étapes suivantes :

1. Ouvrir le **Panneau de configuration**
2. Selectionnez le menu **Sécurité**
3. Selectionnez l'option **Certificat**
4. Cliquez sur le bouton **Ajouter**
5. Cliquez sur **Ajouter un certificat** et cliquez sur le bouton **Suivant**
6. Selectionnez l'option **Procurez vous un certificat auprès de Let's Encrypt**
7. Renseigner le champ **Description** : `nextcloud.alpha.osf`
8. Cochez la case **Configurer comme certificat par défaut**
9. Renseignez les informations suivantes et cliquez sur le bouton **Appliquer** :
	- Nom de domaine: `nextcloud.alpha.osf`
	- Courrier électronique : `admin@alpha.osf`
10. Cliquez sur le bouton **Configurer** et associer le certificat `nextcloud.alpha.osf`sur les services nécessaires.













