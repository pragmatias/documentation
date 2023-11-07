---
Categories : ["Nextcloud","Cloud","QNAP","Docker"]
Tags : ["Nextcloud","Cloud","QNAP","Docker"]
title : "Mise en place de l'application Nextcloud sur un NAS QNAP"
date : 2023-11-07
draft : false
toc: true
---

Vous trouverez dans cet article, l'ensemble des éléments pour mettre en place l'application [Nextcloud](https://nextcloud.com) sur un [NAS QNAP](https://www.qnap.com/en/product/series/home) en utilisant l'application [QNAP Container Station](https://www.qnap.com/en/software/container-station) et plus spécifiquement [Docker](https://www.docker.com/).

La mise en place est spécifique au NAS QNAP de la série [TS-x31P3 Series](https://www.qnap.com/static/landing/2020/fr-ts-x31p3-ts-x31k/index.html) qui a une contrainte limitant l'utilisation des images Docker de manière général et par conséquent bloquant l'utilisation de l'image [Nextcloud AIO](https://github.com/nextcloud/all-in-one).

 <!--more-->

# Qu'est ce qu'un NAS

Un [NAS (Network Attached Storage)](https://en.wikipedia.org/wiki/Network-attached_storage) est un serveur de stockage réseau qui permet de stocker, sauvegarder, partager, sécuriser et faciliter l'accès aux fichiers numériques (photos, vidéos, musiques, documents) et permet aussi d'exécuter des applications permettant d'enrichir les services accessibles (vpn, sftp, serveur web, ...).

# Qu'est ce que Nextcloud

[Nextcloud](https://fr.wikipedia.org/wiki/Nextcloud) est un logiciel (libre) offrant une plateforme de services de stockage et partage de fichiers ainsi que des applications en ligne.


# Objectif

L'objectif de cette démarche est de pouvoir avoir un cloud privée (basé sur Nextcloud) permettant à toute la famille de stocker, partager et gérer ces données tout en utilisant un ancien NAS QNAP déjà existant.

L'application Nextcloud doit être accessible en local en utilisant l'adresse HTTPS suivante : `https://110.110.110.151`

_Note : Pour rendre l'application Nextcloud accessible depuis internet, il faut ajouter une règle NAT sur votre routeur ou votre box internet permettant de rediriger le trafic des ports 80 et 443 vers l'adresse `110.110.110.151`_

## Contrainte spécifique au NAS QNAP

La contrainte spécifique liée au NAS QNAP de la série [TS-x31P3 Series](https://www.qnap.com/static/landing/2020/fr-ts-x31p3-ts-x31k/index.html) est la suivante :
- Ce NAS possède un processeur ARM v7 mais dont l'application QNAP Container Station a été modifiée pour implémenter un page size de 32k au lieu de celui [par défaut](https://wiki.osdev.org/ARM_Paging).

> Une grande majorité d'image Docker ne fonctionne tout simplement pas dont [Nextcloud AIO](https://github.com/nextcloud/all-in-one) (qui est l'image Docker recommandée par Nextcloud)
> Le message d'erreur qui s'affiche est : `/bin/sh: error while loading shared libraries: libc.so.6: ELF load command address/offset not page-aligned`

## Caractéristique du NAS QNAP

- OS : QTS 5.X
- CPU : Quad-Core ARM Cortex-A15
- Memoire : 4GB
- IP Static : 110.110.110.110


## Démarche

Nous allons utiliser les éléments suivants :
- Application QNAP Container Station (Docker et Docker Compose)
- Application Nextcloud v27 (archive)
- Utilisation d'une IP spécifique pour l'accès à Nextcloud (110.110.110.151)

</br>

Les étapes seront les suivantes :
1. Création d'un utilisateur spécifique pour Docker 
2. Création d'un répertoire partagé pour Docker
3. Activation d'un accès SSH sur le NAS QNAP
4. Installation de l'application QNAP Container Station
5. Se connecter en SSH sur le NAS QNAP
6. Création d'un fichier Dockerfile
7. Création d'un fichier Docker Compose
8. Création des fichiers de configurations pour l'application Nextcloud
9. Création d'un script d'initialisation pour l'application Nextcloud
10. Création d'un fichier de configuration pour l'ensemble des variables d'environnement
11. Mise en place d'un script de démarrage sur le NAS QNAP


# Détails

## Création d'un utilisateur spécifique pour Docker 

Création d'un utilisateur spécifique pour Docker afin de limiter les droits sur l'ensemble des éléments et services du NAS QNAP :
1. Allez dans `Main Menu > ControlPanel > Privilege > Users`
2. Cliquez sur le bouton `Create`, puis sur l'option `Create a User`
3. Renseignez les différents éléments du formulaire et choisissez le nom (username) **dockeruser**
4. Cliquez sur le bouton `Create`

_Note : Gardez de côté le PUID (ex : 501) et le PGID (ex: 100), car ils seront nécessaires pour les droits du conteneur Docker contenant l'application Nextcloud_


[![20231107_Blog_use_nextcloud_on_qnap_01](/blog/web/20231107_Blog_use_nextcloud_on_qnap_01.png)](/blog/web/20231107_Blog_use_nextcloud_on_qnap_01.png) 

## Création d'un répertoire partagé pour Docker

Pour créer un répertoire partagé spécifique pour les fichiers de données et de configuration du conteneur Docker contenant l'application Nextcloud, il faut suivre les étapes suivantes :
1. Allez dans `Main Menu > ControlPanel > Privilege > Shared Folders`
2. Cliquez sur le bouton `Create`, puis sur l'option `Create A Shared Folder`
3. Renseignez les différents éléments et cliquez sur le bouton `Next`
    1. Folder Name : Nom du répertoire
    2. Comment : Commentaire pour le répertoire
    3. Disk Volume : Disque où sera créé le répertoire
    4. Path : Chemin du répertoire
4. Dans la fenêtre **Configure access privileges for users**, sélectionnez l'option `RW` (lecture & écriture) pour votre utilisateur d'administration et pour l'utilisateur **dockeruser**) et cliquez sur le bouton `Next`
5. Dans la fenêtre **Properties**, sélectionnez les options souhaitées et cliquez sur le bouton `Finish`

[![20231107_Blog_use_nextcloud_on_qnap_02](/blog/web/20231107_Blog_use_nextcloud_on_qnap_02.png)](/blog/web/20231107_Blog_use_nextcloud_on_qnap_02.png) 

## Activation d'un accès SSH sur le NAS QNAP

Pour pouvoir se connecter en SSH sur le NAS QNAP, il faut commencer par activer le service en suivant les étapes suivantes :
1. Allez dans `Main Menu > ControlPanel > Network & File Services > Telnet / SSH`
2. Cochez l'option `Allow SSH connection` et renseignez le numéro du port souhaité
3. Cliquez sur le bouton `Apply`

_Note : Dans notre cas nous allons utiliser le port 23422 pour l'accès SSH_

[![20231107_Blog_use_nextcloud_on_qnap_03](/blog/web/20231107_Blog_use_nextcloud_on_qnap_03.png)](/blog/web/20231107_Blog_use_nextcloud_on_qnap_03.png) 

## Installation de l'application QNAP Container Station

Pour pouvoir utiliser Docker sur le NAS QNAP, il faut installer l'application QNAP Container Station, en suivant les étapes suivantes :
1. Allez dans `Main Menu > App Center > QNAP Store > All Apps`
2. Recherchez l'application **Container Station (Utilities)** et cliquez sur l'option `+ Install`

_Note : un raccourci nommé **Container Station** doit  être présent sur la page d'accueil de votre NAS QNAP_

[![20231107_Blog_use_nextcloud_on_qnap_04](/blog/web/20231107_Blog_use_nextcloud_on_qnap_04.png)](/blog/web/20231107_Blog_use_nextcloud_on_qnap_04.png) 

## Se connecter en SSH sur le NAS QNAP 

Pour se connecter au NAS QNAP en SSH, il suffit d'utiliser la commande suivante : `ssh <useradmin>@<ip NAS QNAP> -p <port>`
Dans notre cas, la commande sera : `ssh admin@110.110.110.110 -p 23422` 

Nous allons en profiter pour créer les premiers répertoires nécessaires pour Docker et le conteneur Docker contenant l'application Nextcloud
1. Allez dans le répertoire partagé Docker : `cd /share/Docker`
2. Créez le répertoire **nextcloud** qui permettra de stocker toutes les données associées à l'application Nextcloud : `mkdir /share/Docker/nextcloud`
3. Créez le répertoire **scripts** qui permettra de stocker tous les scripts et fichiers de configuration nécessaires à la construction de l'image et du conteneur Docker contenant l'application Nextcloud : `mkdir /share/Docker/scripts`


## Création d'un fichier Dockerfile

Pour pouvoir mettre en place l'application Nextcloud sur le NAS QNAP, nous allons créer les différents éléments nécessaires.

### Création des répertoires nécessaires pour l'image Docker

Nous allons créer un répertoire **nextcloud_app** dans lequel nous mettrons l'ensemble des éléments nécessaires à la construction de l'image Docker contenant l'application Nextcloud :
1. Créez un répertoire **nextcloud_app** : `mkdir /share/Docker/scripts/nextcloud_app`
2. Créez un sous-répertoire **config** permettant de stocker l'ensemble des fichiers de configurations nécessaires pour l'application Nextcloud : `mkdir /share/Docker/scripts/nextcloud_app/config`

### Création du fichier Dockerfile

Créez un fichier nommé **Dockerfile** dans le répertoire `/share/Docker/scripts/nextcloud_app`

Le contenu du fichier est le suivante :
```Dockerfile
# Based on ubuntu image
FROM ubuntu:22.04

# Default value
ARG build_TZ=Europe/Paris
ARG build_PUID=501
ARG build_PGID=100

# Config environment
ENV TZ=$build_TZ
ENV DEBIAN_FRONTEND noninteractive
ENV PUID=$build_PUID
ENV PGID=$build_PGID

# Work directory
WORKDIR /

# Update Ubuntu system
RUN apt-get update -y && apt-get upgrade -y

# Install tools (apache2, mariadb and php)
RUN apt-get install sudo vim wget cron curl ffmpeg apache2 mariadb-server libapache2-mod-php \
php-gd php-mysql php-curl php-mbstring php-intl php-gmp php-bcmath php-xml php-imagick php-zip \
php-bz2 php-ldap php-smbclient php-imap php-apcu -y

# Clean APT cache
RUN apt-get clean
RUN rm -rf /var/lib/apt/lists/*

# Install Nextcloud in the folder /var/www
RUN wget https://download.nextcloud.com/server/releases/latest-27.tar.bz2 -O /tmp/nextcloud-27.tar.bz2
RUN tar -xjvf /tmp/nextcloud-27.tar.bz2 -C /tmp
RUN cp -r /tmp/nextcloud /var/www
RUN chown -R www-data:www-data /var/www/nextcloud

# Copy the template nextcloud config files for run_nextcloud.sh later use
RUN cp -r /tmp/nextcloud/config /tmp/nextcloud_config

# Clean nextcloud temporary folder
RUN rm -rf /tmp/nextcloud
RUN rm /tmp/nextcloud-27.*

# Manage SSL certificate
RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /etc/ssl/private/apache-selfsigned.key -out /etc/ssl/certs/apache-selfsigned.crt \
-subj /C=FR/ST=France/L=Paris/O=NAS/OU=Nextcloud/CN=nas@nas.nas

# Create specific folder
RUN mkdir /scripts

# Copy config files
COPY ./config /config
# Prepare execution of the run_nextcloud.sh script
RUN chmod +x /config/run_nextcloud.sh

# Configuration Crontab
RUN echo exit 0 > /usr/sbin/policy-rc.d
RUN echo "*/5  *  *  *  * php -f /var/www/nextcloud/cron.php" | crontab -u www-data -

# Expose ports for Nextcloud application
EXPOSE 80
EXPOSE 443
EXPOSE 3478

# Define Entrypoint to execute the run_nextcloud.sh script
ENTRYPOINT ["bash","/config/run_nextcloud.sh",">","/var/log/nextcloud/run_nextcloud.log"]
```



## Création d'un fichier Docker Compose

Afin de faciliter l'utilisation de Docker pour la mise en place de l'application Nextcloud, nous allons utiliser Docker Compose en créant un fichier nommé **docker-compose.yml** dans le répertoire `/share/Docker/scripts/nextcloud_app`

Ce fichier va nous permettre de définir le **build** de l'image Docker ainsi que le réseau (**network**) Docker qui seront utilisés par le conteneur Docker contenant l'application Nextcloud.

Le contenu du fichier est le suivant :
```yaml
version: "3.7"

services:
  # Nextcloud application
  nextcloud:
    image: nextcloud-qnas-img:v27
    # Build configuration
    build:
      context: .
      dockerfile: Dockerfile
      # Default argument for the build
      args:
        build_PUID : 501
        build_PGID : 100
        build_TZ : Europe/Paris
    # Name of the application for QNAP Container Station
    container_name: nextcloud-qnas
    # Define the Static IP from QNET Network
    networks:
      qnet-static-eth0:
        ipv4_address: 110.110.110.151
    # Define the Env file to initialise environment variable for the container
    env_file:
      - ./config/.env
    # Define all the volume to store the data and logs into the shared folder (and not into the container)
    volumes:
      - /share/Docker/nextcloud/nc_data:/var/www/nextcloud/data
      - /share/Docker/nextcloud/nc_apps:/var/www/nextcloud/apps
      - /share/Docker/nextcloud/db_data:/var/lib/mysql
      - /share/Docker/nextcloud/nc_log:/var/log/nextcloud
      - /share/Docker/nextcloud/db_log:/var/log/mysql
    # Define the exposed port
    ports:
      - 80:80
      - 443:443
      - 3478:3478
    # Don't restart the container only if we manually stop it
    restart: unless-stopped

# Define the network based en NAS QNAP interfaces
networks:
  qnet-static-eth0 :
    driver: qnet
    driver_opts:
      iface: "eth0"
    ipam:
      driver: qnet
      options:
        iface: "eth0"
      config:
        - subnet: 110.110.110.0/24
          gateway: 110.110.110.1


```

Précision concernant les **volumes** :
- Le répertoire `/share/Docker/nextcloud/nc_data` contiendra l'ensemble des données utilisateurs de l'application Nextcloud
- Le répertoire `/share/Docker/nextcloud/nc_apps` contiendra l'ensemble des applications internes de l'application Nextcloud
- Le répertoire `/share/Docker/nextcloud/db_data` contiendra l'ensemble des données de la base de données MariaDB utilisée par l'application Nextcloud
- Le répertoire `/share/Docker/nextcloud/nc_log` contiendra l'ensemble des logs de l'application Nextcloud
- Le répertoire `/share/Docker/nextcloud/db_log` contiendra l'ensemble des logs de la base de données MariaDB utilisée par l'application Nextcloud

_Note : L'objectif est de garder les données de la base de données mariaDB et de l'application Nextcloud dans le répertoire partagé afin de pouvoir faciliter les sauvegarde et pouvoir dissocier les données du conteneur_

## Création des fichiers de configurations pour l'application Nextcloud

Afin de pouvoir configurer les services nécessaires à l'application Nextcloud lors de l'exécution du conteneur Docker, nous allons préparer les fichiers de configuration suivants :

I\. Pour le service **Apache2** :
1. Créez le répertoire de configuration `mkdir /share/Docker/scripts/nextcloud_app/config/apache2` 
2. Créez le fichier de configuration **nextcloud.conf** dans le répertoire créé

Contenu du fichier **nextcloud.conf** :
```apacheconf
<VirtualHost *:80>
    ServerName ${NC_HOSTNAME}
    Redirect permanent / https://${NC_HOSTNAME}/
</VirtualHost>

<VirtualHost *:443>
     ServerName ${NC_HOSTNAME}
     DocumentRoot ${ROOT_NC}/

     Alias / "${ROOT_NC}/"

     SSLEngine on
     SSLCertificateFile /etc/ssl/certs/apache-selfsigned.crt
     SSLCertificateKeyFile /etc/ssl/private/apache-selfsigned.key

     <Directory ${ROOT_NC}/>
       Options +FollowSymlinks
        AllowOverride All
        Require all granted
          <IfModule mod_dav.c>
            Dav off
          </IfModule>
        SetEnv HOME ${ROOT_NC}
        SetEnv HTTP_HOME ${ROOT_NC}
        SetEnv HTTPS_HOME ${ROOT_NC}
     </Directory>

     ErrorLog ${APACHE_LOG_DIR}/error.log
     CustomLog ${APACHE_LOG_DIR}/access.log combined

</VirtualHost>
```

II\. Pour le service **MariaDB** :
1. Créez le répertoire de configuration `mkdir /share/Docker/scripts/nextcloud_app/config/mariadb` 
2. Créez le fichier de configuration **50-server.conf** dans le répertoire créé en reprenant le template souhaité et modifiez la ligne commençant par `datadir` avec la ligne suivante `datadir                 = ${ROOT_DB_DATA}`

</br>

III\. Pour l'application **Nextcloud** :
1. Créez le répertoire de configuration `mkdir /share/Docker/scripts/nextcloud_app/config/nextcloud` 
2. Créez les fichiers de configuration nommés **autoconfig.php** et **docker.config.php** dans le répertoire créé afin de configurer automatique l'application Nextcloud lors de la 1ère exécution

Contenu du fichier **autoconfig.php** :
```php
<?php
$AUTOCONFIG = array(
  "dbtype"        => "mysql",
  "dbname"        => "${MYSQL_DATABASE}",
  "dbuser"        => "${MYSQL_USER}",
  "dbpass"        => "${MYSQL_PASSWORD}",
  "dbhost"        => "localhost",
  "dbtableprefix" => "oc_",
  "adminlogin"    => "admin",
  "adminpass"     => "${NC_ADMIN_PASSWORD}",
  "directory"     => "${ROOT_NC_DATA}",
  "trusted_domains" => 
  array (
    0 => "${STATIC_IP}",
    1 => "${NC_HOSTNAME}",
  ),
);
```

Contenu du fichier **docker.config.php** :
```php
<?php
$CONFIG = array (
  'overwriteprotocol' => 'https',
  'overwritewebroot' => '/',
  'overwrite.cli.url' => 'https://${NC_HOSTNAME}',
  'htaccess.RewriteBase' => '/',
  'mysql.utf8mb4' => true,
  'default_language' => 'fr',
  'force_language' => 'fr',
  'default_locale' => 'fr_FR',
  'default_phone_region' => 'FR',
  'force_locale' => 'fr_FR',
  'knowledgebaseenabled' => true,
  'allow_user_to_change_display_name' => true,
  'auth.bruteforce.protection.enabled' => true,
  'auth.bruteforce.protection.testing' => false,
  'ratelimit.protection.enabled' => true,
  'auth.webauthn.enabled' => true,
  'auth.storeCryptedPassword' => true,
  'lost_password_link' => 'disabled',
  'mail_domain' => '${MAIL_DOMAINE}',
  'updatechecker' => true,
  'updater.server.url' => 'https://updates.nextcloud.com/updater_server/',
  'updater.release.channel' => 'stable',
  'has_internet_connection' => true,
  'connectivity_check_domains' => [
    'www.nextcloud.com',
    'www.startpage.com',
    'www.eff.org',
    'www.edri.org'
  ],
  'log_type' => 'file',
  'log_type_audit' => 'file',
  'logfile' => '${ROOT_NC_LOG}/nextcloud.log',
  'logfile_audit' => '${ROOT_NC_LOG}/audit.log',
  'logfilemode' => 0640,
  'loglevel' => 2,
  'loglevel_frontend' => 2,
  'syslog_tag' => 'Nextcloud',
  'syslog_tag_audit' => 'Nextcloud',
  'logdateformat' => 'F d, Y H:i:s',
  'logtimezone' => '${TZ}',
  'customclient_desktop' =>
	'https://nextcloud.com/install/#install-clients',
'customclient_android' =>
	'https://play.google.com/store/apps/details?id=com.nextcloud.client',
'customclient_ios' =>
	'https://itunes.apple.com/us/app/nextcloud/id1125420102?mt=8',
'customclient_ios_appid' =>
		'1125420102',
  'defaultapp' => 'dashboard,files',
  'appstoreenabled' => true,
  'apps_paths' => [
    [
      'path'=> OC::$SERVERROOT . '/apps',
      'url' => '/apps',
      'writable' => true,
    ],
  ],
  'enable_previews' => false,
  'memcache.local' => '\OC\Memcache\APCu',
);

```


IV\. Pour le service **PHP** :
1. Créez le répertoire de configuration `mkdir /share/Docker/scripts/nextcloud_app/config/php` 
2. Créez le fichier de configuration nommé **20-pdo_mysql.ini** dans le répertoire créé

Contenu du fichier **20-pdo_mysql.ini** :
```ini
; configuration for php mysql module
; priority=20
extension=pdo_mysql.so

[mysql]
mysql.allow_local_infile=On
mysql.allow_persistent=On
mysql.cache_size=2000
mysql.max_persistent=-1
mysql.max_links=-1
mysql.default_port=3306
mysql.default_socket=/var/lib/mysql/mysql.sock
mysql.default_host=localhost
mysql.connect_timeout=60
mysql.trace_mode=Off
```


## Création d'un script d'initialisation pour Nextcloud

Afin de pouvoir réaliser l'initialisation de l'application Nextcloud lors de l'exécution du conteneur, nous allons mettre en place le script **run_nextcloud.sh** dans le répertoire `/share/Docker/scripts/nextcloud_app/config`

Contenu du script **run_nextcloud.sh** :
```sh
#!/bin/sh

# ENV
ROOT_CONF="/config"

# Check one environment variable (if .env is ok)
if [ -z "${ROOT_DB_DATA}" ]; then
    echo "$(date +"%Y-%m-%d %H:%M:%S") - Error - Environment variable issues"
    exit 1
fi


# Check data folder to do the initialisation only if one or more folders are emppty
CHECK_FOLDER_MARIADB=$(ls "${ROOT_DB_DATA}" | wc -l)
CHECK_FOLDER_NC=$(ls "${ROOT_NC_DATA}" | wc -l)
CHECK_FOLDER_NC_CONF=$(ls "${ROOT_NC_CONF}" | wc -l)
if [ $CHECK_FOLDER_MARIADB -eq 0 ] || [ $CHECK_FOLDER_NC -eq 0 ] || [ $CHECK_FOLDER_NC_CONF -eq 0 ]; then

    echo "$(date +"%Y-%m-%d %H:%M:%S") - Info - Init Nextcloud"

    # Delete old data
    echo "$(date +"%Y-%m-%d %H:%M:%S") - Info - Delete existing Data"
    rm -rf $ROOT_DB_DATA/*
    rm -rf $ROOT_NC_DATA/*
    rm -rf $ROOT_NC_CONF/*

    # Copy config files
    echo "$(date +"%Y-%m-%d %H:%M:%S") - Info - Copy config files"
    # Mariadb
    cat $ROOT_CONF/mariadb/50-server.cnf | sed 's|${ROOT_DB_DATA}|'"${ROOT_DB_DATA}"'|g' > /etc/mysql/mariadb.conf.d/50-server.cnf
    # Apache2 and PHP
    echo "apc.enable_cli = 1" >> /etc/php/8.1/apache2/php.ini
    cat $ROOT_CONF/php/20-pdo_mysql.ini > /etc/php/8.1/apache2/conf.d/20-pdo_mysql.ini
    cat $ROOT_CONF/apache2/nextcloud.conf | sed 's|${NC_HOSTNAME}|'"${NC_HOSTNAME}"'|g' \
        | sed 's|${ROOT_NC}|'"${ROOT_NC}"'|g' \
        > /etc/apache2/sites-available/nextcloud.conf
    # Nextcloud
    cp /tmp/nextcloud_config/* $ROOT_NC_CONF/.
    cat $ROOT_CONF/nextcloud/autoconfig.php | sed 's|${NC_HOSTNAME}|'"${NC_HOSTNAME}"'|g' \
        | sed 's|${ROOT_NC_DATA}|'"${ROOT_NC_DATA}"'|g' \
        | sed 's|${MYSQL_DATABASE}|'"${MYSQL_DATABASE}"'|g' \
        | sed 's|${MYSQL_USER}|'"${MYSQL_USER}"'|g' \
        | sed 's|${MYSQL_PASSWORD}|'"${MYSQL_PASSWORD}"'|g' \
        | sed 's|${STATIC_IP}|'"${STATIC_IP}"'|g' \
        | sed 's|${NC_ADMIN_PASSWORD}|'"${NC_ADMIN_PASSWORD}"'|g' \
        > ${ROOT_NC_CONF}/autoconfig.php
    cat $ROOT_CONF/nextcloud/docker.config.php | sed 's|${NC_HOSTNAME}|'"${NC_HOSTNAME}"'|g' \
        | sed 's|${MAIL_DOMAINE}|'"${MAIL_DOMAINE}"'|g' \
        | sed 's|${ROOT_LOG}|'"${ROOT_LOG}"'|g' \
        | sed 's|${TZ}|'"${TZ}"'|g' \
        | sed 's|${ROOT_NC_LOG}|'"${ROOT_NC_LOG}"'|g' \
        | sed 's|${ROOT_NC_APPS}|'"${ROOT_NC_APPS}"'|g' \
        > ${ROOT_NC_CONF}/docker.config.php

    # Manage right on config files
    echo "$(date +"%Y-%m-%d %H:%M:%S") - Info - Manage right on config files"
    chmod 644 /etc/mysql/mariadb.conf.d/50-server.cnf
    chmod 644 /etc/php/8.1/apache2/conf.d/20-pdo_mysql.ini
    chmod 644 /etc/php/8.1/apache2/php.ini
    chmod 644 /etc/apache2/sites-available/nextcloud.conf
    chmod 644 ${ROOT_NC_CONF}/*

    # Init MariaDB service
    echo "$(date +"%Y-%m-%d %H:%M:%S") - Info - MariasDB : Install DB (mysql)"
    mariadb-install-db --user=mysql
    if [ $? -ne 0 ]; then echo "$(date +"%Y-%m-%d %H:%M:%S") - Error - MariasDB Install"; exit 1 ; fi

    # Start MariaDB service
    echo "$(date +"%Y-%m-%d %H:%M:%S") - Info - MariasDB : Start service"
    service mariadb start
    if [ $? -ne 0 ]; then echo "$(date +"%Y-%m-%d %H:%M:%S") - Error - MariasDB Start"; exit 1 ; fi

    # Create nextcloud user into MariaDB
    QRY_SQL="CREATE USER IF NOT EXISTS '${MYSQL_USER}'@'localhost' IDENTIFIED BY '${MYSQL_PASSWORD}';
    CREATE DATABASE IF NOT EXISTS ${MYSQL_DATABASE} CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
    GRANT ALL PRIVILEGES ON ${MYSQL_DATABASE}.* TO '${MYSQL_USER}'@'localhost';
    FLUSH PRIVILEGES;"

    echo "$(date +"%Y-%m-%d %H:%M:%S") - Info - MariasDB : Create user et database"
    mariadb -u root -e "${QRY_SQL}"
    if [ $? -ne 0 ]; then echo "$(date +"%Y-%m-%d %H:%M:%S") - Error - MariasDB exec QRY"; exit 1 ; fi


    # Init Apache2 service
    echo "$(date +"%Y-%m-%d %H:%M:%S") - Info - Apache2 : Init conf"
    echo "ServerName ${STATIC_IP}" >> /etc/apache2/apache2.conf
    a2ensite nextcloud.conf
    a2enmod rewrite headers env dir mime ssl

    # Start Apache2 service
    echo "$(date +"%Y-%m-%d %H:%M:%S") - Info - Apache2 : Start service"
    service apache2 start
    if [ $? -ne 0 ]; then echo "$(date +"%Y-%m-%d %H:%M:%S") - Error - apache2 service start"; exit 1 ; fi

    # Manage folders rights
    echo "$(date +"%Y-%m-%d %H:%M:%S") - Info - Manage folders chown"
    chown -R www-data:www-data ${ROOT_NC}
    chown -R www-data:www-data ${ROOT_NC_DATA}
    chown -R www-data:www-data ${ROOT_NC_CONF}
    chown -R www-data:www-data ${ROOT_NC_APPS}
    chown -R mysql:mysql ${ROOT_DB_DATA}
    chmod -R 766 ${ROOT_NC_LOG}
    chmod -R 766 ${ROOT_DB_LOG}
    chown -R www-data:www-data ${ROOT_NC_LOG}
    chown -R www-data:www-data ${ROOT_DB_LOG}
    

    # Execute Nextcloud for the first time with HTTPS (initialize admin user and data folder)
    openssl s_client -showcerts -connect ${NC_HOSTNAME}:443 </dev/null | sed -n -e '/-.BEGIN/,/-.END/ p' > /tmp/nextcloud.pem
    curl --cacert /tmp/nextcloud.pem https://${NC_HOSTNAME}
    rm /tmp/nextcloud.pem

    # Start Cron service
    service cron start
    if [ $? -ne 0 ]; then echo "$(date +"%Y-%m-%d %H:%M:%S") - Error - cron service start"; exit 1 ; fi

else
    # If init already done : Start services
    service mariadb start
    if [ $? -ne 0 ]; then echo "$(date +"%Y-%m-%d %H:%M:%S") - Error - mariadb service start"; exit 1 ; fi
    service apache2 start
    if [ $? -ne 0 ]; then echo "$(date +"%Y-%m-%d %H:%M:%S") - Error - apache2 service start"; exit 1 ; fi
    service cron start
    if [ $? -ne 0 ]; then echo "$(date +"%Y-%m-%d %H:%M:%S") - Error - cron service start"; exit 1 ; fi

fi

# Infinite loop to keep service up
while [ 1 ]; do 
    sleep 300

    # Check Apache2 service
    CHECK_APACHE=$(service apache2 status | grep 'is running' | wc -l)
    if [ "$CHECK_APACHE" != "1" ]; then
        echo "$(date +"%Y-%m-%d %H:%M:%S") - Info - Restart apache2 service"
        service apache2 start
        CHECK_APACHE_2=$(service apache2 status | grep 'is running' | wc -l)
        if [ "$CHECK_APACHE_2" != "1" ]; then
            echo "$(date +"%Y-%m-%d %H:%M:%S") - Error - Service apache2 KO"
            exit 1
        fi
    fi

    # Check MariaDB service
    CHECK_MARIADB=$(service mariadb status | grep 'Uptime' | wc -l)
    if [ "$CHECK_MARIADB" != "1" ]; then
        echo "$(date +"%Y-%m-%d %H:%M:%S") - Info - Restart mariadb service"
        service mariadb start
        CHECK_MARIADB_2=$(service mariadb status | grep 'Uptime' | wc -l)
        if [ "$CHECK_MARIADB_2" != "1" ]; then
            echo "$(date +"%Y-%m-%d %H:%M:%S") - Error - Service mariadb KO"
            exit 1
        fi
    fi

done

exit 0
```

## Création d'un fichier de configuration pour l'ensemble des variables d'environnement

Afin de pouvoir finaliser la création de l'image Docker, nous avons besoin de mettre en place un fichier **.env** afin de centraliser l'ensemble des variables d'environnements nécessaires au container et plus spécifique au script d'initialisation **run_nextcloud.sh**

Ce fichier d'environnement est définie au niveau du fichier **docker-compose.yml**
Le fichier **.env**doit être créé dans le répertoire `/share/Docker/scripts/nextcloud_app/config`

Le contenu du fichier **.env** est le suivant :  _(en remplaçant les valeurs nécessaires pour votre environnement)_
```sh
PUID=501
PGID=100
ROOT_DB_DATA=/var/lib/mysql
ROOT_NC=/var/www/nextcloud
ROOT_NC_DATA=/var/www/nextcloud/data
ROOT_NC_CONF=/var/www/nextcloud/config
ROOT_NC_LOG=/var/log/nextcloud
ROOT_DB_LOG=/var/log/mysql
ROOT_NC_APPS=/var/www/nextcloud/apps
NC_HOSTNAME=<hostname (ex: nextcloud.nas.nas)>
MYSQL_DATABASE=nextcloud
MYSQL_USER=<nextcloud username for mariadb>
MYSQL_PASSWORD=<nextcloud user password for mariadb>
STATIC_IP=110.110.110.151
MAIL_DOMAINE=nas@nas.nas
TZ=Europe/Paris
NC_ADMIN_PASSWORD=<nextcloud admin password>
```




## Mise en place d'un script de démarrage sur le NAS QNAP

Afin de pouvoir relancer au démarrage du NAS QNAP le conteneur Docker de l'application Nextcloud :
1. Allez dans `Main Menu > ControlPanel > System > Hardware`
2. Dans l'onglet `General`, cochez l'option `Run user defined processes during startup`
3. Connectez vous en SSH sur le NAS QNAS avec un compte administrateur : `ssh <user>@<ip> -p <port>`
4. Exécutez les commandes suivante pour monter le répertoire `/tmp/config`
```sh
ubiattach -m 6 -d 2
/bin/mount -t ubifs ubi2:config /tmp/config
```
5. Créez le fichier  `/tmp/config/autorun.sh` avec le contenu suivant :
```sh
#!/bin/sh
cd /share/Docker/scripts/nextcloud_app
docker compose up -d
```
6. Exécuter les commandes suivante pour rendre exécutable le fichier `/tmp/config/autorun.sh` 
```sh
chmod +x /tmp/config/autorun.sh
umount /tmp/config
ubidetach -m 6
```

# Exécution de l'application Nextcloud

Les étapes pour exécuter manuellement l'application Nextcloud sont les suivantes :
1. Connectez vous SSH sur le NAS QNAP avec un compte administrateur : `ssh <user>@<ip> -p <port>`
2. Positionnez vous dans le répertoire contenant les éléments de l'image docker : `cd /share/Docker/scripts/nextcloud_app`
3. Exécutez la commande docker compose suivante : `docker compose up -d`
4. Attendez quelques secondes/minutes et vérifiez la bonne exécution du conteneur en vous connectant sur l'application Nextcloud `https://110.110.110.151`

Vous pouvez vérifier la bonne exécution du conteneur en allant voir les informations dans l'application QNAP Container Station ou en utilisant les commande Docker (stats, logs, ps, ...)

[![20231107_Blog_use_nextcloud_on_qnap_05](/blog/web/20231107_Blog_use_nextcloud_on_qnap_05.png)](/blog/web/20231107_Blog_use_nextcloud_on_qnap_05png) 

[![20231107_Blog_use_nextcloud_on_qnap_06](/blog/web/20231107_Blog_use_nextcloud_on_qnap_06.png)](/blog/web/20231107_Blog_use_nextcloud_on_qnap_06.png) 

[![20231107_Blog_use_nextcloud_on_qnap_07](/blog/web/20231107_Blog_use_nextcloud_on_qnap_07.png)](/blog/web/20231107_Blog_use_nextcloud_on_qnap_07.png) 


# Commandes Docker

Quelques commandes concernant l'utilisation de Docker :
- `docker build -t nextcloud-qnas-img:v27 . ` : Permet de construire (build) l'image à partir du fichier **Dockerfile** du répertoire courant
    - `docker build  -t nextcloud-qnas-img:v27 . --build-arg build_TZ=Europe/Paris --build-arg build_PUID=501 --build-arg build_PGID=100` : Commande **build** avec argument
- `docker ps` : Liste des conteneurs en cours d'exécution
- `docker ps -a` : Liste de l'ensemble des conteneurs existants
- `docker stats` : Statistiques d'utilisation des conteneurs en cours d'exécution
- `docker logs nextcloud-qnas` : Message de log (sortie standard) du conteneur
- `docker create -i -t -v /share/Docker/nextcloud/...:/... -v ... --name nextcloud-qnas nextcloud-qnas-img:v27` : Création d'un conteneur **nextcloud-qnas** à partir de l'image **nextcloud-qnas-img:v27**
- `docker container start -a -i nextcloud-qnas` : Démarrage d'un conteneur en accédant directement à la console
- `docker rm nextcloud-qnas` : Permet de supprimer le conteneur

Si vous avez besoin de recréer manuellement les **network** propre au NAS QNAP pour Docker : 
```bash
# Create dhcp network
docker network create -d qnet --opt=iface=eth0 --ipam-driver=qnet --ipam-opt=iface=eth0 qnet-dhcp-eth0

# Create static network
docker network create -d qnet --opt=iface=eth0 --ipam-driver=qnet --ipam-opt=iface=eth0 \
      --subnet=110.110.110.0/24 --gateway=110.110.110.1 qnet-static-eth0
```

Quelques commandes concernant l'utilisation de Docker Compose : _(Il faut se positionner dans le répertoire contenant le fichier `docker-compose.yaml)_ 
- `docker compose build --build-arg TZ=Europe/Paris --build-arg PUID=501 --build-arg PGID=100` : Permet de faire la construction (build) à l'image de la commande Docker
- `docker compose up -d` : Permet de créer et démarrer les conteneurs définis
- `docker compose down` : Permet de d'arrêter et de supprimer les conteneurs définis
- `docker compose start` : Permet de démarrer les conteneurs définis
- `docker compose stop` : Permet d'arrêter les conteneurs définis

