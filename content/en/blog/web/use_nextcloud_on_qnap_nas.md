---
Categories : ["Nextcloud","Cloud","QNAP","Docker"]
Tags : ["Nextcloud","Cloud","QNAP","Docker"]
title : "Setting up Nextcloud application on a QNAP NAS"
date : 2023-11-07
draft : false
toc: true
---

In this article, you'll find everything you need to set up the [Nextcloud](https://nextcloud.com) application on a [QNAP NAS](https://www.qnap.com/en/product/series/home) using the [QNAP Container Station](https://www.qnap.com/en/software/container-station) application and, more specifically, [Docker](https://www.docker.com/).

The set up is specific to the QNAP NAS of the [TS-x31P3 Series](https://www.qnap.com/static/landing/2020/fr-ts-x31p3-ts-x31k/index.html) which has a constraint limiting the use of Docker images in general and consequently blocking the use of the [Nextcloud AIO](https://github.com/nextcloud/all-in-one) image.


 <!--more-->

# What's a NAS

A [NAS (Network Attached Storage)](https://en.wikipedia.org/wiki/Network-attached_storage) is a network storage server that stores, backs up, shares, secures and facilitates access to files (photos, videos, music, documents), as well as running applications to add more services (vpn, sftp, web server, etc.).

# What's Nexcloud

[Nextcloud](https://en.wikipedia.org/wiki/Nextcloud) is a open source software offering a platform for file storage and sharing services as well as online applications.


# Objective

The objective of this approach is to be able to have a private cloud (based on Nextcloud application) allowing the whole family to store, share and manage their data while using an existing QNAP NAS.

The Nextcloud application must be accessible locally using the following HTTPS address: `https://110.110.110.151`

_Note: To have access to the Nextcloud application from Internet, you'll need to add a NAT rule on your router or Internet box to redirect traffic from ports 80 and 443 to the address `110.110.110.151`_

## Constraints specific to QNAP NAS

The specific QNAP NAS constraint of the [TS-x31P3 Series](https://www.qnap.com/static/landing/2020/fr-ts-x31p3-ts-x31k/index.html) is as follows:
- This NAS has an ARM v7 processor but the QNAP Container Station application has been modified to implement a page size of 32k instead of the [default](https://wiki.osdev.org/ARM_Paging).
    - The majority of existing Docker images don't work, including [Nextcloud AIO](https://github.com/nextcloud/all-in-one) (which is Nextcloud's recommended Docker image).
    - The error message displayed is : `/bin/sh: error while loading shared libraries: libc.so.6: ELF load command address/offset not page-aligned`.


## QNAP NAS specification

- OS : QTS 5.X
- CPU : Quad-Core ARM Cortex-A15
- Memory : 4GB
- IP Static : 110.110.110.110


## Process

We'll be using the following components:
- QNAP Container Station application (Docker and Docker Compose)
- Nextcloud v27 application (archive)
- A static IP for Nextcloud access (110.110.110.151)

The steps are as follows:
1. Create a specific user for Docker 
2. Create a shared directory for Docker
3. Enable SSH access on QNAP NAS
4. Install QNAP Container Station application
5. SSH connection to QNAP NAS
6. Create a Dockerfile
7. Creating a Docker Compose file
8. Create Nextcloud application configuration files
9. Creation of an initialization script for the Nextcloud application
10. Creation of a configuration file for all environment variables
11. Set up a startup script on the QNAP NAS


# Details

## 1. Create a specific user for Docker 

Create a specific user for Docker to limit rights on all QNAP NAS components and services:
1. Go to `Main Menu > ControlPanel > Privilege > Users`.
2. Click on the `Create` button, then on the `Create a User` option.
3. Fill in the form and choose the name (username) `dockeruser`.
4. Click on the `Create` button

_Note: Save the PUID (e.g. 501) and PGID (e.g. 100), as these will be required for the rights of the Docker container containing the Nextcloud application._

[![20231107_Blog_use_nextcloud_on_qnap_01](/blog/web/20231107_Blog_use_nextcloud_on_qnap_01.png)](/blog/web/20231107_Blog_use_nextcloud_on_qnap_01.png) 

## 2. Create a shared directory for Docker

To create a specific shared directory for the data and configuration files of the Docker container containing the Nextcloud application, follow these steps:
1. Go to `Main Menu > ControlPanel > Privilege > Shared Folders`.
2. Click on the `Create` button, then on the `Create A Shared Folder` option.
3. Fill in the details and click on the `Next` button.
    1. Folder Name : Folder name
    2. Comment : Comment for the directory
    3. Disk Volume : Disk on which the folder will be created.
    4. Path: Directory path
4. In the `Configure access privileges for users` window, select the `RW` (read & write) option for your administration user and for the `dockeruser` user, and click on the `Next` button.
5. In the `Properties` window, select the desired options and click on the `Finish` button.

[![20231107_Blog_use_nextcloud_on_qnap_02](/blog/web/20231107_Blog_use_nextcloud_on_qnap_02.png)](/blog/web/20231107_Blog_use_nextcloud_on_qnap_02.png) 

## 3.  Enable SSH access on QNAP NAS

To be able to connect to the QNAP NAS via SSH, you must first activate the service by following the steps below:
1. Go to `Main Menu > ControlPanel > Network & File Services > Telnet / SSH`.
2. Check the `Allow SSH connection` option and enter the desired port number.
3. Click on the `Apply` button

_Note: In our case, we'll use port 23422 for SSH access._

[![20231107_Blog_use_nextcloud_on_qnap_03](/blog/web/20231107_Blog_use_nextcloud_on_qnap_03.png)](/blog/web/20231107_Blog_use_nextcloud_on_qnap_03.png) 

## 4. Install QNAP Container Station application

To use Docker on the QNAP NAS, you need to install the QNAP Container Station application, following these steps:
1. Go to `Main Menu > App Center > QNAP Store > All Apps`.
2. Find the `Container Station (Utilities)` application and click on the `+ Install` option.

_Note: A shortcut named "Container Station" should be present on the home page of your QNAP NAS._

[![20231107_Blog_use_nextcloud_on_qnap_04](/blog/web/20231107_Blog_use_nextcloud_on_qnap_04.png)](/blog/web/20231107_Blog_use_nextcloud_on_qnap_04.png) 

## 5. SSH connection to QNAP NAS 

To connect to the QNAP NAS via SSH, simply use the following command: `ssh <useradmin>@<ip NAS QNAP> -p <port>`
In our case, the command would be: `ssh admin@110.110.110.110 -p 23422` 

Let's take this opportunity to create the first directories needed for Docker and the Docker container containing the Nextcloud application
1. Go to the Docker shared directory: `cd /share/Docker`.
2. Create the `nextcloud` directory, which will store all data associated with the Nextcloud application: `mkdir /share/Docker/nextcloud`.
3. Create the `scripts` directory, which will store all the scripts and configuration files needed to build the Docker image and container containing the Nextcloud application: `mkdir /share/Docker/scripts`.


## 6. Create a Dockerfile

To set up the Nextcloud application on the QNAP NAS, we're going to create the required elements.

### Creating the directories needed for the Docker image

We're going to create an `nextcloud_app` directory in which we'll put all the elements needed to build the Docker image containing the Nextcloud application :
1. Create an `nextcloud_app` directory:  `mkdir /share/Docker/scripts/nextcloud_app`.
2. Create a `config` subdirectory to store all the configuration files required for the Nextcloud application: `mkdir /share/Docker/scripts/nextcloud_app/config`.

### Create a Dockerfile

Create a file named `Dockerfile` in the directory `/share/Docker/scripts/nextcloud_app`.

The contents of the file `Dockerfile` :
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



## 7. Creating a Docker Compose file

To make it easier to use Docker to build the Nextcloud application, we're going to use Docker Compose to create a file named `docker-compose.yml` in the `/share/Docker/scripts/nextcloud_app` directory.

This file will enable us to define the build of the Docker image and the Docker network to be used by the Docker container containing the Nextcloud application.

The contents of the file `docker-compose.yml` :
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

Note on `volumes`:
- The `/share/Docker/nextcloud/nc_data` directory will contain all Nextcloud application user data.
- The `/share/Docker/nextcloud/nc_apps` directory will contain all the Nextcloud application's internal applications.
- The `/share/Docker/nextcloud/db_data` directory will contain all the MariaDB database data used by the Nextcloud application.
- The `/share/Docker/nextcloud/nc_log` directory will contain all Nextcloud application logs.
- The `/share/Docker/nextcloud/db_log` directory will contain all logs from the MariaDB database used by the Nextcloud application.

_Note: The objective is to keep the data from the mariaDB database and the Nextcloud application in the shared directory, to make backups easier and to be able to dissociate the data from the container._

## 8. Create Nextcloud application configuration files

In order to configure the services required by the Nextcloud application when running the Docker container, we'll prepare the following configuration files:

1. For the `Apache2` service
    1. Create the configuration directory `mkdir /share/Docker/scripts/nextcloud_app/config/apache2`
    2. Create the configuration file `nextcloud.conf` in the created directory

The contents of the file `nextcloud.conf` :
```conf
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

2. For the `mariadb` service
    1. Create the configuration directory `mkdir /share/Docker/scripts/nextcloud_app/config/mariadb`. 
    2. Create the `50-server.conf` configuration file in the directory you've created, using the desired template and modifying the line starting with `datadir` with the following line `datadir = ${ROOT_DB_DATA}`.

3. For the `nextcloud` application
    1. Create the `mkdir /share/Docker/scripts/nextcloud_app/config/nextcloud` configuration directory. 
    2. Create configuration files named `autoconfig.php` and `docker.config.php` in the created directory to automatically configure the Nextcloud application on the first run.

The contents of the file `autoconfig.php`:
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

The contents of the file `docker.config.php`:
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

5. For the `php` service
    1. Create the configuration directory `mkdir /share/Docker/scripts/nextcloud_app/config/php`. 
    2. Create a configuration file named `20-pdo_mysql.ini` in the created directory.

The contents of the file `20-pdo_mysql.ini`:
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


## 9. Creation of an initialization script for the Nextcloud application

In order to initialize the Nextcloud application when the container is executed, we'll set up the `run_nextcloud.sh` script in the `/share/Docker/scripts/nextcloud_app/config` directory.

The contents of the file `run_nextcloud.sh` :
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

## 10. Creation of a configuration file for all environment variables

In order to finalize the creation of the Docker image, we need to set up an `.env` file to centralize all the environment variables required by the container and, more specifically, by the `run_nextcloud.sh` initialization script.

This environment file is defined in the `docker-compose.yml` file.
The `.env` file must be created in the `/share/Docker/scripts/nextcloud_app/config` directory.

The contents of the file `.env` :  _(replacing the values required for your environment))_
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



## 11. Set up a startup script on the QNAP NAS

In order to start the Docker container of the Nextcloud application at the QNAP NAS startup :
1. Go to `Main Menu > ControlPanel > System > Hardware`.
2. In the `General` tab, check the `Run user defined processes during startup` option.
3. Connect to the QNAS NAS via SSH with an administrator account: `ssh <user>@<ip> -p <port>`
4. Run the follow commands to mount the directory `/tmp/config`
```sh
ubiattach -m 6 -d 2
/bin/mount -t ubifs ubi2:config /tmp/config
```
5. Create the file `/tmp/config/autorun.sh` with the content as follow :
```sh
#!/bin/sh
cd /share/Docker/scripts/nextcloud_app
docker compose up -d
```
6. Run the following commands to be able to run the file `/tmp/config/autorun.sh`  and unmount he directory `/tmp/config`
```sh
chmod +x /tmp/config/autorun.sh
umount /tmp/config
ubidetach -m 6
```




# Run the Nextcloud application

The steps for manually running the Nextcloud application are as follows:
1. Connect SSH to the QNAP NAS with an administrator account: `ssh <user>@<ip> -p <port>`
2. Go to the directory containing the Docker image elements: `cd /share/Docker/scripts/nextcloud_app`
3. Run the following Docker Compose command: `docker compose up -d`
4. Wait a few seconds/minutes and check that the container is running correctly by connecting to the Nextcloud application `https://110.110.110.151`

You can check that the container is running correctly by checking the information in the QNAP Container Station application, or by using the usual docker commands (stats, logs, ps, ...).

[![20231107_Blog_use_nextcloud_on_qnap_05](/blog/web/20231107_Blog_use_nextcloud_on_qnap_05.png)](/blog/web/20231107_Blog_use_nextcloud_on_qnap_05png) 

[![20231107_Blog_use_nextcloud_on_qnap_06](/blog/web/20231107_Blog_use_nextcloud_on_qnap_06.png)](/blog/web/20231107_Blog_use_nextcloud_on_qnap_06.png) 

[![20231107_Blog_use_nextcloud_on_qnap_07](/blog/web/20231107_Blog_use_nextcloud_on_qnap_07.png)](/blog/web/20231107_Blog_use_nextcloud_on_qnap_07.png) 


# Commands

Some commands for using Docker :
- `docker build -t nextcloud-qnas-img:v27 . ` : Builds the image from the `Dockerfile` in the current directory.
    - `docker build  -t nextcloud-qnas-img:v27 . --build-arg build_TZ=Europe/Paris --build-arg build_PUID=501 --build-arg build_PGID=100` : `build` command with argument
- `docker ps` : List of running containers
- `docker ps -a` : List of all existing containers
- `docker stats` : Statistics on running container usage
- `docker logs nextcloud-qnas` : Container log message (standard output)
- `docker create -i -t -v /share/Docker/nextcloud/...:/... -v ... --name nextcloud-qnas nextcloud-qnas-img:v27` : Create an `nextcloud-qnas` container from the `nextcloud-qnas-img:v27` image
- `docker container start -a -i nextcloud-qnas` : Start a container by accessing the console directly
- `docker rm nextcloud-qnas` : Delete the container

If you need to manually recreate the QNAP NAS `network` for Docker : 
```bash
# Create dhcp network
docker network create -d qnet --opt=iface=eth0 --ipam-driver=qnet --ipam-opt=iface=eth0 qnet-dhcp-eth0

# Create static network
docker network create -d qnet --opt=iface=eth0 --ipam-driver=qnet --ipam-opt=iface=eth0 \
      --subnet=110.110.110.0/24 --gateway=110.110.110.1 qnet-static-eth0
```

Some commands for using Docker Compose : _(You need to be in the directory containing the `docker-compose.yaml` file)_ 
- `docker compose build --build-arg TZ=Europe/Paris --build-arg PUID=501 --build-arg PGID=100` : Allows `Build` to be performed in the same way as the Docker command
- `docker compose up -d` : Create and start defined containers
- `docker compose down` : Stop and delete defined containers
- `docker compose start` : Start defined containers
- `docker compose stop` : Stop defined containers




