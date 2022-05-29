---
Categories : ["Nextcloud","Cloud"]
Tags : ["Nextcloud","Cloud"]
title : "Installing Nextcloud on a Synology NAS"
date : 2019-10-20
draft : false
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

On the Synology NAS, it's required to install the following applications by using the **Package Center** :

- **PHP 7.2** : Programming language
- **MariaDB 10** : Relational database
- **phpMyAdmin** : Administration interface for MariaDB
- **Apache HTTP Server 2.4** : Web server
- **Web Station** : Application to administer the web server



# Enabling SSH access on the Synology NAS

The [SSH](https://en.wikipedia.org/wiki/Secure_Shell) access will allow to install the Nextcloud application from the command line.

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
7. Change the user **http** as the owner of the created directories : 
```bash
chown -R http:http /volume1/web/nextcloud/
chown -R http:http /volume1/nextcloud/
chown http:http /volume1/web/nextcloud/.htaccess
```
8. Change the permissions of directories and files :
```bash
find /volume1/web/nextcloud/ -type f -print0 | xargs -0 chmod 777
find /volume1/web/nextcloud/ -type d -print0 | xargs -0 chmod 777
find /volume1/nextcloud/ -type d -print0 | xargs -0 chmod 777
chmod 777 /volume1/web/nextcloud/.htaccess
```
9. Modify the application configuration file **Nextcloud** regarding the following two parameters : `/volume1/web/nextcloud/config/config.php`
```bash
'trusted_domains' =>
	array (
		0 => '192.168.51.54'
		1 => 'nextcloud.alpha.osf'
	),
'overwrite.cli.url' => 'https://nextcloud.alpha.osf'
```


# Configuring the Web Station application

Configure the Web Station application by following these steps :

1. Open the **Package Center**
2. Select **Installed**
3. Select **Open** on Web Station application
4. Select the tab **General Settings** and fill in the following information :
	- HTTP back-end server : `Apache HTTP Server 2.4`
	- PHP : `Default Profile ( PHP 7.2 )`

[![Web Station Step 1](/blog/web/20191020_nextcloud_webstation_step1.png)](/blog/web/20191020_nextcloud_webstation_step1.png) 

5. Select the tab **PHP Settings** and click on the button **Create**
6. Select the tab **General Settings** and fill in the following information :
	- Profile Name : `Default Profile`
	- Description : `Default PHP 7.2 Profile`
	- PHP Version : `PHP 7.2`
	- Check the box `Enable PHP cache`
	- Check the box `Customize PHP open_basedir` and fill in the following value `/tmp:/var/services/tmp:/var/services/web:/var/services/homes:/volume1/nextcloud`
	- Select the desired extensions
	- Click on the button **OK**

[![Web Station Step 2](/blog/web/20191020_nextcloud_webstation_step2.png)](/blog/web/20191020_nextcloud_webstation_step2.png) 

7. Select the tab **Virtual Host**, click on the button **Create** and fill in the following elements :
	- click on the button `Name-based`
	- Hostname : `ncalpha.synology.me`
	- Port : `HTTPS 444`
	- Document root : `web/nextcloud`
	- HTTP back-end server: `Apache HTTP Server 2.4`
	- PHP : `Default Profile (PHP 7.2)`
	- Click on the button **OK**

[![Web Station Step 3](/blog/web/20191020_nextcloud_webstation_step3.png)](/blog/web/20191020_nextcloud_webstation_step3.png) 

# MariaDB configuration

Configure the MariaDB database by following these steps :

1. Open the **Package Center**
2. Select **Installed**
3. Select **Open** on the MariaDB application
4. Click on the button **Reset Database**
5. Click on the button **Reset root password** *(PasswordRootMariaDB)*
6. Fill in the port `3307`


[![MariaDB](/blog/web/20191020_nextcloud_mariaDB10_reinitialisation.png)](/blog/web/20191020_nextcloud_mariaDB10_reinitialisation.png) 


# Nextcloud application initialization

1. Connect to the home page via the local network : `http://192.168.51.54/nextcloud/index.php`
2. Fill in the following information :
	- Data folder : `/volume1/nextcloud/data`
	- Configure the database : `mysql/MariaDB`
	- Database User : `root`
	- Database Password : `PasswordRootMariaDB`
	- Database Name : `nextcloud`
	- Localhost : `127.0.0.1:3307`


# Link the public address of the NAS on a domain (dns)

Configure the DDNS on the Synology NAS by following these steps :

1. Open the **Control Panel**
2. Select the menu **External Access**
3. Select the tab **DDNS**
4. Click on the button **Add**
5. Check the box **Enable DDNS support** and fill in the following information :
	- Service provider : `Synology`
	- Hostname : `ncalpha.synology.me`
	- Heartbeat : `Activer`
	- Click on the button **OK**

[![DDNS](/blog/web/20191020_nextcloud_ddns_synology.png)](/blog/web/20191020_nextcloud_ddns_synology.png) 


Configure your **alpha.osf** domain to use the **synology.me** domain :

1. Add the following line to the **alpha.osf** domain's DNS record :
	-  `nc 10800 IN CNAME ncalpha.synology.me.`

*Note: it can take several hours for DNS records to be propagated*


# Certificate configuration (https)

Configure a **Let's Encrypt** certificate on the Synology NAS by following these steps :

1. Open the **Control Panel**
2. Select the menu **Security**
3. Select the tab **Certificate**
4. Click on the button **Add**
5. Click on **Add a new certificate** and click on the button **Next**
6. Select **Get a certificate from Let's Encrypt**
7. Fill in **Description** : `nextcloud.alpha.osf`
8. Check the box **Set as default certificate**
9. Fill in the following information and click on the button **Apply** :
	- Domain name : `nextcloud.alpha.osf`
	- Email : `admin@alpha.osf`
10. Click on the button **Configure** and associate the `nextcloud.alpha.osf` certificate with the desired services.
11. Click on the button **OK**













