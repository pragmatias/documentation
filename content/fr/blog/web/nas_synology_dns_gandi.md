---
Categories : ["NAS","Synology","DNS"]
Tags : ["NAS","Synology","DNS"]
title : "Mise a jour des DNS de Gandi.net et utilisation d'un Proxy inversé avec un NAS Synology"
date : 2024-04-19
draft : false
toc: true
---

Vous trouverez dans cet article, l'ensemble des éléments permettant de mettre à jour les [DNS](https://en.wikipedia.org/wiki/Domain_Name_System) [Gandi.net](https://www.gandi.net/en) à partir d'un [NAS Synology](https://www.synology.com/en-en/products/DS223) ainsi que de mettre en place un proxy inversé pour vos différents services sur votre réseau local.

 <!--more-->

# Objectif

## Contexte

Nous souhaitons utiliser un nom de domaine personnel de [Gandi.net](https://www.gandi.net/en) nommé `testing.com` pour pouvoir accéder aux différents services existant derrière un accès (Routeur Livebox) internet personnel en fonction des sous-domaines définis.

Nous avons un réseau local contenant les équipements suivants :
- Routeur Livebox avec l'adresse local 192.10.10.1 _(Adresse publique : 90.125.62.14)_
- NAS Synology avec l'adresse local 192.10.10.2
- Serveur local n°1 pour héberger le service VPN avec l'adresse local 192.10.10.10
- Serveur local n°2 pour héberger le service GAME avec l'adresse local 192.10.10.20
- Serveur local n°3 pour héberger le service TODO avec l'adresse local 192.10.10.30

Nous avons un nom de domaine `testing.com` actif chez [Gandi.net](https://www.gandi.net/en).

[![Obj - Step n°0](/blog/web/20240419_nas_synology_dns_gandi_12.png)](/blog/web/20240419_nas_synology_dns_gandi_12.png)


Schéma :

[![Obj - Step n°1](/blog/web/20240419_nas_synology_dns_gandi_07.png)](/blog/web/20240419_nas_synology_dns_gandi_07.png)


## Contrainte

Le routeur Livebox ne permet de gérer que l'IPv4, l'adresse IP publique n'est pas fixe et on ne sait pas quand elle change, il faut donc pouvoir vérifier régulièrement notre adresse IP publique pour mettre à jour le DNS de Gandi.net lorsque cela est nécessaire.

## Usage

- Lorsqu'un utilisateur souhaite accéder à l'url `https://vpn.testing.com` alors il doit être redirigé automatiquement vers le serveur local n°1.
- Lorsqu'un utilisateur souhaite accéder à l'url `http://game.testing.com` alors il doit être redirigé automatiquement vers le serveur local n°2.
- Lorsqu'un utilisateur souhaite accéder à l'url `http://todo.testing.com` alors il doit être redirigé automatiquement vers le serveur local n°3.
- Lorsqu'un utilisateur souhaite accéder à l'url `https://share.testing.com` alors il doit être redirigé automatiquement vers le NAS Synology.


Schéma : 
[![Obj - Step n°2](/blog/web/20240419_nas_synology_dns_gandi_08.png)](/blog/web/20240419_nas_synology_dns_gandi_08.png)


## Liste des étapes

Pour mettre en place les éléments nécessaires, nous allons réaliser les étapes suivantes :
1. Création d'un jeton d'accès à l'API de [Gandi.net](https://www.gandi.net/en)
2. Configuration du routeur Livebox pour rediriger le traffic internet entrant vers le NAS Synology
3. Creation et mise à jour des DNS [Gandi.net](https://www.gandi.net/en) avec l'adresse IP publique associée au routeur Livebox
4. Mise en place du Proxy inversé sur le NAS Synology pour accéder aux différents serveurs


# Création d'un jeton d'accès à l'API de Gandi.net

Le jeton d'accès va nous permettre de nous authentifier pour utiliser l'API fourni par [Gandi.net](https://www.gandi.net/en) afin de pouvoir automatiser les modifications nécessaires sur les enregistrements DNS lors des changements d'adresse IP publique.

Démarche pour créer le jeton d'accès :
1. Connexion sur le compte d'administration sur le site [Gandi.net](https://www.gandi.net/en)
2. Cliquez sur le menu `Organizations`

[![Token - Step n°1](/blog/web/20240419_nas_synology_dns_gandi_01.png)](/blog/web/20240419_nas_synology_dns_gandi_01.png)

3. Cliquez sur l'organisation souhaitée
4. Cliquez sur l'onglet `Sharing`

[![Token - Step n°2](/blog/web/20240419_nas_synology_dns_gandi_02.png)](/blog/web/20240419_nas_synology_dns_gandi_02.png)

5. Dans la partie `Personal Access Token (PAT)`, cliquez sur le bouton `Create a token`
6. Renseigner les différents éléments nécesssaires
    1. Renseigner le nom du jeton  (ex : `testing_dns_pat`)
    2. Sélectionnez la durée de validité du jeton comprise entre 7 jours et 1 an (ex : `7 days`)
    3. Cochez la case `Restrict to selected products` et sélectionnez le domaine souhaité (ex : `testing.com`)
    4. Cochez la case `See and renew domain names`
    5. Cochez la case `Manage domain technical configurations`
    6. Cliquez sur le bouton `Create`

[![Token - Step n°3](/blog/web/20240419_nas_synology_dns_gandi_03.png)](/blog/web/20240419_nas_synology_dns_gandi_03.png)

7. Copier le Jeton d'accès créé dans un endroit sécurisé car il ne sera plus accessible

[![Token - Step n°4](/blog/web/20240419_nas_synology_dns_gandi_04.png)](/blog/web/20240419_nas_synology_dns_gandi_04.png)

# Configuration du routeur 

Nous allons mettre en place une redirection du traffic internet entrant vers le NAS Synology par défaut pour que le NAS Synology puisse servir de reverse proxy pour rediriger les utilisateurs vers le serveur local défini en fonction de l'adresse entrante utilisée.

Démarche pour configurer la box internet :
1. Se connecter sur le compte d'administration de la livebox
2. Allez dans le menu `Advanced Parameters`
3. Cliquez sur l'option `Network`

[![Box - Step n°1](/blog/web/20240419_nas_synology_dns_gandi_05.png)](/blog/web/20240419_nas_synology_dns_gandi_05.png)

4. Cliquez sur l'onglet `NAT / PAT`
5. Ajoutez une règle pour rediriger le traffic HTTP entrant vers le NAS Synology et cliquez sur `Create`
    1. Application/Service : Reverse Proxy HTTP
    2. Internal Port : 80
    3. External Port : 80
    4. Protocol : TCP
    5. Equipment : 192.10.10.2
    6. External IP : All
6. Ajoutez une règle pour rediriger le traffic HTTPS entrant vers le NAS Synology et cliquez sur `Create`
    1. Application/Service : Reverse Proxy HTTPS
    2. Internal Port : 443
    3. External Port : 443
    4. Protocol : TCP
    5. Equipment : 192.10.10.2
    6. External IP : All

[![Box - Step n°2](/blog/web/20240419_nas_synology_dns_gandi_06.png)](/blog/web/20240419_nas_synology_dns_gandi_06.png)



# Creation et mise à jour des DNS Gandi.net 

_Attention : la prise en compte d'un changement de DNS peut mettre plusieurs heures en fonction de sa configuration._

Pour créer et mettre à jour les informations sur le DNS de Gandi.net, nous allons utiliser l'API publique de Gandi.net et créer un script qui sera exécuté directement sur le NAS Synology.

##  Création d'un répertoire sur le NAS pour stocker le script à exécuter

1. Allez dans l'application `File Station`
2. Naviguez jusqu'au répertoire `Share`
3. Créer un sous-répertoire `Script`

_Note : L'adresse complète du répertoire sera `volume1/Share/Script`_

## Création d'un script nommé **Gandi_Update_DNS.sh**

Le script `Gandi_Update_DNS.sh` doit être créé dans le répertoire `volume1/Share/Script` du NAS Synology.

Nous définissons les paramètres important du script au début :
- Le jeton d'accès à l'API Gandi sera dans la variable : `TOKEN_GANDI`
- Le nom du domaine sera dans la variable : `DOMAIN_GANDI`
- La liste des sous domaines à mettre à jour seront dans la variable : `RECORDS_GANDI`

A partir de ces informations, nous allons pouvoir mettre en place le script suivant :
```bash
#!/bin/sh

# Configure data
TOKEN_GANDI="<testing_dns_pat>"
DOMAIN_GANDI="testing.com"
RECORDS_GANDI="share vpn game todo" #subdomain listing
RECORD_TYPE_GANDI="A"
RECORD_TTL_GANDI="1200"

RECORD_GANDI=$(echo $RECORDS_GANDI | cut -d" " -f1)

# 1. Get Public IP
CURRENTIP_GANDI=$(curl -s -4 ifconfig.co/ip)
IPLENGTH_GANDI=$(echo -n ${CURRENTIP_GANDI} | wc -m)

# Check that ifconfig.io give me an IP
if [ -z "${CURRENTIP_GANDI}" ]
then
  echo "\n$(date +"%Y-%m-%d %H:%M:%S") - Error - CURRENTIP_GANDI is empty"
  exit 1
fi

if [ ${IPLENGTH_GANDI} -gt 16 ] || [ ${IPLENGTH_GANDI} -lt 7 ]
then
  echo "\n$(date +"%Y-%m-%d %H:%M:%S") - Error - CURRENTIP_GANDI issue : [${CURRENTIP_GANDI}]"
  exit 1
fi


# 2. Get gandi's NS for my domain
NS_GANDI=$(curl -X GET "https://api.gandi.net/v5/livedns/domains/${DOMAIN_GANDI}/nameservers" -H "authorization: Bearer ${TOKEN_GANDI}" | jq '.[0]' | sed 's/"//g')

# 3. Get the last IP recorded
LASTREGISTEREDIP_GANDI=$(/var/packages/DNSServer/target/bin/dig +short ${RECORD_GANDI}.${DOMAIN_GANDI} @${NS_GANDI})
LASTREGISTEREDIPLENGTH_GANDI=$(echo -n ${LASTREGISTEREDIP_GANDI} | wc -m)

if [ -z "${LASTREGISTEREDIP_GANDI}" ]
then
  echo "\n$(date +"%Y-%m-%d %H:%M:%S") - Error - LASTREGISTEREDIP_GANDI is empty"
  exit 1
fi

if [ ${LASTREGISTEREDIPLENGTH_GANDI} -gt 16 ] || [ ${LASTREGISTEREDIPLENGTH_GANDI} -lt 7 ]
then
  echo "\n$(date +"%Y-%m-%d %H:%M:%S") - Error - LASTREGISTEREDIP_GANDI issue : [${LASTREGISTEREDIP_GANDI}]"
  exit 1
fi


# 4. Update if needed
if [ "${CURRENTIP_GANDI}" != "${LASTREGISTEREDIP_GANDI}" ]
then
    for SUB_GANDI in $RECORDS_GANDI; do # Loop on all domaine to use the same IP Address
      echo "\n$(date +"%Y-%m-%d %H:%M:%S") - Info - DNS Record for [$SUB_GANDI] sent"
      curl -X PUT https://api.gandi.net/v5/livedns/domains/${DOMAIN_GANDI}/records/${SUB_GANDI}/${RECORD_TYPE_GANDI} \
              -H "authorization: Bearer ${TOKEN_GANDI}" \
              -H "Content-Type: application/json" \
              -d "{\"rrset_values\": [\"${CURRENTIP_GANDI}\"], \"rrset_ttl\": "${RECORD_TTL_GANDI}"}"
    done
    echo "\n$(date +"%Y-%m-%d %H:%M:%S") - Info - DNS Record has changed !!!!"
    exit 2
fi

exit 0
```

Les grandes étapes sont les suivantes :
1. `curl -s -4 ifconfig.co/ip` (résultat : `90.125.62.14`) : Récupération de notre adresse IP publique actuelle
2. `curl -X GET "https://api.gandi.net/v5/livedns/domains/${DOMAIN_GANDI}/nameservers" -H "authorization: Bearer ${TOKEN_GANDI}" | jq '.[0]' | sed 's/"//g'` : Récupération du `nameserver` principal de [Gandi.net](https://www.gandi.net/en) pour notre domaine `testing.com`
3.  `/var/packages/DNSServer/target/bin/dig +short ${RECORD_GANDI}.${DOMAIN_GANDI} @${NS_GANDI}` : Récupération de l'adresse IP publique enregistrée dans le DNS de [Gandi.net](https://www.gandi.net/en) pour le domaine `testing.com`
4. Dans le cas où l'adresse IP publique actuelle est différente de l'adresse IP publique enregistrée dans le DNS de Gandi.net alors on met à jour l'information pour chaque sous domaine renseigné.


## Automatisation de l'exécution du script **Gandi_Update_DNS.sh**

Pour exécuter automatiquement un script sur le NAS Synology, les étapes sont les suivantes :
1. Cliquez sur le menu `Main menu` (en haut à gauche sur l'écran principal)
2. Cliquez sur l'application `Control Panel`
3. Cliquez sur le menu `Task Scheduler`
4. Cliquez sur le bouton `Create` et sélectionnez l'option `Scheduled Task > User-defined script`
    1. Renseignez les informations de l'onglet `General` et cochez la case `Enabled`
    2. Renseignez les informations de l'onglet `Schedule` avec la fréquence et l'horaire d'exécution du script
    3. Renseignez les informations de l'onglet `Task Settings`
        1. Cochez la case `Send run details by email`
        2. Cochez la case `Send run details only when the scrip terminates abnormally`
        3. Renseignez votre mail pour recevoir les informations en cas d'erreur du script
        4. Renseignez la commande a exécuter dans `User-defined script`. La commande est `bash <script path>/Gandi_Update_DNS.sh`
    4. Cliquez sur le bouton `OK`
5. Vérifiez que la case est bien cochée pour le script ajouté dans l'écran récapitulatif

[![CRON - Step n°1](/blog/web/20240419_nas_synology_dns_gandi_13.png)](/blog/web/20240419_nas_synology_dns_gandi_13.png)

## Résultat de l’exécution du script **Gandi_Update_DNS.sh**

[![Execution - Step n°1](/blog/web/20240419_nas_synology_dns_gandi_14.png)](/blog/web/20240419_nas_synology_dns_gandi_14.png)


# Mise en place du Proxy inversé sur le NAS Synology

Se connecter au NAS Synology et suivre les étapes suivantes :
1. Cliquez sur le menu `Main menu` (en haut à gauche sur l'écran principal)
2. Cliquez sur l'application `Control Panel`
3. Cliquez sur le menu `Login Portal`
4. Cliquez sur l'onglet `Advanced`
5. Cliquez sur le bouton `Reverse Proxy`

[![Proxy - Step n°1](/blog/web/20240419_nas_synology_dns_gandi_09.png)](/blog/web/20240419_nas_synology_dns_gandi_09.png)

6. Cliquez sur le bouton `Create`
7. Renseignez les éléments suivant pour la redirection de l'adresse `vpn.testing.com` vers le serveur n°1 (192.10.10.10) et cliquez sur le bouton `Save`
    1. Reverse Proxy Name : `VPN (HTTPS)`
    2. Source
        1. Protocol : `HTTPS`
        2. Hostname: `vpn.testing.com`
        4. Port : `443`
    3. Destination :
        1. Protocol : `HTTPS`
        2. Hostname : `192.10.10.10`
        3. Port : `443`

[![Proxy - Step n°2](/blog/web/20240419_nas_synology_dns_gandi_10.png)](/blog/web/20240419_nas_synology_dns_gandi_10.png)

8. Recommencez l'opération pour la redirection de l'adresse `game.testing.com`vers le serveur local n°2 (192.10.10.20)
    1. Reverse Proxy Name : `GAME (HTTP)`
    2. Source
        1. Protocol : `HTTP`
        2. Hostname: `game.testing.com`
        4. Port : `80`
    3. Destination :
        1. Protocol : `HTTP`
        2. Hostname : `192.10.10.20`
        3. Port : `80`
9. Recommencez l'opération pour la redirection de l'adresse `todo.testing.com`vers le serveur local n°3 (192.10.10.30)
    1. Reverse Proxy Name : `TODO (HTTP)`
    2. Source
        1. Protocol : `HTTP`
        2. Hostname: `todo.testing.com`
        4. Port : `80`
    3. Destination :
        1. Protocol : `HTTP`
        2. Hostname : `192.10.10.30`
        3. Port : `80`

Résultat de la configuration du Proxy inversé :

[![Proxy - Step n°3](/blog/web/20240419_nas_synology_dns_gandi_11.png)](/blog/web/20240419_nas_synology_dns_gandi_11.png)


