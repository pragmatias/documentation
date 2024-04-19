---
Categories : ["NAS","Synology","DNS"]
Tags : ["NAS","Synology","DNS"]
title : "Updating Gandi.net DNS and using a Reverse Proxy with a Synology NAS"
date : 2024-04-19
draft : false
toc: true
---

In this article, you'll find everything you need to update [Gandi.net](https://www.gandi.net/en) [DNS](https://en.wikipedia.org/wiki/Domain_Name_System) from a [Synology NAS](https://www.synology.com/en-en/products/DS223), as well as to set up a reverse proxy for your services on your local network.

 <!--more-->

# Goal

## Context

We would like to use a personal domain name from [Gandi.net](https://www.gandi.net/en) named `testing.com` to access the available services behind a personal internet access (Livebox router) according to the sub-domains defined.

We have a local network containing the following equipment:
- Livebox router with local address 192.10.10.1 _(Public address : 90.125.62.14)_
- Synology NAS with local address 192.10.10.2
- Local server n°1 to host the VPN service with local address 192.10.10.10
- Local server n°2 to host the GAME service with local address 192.10.10.20
- Local server n°3 to host the TODO service with local address 192.10.10.30

We have an active `testing.com` domain name at [Gandi.net](https://www.gandi.net/en).

[![Obj - Step n°0](/blog/web/20240419_nas_synology_dns_gandi_12.png)](/blog/web/20240419_nas_synology_dns_gandi_12.png)


Schema :

[![Obj - Step n°1](/blog/web/20240419_nas_synology_dns_gandi_07.png)](/blog/web/20240419_nas_synology_dns_gandi_07.png)


## Constraint

The Livebox router can only manage IPv4, the public IP address is not fixed and we don't know when it changes, so we need to be able to check our public IP address regularly to update Gandi.net's DNS when necessary.


## Use

- When a user wants to access the url `https://vpn.testing.com` then he must be automatically redirected to local server n°1.
- When a user wants to access the url `http://game.testing.com` then he must be automatically redirected to local server n°2.
- When a user wants to access the url `http://todo.testing.com` then he must be automatically redirected to local server n°3.
- When a user wants to access the url `htpps://share.testing.com` then he should be automatically redirected to the Synology NAS.

Schema : 
[![Obj - Step n°2](/blog/web/20240419_nas_synology_dns_gandi_08.png)](/blog/web/20240419_nas_synology_dns_gandi_08.png)


## List of steps

To set up the necessary elements, we will do the following steps:
1. Create an access token to the [Gandi.net](https://www.gandi.net/en) API
2. Configure the Livebox router to redirect incoming internet traffic to the Synology NAS.
3. Create and update [Gandi.net](https://www.gandi.net/en) DNS with the Public IP address associated with the Livebox router.
4. Set up a reverse proxy on the Synology NAS to access the servers.




# Create an access token to the Gandi.net API

The access token will enable us to use the API provided by [Gandi.net](https://www.gandi.net/en) to automate the necessary modifications to DNS records when changing public IP addresses.

How to create an access token :
1. Log in to your administration account at [Gandi.net](https://www.gandi.net/en)
2. Click on the `Organizations` menu

[![Token - Step n°1](/blog/web/20240419_nas_synology_dns_gandi_01.png)](/blog/web/20240419_nas_synology_dns_gandi_01.png)

3. Click on the organization of your choice
4. Click on the `Sharing` tab

[![Token - Step n°2](/blog/web/20240419_nas_synology_dns_gandi_02.png)](/blog/web/20240419_nas_synology_dns_gandi_02.png)

5. In the `Personal Access Token (PAT)` part, click on the `Create a token` button
6. Fill in the necessary data
    1. Enter token name (e.g. `testing_dns_pat`)
    2. Select the token validity period between 7 days and 1 year (e.g. `7 days`)
    3. Check the `Restrict to selected products` box and select the desired domain (ex: `testing.com`)
    4. Check the `See and renew domain names` box
    5. Check box `Manage domain technical configurations`
    6. Click on the `Create` button

[![Token - Step n°3](/blog/web/20240419_nas_synology_dns_gandi_03.png)](/blog/web/20240419_nas_synology_dns_gandi_03.png)

7. Copy the access token you've created to a secure location, as it will no longer be accessible

[![Token - Step n°4](/blog/web/20240419_nas_synology_dns_gandi_04.png)](/blog/web/20240419_nas_synology_dns_gandi_04.png)

# Setting up the router

We're going to set up a redirection of incoming Internet traffic to the Synology NAS by default, so that the Synology NAS can act as a reverse proxy to redirect users to the local server defined according to the incoming address used.

How to configure your Internet box :
1. Log in to the livebox administration account
2. Go to `Advanced Parameters` menu
3. Click on `Network` option

[![Box - Step n°1](/blog/web/20240419_nas_synology_dns_gandi_05.png)](/blog/web/20240419_nas_synology_dns_gandi_05.png)

4. Click on the `NAT / PAT` tab
5. Add a rule to redirect incoming HTTP traffic to the Synology NAS and click `Create`.
    1. Application/Service : Reverse Proxy HTTP
    2. Internal Port : 80
    3. External Port : 80
    4. Protocol : TCP
    5. Equipment : 192.10.10.2
    6. External IP : All
6. Add a rule to redirect incoming HTTPS traffic to the Synology NAS and click `Create`.
    1. Application/Service : Reverse Proxy HTTPS
    2. Internal Port : 443
    3. External Port : 443
    4. Protocol : TCP
    5. Equipment : 192.10.10.2
    6. External IP : All

[![Box - Step n°2](/blog/web/20240419_nas_synology_dns_gandi_06.png)](/blog/web/20240419_nas_synology_dns_gandi_06.png)




# Creating and updating Gandi.net DNS 

_Warning: it may take several hours for a DNS change to take effect, depending on its configuration._

To create and update Gandi.net's DNS information, we're going to use Gandi.net's public API and create a script that will be run directly on the Synology NAS.

##  Create a directory on the NAS to store the script to be executed

1. Go to the `File Station` application
2. Navigate to the `Share` directory
3. Create a `Script` sub-directory

_Note : The complete address of the directory will be `volume1/Share/Script`_

## Create a script named **Gandi_Update_DNS.sh**

The `Gandi_Update_DNS.sh` script must be created in the `volume1/Share/Script` directory on the Synology NAS.

We define the important parameters of the script at the beginning :
- The Gandi API access token will be in the variable: `TOKEN_GANDI`.
- The domain name will be in the variable: `DOMAIN_GANDI`.
- The list of sub-domains to be updated will be in the variable: `RECORDS_GANDI`.

Based on this information, we can create the following script :
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

The major steps are as follows :
1. `curl -s -4 ifconfig.co/ip` (result : `90.125.62.14`) : Get our current public IP address
2. `curl -X GET "https://api.gandi.net/v5/livedns/domains/${DOMAIN_GANDI}/nameservers" -H "authorization: Bearer ${TOKEN_GANDI}" | jq '.[0]' | sed 's/"//g'` : Retrieving the main [Gandi.net](https://www.gandi.net/en) `nameserver` for our `testing.com` domain
3.  `/var/packages/DNSServer/target/bin/dig +short ${RECORD_GANDI}.${DOMAIN_GANDI} @${NS_GANDI}` : Retrieving the public IP address registered in the DNS of [Gandi.net](https://www.gandi.net/en) for the domain `testing.com`
5. If the current public IP address is different from the public IP address registered in Gandi.net's DNS, then the information is updated for each sub-domain entered


## Automate execution of **Gandi_Update_DNS.sh** script

To automatically run a script on the Synology NAS, follow these steps:
1. Click on the `Main menu` (top left on the main screen)
2. Click on the `Control Panel` application
3. Click on the `Task Scheduler` menu
4. Click on the `Create` button and select the `Scheduled Task > User-defined script` option
    1. Fill in the information on the `General` tab and check the `Enabled` box
    2. Fill in the information on the `Schedule` tab, with the frequency and time of script execution
    3. Fill in the `Task Settings` tab
        1. Check box `Send run details by email`
        2. Check box `Send run details only when the scrip terminates abnormally`
        3. Enter your e-mail address to receive information in the event of script error
        4. Enter the command to be executed in `User-defined script`. The command is `bash <script path>/Gandi_Update_DNS.sh`
    4. Click on the `OK` button
5. Check that the box is ticked for the added script in the summary screen

[![CRON - Step n°1](/blog/web/20240419_nas_synology_dns_gandi_13.png)](/blog/web/20240419_nas_synology_dns_gandi_13.png)

### Result of the **Gandi_Update_DNS.sh** script execution

[![Execution - Step n°1](/blog/web/20240419_nas_synology_dns_gandi_14.png)](/blog/web/20240419_nas_synology_dns_gandi_14.png)


# Setting up reverse proxy on Synology NAS

Connect to the Synology NAS and follow the steps below:
1. Click on the `Main menu` (top left of the main screen)
2. Click on the `Control Panel` application
3. Click on the `Login Portal` menu
4. Click on the `Advanced` tab
5. Click on the `Reverse Proxy` button

[![Proxy - Step n°1](/blog/web/20240419_nas_synology_dns_gandi_09.png)](/blog/web/20240419_nas_synology_dns_gandi_09.png)

6. Click on the `Create` button
7. Fill in the following information to redirect the address `vpn.testing.com` to server n°1 (192.10.10.10) and click on the `Save` button.
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

8. Repeat the operation to redirect the `game.testing.com` address to local server n°2 (192.10.10.20)
    1. Reverse Proxy Name : `GAME (HTTP)`
    2. Source
        1. Protocol : `HTTP`
        2. Hostname: `game.testing.com`
        4. Port : `80`
    3. Destination :
        1. Protocol : `HTTP`
        2. Hostname : `192.10.10.20`
        3. Port : `80`
9. Repeat the operation to redirect the `todo.testing.com` address to local server n°3 (192.10.10.30)
    1. Reverse Proxy Name : `TODO (HTTP)`
    2. Source
        1. Protocol : `HTTP`
        2. Hostname: `todo.testing.com`
        4. Port : `80`
    3. Destination :
        1. Protocol : `HTTP`
        2. Hostname : `192.10.10.30`
        3. Port : `80`

Result of reverse proxy configuration :

[![Proxy - Step n°3](/blog/web/20240419_nas_synology_dns_gandi_11.png)](/blog/web/20240419_nas_synology_dns_gandi_11.png)


