---
Categories : ["NAS","Synology","VPN"]
Tags : ["NAS","Synology","VPN"]
title : "Set up a VPN access with a Synology NAS"
date : 2024-02-21
draft : true
toc: true
---

In this article, you'll find all the information you need to set up VPN access using a Synology NAS (and more specifically the [OpenVPN] protocol (https://openvpn.net/faq/what-is-openvpn/) as VPN server and an Android phone as client.

 <!--more-->

# Objective

To set up the needed elements, we will perform the following steps:
1. Create a specific user (named **vpn**) for VPN access.
2. Install the [VPN Server](https://www.synology.com/fr-fr/dsm/packages/VPNCenter) application .
3. Install a [Let's Encrypt](https://letsencrypt.org/) certificate
4. Setting up the [VPN Server](https://www.synology.com/fr-fr/dsm/packages/VPNCenter) application
5. Installing and configuring VPN access on the phone (Android)


# 1. Create a specific user for VPN access

We're going to create a local user, named **vpn**, on the NAS specifically to access the VPN server, so that we can limit rights if necessary.

To create the **vpn** user:
1. Click on the `Main menu` (top left on the main screen)
2. Click on the `Control Panel` application
3. Click on the `User & Group` menu
4. Click on the `Create` button, then on the `Create user` option.
5. Fill in the details of the new local user _(named **vpn**)_
6. Click on the `Save` button to validate changes

Form :
[![User - Step n°1](/blog/web/20240221_nas_synology_vpn_server_01.png)](/blog/web/20240221_nas_synology_vpn_server_01.png)

Result :
[![User - Step n°2](/blog/web/20240221_nas_synology_vpn_server_02.png)](/blog/web/20240221_nas_synology_vpn_server_02.png)


# 2. Install the **VPN Server** application

To install the VPN Server application, follow the steps below:
1. Click on `Main menu` (top left of main screen)
2. Click on the `Package Center` application
3. Click on the `All Packages` filter in the menu on the left of the screen
4. Select the `VPN Server` application and click on `Install`.
_Note: If the `Package Center` application asks you to install dependencies, click on `Yes`._

To check that the VPN Server application has been installed, follow the steps below:
1. Click on `Main menu` (top left of main screen)
2. Click on the `Package Center` application
3. Click on the `Installed` filter in the menu on the left of the screen
4. You should see the `VPN Server` application with the `Open` option.
[![Appli - Step n°1](/blog/web/20240221_nas_synology_vpn_server_03.png)](/blog/web/20240221_nas_synology_vpn_server_03.png)


# 3. Install a **Let's Encrypt** certificat

To secure access to the VPN, we're going to set up a **Let's Encrypt** certificate for the VPN Server application:
1. Click on the `Main menu` (top left of main screen)
2. Click on the `Control Panel` application
3. Click on the `Security` menu and click on the `Certificate` tab
4. Click on the `Add` button to add a certificate
[![Certif - Step n°1](/blog/web/20240221_nas_synology_vpn_server_04.png)](/blog/web/20240221_nas_synology_vpn_server_04.png)
5. Fill in the description, select the `Get a certificate from Let's Encrypt`  option and click on the `Next` button
[![Certif - Step n°2](/blog/web/20240221_nas_synology_vpn_server_05.png)](/blog/web/20240221_nas_synology_vpn_server_05.png)
6. Fill in the fields and click on the `Done` button to validate the certificate creation
[![Certif - Step n°3](/blog/web/20240221_nas_synology_vpn_server_06.png)](/blog/web/20240221_nas_synology_vpn_server_06.png)

Result : 
[![Certif - Step n°4](/blog/web/20240221_nas_synology_vpn_server_07.png)](/blog/web/20240221_nas_synology_vpn_server_07.png)


# 4. Setting up the **VPN Server** application

We're going to limit ourselves to the **OpenVPN** protocol, which will enable us to access all the services we require by connecting to the VPN access. 
It is also possible to use the [PPTP](https://fr.wikipedia.org/wiki/Point-to-Point_Tunneling_Protocol) and [L2TP/IPSec](https://fr.wikipedia.org/wiki/Layer_2_Tunneling_Protocol) protocols.

To access the VPN Server application configuration menu : 
1. Click on the `Main menu` (top left of main screen)
2. Click on the `VPN Server` application
[![Config - Step n°1](/blog/web/20240221_nas_synology_vpn_server_08.png)](/blog/web/20240221_nas_synology_vpn_server_08.png)

Available options :
- **Overview** : Shows the current status of VPN usage by protocol (number of connections in progress).
- **Connection List** : Provides information on current connections (username, IP address, protocol, uptime).
- **Log** : Log message for connections, disconnections, ...
- **General Settings**: Defines general application behavior and security.
- **Privilege**: Manage rights between users and protocols



Les différentes options disponibles :
- **Overview** : Donne l'état actuel de l'utilisation du VPN en fonction de chaque protocole (le nombre de connexion en cours)
- **Connection List** : Donne des informations sur les connexions en cours (nom d'utilisateur, adresse IP, Protocole, uptime)
- **Log** : Message de log des connexions, déconnexions etc ....
- **General Settings** : Permet de définir le comportement général de l'application et la sécurité liée
- **Privilege** : Permet de gérer les droits d'utilisation entre les utilisateurs et les protocoles


## Setting up the **Privilege** part

For the local user named **vpn**:
1. Select OpenVPN protocol user rights only
2. Click on the `Apply` button to validate the change.
[![Config - Step n°2](/blog/web/20240221_nas_synology_vpn_server_09.png)](/blog/web/20240221_nas_synology_vpn_server_09.png)


## Setting up the "General Settings" part

For the general configuration : 
1. Set the `Network interface` option to `LAN`.
2. Set `Account type` to `Local users` to use local NAS users.
3. You can enable the `Grant VPN permission to newly added local users` option if required
4. Click on the `Apply` button to validate changes
[![Config - Step n°3](/blog/web/20240221_nas_synology_vpn_server_10.png)](/blog/web/20240221_nas_synology_vpn_server_10.png)

To set up additional security for VPN access :
1. Click on the `Set up Auto Block` option to secure VPN access.
2. Check the `Enable auto block` box and fill in the desired values for the number of attempts before blocking _(default 5)_.
3. Check the `Enable DoS protection` box on the `LAN` network interface. 
4. Click on the `Apply` button to validate changes
[![Config - Step n°3](/blog/web/20240221_nas_synology_vpn_server_11.png)](/blog/web/20240221_nas_synology_vpn_server_11.png)


## Setting up the OpenVPN protocol

To configure access using the OpenVPN protocol :
1. Check the `Enable OpenVPN server` box.
3. Fill in the information
4. Click on the `Apply` button to validate changes and activate VPN access.
[![Config - Step n°4](/blog/web/20240221_nas_synology_vpn_server_12.png)](/blog/web/20240221_nas_synology_vpn_server_12.png)


# 5. Installing and configuring VPN access on the phone (Android)

## Prerequisites: Preparing the profile file
1. Retrieving the default profile file on your workstation : 
    1. Click on `Main menu` (top left of main screen)
    2. Click on the `VPN Server` application
    3. Click on the `OpenVPN` option
    4. Click on the `Export Configuration` button
2. Modifying the default profile file :
    1. Extract archive `openvpn.zip` containing the file `VPNConfig.ovpn`
    2. Open the `VPNConfig.ovpn` file with a text editor and make the following changes :
        1. Replace the term `YOUR_SERVER_IP` in the `remote YOUR_SERVER_IP 6457` line with the IP address used to access the NAS _(e.g. `vpn.testing.com`)_
        2. Below the line modified in the previous step, add the line `client-cert-not-required` to be able to connect without needing a client-side certificate
        3. Replace the last line `verify-x509-name 'testing.com' name` with the line `verify-x509-name "testing.com" name`
3. Copy the modified `VPNConfig.ovpn` file to the phone



## Installing and configuring VPN access on the phone

1. Install the `OpenVPN Connect` application using **Google Play Store**
[![Tel - Step n°1](/blog/web/20240221_nas_synology_vpn_server_13.png)](/blog/web/20240221_nas_synology_vpn_server_13.png)
2. Open the application and select the `Upload File` tab for import the created profile file _(prerequisite)_
[![Tel - Step n°2](/blog/web/20240221_nas_synology_vpn_server_14.png)](/blog/web/20240221_nas_synology_vpn_server_14.png)
3. Select the `VPNConfig.ovpn` file
4. click on the `OK` button to validate the import
5. Fill in the necessary information using the **vpn** user and click on the `Connect` button.
[![Tel - Step n°3](/blog/web/20240221_nas_synology_vpn_server_15.png)](/blog/web/20240221_nas_synology_vpn_server_15.png)

Result : 
[![Tel - Step n°4](/blog/web/20240221_nas_synology_vpn_server_16.png)](/blog/web/20240221_nas_synology_vpn_server_16.png)






