---
Categories : ["Nextcloud","Cloud"]
Tags : ["Nextcloud","Cloud"]
title : "Installing Nextcloud on a Synology NAS"
date : 2019-10-20
draft : true
toc: true
---

In this article, you will find all the elements/steps to install [Nextcloud](https://nextcloud.com) application on a [Synology NAS](https://www.synology.com/en-global/products/DS218+).

<!--more-->

# What's Nextcloud

[Nextcloud](https://en.wikipedia.org/wiki/Nextcloud) is a open source software offering a platform for file storage and sharing services as well as online applications.

# Objective

In the context of this installation, the following information should be taken into account:

- The Synology NAS is accessible from the IP **192.168.51.54**
- The Nextcloud application is in version **17.0**
- The Nextcloud application must be accessible from the outside using the subdomain **nextcloud.alpha.osf**
- The IP provided by the ISP is changed regularly, the Synology NAS must be configured to link the **ncalpha.synology.me** address to the public IP.
- The administrator account of the Synology NAS is **NasUsr**


# Applications required on the Synology NAS

On the Synology NAS, it's required to install the following applications by using the **centre de paquets** :

- **PHP 7.2** : Programming language
- **MariaDB 10** : Relational database
- **phpMyAdmin** : Administration interface for MariaDB
- **Apache HTTP Server 2.4** : Web server
- **Web Station** : Application to administer the web server



# Enabling SSH access on the Synology NAS

The [SSH](https://en.wikipedia.org/wiki/Secure_Shell) access  will allow to install the Nextcloud application from the command line.

To activate SSH access, the following steps must be followed :

1. Go to **Control Panel**
2. Click on **Terminal & SNMP**
3. Click on **Terminal**
4. Check the option **Enable SSH service**

[![Activation SSH](/blog/web/20191020_nextcloud_activation_ssh.png)](/blog/web/20191020_nextcloud_activation_ssh.png) 


# Connexion au NAS Synology par SSH

Récupérez l'application [Putty](https://www.putty.org/) et suivez les étapes suivantes :

1. Run [Putty](https://www.putty.org/)
2. Fill **Host Name** with the NAS IP : `192.168.51.54`
3. Fill **Port** with the port defined on the NAS : `22`
4. Click on the button **Open** to connect on the NAS
5. Enter the NAS user name and password : `NasUsr`

[![Connexion SSH](/blog/web/20191020_nextcloud_connexion_ssh.png)](/blog/web/20191020_nextcloud_connexion_ssh.png) 

# Installing the Nextcloud application

Once connected in SSH on the NAS, follow these steps  :

1. Switch to admin mode : `sudo -i` and enter the user password **NasUsr**
2. Create the folder **web** : `mkdir -p /volume1/web`
2. Create the folder **nextcloud** for data storage : `mkdir -p /volume1/nextcloud`
3. Move to the directory **web** : `cd /volume1/web`
4. Download the **Nextcloud** application on the [official website](https://nextcloud.com/install/#) : `wget https://download.nextcloud.com/server/releases/nextcloud-17.0.0.zip`
5. Unzip the **Nextcloud** application archive : `7z x nextcloud-17.0.0.zip`
6. Check that the directory **web/nextcloud** exist : `/volume1/web/nextcloud`
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













