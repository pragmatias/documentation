---
Categories : ["Databricks","Unity Catalog"]
Tags : ["Databricks","Unity Catalog"]
title : "Databricks : Unity Catalog - Découverte - Mise en place"
date : 2023-05-04
draft : false
toc: true
---

Nous allons découvrir la solution [Unity Catalog](https://docs.databricks.com/data-governance/unity-catalog/index.html) de Databricks et plus particulièrement comment la mettre en place sur un workspace existant.

Nous allons utiliser un Account Databricks sur AWS pour réaliser cette démonstration.

_Note : Nous allons garder des termes techniques en anglais pour faciliter la compréhension_

<!--more-->

# Qu'est-ce qu'un métastore

Un métastore est un référentiel permettant de stocker un ensemble de métadonnées liés aux données (stockage, usage, options).

Une métadonnée est une information sur une donnée permettant de définir son contexte (description, droits, date et heure technique de création ou mise à jour, créateur, ...) et son usage (stockage, structure, accès, ...).

Un métastore peut être local à une instance d'une ressource (un cluster, un workspace) ou central à l'ensemble des ressources gérant des données.

Dans une entreprise ayant une gouvernance de données basée sur un modèle Data Lake, Datawarehouse ou Lakehouse par exemple, nous allons conseiller de mettre en place un métastore centralisé permettant de stocker l'ensemble des métadonnées des données de l'entreprise pour pouvoir faciliter la gouvernance, l'usage et le partage des données à l'ensemble des équipes.



# Qu'est ce que la solution Unity Catalog

Unity Catalog est la solution de Databricks permettant d'avoir une gouvernance unifiée et centralisée pour l'ensemble des données gérées par les ressources Databricks ainsi que de sécuriser et faciliter la gestion et le partage des données à l'ensemble des acteurs internes et externes d'une organisation.

L'utilisation interne se fait en partageant un métastore d'Unity Catalog sur l'ensemble des workspaces Databricks.

L'utilisation externe se fait en utilisant la fonctionnalité "Delta Sharing" de l'Unity Catalog ou par l'usage de la fonctionnalité SQL Warehouse par un outil externe (connecteur JDBC, ODC ou partenaires databricks).


Quelques exemples de fonctionnalités proposées par la solution Unity Catalog :
- Gestion des droits sur les objets par des groupes et des utilisateurs en utilisant une syntaxe SQL ANSI
- Gestion des objets permettant d'être créés dans un workspace Databricks et utilisés par l'ensemble des workspaces Databricks utilisant Unity Catalog
- Possibilité de partager les données de manière simple et sécurisée en passant par la fonctionnalité Delta Sharing
- Permet de capturer des informations sur le cycle de vie et la provenance des données (Data Lineage)
- Permet de capturer l'ensemble des logs pour être en capacité de faire l'audit des accès et de l'utilisation des données


Vous pourrez avec une vue d'ensemble plus complète en parcourant la [documentation officielle](https://docs.databricks.com/data-governance/unity-catalog/index.html)



# Hiérarchie des objets

Avant d'aller plus loin, nous allons introduire la hiérarchie des objets au sein de la solution Unity Catalog.
Nous allons nous concentrer uniquement sur les éléments nécessaires à la mise en place de la solution Unity Catalog.

Schématisation de la hiérarchie des objets : 
[![schema_01](/blog/web/20230504_databricks_unity_catalog_schema_01.png)](/blog/web/20230504_databricks_unity_catalog_schema_01.png) 


La hiérarchie des objets est constituée des trois niveaux suivants :
1. Metastore (métastore) :
    1. C'est l'objet le plus haut niveau pouvant contenir des métadonnées
    2. Il ne peut y avoir qu'un seul Metastore par région
    3. Un Metastore doit être rattaché à un Workspace pour pouvoir être utilisé
    4. Le Metastore doit avoir la même région que le Workspace auquel il est rattaché
2. Catalog (catalogue) :
    1. C'est le 1er niveau de la hiérarchie permettant d'organiser les données
    2. Il permet d'organiser les objets (données) par Schéma (aussi nommé Base de données)
    3. Si l'on souhaite pouvoir avoir plusieurs environnements dans un même Metastore (dans une même région) alors on pourra créer un Catalog par environnement
3. Schema (schéma ou base de données) : 
    1. C'est le 2ème et dernier niveau de la hiérarchie permettant d'organiser les données
    2. Ce niveau permet de stocker l'ensemble des métadonnées sur les objets de type Table, Vue ou Fonction

Lorsque vous souhaitez accéder à un objet (par exemple une table), il sera nécessaire de renseigner le catalogue et le schéma où est défini l'objet.
Exemple : `select ... from catalog.schema.table`



Objet utilisé par la solution Unity Catalog pour gérer l'accès global aux données :
- Storage Credential : Cet objet est associé directement au Metastore et permet de stocker les accès à un cloud provider (par exemple AWS S3) permettant à la solution Unity Catalog de gérer les droits sur les données.

Objets utilisés par la solution Unity Catalog pour stocker et gérer les métadonnées (usage des données):
- Table : Objet permettant de définir la structure et le stockage des données. 
    - Managed Table : Table dont la donnée est directement gérée par la solution Unity Catalog et dont le format est Delta
    - External Table :  Table dont la donnée n'est pas directement gérée par la solution Unity Catalog (l'utilisateur défini le chemin d'accès à la donnée) et dont le format peut être Delta, CSV, JSON, Avro, Parquet, ORC ou Texte
- View (Vue) : Objet permettant d'encapsuler une requête utilisant un ou plusieurs objets (table ou vue)
- Function (Fonction) : Objet permettant de définir des opérations sur les données


Quelques informations concernant les quotas des objets sur la solution Unity Catalog :
- Un Metastore peut contenir jusqu'à 1000 catalogues
- Un Metastore peut contenir jusqu'à 200 objets Storage Credential
- Un catalogue peut contenir jusqu'à 10000 schémas
- Un schéma peut contenir jusqu'à 10000 tables (ou vues) et 10000 fonctions


# Contexte 

Pour cette démonstration, nous allons nous concentrer uniquement sur la mise en place d'un Metastore de la solution Unity Catalog sur un Account Databricks sur AWS.

Dans un contexte projet/entreprise, il est recommandé d'utiliser l'outil Terraform afin de pouvoir gérer l'infrastructure avec du code (IaC) et rendre reproductible les éléments.

Dans le contexte de cette démonstration, nous allons volontairement utiliser des lignes de commandes pour rendre plus clair et didactique notre démarche.

Nous allons utiliser principalement les deux outils suivants :
- Databricks CLI : Interface de ligne de commande permettant de faciliter l'utilisation et la configuration des ressources Databricks
- AWS CLI : Interface de ligne de commande permettant de faciliter l'utilisation et la configuration des ressources AWS


## Schématisation

Schéma de l'ensemble des éléments que nous allons mettre en place pour pouvoir utiliser la solution Unity Catalog avec un Workspace Databricks.

[![schema_02](/blog/web/20230504_databricks_unity_catalog_schema_02.png)](/blog/web/20230504_databricks_unity_catalog_schema_02.png) 


## Prérequis

Les éléments suivants sont nécessaires avant de démarrer les actions :
- Le Workspace doit être dans un plan Premium ou supérieur
- Vous devez avoir un Account Databricks sur AWS
- Vous devez avoir un Workspace Databricks basé sur la région "eu-west-1"
- Vous devez avoir un compte utilisateur Databricks avec les droits d'administration sur l'Account Databricks
- Vous devez avoir un compte utilisateur AWS avec les droits d'administration sur les ressources AWS S3 et AWS IAM


Afin d'utiliser les outils Databricks CLI et AWS CLI vous devez avoir créé les éléments suivants :
- Un Token Utilisateur pour Databricks pour utiliser Databricks CLI
- Un Token Utilisateur AWS pour utiliser AWS CLI
_Note : Vous trouverez la démarche pour la configuration des outils AWS CLI et Databricks CLI dans les ressources de cette article_


Information concernant le rôle global Databricks pour la gestion des accès AWS par Unity Catalog :
- AWS IAM Role Unity Catalog : `arn:aws:iam::414351767826:role/unity-catalog-prod-UCMasterRole-14S5ZJVKOTYTL`
- AWS IAM ExternalId Unity Catalog : `65377825-bfee-466e-9a14-16a53b9a4e12`

Information concernant le Databricks Workspace ID :
- En se basant sur l'URL du Workspace Databricks `https://<databricks-instance>.com/o=XXXXX`, le Databricks Workspace ID est le numéro représenté par `XXXXX`.


## Les étapes à réaliser

Pour mettre en place la solution Unity Catalog et créer le Metastore nécessaire, nous allons réaliser les étapes suivantes :
1. Création d'une ressource AWS S3
2. Création d'une Politique (Policy) et d'un Rôle (AWS IAM) pour gérer l'accès à la ressource AWS S3 avec la ressource AWS IAM
3. Création d'un Metastore
4. Création d'un Storage Credential
5. Association d'un Storage Credential à un Metastore
6. Association d'un Metastore avec un Workspace Databricks


# Mise en place

## Étape n°0 : Initialisation des variables d'environnement

Création des variables d'environnement permettant de définir les nommage et de faciliter la rédaction des commandes
```bash
# AWS Variables
export AWS_S3_DBX_UC="s3-dbx-metastore-uc"
export AWS_IAM_ROLE_DBX_UC="role-dbx-metastore-uc"
export AWS_IAM_POLICY_DBX_UC="policy-dbx-metastore-uc"
export AWS_TAGS='{"TagSet": [{"Key": "owner","Value": "admin"},{"Key": "project","Value": "databricks"}]}'

# Databricks Variables
export DBX_WORKSPACE_ID="0000000000000000"
export DBX_METASTORE_NAME="metastor-sandbox"
export DBX_METASTORE_SC="sc-metastore-sandbox"


# AWS Variables to define during the steps executions
export AWS_IAM_ROLE_DBX_UC_ARN=""
export AWS_IAM_POLICY_DBX_UC_ARN=""

# Databricks Variables to define during the steps executions
export DBX_METASTORE_ID=""
export DBX_METASTORE_SC_ID=""

```


## Étape n°1 : Création de la ressource AWS S3

Cette ressource AWS S3 sera utilisée par Unity Catalog pour stocker les données des objets "Managed" et les métadonnées.

Exécution des commandes suivantes en s'appuyant sur AWS CLI : 
```bash
# Bucket creation
aws s3api create-bucket --bucket ${AWS_S3_DBX_UC} --create-bucket-configuration LocationConstraint=eu-west-1
# Add Encryption information
aws s3api put-bucket-encryption --bucket ${AWS_S3_DBX_UC} --server-side-encryption-configuration '{"Rules": [{"ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"},"BucketKeyEnabled": true}]}'
# Revoke public access
aws s3api put-public-access-block --bucket ${AWS_S3_DBX_UC} --public-access-block-configuration '{"BlockPublicAcls": true,"IgnorePublicAcls": true,"BlockPublicPolicy": true,"RestrictPublicBuckets": true}'
# Add ownership controls information
aws s3api put-bucket-ownership-controls --bucket ${AWS_S3_DBX_UC} --ownership-controls '{"Rules": [{"ObjectOwnership": "BucketOwnerEnforced"}]}'
# Add tags
aws s3api put-bucket-tagging --bucket ${AWS_S3_DBX_UC} --tagging ${AWS_TAGS}
```


## Étape n°2 : Création d'une politique et d'un rôle avec la ressource AWS IAM

La politique et le rôle vont permettre de donner les droits d'administration à la solution Unity Catalog pour gérer les accès aux données.

Exécution des commandes suivantes en s'appuyant sur AWS CLI :
```bash

# Create JSON config file for role creation (init)
cat > tmp_role_document.json <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "AWS": [
                    "arn:aws:iam::414351767826:role/unity-catalog-prod-UCMasterRole-14S5ZJVKOTYTL"
                ]
            },
            "Action": "sts:AssumeRole",
            "Condition": {
                "StringEquals": {
                    "sts:ExternalId": "65377825-bfee-466e-9a14-16a53b9a4e12"
                }
            }
        }
    ]
}
EOF



# Role creation
aws iam create-role --role-name ${AWS_IAM_ROLE_DBX_UC} --assume-role-policy-document file://tmp_role_document.json
# Get the role ARN
export AWS_IAM_ROLE_DBX_UC_ARN=`aws_ippon_dtl iam get-role --role-name ${AWS_IAM_ROLE_DBX_UC} | jq '.Role.Arn'`



# Create JSON config file for role update
cat > tmp_role_document_update.json <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "AWS": [
                    ${AWS_IAM_ROLE_DBX_UC_ARN},
                    "arn:aws:iam::414351767826:role/unity-catalog-prod-UCMasterRole-14S5ZJVKOTYTL"
                ]
            },
            "Action": "sts:AssumeRole",
            "Condition": {
                "StringEquals": {
                    "sts:ExternalId": "65377825-bfee-466e-9a14-16a53b9a4e12"
                }
            }
        }
    ]
}
EOF

# Add reference on himself
aws iam update-assume-role-policy --role-name ${AWS_IAM_ROLE_DBX_UC}  --policy-document file://tmp_role_document_update.json
# Add tags
aws iam tag-role --role-name ${AWS_IAM_ROLE_DBX_UC} --tags ${AWS_TAGS}
# Add description
aws iam update-role-description --role-name ${AWS_IAM_ROLE_DBX_UC} --description 'This role is used for storing Databricks Unity Catalog metadata to S3 Resources'




# Create JSON config file for policy creation
cat > tmp_policy_document.json <<EOF
{
 "Version": "2012-10-17",
 "Statement": [
     {
         "Action": [
             "s3:GetObject",
             "s3:PutObject",
             "s3:DeleteObject",
             "s3:ListBucket",
             "s3:GetBucketLocation",
             "s3:GetLifecycleConfiguration",
             "s3:PutLifecycleConfiguration"
         ],
         "Resource": [
             "arn:aws:s3:::${AWS_S3_DBX_UC}/*",
             "arn:aws:s3:::${AWS_S3_DBX_UC}"
         ],
         "Effect": "Allow"
     },
     {
         "Action": [
             "sts:AssumeRole"
         ],
         "Resource": [
             ${AWS_IAM_ROLE_DBX_UC_ARN}
         ],
         "Effect": "Allow"
     }
   ]
}
EOF

# Policy creation
aws iam create-policy --policy-name ${AWS_IAM_POLICY_DBX_UC} --policy-document file://tmp_policy_document.json > tmp_result_creation_policy.json
# Get Policy ARN
export AWS_IAM_POLICY_DBX_UC_ARN=`cat tmp_result_creation_policy.json | jq '.Policy.Arn'`
# Add tags
aws iam tag-policy --policy-arn ${AWS_IAM_POLICY_DBX_UC_ARN} --tags ${AWS_TAGS}


# Attach Policy to the Role
aws iam attach-role-policy --role-name ${AWS_IAM_ROLE_DBX_UC}  --policy-arn ${AWS_IAM_POLICY_DBX_UC_ARN}


# Delete temporary JSON files
rm tmp_role_document_update.json
rm tmp_role_document.json
rm tmp_policy_document.json
rm tmp_result_creation_policy.json
```

## Step n°3 : Création d'un Metastore 

Création d'un Metastore Unity Catalog dans la même région que le Workspace avec lequel nous voulons l'utiliser.

Exécution des commandes suivantes en s'appuyant sur Databricks CLI :
```bash
# Create metastore
databricks unity-catalog metastores create --name ${DBX_METASTORE_NAME} \
                                           --storage-root s3://${AWS_S3_DBX_UC}/${DBX_METASTORE_NAME}


# Get the metastore ID
export DBX_METASTORE_ID=`databricks unity-catalog metastores get-summary | jq 'select(.name == $ENV.DBX_METASTORE_NAME) | .metastore_id'`

# Check the metastore ID (it must not be empty)
echo ${DBX_METASTORE_ID}

```




## Étape n°4 : Création d'un Storage Credential 

Création d'un Storage Credential pour stocker les accès pour le rôle global Databricks sur la ressource AWS S3 utilisée pour stocker les données du Metastore.

Exécution des commandes suivantes en s'appuyant sur Databricks CLI :
```bash
# Create JSON config file
cat > tmp_databricks_metastore_storagecredential.json <<EOF
{
  "name": ${DBX_METASTORE_SC},
  "aws_iam_role": {
    "role_arn": ${AWS_IAM_ROLE_DBX_UC_ARN}
  },
  "comment" : "Storage Credential for Unity Catalog Storage"
}
EOF

# Create Storage Credential
databricks unity-catalog storage-credentials create --json-file tmp_databricks_metastore_storagecredential.json

# Get Storage Credential ID
export DBX_METASTORE_SC_ID=`databricks unity-catalog storage-credentials get --name ${DBX_METASTORE_SC} | jq '.id'`

# Delete temporary files
rm tmp_databricks_metastore_storagecredential.json
```





## Étape n°5 : Association d'un Storage Credential avec un Metastore

Afin que le Metastore puisse utiliser le Storage Credential pour accéder à la ressource AWS S3 et pour pouvoir gérer les accès sur les données pour l'ensemble des utilisateurs, nous devons associer le Storage Credential au Metastore.

Exécution des commandes suivantes en s'appuyant sur Databricks CLI :
```bash
# Create JSON config file
cat > tmp_databricks_metastore_update_sc.json <<EOF
{
  "default_data_access_config_id": ${DBX_METASTORE_SC_ID},
  "storage_root_credential_id": ${DBX_METASTORE_SC_ID}
}
EOF

# Update Metastore with the Storage Credential
databricks unity-catalog metastores update --id ${DBX_METASTORE_ID} \
                                           --json-file tmp_databricks_metastore_update_sc.json

# Delete temporary files
rm tmp_databricks_metastore_update_sc.json
```




## Étape n°6 : Association d'un Metastore à un Workspace Databricks

Pour pouvoir utiliser le Metastore avec un Workspace Databricks, il est nécessaire d'assigner le Metastore au Workspace Databricks au niveau de l'account Databricks.
Note : il est possible de définir le nom du catalogue par défaut pour les utilisateurs du Workspace.

Exécution des commandes suivantes en s'appuyant sur Databricks CLI :
```bash
databricks unity-catalog metastores assign --workspace-id ${DBX_WORKSPACE_ID} \
                                           --metastore-id ${DBX_METASTORE_ID} \
                                           --default-catalog-name main
```



## Étape n°7 : Nettoyage des variables d'environnements

Nous pouvons supprimer l'ensemble des variables d'environnements utilisées lors de la mise en place d'Unity Catalog.

```bash
# Clean the AWS & Databricks Attributes
unset AWS_S3_DBX_UC
unset AWS_IAM_ROLE_DBX_UC
unset AWS_IAM_POLICY_DBX_UC
unset AWS_TAGS
unset DBX_WORKSPACE_ID
unset DBX_METASTORE_NAME
unset DBX_METASTORE_SC
unset AWS_IAM_ROLE_DBX_UC_ARN
unset AWS_IAM_POLICY_DBX_UC_ARN
unset DBX_METASTORE_ID
unset DBX_METASTORE_SC_ID
```



# Conclusion


A l'aide des outils Databricks CLI et AWS CLI, nous avons pu très facilement mettre en place un Metastore sur notre Workspace Databricks afin de pouvoir utiliser la solution Unity Catalog.

Cela nous a permis de mettre en place simplement une solution permettant de gérer notre référentiel centralisé de métadonnées pour l'ensemble des données gérées et manipulées par nos ressources Databricks (Cluster et SQL Warehouse).


Les avantages de l'utilisation de la solution Unity Catalog : 
- Unity Catalog permet de simplifier et centraliser la gestion des droits sur l'ensemble des objets gérés.
- Unity Catalog permet de sécuriser, faciliter et multiplier les usages sur les données grâce aux nombreux connecteurs pour SQL Warehouse ainsi que la possibilité d'exporter les informations vers d'autres outils de gestion de catalogue de données.
- Unity Catalog est un outil qui s'améliore régulièrement et qui devrait devenir la référence pour la gouvernance des données pour tous ceux qui utilisent Databricks.



Quelques informations concernant les limitations sur la solution Unity Catalog : 
- Le Workspace Databricks doit être au moins au niveau premium pour pouvoir utiliser la solution Unity Catalog
- Un Metastore doit contenir l'ensemble des éléments concernant une région. 
- Il est recommandé d'utiliser un cluster avec le Databricks Runtime en version 11.3 LTS (DBR) ou supérieur 
- La création d'un Storage Credential n'est possible qu'avec un rôle AWS IAM lorsque l'Account Databricks est sur AWS
- Une partie de la gestion des utilisateurs et groupes doit se faire au niveau de l'Account Databricks et non plus seulement au niveau du Workspace Databricks
- Les groupes définis localement dans un Workspace Databricks ne peuvent pas être utilisés avec Unity Catalog, il est nécessaire de les recréer au niveau de l'Account Databricks pour pouvoir les utiliser avec la solution Unity Catalog (Migration).



# Ressources

## Glossaire

- Account Databricks : Niveau le plus haut pour l'administration de Databricks
- Cluster Databricks : Ensemble de ressources de calcul permettant d'exécuter des traitements Spark avec Databricks
- Workspace Databricks : Espace de travail dans Databricks
- Databricks Workspace ID : Identifiant du workspace Databricks
- Storage Credential : Objet permettant le stockage des accès par la solution Unity Catalog
- Data Lake : Lac de données permettant de stocker des données structurée, semi-structurée ou non structurée
- Data Warehouse : Entrepôt de données permettant de stocker des données structurées (Base de données relationnelle)
- Lakehouse : Architecture de gestion des données qui combine les avantages d'un lac de données et  les fonctionnalités de gestion d'un entrepôt de données
- Metastore : un métastore dans la solution Unity Catalog
- Catalog (Catalgoue) : Objet de la solution Unity Catalog permettant d'organiser les données (objets) par Schéma
- External Table (Table externe) : Table dont la donnée n'est pas directement géré par la solution Unity Catalog (l'utilisateur défini le chemin d'accès à la donnée)
- Managed Table (Table managée) : Table dont la donnée est directement géré par la solution Unity Catalog 
- Databricks CLI : Interface de ligne de commande permettant de faciliter l'utilisation et la configuration des ressources Databricks
- AWS CLI : Interface de ligne de commande permettant de faciliter l'utilisation et la configuration des ressources AWS
- AWS S3 : Service AWS Simple Storage permettant de stocker des données/objets
- AWS IAM : Service AWS Identity and Access Management permettant de contrôler l'accès aux services et aux ressources AWS.
- AWS IAM Policy : Politique de droit sur AWS IAM



## Gestion de la connexion pour l'outil AWS CLI

1. Installez l'outil `AWS CLI` sur macOS avec l'outil Homebrew :  `brew install awscli`

2. Définissez un utilisateur spécifique pour AWS CLI : _(pour l'exemple, nous avons pris le nom `usr_adm_cli`)_
    1. Allez sur `AWS IAM > Users`
    2. Cliquez sur `Add users`
    3. Renseigner l'information "User Name" : `usr_adm_cli` et cliquez sur `Next`
    4. Si vous avez un groupe d'administration (AWS IAM Group) déjà défini : 
        1. Sélectionnez `Add user to group`
        2. Sélectionnez le groupe souhaité :  `FullAdmin` et cliquez sur `Next`
    5. Si vous avez une politique d'administration (AWS IAM Policy) déjà définie :
        1. Sélectionnez `Attach policies directly`
        2. Sélectionnez la politique souhaitée : `AdministratorAccess` et cliquez sur `Next`
    6. Si vous souhaitez définir des tags : Cliquez sur `Add new tag` et ajoutez les informations souhaités
    7. Cliquez sur `Create user`
    8. Sélectionnez l'utilisateur créé `usr_adm_cli`
    9. Cliquez sur `Security credentials`
    10. Cliquez sur `Create access key`
    11. Sélectionnez `Command Line Interface (CLI)`, cochez sur l'option `I understand the above .... to proceed to create an access key` et cliquez sur `Next`
    12. Renseignez l'information `Description tag value` : `administration` et cliquez sur `Create access key`
    13. Copiez les informations `Access key` et  `Secret access key` pour pouvoir les utiliser avec l'outil AWS CLI _(ces informations ne seront plus accessibles après avoir quitté la page)_

3. Configurez l'outil AWS CLI avec le nouvel utilisateur créé :
    1. Exécutez la commande : `aws configure`
        1. Renseignez l'information `AWS Access Key ID` avec l'information `Access key` du nouvel utilisateur `usr_adm_cli`
        2. Renseignez l'information `AWS Secret Access Key` avec l'information `Secret access key` du nouvel utilisateur `usr_adm_cli`
        3. Renseignez l'information `Default region name` avec la région par défaut :  `eu-west-1`
        4. Renseignez l'information `Default output format` avec le format de sortie par défaut `json`


4. Vérification de la configuration de l'outil AWS CLI
    1. Exécutez la commande `aws s3api list-buckets`
    2. Résultat :
```json
{
    "Buckets": [
        {...}
    ]
}
```


## Gestion de la connexion pour l'outil Databricks CLI

1. Installez l'outil `Databricks CLI` avec `pip` (nécessite d'avoir python3)
    1. Exécutez la commande : `pip install databricks-cli`
    2. Vérifiez le résultat avec la commande : `databricks --version` (Résultat possible : `Version 0.17.6`)


2. Créez un Token Utilisateur sur Databricks
    1. Allez sur le workspace Databricks
    2. Cliquez sur votre nom d'utilisateur et cliquez sur l'option `User Settings`
    3. Cliquez sur  `Access tokens`
    4. Cliquez sur `Generate new token`
    5. Renseignez les parties `comment`  et `define the token life time` avec les valeurs souhaitées
    6. Cliquez sur `Generate`
    7. Copiez le Token Databricks généré pour pouvoir l'utiliser avec l'outil Databricks CLI _(vous ne pourrez plus le voir après avoir quitté la page)_


3. Configurez Databricks CLI
    1. Exécutez la commande : `databricks configure --token`
    2. Renseignez l'information `Databricks Host (should begin with https://):` avec l'URL de votre workspace Databricks : `https://dbc-XXXXXXXX-XXXX.cloud.databricks.com`
    3. Renseignez l'information `Access Token` avec le Token Databricks récupéré lors de l'étape précédente : `dapi2c0000aa000a0r0a00e000000000000`

Vous pouvez voir les informations enregistrées avec la commande : `cat ~/.databrickscfg`
