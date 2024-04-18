---
Categories : ["NAS","Synology","VPN"]
Tags : ["NAS","Synology","VPN"]
title : "Mise en place d'un accès VPN avec un NAS Synology"
date : 2024-02-21
draft : false
toc: true
---

Vous trouverez dans cet article, l'ensemble des éléments permettant de mettre en place un accès VPN en utilisant un NAS Synology (et plus précisément le protocol [OpenVPN](https://openvpn.net/faq/what-is-openvpn/) comme serveur VPN et un téléphone sous Android comme client.

 <!--more-->

# Objectif

Pour mettre en place les éléments nécessaires, nous allons réaliser les étapes suivantes :
1. Création d'un utilisateur spécifiques (nommé **vpn**) pour l'accès au VPN
2. Installation de l'application [VPN Server](https://www.synology.com/fr-fr/dsm/packages/VPNCenter)
3. Mise en place d'un certificat [Let's Encrypt](https://letsencrypt.org/)
4. Configuration de l'application [VPN Server](https://www.synology.com/fr-fr/dsm/packages/VPNCenter)
5. Installation et configuration de l'accès VPN sur le téléphone (Android)


# Etapes

## Création d'un utilisateur spécifique pour l'accès au VPN 

Nous allons créer un utilisateur local, nommé **vpn**, au NAS spécifiquement pour être utiliser lors de l'accès au server VPN afin de pouvoir limiter les droits en fonction de nos besoins.

Pour créer l'utilisateur **vpn** :
1. Cliquez sur le menu `Main menu` (en haut à gauche sur l'écran principal)
2. Cliquez sur l'application `Control Panel`
3. Cliquez sur le menu `User & Group`
4. Cliquez sur le bouton `Create` puis sur l'option `Create user`
5. Renseignez les informations concernant le nouvel utilisateur local _(nommé **vpn**)_
6. Cliquez sur le bouton `Save` pour valider les modifications

Formulaire :
[![User - Step n°1](/blog/web/20240221_nas_synology_vpn_server_01.png)](/blog/web/20240221_nas_synology_vpn_server_01.png)

Résultat :
[![User - Step n°2](/blog/web/20240221_nas_synology_vpn_server_02.png)](/blog/web/20240221_nas_synology_vpn_server_02.png)


## Installation de l'application **VPN Server**

Pour installation l'application VPN Server, il faut suivre les étapes suivantes :
1. Cliquez sur le menu `Main menu` (en haut à gauche sur l'écran principal)
2. Cliquez sur l'application `Package Center`
3. Cliquez sur le filtre `All Packages` dans le menu à gauche de l'écran
4. Sélectionnez l'application `VPN Server` et cliquez sur `Install`

_Note : Si l'application `Package Center` vous demande le droit d'installer des dépendances, cliquez sur `Yes`._ 

Pour vérifier que l'application VPN Server est bien installé, il faut suivre les étapes suivantes :
1. Cliquez sur le menu `Main menu` (en haut à gauche sur l'écran principal)
2. Cliquez sur l'application `Package Center`
3. Cliquez sur le filtre `Installed` dans le menu à gauche de l'écran
4. Vous devriez voir l'application `VPN Server` avec l'option `Open`

[![Appli - Step n°1](/blog/web/20240221_nas_synology_vpn_server_03.png)](/blog/web/20240221_nas_synology_vpn_server_03.png)


## Mise en place d'un certificat **Let's Encrypt**

Afin de sécuriser l'accès au VPN, nous allons mettre en place un certificat **Let's Encrypt** pour l'application VPN Server :
1. Cliquez sur le menu `Main menu` (en haut à gauche sur l'écran principal)
2. Cliquez sur l'application `Control Panel`
3. Cliquez sur le menu `Security` et cliquez sur l'onglet `Certificate`
4. Cliquez sur le bouton `Add` pour ajouter un certificat

[![Certif - Step n°1](/blog/web/20240221_nas_synology_vpn_server_04.png)](/blog/web/20240221_nas_synology_vpn_server_04.png)

5. Renseignez la description, sélectionnez l'option `Get a certificate from Let's Encrypt` et cliquez sur le bouton `Next`

[![Certif - Step n°2](/blog/web/20240221_nas_synology_vpn_server_05.png)](/blog/web/20240221_nas_synology_vpn_server_05.png)

6. Renseignez les différents éléments et cliquez sur le bouton `Done` pour valider la création du certificat

[![Certif - Step n°3](/blog/web/20240221_nas_synology_vpn_server_06.png)](/blog/web/20240221_nas_synology_vpn_server_06.png)

Résultat : 
[![Certif - Step n°4](/blog/web/20240221_nas_synology_vpn_server_07.png)](/blog/web/20240221_nas_synology_vpn_server_07.png)


## Configuration de l'application **VPN Server**

Nous allons nous limiter au protocole **OpenVPN** qui nous permettra d'accéder à l'ensemble des services souhaités en se connectant à l'accès VPN. 
Il est aussi possible d'utiliser les protocoles [PPTP](https://fr.wikipedia.org/wiki/Point-to-Point_Tunneling_Protocol) et [L2TP/IPSec](https://fr.wikipedia.org/wiki/Layer_2_Tunneling_Protocol)

Pour accéder au menu de configuration de l'application VPN Server : 
1. Cliquez sur le menu `Main menu` (en haut à gauche sur l'écran principal)
2. Cliquez sur l'application `VPN Server`

[![Config - Step n°1](/blog/web/20240221_nas_synology_vpn_server_08.png)](/blog/web/20240221_nas_synology_vpn_server_08.png)


Les différentes options disponibles :
- **Overview** : Donne l'état actuel de l'utilisation du VPN en fonction de chaque protocole (le nombre de connexion en cours)
- **Connection List** : Donne des informations sur les connexions en cours (nom d'utilisateur, adresse IP, Protocole, uptime)
- **Log** : Message de log des connexions, déconnexions, ...
- **General Settings** : Permet de définir le comportement général de l'application et la sécurité liée
- **Privilege** : Permet de gérer les droits entre les utilisateurs et les protocoles


### Configuration de la partie **Privilege**

Pour l'utilisateur local nommé **vpn**:
1. Sélectionnez le droit d'utilisateur du protocole OpenVPN uniquement
2. Cliquez sur le bouton `Apply` pour valider la modification

[![Config - Step n°2](/blog/web/20240221_nas_synology_vpn_server_09.png)](/blog/web/20240221_nas_synology_vpn_server_09.png)


### Configuration de la partie **General Settings**

Pour la configuration générale : 
1. Renseignez l'option `Network interface` avec l'interface réseau `LAN`
2. Renseignez l'option `Account type` avec la valeur `Local users` pour utiliser les utilisateurs locaux du NAS
3. Vous pouvez activer l'option `Grant VPN permission to newly added local users` si besoin
4. Cliquez sur le bouton `Apply` pour valider les modifications

[![Config - Step n°3](/blog/web/20240221_nas_synology_vpn_server_10.png)](/blog/web/20240221_nas_synology_vpn_server_10.png)

Pour la mise en place d'une sécurité supplémentaire pour l'accès au VPN :
1. Cliquez sur l'option `Set up Auto Block` afin de pouvoir sécuriser l'accès au VPN
2. Cochez la case `Enable auto block` et renseignez les valeurs souhaitées pour le nombre de tentative avant blocage _(5 par défaut)_
3. Cochez la case `Enable DoS protection` sur l'interface réseau `LAN` 
4. Cliquez sur le bouton `Apply` pour valider les modifications

[![Config - Step n°3](/blog/web/20240221_nas_synology_vpn_server_11.png)](/blog/web/20240221_nas_synology_vpn_server_11.png)


### Configuration du protocole OpenVPN

Pour configurer l'accès avec le protocole OpenVPN :
1. Cochez la case `Enable OpenVPN server`
3. Renseignez les différentes informations
4. Cliquez sur le bouton `Apply` pour valider les modifications et activer l'accès au VPN

[![Config - Step n°4](/blog/web/20240221_nas_synology_vpn_server_12.png)](/blog/web/20240221_nas_synology_vpn_server_12.png)


## Installation et configuration de l'accès VPN sur le téléphone (Android)

### Pré-requis : Création du profile
1. Récupération du fichier de profile par défaut sur votre poste : 
    1. Cliquez sur le menu `Main menu` (en haut à gauche sur l'écran principal)
    2. Cliquez sur l'application `VPN Server`
    3. Cliquez sur l'option `OpenVPN`
    4. Cliquez sur le bouton `Export Configuration`
2. Modification du fichier de profile par défaut :
    1. Extraire l'archive `openvpn.zip` contenant le fichier `VPNConfig.ovpn`
    2. Ouvrir le fichier `VPNConfig.ovpn` avec un éditeur de texte et faire les modifications suivantes :
        1. Remplacez le terme `YOUR_SERVER_IP` dans la ligne `remote YOUR_SERVER_IP 6457` par l'adresse IP permettant d'accéder au NAS _(ex : `vpn.testing.com`)_
        2. Ajoutez en dessous de la ligne modifiée à l'étape précédente, la ligne `client-cert-not-required` pour pouvoir se connecter sans avoir besoin d'un certificat côté client
        3. Remplacez la dernière ligne `verify-x509-name 'testing.com' name` par la ligne `verify-x509-name "testing.com" name`
3. Copier le fichier modifié `VPNConfig.ovpn` sur le téléphone



### Installation et configuration de l'accès VPN sur le téléphone

1. Installez l'application `OpenVPN Connect` en utilisant **Google Play Store**

[![Tel - Step n°1](/blog/web/20240221_nas_synology_vpn_server_13.png)](/blog/web/20240221_nas_synology_vpn_server_13.png)

2. Ouvrez l'application et sélectionnez l'onglet `Upload File` pour importer le profile créé _(voir pré-requis)_

[![Tel - Step n°2](/blog/web/20240221_nas_synology_vpn_server_14.png)](/blog/web/20240221_nas_synology_vpn_server_14.png)

3. Sélectionner le fichier `VPNConfig.ovpn` (ajouter en prérequis)
4. Cliquez sur le bouton `OK` pour valider l'import
5. Renseignez les informations nécessaires en utilisant l'utilisateur **vpn** et cliquez sur le bouton `Connect`

[![Tel - Step n°3](/blog/web/20240221_nas_synology_vpn_server_15.png)](/blog/web/20240221_nas_synology_vpn_server_15.png)

Résultat : 
[![Tel - Step n°4](/blog/web/20240221_nas_synology_vpn_server_16.png)](/blog/web/20240221_nas_synology_vpn_server_16.png)






