---
Categories : ["Databricks","Unity Catalog"]
Tags : ["Databricks","Unity Catalog"]
title : "Databricks : Unity Catalog - Découverte - Partie 4 - Delta Sharing"
date : 2023-05-21
draft : false
toc: true
---

Nous allons découvrir la fonctionnalité [Delta Sharing](https://www.databricks.com/fr/product/delta-sharing) proposée par Databricks dans la solution [Unity Catalog](https://docs.databricks.com/data-governance/unity-catalog/index.html).

Nous allons utiliser un Account Databricks sur AWS comme fournisseur (Provider) et un Account Databricks sur Azure comme destinataire (Recipient) du partage des objets avec la fonctionnalité Delta Sharing pour cette découverte.

_Note n°1 : Nous allons garder des termes techniques en anglais pour faciliter la compréhension._

_Note n°2 : Les informations de ce papier concernant la période Mars/Avril 2023._

<!--more-->

# Qu'est ce qu'est le Data Sharing

Le Data Sharing est une pratique qui consiste à partager des données entre différents partenaires.

Cela peut être pour des besoins réglementaires ou contractuels mais aussi pour valoriser et monétiser ses données et ses produits.

Il y a un enjeu de sécurité  et de gouvernance des données très fort lorsque l'on souhaite partager des données avec des partenaires ou concurrents afin d'éviter tout risque de fuite de données et de garantir la traçabilité  des actions concernant l'utilisation des données.

On peut retrouver l'usage du Data Sharing lors de la mise en place d'un Data Mesh pour le partage des données des différents produits entre les différentes équipes.

Il est aussi assez courant de mettre en place une interface en REST API afin de permettre aux partenaires externes de récupérer les données en gérant les droits d'accès directement par l'API REST mais il existe des solutions permettant de grandement faciliter et sécuriser ce partage de données.
De plus, l'interface REST API n'est pas forcément le moyen le plus efficace lorsqu'il s'agit d'échanger des données volumineuses entre des partenaires (par exemple dans le cadre d’un Data Lake ou d’un Lakehouse).

Parmi les solutions existantes, nous allons nous intéresser à la fonctionnalité "Delta Sharing" proposée par Databricks avec la solution Unity Catalog afin de mettre en place un partage de données avec des partenaires externes.


# Unity Catalog et la hiérarchie des objets


Unity Catalog est la solution de Databricks permettant d'avoir une gouvernance unifiée et centralisée pour l'ensemble des données gérées par les ressources Databricks ainsi que de sécuriser et faciliter la gestion et le partage des données à l'ensemble des acteurs internes et externes d'une organisation.

Vous pourrez avec une vue d'ensemble plus complète en parcourant la [documentation officielle](https://docs.databricks.com/data-governance/unity-catalog/index.html).

Rappel concernant la hiérarchie  des objets :
[![schema_00](/blog/web/20230521_blog_article_unity_catalog_dela_sharing_00.png)](/blog/web/20230521_blog_article_unity_catalog_dela_sharing_00.png)


Les différents objets sont :
- Storage Credential : Cet objet est associé directement au Metastore et permet de stocker les accès à un cloud provider (par exemple AWS S3) permettant à la solution Unity Catalog de gérer les droits sur les données.
- External Location : Cet objet est associé au Metastore et permet de stocker le chemin vers un cloud provider (par exemple une ressource AWS S3) en combinaison avec un Storage Credential pour gérer les accès aux données
- Metastore : Objet du plus haut niveau pouvant contenir des métadonnées
- Catalog (Catalogue) : Objet de 1er niveau permettant d'organiser les données par schéma (aussi nommé Base de données)
- Schema (Schéma) : Objet de 2ème et dernier niveau permettant d'organiser les données (contient les tables, les vues et les fonctions)
- Table : Objet permettant de définir la structure et le stockage des données. 
- Share (Partage) : Un regroupement logique des tables que l'on souhaite partager.
- Recipient (Destinataire) : Un objet qui identifie un partenaire (ou groupe d'utilisateurs) qui aura accès au partage des données.
- Provider (Fournisseur) : Un objet qui représente un partenaire qui partage des données.

Lorsque vous souhaitez accéder à un objet (par exemple une table), il sera nécessaire de renseigner le nom du catalogue et le nom du schéma où est défini l'objet.
Exemple : `select * from catalog.schema.table`


Note : Les notions de partage (Share), destinataire (Recipient) et fournisseur (Provider) sont spécifiques à la fonctionnalité Delta Sharing.



# Qu’est ce que la fonctionnalité Delta Sharing

Cette fonctionnalité s'appuie sur un [protocol ouvert](https://github.com/delta-io/delta-sharing/blob/main/PROTOCOL.md) développé par Databricks pour permettre le partage de données de manière sécurisée entre plusieurs plateformes.

Cette fonctionnalité se base sur la solution Unity Catalog afin de centraliser la gouvernance des données (gestion des catalogues et des droits sur les données).

Le Delta Sharing Server est géré par la solution Unity Catalog et permet de donner à un destinataire l'accès direct au données sur le stockage sans passer par un cluster ou un SQL Warehouse

Schématisation du fonctionnement du Delta Sharing : 
[![schema_20](/blog/web/20230521_blog_article_unity_catalog_dela_sharing_20.png)](/blog/web/20230521_blog_article_unity_catalog_dela_sharing_20.png)
Le fonctionnement est le suivant :
1. Le destinataire  (Recipient) demande la lecture d'une table partagée
2. Le fournisseur (Provider) (avec le Delta Sharing Serveur géré par Unity Catalog) va contrôler l'accès à la table partagée
3. Le fournisseur (Provider) va envoyer les liens d'accès (valide sur un temps très court) vers le stockage où se trouve réellement la donnée (sans passer par un Cluster ou SQL Warehouse)
4. Le destinataire  (Recipient) va accéder directement au stockage pour récupérer en lecture seule les données de la table partagée


Les trois grand cas d'utilisation mis en avant par Databricks pour l'utilisation de cette fonctionnalité : 
- Partage des données en interne (filiales, équipes)
    - Créer un Data Mesh pour échanger des données des différents produits entre différentes filiales, équipes, applications
- Partage des données en externe (entreprises)
    - Partagez des données avec des partenaires et fournisseurs, qu'ils soient ou non sur la plateforme Databricks
- Monétisation des données 
    - Distribuez et monétisez vos produits (données) avec des clients qui sont ou non sur la plateforme Databricks


Quelques avantages de cette fonctionnalité : 
- Un fournisseur peut facilement définir des partages sur une version ou une partition spécifique d'une table
- Les tables sont partagés en direct et peuvent être mise à jour par le fournisseur seulement
- Tous les clients qui peuvent lire des données parquets peuvent accéder aux données partagées
- Le transfert des données s'appuient uniquement sur les ressources S3/ADLS/GCS, par conséquent le transfert est extrêmement efficace et peu coûteux


Il est possible d'utiliser la fonctionnalité "Delta Sharing" de trois façon différentes :
1. [Open Sharing](https://docs.databricks.com/data-sharing/share-data-open.html)
    1. Cela permet à n'importe quel client n'utilisant pas Databricks  avec la solution Unity Catalog d'accéder aux données partagés
    2. Il est nécessaire d'utiliser une librairies spécifiques pour pouvoir lire des données en passant pour le Delta Sharing
    3. Les destinataires de ce type de partage se base sur la durée de vie d'un Token Databricks (définie au niveau du Metastore Unity Catalog du fournisseur)
2. [Databricks-to-Databricks Sharing](https://docs.databricks.com/data-sharing/share-data-databricks.html)
    1. Cela correspond au partage de données entre deux Metastores de la solution Unity Catalog (dans le même Account Databricks ou dans des Accounts Databricks différents (AWS, Azure ou GCP))
    3. Un des avantages de ce type de partage est que ni le destinataire (Recipient), ni le fournisseur (Provider) n'a besoin de gérer un Token Databricks pour l'accès aux données partagées.
    4. La sécurité de ce partage (incluant la vérification des accès, l'authentification et l'audit) est gérée entièrement à travers la fonctionnalité Delta Sharing et la plateforme Databricks.
    5. Il est aussi possible de partager des notebooks en lecture seul
3. Marketplace :
    1. Cela correspond au fait de se déclarer comme partenaire Databricks afin de pouvoir proposer ces données partagées sur la Marketplace Databricks. Nous n'allons pas développer cette méthode de partage dans le cadre de cette découverte.



Les objets spécifique à cette fonctionnalité qui ont été mis en place dans la solution Unity Catalog sont :
- `Provider` (Fournisseur) : Cela permet de définir le fournisseur de données pour le destinataire
- `Recipient` (Destinataire) : Cela permet de définir les différents destinataires (équivalent d'utilisateur) pour gérer les droits d'accès sur les données partagées
- `Share` (Partage) : C'est une collection de tables et de notebooks en lecture  seule permettant de partager des données provenant d'un Metastore à des destinataires 
    - Le partage (Share) des notebooks ne concernent que des destinataires utilisant aussi la solution Unity Catalog


Information concernant les partages (Share) : 
- C'est une enveloppe logique qui permet de regrouper l'ensemble des objets (tables delta et notebooks) que l'on souhaite partager en lecture seul.
- Unity Catalog écrit les informations concernant les partages (Share) dans le répertoire du stockage (AWS S3) suivant : `s3://s3-dbx-metastore-uc/metastore-sandbox/<Metastore ID>/delta-sharing/shares/<Share ID>/*`
- Il est possible d'ajouter l'ensemble des tables du Metastore dans un partage (Share)
    - Il faut uniquement avoir les droits de `SELECT` et `USE` sur les objets que l'on souhaite ajouter dans le partage (Share)
- Les droits d'accès au partage (Share) ne peuvent être donnés qu’aux destinataires (Recipient) définis
- Le nom d'un partage (Share) peut être un nom déjà utilisé par un catalogue ou un schéma (pas de restriction, mais il est recommandé d'avoir un nom différent pour faciliter la gestion des partages)
- Il est possible de partager uniquement des tables Delta qu'elles soient managées ou externes
    - Il est possible de définir une notion de partition se basant sur les partitions existantes de la table Delta pour limiter automatiquement l'accès aux données en fonction des propriétés de chaque destinaires (Recipient)
        - La gestion des partitions au niveau du partage (Share) peut être extrêmement pratique si vous avez défini des partitions sur une information comme le pays, une période ou un identifiant lié au destinataire (Recipient) pour limiter automatiquement l'accès aux données.
        - Cela permet de définir une seule fois les contraintes sur les partitions au niveau du partage (Share) et de pouvoir définir les propriétés de chaque destinataire (Recipient)
    - Il est possible de définir si l'historique d'une table Delta est partagée ou non
    - Il est possible de définir si le Change Data Feed d'une table Delta est partagée ou non
- Il est recommandé de mettre en place des alias pour chaque objets ajoutés au partage (Share) 
    - Lorsque l'on ne défini pas d'alias pour le nom du schéma alors c'est le nom du schéma source qui sera utilisé
    - Lorsque l'on ne défini pas d'alias pour le nom du schéma et de la table alors c'est le nom du schéma source et de la table source qui seront utilisés
    - Il n'est pas possible de mettre à jour un alias après ajout de l'objet dans le partage. (Il est nécessaire d'enlever et d'ajouter à nouveau l'objet pour modifier l'alias)
- Information spécifique au partage d'un notebook (dans le cas d'un partage Databricks-to-Databricks uniquement) :
    - Lors du partage du notebook, il est en réalité exporté au format HTML vers un répertoire du stockage (AWS S3) managé de Unity Catalog (et plus précisément le répertoire `s3://s3-dbx-metastore-uc/metastore-sandbox/<Metastore ID>/delta-sharing/shares/<Share ID>/notebooks_files/*`), ce qui a pour effet de garder un version figée du notebook que l'on souhaite partager.
    - Lorsque le notebook qui a été partagé est modifié, cela n'a pas d'impact sur le notebook partagé. Il faut l'enlever et l'ajouter à nouveau au partage (Share) pour partager la dernière version du notebook.


Information concernant les destinataires (Recipient) :
- C'est un objet au niveau du Metastore qui permet de définir un accès pour un partenaire/client
- La gestion des accès en lecture sur le partage (Share) se fait sur l'objet destinataire (Recipient) 
- Un destinataire  (Recipient) peut accéder à l'ensemble des partages (Share) d'un Metastore en fonction des droits données par les propriétaires des partages (Share)
- Un destinataire  (Recipient) ne peut pas accéder aux catalogues du Metatore Unity Catalog, uniquement aux partages autorisés.
- Pour pouvoir créer un destinataire (Recipient), il est nécessaire d'activer la fonctionnalité Delta Sharing au niveau du Metastore
- Il existe deux types de destinataire (Recipient)
    - Open Sharing : le destinataire (Recipient) utilise un Token Databricks dont la durée de validité est définie au niveau du Metastore
    - Databricks-to-Databricks Sharing : le destinataire  (Recipient) utilise un Identifiant de partage du Metastore (pas de durée de validité)
- Les utilisateurs d'un Metastore ne peuvent pas accéder aux partages du même Metastore


Liens concernant quelques connecteurs permettant d'accéder aux données partagées sans passer par une ressource Databricks : 
- [Python & Pandas](https://github.com/delta-io/delta-sharing#python-connector)
- [Apache spark](https://github.com/delta-io/delta-sharing#apache-spark-connector)
- [Power BI](https://learn.microsoft.com/en-us/power-query/connectors/delta-sharing)
- [Java](https://github.com/databrickslabs/delta-sharing-java-connector)



# Qu’est ce que les Logs d'audit

Lorsque l'on est fournisseur (Provider) de données, il est indispensable de pouvoir tracer l'utilisation de nos données par les différents destinataires (Recipient) définis.

Cela peut permettre de définir les règles de facturation lorsque l'on souhaite monétiser l'accès aux données mais aussi de simplement tracer l'utilisation des objets partagés.

Quelques exemples d'évènements capturés au niveau du Metastore de la solution Unity Catalog (non exhaustif) :
- Action de création/suppression d'un partage (Share)
- Action de création/suppression d'un destinataire  (Recipient)
- Action de demande d'accès d'un destinataire  (Recipient)
- Exécution d'une requête sur un objet partagé
- Résultat de la requête (métadonnées) sur un objet partagé

Pour ce faire, il est nécessaire de mettre en place la récupération des logs d'audit pour les évènements/actions liés au Metastore de la solution Unity Catalog.

La récupération des logs d'audit nécessite la mise en place d'une configuration de log au niveau de l'Account Databricks.

Quelques informations : 
- Les logs d'audit ne sont pas récupérés en temps réel, mais toutes les X minutes et stockés dans la ressource AWS S3 indiqué au niveau de la configuration de log dans l'Account Databricks.
- Les fichiers des logs d'audit sont au format JSON.
- Les fichiers de logs d'audit concernant le Metastore Unity Catalog sont stockés dans un sous répertoire nommé `workspace=0`
    - Lorsque vous allez mettre en place la configuration de logs, il faudra faire attention à ne pas filtrer d'identifiant de Workspace Databricks ou à prendre en compte l'identifiant de Workspace Databricks avec la valeur `0`  sinon vous ne récupérerez pas les logs concernant les évènements liés au Métastore Unity Catalog.
- Vous ne pourrez pas mettre à jour ou supprimer une configuration de log au niveau de l'Account Databricks, vous pourrez uniquement la désactiver et en créer une nouvelle (même si vous utiliser le même nom, l'identifiant de configuration sera différent avec un identifiant unique)

Tous les événements tracés au niveau account et plus spécifiquement concernant Unity Catalog sont tracés dans la logs d’audit et peuvent faire l'objet d'une analyse. Nous avons volontairement limité notre analyse à deux types d'actions pour cette démonstration.

Vous trouverez une liste exhaustive des actions/événements que vous pourrez analyser sur la [documentation officielle](https://docs.databricks.com/administration-guide/account-settings/audit-logs.html#events).


# Préparation de l'environnement

Nous allons mettre en place un ensemble d'éléments nous permettant de découvrir plus en détail la fonctionnalité Delta Sharing de la solution Unity Catalog.

## Contexte

Pré-requis :
- Existence d'une ressource AWS S3 nommée `s3-dbx-metastore-uc`
- Existence d'une ressource AWS S3 nommée `s3-demo-data-uc`
- Existence d'un Metastore nommé `metastore-sandbox` avec le Storage Credential nommé `sc-metastore-sandbox` permettant de stocker les données par défaut dans la ressource AWS S3 nommée `s3-dbx-metastore-uc`
- Existence d'un rôle AWS IAM nommé `role-databricks-demo-data-uc` et d'une politique AWS IAM nommée `policy-databricks-demo-data-uc` permettant au rôle global Databricks de gérer l'accès à la ressource AWS S3 nommée `s3-demo-data-uc`
- Existence d'un Storage Credential nommé `sc-demo-data-uc` et d'un External Location nommé `el_demo_data_uc` permettant au rôle global Databricks de gérer l'accès à la ressource AWS S3 nommée `s3-demo-data-uc`
- Existence du groupe `grp_demo`
- Existence de l'utilisateur `john.do.dbx@gmail.com` dans le groupe `grp_demo`
- Existence d'un SQL Warehouse avec le droit d'utilisation pour le groupe `grp_demo`


Mise en place des droits pour le groupe `grp_demo` :
1. Donner le droit de créer des catalogues au niveau du Metastore pour le groupe `grp_demo` 
2. Donner le droit de lire les fichiers externes à partir de l'objet External Location nommé `el_demo_data_uc` 
3. Donner le droit de créer un espace de partage (Share) au niveau du Metastore pour le groupe `grp_demo`
4. Donner le droit de créer un destinataire (Recipient) au niveau du Metastore pour le groupe `grp_demo` 
```sql
-- 1. Give Create Catalog right on Metastore to grp_demo
GRANT CREATE CATALOG ON METASTORE TO grp_demo;

-- 2. Give Read Files right on el_demo_data_uc location to grp_demo
GRANT READ FILES ON EXTERNAL LOCATION `el_demo_data_uc` TO grp_demo;

-- 3. Give Create share right on Metastore to grp_demo
GRANT CREATE_SHARE ON METASTORE TO grp_demo;

-- 4. Give Create recipient right on Metastore to grp_demo
GRANT CREATE_RECIPIENT ON METASTORE TO grp_demo;
```



## Schématisation de l'environnement

Concernant les éléments sur AWS
Schématisation des objets au niveau du Metastore Unity Catalog sur AWS: 
[![schema_21](/blog/web/20230521_blog_article_unity_catalog_dela_sharing_21.png)](/blog/web/20230521_blog_article_unity_catalog_dela_sharing_21.png)
Liste des éléments :
- Metastore `metastore-sandbox` : Metastore principal au niveau de l'Account Databricks AWS
- Storage Credential `sc-metastore-sandbox` : Information de connexion pour gérer les droits d'accès à la ressource AWS nommée `s3-dbx-metastore-uc`
- Storage Credential `sc-demo-data-uc` et External Location `el-demo-data-uc`: Information de connexion pour gérer les droits d'accès à la ressource AWS nommé `s3-demo-data-uc`
- Catalogue `ctg_mng` : Enveloppe pour gérer les données managées
- Catalogue  `ctg_ext`: Enveloppe pour gérer les données externes

Schématisation de l'ensemble des objets que nous allons mettre en place et utilisés sur le Metastore Unity Catalog sur AWS :
[![schema_22](/blog/web/20230521_blog_article_unity_catalog_dela_sharing_22.png)](/blog/web/20230521_blog_article_unity_catalog_dela_sharing_22.png)
Liste des éléments :
- Catalogue `ctg_mng` et Schéma `sch_mng` : Enveloppe logique pour organiser et gérer les données managées
- Catalogue `ctg_ext` et Schéma `sch_ext` : Enveloppe logique pour organiser et gérer les données externes
- Table `fct_transactions_mng` : Table managée par Unity Catalog contenant les informations de transactions et partitionné sur la colonne `id_client`
- Table `fct_transactions_ext` : Table externe contenant les informations de transactions non partitionné mais avec le Change Data Feed activé dans la ressource AWS S3 nommée `s3-demo-data-uc/data/fct_transactions_ext`
- Table `fct_transactions_csv` : Table externe permettant d'accéder directement au fichier source CSV des transactions de la ressource AWS S3 nommée `s3-demo-data-uc/demo/fct_transactions.csv`
- Table `audit_logs_json` : Table externe permettant d'accéder directement à l'ensemble des fichiers de logs d'audits en se basant sur les données de la ressource AWS S3 nommé `s3_demo_data_uc/dbx_logs/account`
- Partage `share_aws_dbx` : Enveloppe logique permettant d'organiser et gérer les objets partagés
    - L'Alias du schéma `sch_share` permet de regrouper les objets des différents catalogues et schémas dans un seul schéma logique pour le partage des données
    - L'Alias de la table  `fct_trx_mng` permet de mettre à disposition les données de la table `fct_transactions_mng` sans avoir à communiquer le nom de table
    - L'Alias de la table  `fct_trx_ext` permet de mettre à disposition les données de la table `fct_transactions_ext` sans avoir à communiquer le nom de la table
- Destinataire `rcp_azure_dbx` : Object permettant aux utilisateurs du Metastore Unity Catalog Azure d'accéder aux données du partage `share_aws_dbx`
- Destinataire `rcp_open_all` : Object permettant aux utilisateurs n'utilisant pas de Metastore Unity Catalog d'accéder aux données du partage `share_aws_dbx`


Concernant les éléments sur Azure :
Schématisation de l'ensemble des éléments que nous allons mettre en place et utilisés sur le Metastore Unity Catalog sur Azure : 
[![schema_23](/blog/web/20230521_blog_article_unity_catalog_dela_sharing_23.png)](/blog/web/20230521_blog_article_unity_catalog_dela_sharing_23.png)

Liste des éléments :
- Metastore `metastore-az`: Metastore principal au niveau de l'Account Databricks Azure
- Storage Credential `sc-metastore-az`: Information de connexion pour gérer les droits d'accès à la ressource Azure ADLS Gen2 nommée `adls-dbx-metastore-uc`
- Catalogue `ctg_aws` : Enveloppe permettant de se synchroniser avec le partage `share_aws_dbx` et d'avoir accès à l'ensemble des éléments du schéma partagé `sch_share`



## Variable d'environnement

Afin de faciliter la mise en place des différents éléments tout au long de cette découverte, nous allons mettre en place un certain nombre de variables d'environnements pour l'utilisation de Databricks REST API.

```bash
# Alias using the netrc file from databricks
alias dbx-api='curl --netrc-file ~/.databricks/.netrc'

########################################
############# AWS ######################
########################################
# Url for Account Access
export DBX_API_ACCOUNT_URL="https://accounts.cloud.databricks.com"
# Url for Workspace Access
export DBX_API_URL="<Workspace Databricks AWS URL>"
# Account ID
export DBX_ACCOUNT_ID="<Account Databricks ID>"
# AWS Metastore Name
export DBX_METASTORE_NAME="metastore-sandbox"
# AWS Share Name
export DBX_SHARE_NAME="share_aws_dbx"
# AWS Provider Name
export DBX_PROVIDER_NAME="dbx_aws_sharing"
# AWS Recipient for Databricks to Databricks Sharing
export DBX_RECIPIENT_DBX="rcp_azure_dbx"
# AWS Recipient for Open Sharing
export DBX_RECIPIENT_OPEN="rcp_open_all"


########################################
############# Azure ####################
########################################
# Name of the ADLS Gen2 Storage
export AZ_ADLS2_NAME="adls-dbx-metastore-uc"
# Name of the Container in the ADLS Gen2 Storage
export AZ_ADLS2_CONTAINER_NAME="metastoredbx"
# Name of the Resource Group
export AZ_RG_NAME="<Azure Resource Group Name>"
# Region
export AZ_REGION="francecentral"
# Tags
export AZ_TAGS=("owner=john" "project=databricks" "TTL=7" "environment=demo")
# Azure Databricks Access Connector Name
export AZ_DBX_CONNECTOR_NAME="DBXAccessConnectorUC"
# Azure Workspace Databricks URL
export DBX_AZ_API_URL="<Azure Workspace Databricks URL>"
# Azure Workspace Databricks ID
export DBX_AZ_WORKSPACE_ID="<Azure Workspace Databricks ID>"
# Azure Metastore Name
export DBX_AZ_METASTORE_NAME="metastore-az"
# Azure Storage Credential Name
export DBX_AZ_METASTORE_SC_NAME="sc-metastore-az"
# Azure Metastore ADLS Gen2 Path
export DBX_AZ_ADLS2_METASTORE_PATH="${AZ_ADLS2_CONTAINER_NAME}@${AZ_ADLS2_NAME}.dfs.core.windows.net/${AZ_ADLS2_CONTAINER_NAME}"


```


## Mise en place d'un jeu de données sur la ressource AWS S3

Contenu du fichier `fct_transactions.csv` :
```text
id_trx,ts_trx,id_product,id_shop,id_client,quantity
1,2023-04-01 09:00:00,1,2,1,1
2,2023-04-01 11:00:00,1,1,1,3
3,2023-04-03 14:00:00,1,2,1,1
4,2023-04-05 08:00:00,3,1,2,9
5,2023-04-06 10:00:00,1,2,1,3
6,2023-04-06 12:00:00,2,2,1,1
7,2023-04-10 18:30:00,2,1,2,11
8,2023-04-10 18:30:00,3,1,2,2
```


Réalisation de la copie des données vers le répertoire `demo`de la ressource AWS S3 nommée `s3-demo-data-uc` avec l'outil AWS CLI:
```bash
aws s3 cp fct_transactions.csv s3://s3-demo-data-uc/demo/fct_transactions.csv 
```



## Mise en place des objets dans le Metastore Unity Catalog (AWS)

1. Création des Catalogues
- `ctg_mng` : Catalogue permettant de gérer les éléments managés par Unity Catalog
- `ctg_ext` : Catalogue permettant de gérer les éléments externes
```sql
-- Create Catalog (for managed data)
CREATE CATALOG IF NOT EXISTS ctg_mn
    COMMENT 'Catalog for managed data';

-- Create Catalog (for external data)
CREATE CATALOG IF NOT EXISTS ctg_ext
    COMMENT 'Catalog for external data';
```


2. Création des schémas
La liste des schémas est la suivante :
- `ctg_ext.sch_ext` : Schéma permettant de regrouper les tables externes 
- `ctg_mng.sch_mng` : Schéma permettant de stocker les données managées
```sql
-- Create Schema for external data
CREATE SCHEMA IF NOT EXISTS ctg_ext.sch_ext
    COMMENT 'Schema for external data';

-- Create Schema for managed data
CREATE SCHEMA IF NOT EXISTS ctg_mng.sch_mng
    COMMENT 'Schema for managed Data';
```


3. Création des tables
```sql
-- External table
CREATE TABLE ctg_ext.sch_ext.fct_transactions_csv (
    id_trx integer not null
    ,ts_trx timestamp not null
    ,id_product integer not null
    ,id_shop integer not null
    ,id_client integer not null
    ,quantity integer not null
)
USING CSV
OPTIONS (path "s3://s3-demo-data-uc/demo/fct_transactions.csv",
        delimiter ",",
        header "true")
        ;


-- External table with Change data feed activated
CREATE TABLE ctg_ext.sch_ext.fct_transactions_ext (
    id_trx integer not null
    ,ts_trx timestamp not null
    ,id_product integer not null
    ,id_shop integer not null
    ,id_client integer not null
    ,quantity integer not null
    ,ts_tech timestamp not null
)
LOCATION 's3://s3-demo-data-uc/data/fct_transactions_delta'
COMMENT 'External Delta Table for Transaction Data'
TBLPROPERTIES (delta.enableChangeDataFeed = true);


-- Managed table with column partition (id_client)
CREATE TABLE ctg_mng.sch_mng.fct_transactions_mng (
    id_trx integer not null
    ,ts_trx timestamp not null
    ,id_product integer not null
    ,id_shop integer not null
    ,id_client integer not null
    ,quantity integer not null
    ,ts_tech timestamp not null
)
PARTITIONED BY (id_client)
COMMENT 'Managed Data Table for Transaction Data'
;

```


4. Alimentation des tables
```sql
-- Truncate table
DELETE FROM ctg_ext.sch_ext.fct_transactions_ext;
DELETE FROM ctg_mng.sch_mng.fct_transactions_mng;

-- Add data in the external table
INSERT INTO ctg_ext.sch_ext.fct_transactions_ext (
    id_trx
    ,ts_trx
    ,id_product
    ,id_shop
    ,id_client
    ,quantity
    ,ts_tech
)
SELECT id_trx
    ,ts_trx
    ,id_product
    ,id_shop
    ,id_client
    ,quantity
    ,current_timestamp() as ts_tech
FROM ctg_ext.sch_ext.fct_transactions_csv;


-- Add data in the managed table 
INSERT INTO ctg_mng.sch_mng.fct_transactions_mng (
    id_trx
    ,ts_trx
    ,id_product
    ,id_shop
    ,id_client
    ,quantity
    ,ts_tech
)
SELECT id_trx
    ,ts_trx
    ,id_product
    ,id_shop
    ,id_client
    ,quantity
    ,current_timestamp() as ts_tech
FROM ctg_ext.sch_ext.fct_transactions_csv;

```


## Création d'un notebook pour pouvoir le partager

Nous allons importer un notebook scala nommé `read_demo_data_nbk_scala` dans le répertoire `Shared` du Workspace Databricks AWS avec Databricks REST API : 
```bash 
dbx-api -X POST ${DBX_API_URL}/api/2.0/workspace/import -H 'Content-Type: application/json' -d "{ 
    \"path\": \"/Shared/read_demo_data_nbk_scala\",
    \"content\": \"Ly8gRGF0YWJyaWNrcyBub3RlYm9vayBzb3VyY2UKdmFsIGRmID0gc3BhcmsudGFibGUoImN0Z19tbnQuc2NoX21uZy5mY3RfdHJhbnNhY3Rpb25zX21uZyIpCgovLyBDT01NQU5EIC0tLS0tLS0tLS0KCmRpc3BsYXkoZGYp\",
    \"language\": \"SCALA\",
    \"overwrite\": \"true\",
    \"format\":\"SOURCE\"
}"
```

Contenu du notebook importé :
[![schema_01](/blog/web/20230521_blog_article_unity_catalog_dela_sharing_01.png)](/blog/web/20230521_blog_article_unity_catalog_dela_sharing_01.png)



# Configuration des Logs d'audit sur le Metastore

Nous allons commencer par la configuration des logs d'audit afin de pouvoir garder la trace de l'ensemble des évènements liés au Metastore Unity Catalog dans le cadre du Delta Sharing.

Il est possible de capturer l'ensemble des évènements au niveau de l'Account Databricks ou au niveau de chaque Workspace Databricks.
Dans notre cas, nous allons nous intéresser à l'Account Databricks car c'est à ce niveau que les évènements liés au Metastore Unity Catalog sont capturés.

Pour cette démonstration, nous allons nous intéresser uniquement aux évènements concernant les requêtes des destinataires (Recipient) sur les objets partagés mais les logs d'audit contiennent beaucoup plus d'informations.


Objectifs  :
- Nous souhaitons capturer les logs d'audit dans la ressource AWS S3 nommée `s3-demo-data-uc/dbx_logs`
- Nous ne souhaitons pas filtrer d'identifiant de Workspace Databricks afin de capturer l'ensemble des logs d'audit proposés par Databricks

Vous devez suivre les étapes suivantes : (en s'appuyant sur la [documentation officielle](https://docs.databricks.com/administration-guide/account-settings/audit-logs.html#configure-audit-log-delivery))
1. Création d'un rôle AWS IAM et d'une politique AWS IAM pour que Databricks puisse accéder (et écrire) dans la ressource AWS S3 nommée `s3-demo-data-uc/dbx_logs`
2. Création d'un Credential Databricks  au niveau de l'Account Databricks pour stocker les informations de connexion (rôle AWS IAM créé) 
3. Création d'un Storage Databricks au niveau de l'Account Databricks pour stocker le chemin de la ressource AWS S3 nommée  `dbx_logs`
4. Création de la configuration de log au niveau de l'Account Databricks en se basant sur le Credential Databricks et le Storage Databricks


# Activation du Delta Sharing sur le Metastore

La gestion (création et suppression) des partages (Share) ne nécessite pas l'activation de la fonctionnalité Delta Sharing sur le Metastore.
L'activation de la fonctionnalité Delta Sharing est obligatoire uniquement lorsque l'on veut gérer les destinataires (Recipient) et configurer l'accès aux objets partagés.

Pour activer cette fonctionnalité, il faut réaliser l'action suivante :
1. Mise à jour de la configuration du Metastore avec les informations suivantes :
    - L'information `delta_sharing_scope` doit être valorisée avec la valeur  `INTERNAL_AND_EXTERNAL` 
        - La valeur `INTERNAL` signifie que la fonctionnalité est désactivée
    - L'information `delta_sharing_recipient_token_lifetime_in_seconds` doit être valorisée avec le nombre de seconde de validité du Token Databricks (par exemple avec la valeur `86400` pour une journée)
        - Le destinataire utilisant un Token Databricks pourra accéder aux objets partagés uniquement durant le temps de validité du Token Databricks
    - L'information `delta_sharing_organization_name` doit être valorisée avec le nom représentant votre organisation en tant que fournisseur (Provider) (par exemple : `dbx_aws_sharing`)
        - C'est le nom que les destinataires (Recipient), utilisant Databricks, verront comme fournisseur (Provider) du partage (Share)

Réalisation de l'action avec Databricks REST API :
```bash
# Get the Metastore ID (databricks)
export TMP_DBX_METASTORE_ID=`dbx-api -X GET ${DBX_API_URL}/api/2.1/unity-catalog/metastores | jq -r '.metastores[]|select(.name==$ENV.DBX_METASTORE_NAME)|.metastore_id'`

# Update the Metastore configuration to activate Delta Sharing (external)
dbx-api -X PATCH ${DBX_API_URL}/api/2.1/unity-catalog/metastores/${TMP_DBX_METASTORE_ID} -H 'Content-Type: application/json' -d "{
    \"delta_sharing_scope\": \"INTERNAL_AND_EXTERNAL\",
    \"delta_sharing_recipient_token_lifetime_in_seconds\": \"86400\",
    \"delta_sharing_organization_name\": \"${DBX_PROVIDER_NAME}\"
}"
```



# Création d'un partage (Share) sur le Metastore

La création d'un partage (Share) peut se faire avec Databricks REST API ou directement avec des commandes SQL.

La création d'un partage (Share) nécessite les droits suivants sur le Metastore :
- Droit de création des objets Share sur le Metastore
- Droit d'utilisation des catalogs et schémas contenant les données à partager
- Droit de lecture des tables contenant les données à partager
```sql
GRANT CREATE_SHARE ON METASTORE TO grp_demo;
GRANT USE, USE SCHEMA, SELECT ON CATALOG ctg_mng TO grp_demo;
GRANT USE, USE SCHEMA, SELECT ON CATALOG ctg_ext TO grp_demo;
```


La création du partage (Share) permet de définir l'ensemble des données à partager : 
1. Créer le partage (Share) `share_aws_dbx` au niveau du Metastore Unity Catalog
2. Ajouter la table `ctg_ext.sch_ext.fct_transactions_ext` en utilisant l'alias `sch_share.fct_trx_ext`
    1. Activer le Change Data Feed dans le partage de données (option `cdf_enable : true`)
    2. Autoriser l'accès à partir de la version n°0 de l'historique des données (option `start_version : 0`)
3. Ajouter la table `ctg_mng.sch_mng.fct_transactions_mng` en utilisant l'alias `sch_share.fct_trx_mng` 
    1. Autoriser l'accès uniquement à la dernière version des données (pas d'accès à l'historique) (option `history_data_sharing_status : false`)
    2. Ajouter une gestion des partitions pour n'autoriser l'accès aux données uniquement pour la partition (id_client) qui est égale à la valeur de la propriété nommée `ìd_client` associé au destinataire (Recipient) lors de sa création. (Chaque destinataire aura une valeur différente pour la propriété `id_client` afin de mettre en évidence cette stratégie d'accès qui ne pourra pas être contourné par le destinataire)
4. Ajouter le notebook `/Shared/read_demo_data_nbk_scala` dans le partage (Share) manuellement (l'API ne fonctionnait pas lors de nos tests)

Utilisation de Databricks REST API :
```bash
# 1. Create share
dbx-api -X POST -H 'Content-Type: application/json' ${DBX_API_URL}/api/2.1/unity-catalog/shares -d "{\"name\": \"${DBX_SHARE_NAME}\", \"comment\": \"Share DBX AWS Data\"}"


# 2. Add table ctg_ext.sch_ext.fct_transactions_ext
dbx-api -X PATCH ${DBX_API_URL}/api/2.1/unity-catalog/shares/share_aws_dbx -H 'Content-Type: application/json' -d '{"updates": [
    {"action": "ADD"
    ,"data_object": {
        "name": "ctg_ext.sch_ext.fct_transactions_ext",
        "data_object_type": "TABLE",
        "shared_as": "sch_share.fct_trx_ext",
        "cdf_enabled": true,
        "start_version": 0,
        "status": "ACTIVE"
        }
    }
    ]
}'


# 3. Add table ctg_mng.sch_mng.fct_transactions_mng
dbx-api -X PATCH ${DBX_API_URL}/api/2.1/unity-catalog/shares/share_aws_dbx -H 'Content-Type: application/json' -d '{"updates": [
    {"action": "ADD"
    ,"data_object": {
        "name": "ctg_mng.sch_mng.fct_transactions_mng",
        "data_object_type": "TABLE",
        "shared_as": "sch_share.fct_trx_mng",
        "history_data_sharing_status": "DISABLED",
        "status": "ACTIVE",
        "partitions": [
        {
          "values": [
            {
              "name": "id_client",
              "recipient_property_key": "id_client",
              "op": "EQUAL"
            }
          ]
        }
        ]
        }
    }
    ]
}'

```


Utilisation des commandes SQL :
```sql
-- 1. Create share
CREATE SHARE IF NOT EXISTS share_aws_dbx COMMENT 'Share DBX AWS Data';

-- 2. Add table ctg_ext.sch_ext.fct_transactions_ext
-- With alias sch_share.fct_trx_ext
-- With Change Data Feed and Historical Data
ALTER SHARE share_aws_dbx
ADD TABLE ctg_ext.sch_ext.fct_transactions_ext
    COMMENT 'Shared External Transactions data'
    AS 'sch_share.fct_trx_ext'
    WITH HISTORY;
    
# 3. Add table ctg_mng.sch_mng.fct_transactions_mng
-- With a specific rule on partition
-- With alias sch_share.fct_trx_mng
-- Without historical data (delta)
ALTER SHARE share_aws_dbx
ADD TABLE ctg_mng.sch_mng.fct_transactions_mng 
    COMMENT 'Shared Managed Transactions data'
    AS 'sch_share.fct_trx_mng'
    PARTITION (id_client = CURRENT_RECIPIENT().id_client)
    WITHOUT HISTORY;

```


Pour l'étape n°4 de création du notebook, il n'est pas possible de le faire directement avec les commandes SQL et nous n'avons pas réussi à le faire en utilisant Databricks REST API, par conséquent nous allons le faire manuellement en utilisant Data Explorer :
1. Allez sur `Workspace Databricks page > Data > Delta Sharing > Shared by me`
2. Cliquez sur le partage (Share) souhaité `share_aws_dbx`
3. Cliquez sur `Manage assets` et sélectionnez l'option `Add notebook file`
4. Renseignez l'information `Notebook file` avec le chemin et le nom du fichier à partager `/Shared/read_demo_data_nbk_scala`
5. Renseignez l'information `Share as` avec le nom que vous voulez afficher dans le partage pour le notebook `shared_nbk` 

Résultat de la création et de l'ajout des éléments dans le Share :
[![schema_02](/blog/web/20230521_blog_article_unity_catalog_dela_sharing_02.png)](/blog/web/20230521_blog_article_unity_catalog_dela_sharing_02.png)



# Partage des données avec un Metastore Unity Catalog sur Azure

Le fait de partager des données entre deux Metastore Unity Catalog est nommé "Databricks-to-Databricks Sharing".

Pour réaliser ce partage Databricks-to-Databricks, nous allons utiliser un Metastore Unity Catalog sur un Account Databricks Azure dans la région France Central.
Pour rappel, le Metastore Unity Catalog principal (fournisseur) est sur un Account Databricks AWS dans la région eu-west-1 (Irlande)

## Configuration Unity Catalog sur Azure

Pour ce faire nous allons commencer par mettre en place un Metastore sur un Workspace Databricks sur Azure.

Pré-requis :
- Vous devez avoir installer l'outil Azure CLI et configurez la connexion nécessaire à Azure
- Vous devez avoir créé un Workspace Databricks dans un Ressource Groupe et votre compte doit avoir les droits d'administration du Workspace Databricks.
- Vous devez avoir les droits d'administration de l'Account Databricks Azure
    - Ce droit peut être donné par un compte avec le rôle "Azure AD Global Administrator" en se connectant à l'Account Databricks Azure
- Vous devez avoir les droits de créer les différentes ressources nécessaire dans un Ressource Groupe Azure


Les étapes nécessaires pour mettre en place un Metastore Unity Catalog sur Azure sont les suivantes :
1. Création d'un stockage (ADLS Gen2 obligatoirement) dans la même région que le Metastore
2. Création d'un connecteur d’accès Databricks
3. Assigne le connecteur d’accès Databricks avec le stockage créé
4. Création d'un Metastore
5. Association du Metastore avec le Workspace Databricks
6. Création d'un Credential Storage (pour la gestion des droits d'accès)
7. Association du Credential Storage avec le Metastore

Pour accélérer la démarche mais garder une approche pédagogique, nous allons utiliser Azure CLI et Databricks REST API pour réaliser les étapes  : 
```bash
# 1. Create the ADLS GEN 2 storage for the Metastore
# BlobStorage Creation
az storage account create --name ${AZ_ADLS2_NAME} --resource-group ${AZ_RG_NAME} --access-tier Hot --kind StorageV2 --location ${AZ_REGION} --allow-blob-public-access false --sku Standard_LRS --tags ${AZ_TAGS}

# Remove useless features (blobstorage)
az storage account blob-service-properties show --account-name ${AZ_ADLS2_NAME} --resource-group ${AZ_RG_NAME}
az storage account blob-service-properties update --account-name ${AZ_ADLS2_NAME} --resource-group ${AZ_RG_NAME} --enable-change-feed false --enable-delete-retention false --enable-last-access-tracking false --enable-restore-policy false --enable-versioning false

# Remove useless features (filestorage)
az storage account file-service-properties show --account-name ${AZ_ADLS2_NAME} --resource-group ${AZ_RG_NAME}
az storage account file-service-properties update --account-name ${AZ_ADLS2_NAME} --resource-group ${AZ_RG_NAME} --enable-delete-retention false

# Activate ADLS Gen2
az storage account hns-migration start --type validation --name ${AZ_ADLS2_NAME} --resource-group ${AZ_RG_NAME}
az storage account hns-migration start --type upgrade --name ${AZ_ADLS2_NAME} --resource-group ${AZ_RG_NAME}

# Create a container in the ADLS Gen2 Storage
export TMP_AZ_ADLS_KEY=`az storage account keys list --account-name ${AZ_ADLS2_NAME} --resource-group ${AZ_RG_NAME} -o json | jq '.[0]|.value'`
az storage container create --name ${AZ_ADLS2_CONTAINER_NAME} --account-name ${AZ_ADLS2_NAME} --account-key ${TMP_AZ_ADLS_KEY} --public-access off --fail-on-exist


# 2. Create the databricks access-connector to manage access between Databricks and the ADLS2 Gen storage
az databricks access-connector create --name ${AZ_DBX_CONNECTOR_NAME} --resource-group ${AZ_RG_NAME} --location ${AZ_REGION} --identity-type SystemAssigned --tags ${AZ_TAGS}


# 3. Assign Storage Blob Data Contributor role to Databricks Access Connecter
export TMP_AZ_ADLS_ID=`az storage account show --name ${AZ_ADLS2_NAME} --resource-group ${AZ_RG_NAME} | jq -r '.id'`
export TMP_AZ_DBX_CONNECTOR_PRINCIPAL_ID=`az databricks access-connector show --resource-group ${AZ_RG_NAME} --name ${AZ_DBX_CONNECTOR_NAME} -o json | jq -r '.identity.principalId'`

az role assignment create --assignee-object-id ${TMP_AZ_DBX_CONNECTOR_PRINCIPAL_ID} --assignee-principal-type ServicePrincipal --role "Storage Blob Data Contributor" --scope ${TMP_AZ_ADLS_ID}


# 4. Create the Metastore in Unity Catalog
dbx-api -X POST ${DBX_AZ_API_URL}/api/2.1/unity-catalog/metastores -H 'Content-Type: application/json' -d "{\"name\":\"${DBX_AZ_METASTORE_NAME}\", \"region\": \"${AZ_REGION}\", \"storage_root\":\"abfss://${DBX_AZ_ADLS2_METASTORE_PATH}\"}"

# Get the Metastore ID
export TMP_DBZ_AZ_METASTORE_ID=`dbx-api -X GET ${DBX_AZ_API_URL}/api/2.1/unity-catalog/metastores | jq -r '.metastores[]|select(.name==$ENV.DBX_AZ_METASTORE_NAME)|.metastore_id'`

# 5. Assign the Metastore to the Workspace Databricks Azure
# It's not possible to create the Storage Credential if the Metastore is not assigned to the Workspace Databricks
dbx-api -X PUT ${DBX_AZ_API_URL}/api/2.1/unity-catalog/workspaces/${DBX_AZ_WORKSPACE_ID}/metastore -H 'Content-Type: application/json' -d "{\"metastore_id\":\"${TMP_DBZ_AZ_METASTORE_ID}\",\"default_catalog_name\":\"main\"}"

# 6. Create the Storage Credential (for Unity Catalog)
# Get the databricks access connector id
export TMP_AZ_DBX_CONNECTOR_ID=`az databricks access-connector show --resource-group ${AZ_RG_NAME} --name ${AZ_DBX_CONNECTOR_NAME} -o json | jq -r '.id'`

# Create the Storage Credential
dbx-api -X POST -H 'Content-Type: application/json' ${DBX_AZ_API_URL}/api/2.0/unity-catalog/storage-credentials --data "{
  \"name\": \"${DBX_AZ_METASTORE_SC_NAME}\",
  \"comment\": \"storage credential for the Metastore\",
  \"azure_managed_identity\": {
    \"access_connector_id\": \"${TMP_AZ_DBX_CONNECTOR_ID}\"
  }
}"


# 7. Assign the Storage Credential to the Metastore
# Get the Storage Credential id 
export TMP_DBX_AZ_METASTORE_SC_ID=`dbx-api -X GET ${DBX_AZ_API_URL}/api/2.1/unity-catalog/storage-credentials | jq -r '.storage_credentials[]|select(.name==$ENV.DBX_AZ_METASTORE_SC_NAME)|.id'`

# Update Metastore configuration with the Storage Credential
dbx-api -X PATCH ${DBX_AZ_API_URL}/api/2.1/unity-catalog/metastores/${TMP_DBZ_AZ_METASTORE_ID} -H 'Content-Type: application/json' -d "{\"storage_root_credential_id\": \"${TMP_DBX_AZ_METASTORE_SC_ID}\"}"
``` 

Si la création du `Databricks Access Connector` (étape n°2) ne fonctionne pas avec l'outil Azure CLI, vous pouvez le faire manuellement de la manière suivante :
1. Allez sur `Microsoft Azure page > Resource Group`
2. Cliquez sur le resource groupe souhaité
3. Cliquez sur `Create`
4. Renseignez l'information `Search the Marketplace` avec la valeur `access connector for azure databricks`
5. Cliquez sur `Create > Access Connector for Azure Databricks`
6. Cliquez sur `Create`
7. Renseignez les informations `Subscription` , `Resource group`, `Name` et `Region` avec les valeurs souhaitées
8. Cliquez sur `Review + create`
9. Cliquez sur `Create`

Note : concernant la ressource SQL Warehouse sur Azure, un SQL Warehouse 2X-Small nécessite d'avoir une valeur de 8 au minimum pour le quota nommé `Total Regional Spot vCPUs`


## Mise en place d'un destinataire (Recipient) Databricks-to-Databricks

Afin de pouvoir partager les données avec un destinataire utilisant un Metastore Unity Catalog, nous devons réaliser les actions suivantes :
1. Demander l'identifiant de partage du Metastore Unity Catalog (sharing identifier) du destinataire (Recipient)
2. Créer un destinataire (Recipient) `rcp_azure_dbx` sur le Metastore Unity Catalog AWS du fournisseur (Provider) en utilisant l'identifiant de partage (sharing identifier) communiqué correspondant au Metastore Unity Catalog Azure du destinaire (Recipient)
3. Donner les droits de lecture au destinataire (Recipient) `rcp_azure_dbx` sur les éléments du partage (Share) nommé `share_aws_dbx`

Détail des étapes :
1. Demander l'identifiant de partage du Metastore Unity Catalog (sharing identifier) du destinataire (Recipient)

L'identifiant de partage est une chaîne de caractères composées des informations suivantes : `<Metastore Cloud Provider>:<Metastore Region>:<Metastore ID>`

Il existe plusieurs moyen d'avoir cet identifiant pour le destinataire: 
- Le 1er moyen (qui est le plus simple) est de se connecter sur le Worspace Databricks et d'exécuter la commande `select current_metastore()` sur un SQL Warehouse (ou `spark.sql("select current_metastore()")` dans un notebook attaché à un cluster ayant les droits d'accès à au Metastore Unity Catalog)
- Le 2ème moyen est l'utilisation de Databricks REST API
```bash
# Get Metastore Sharing ID
dbx-api -X GET ${DBX_AZ_API_URL}/api/2.1/unity-catalog/metastores  | jq -r '.metastores[]|select(.name==$ENV.DBX_AZ_METASTORE_NAME)|.cloud+":"+.region+":"+.metastore_id'
```
- Le 3ème moyen est d'utiliser l'outil Data Explorer
    1. Allez dans `Workspace Databricks page > Data > Delta Sharing > Shared with me`
    2. Cliquez sur `Copy sharing identifier`

Une fois l'identifiant de partage récupéré, il faut l'envoyer au fournisseur (Provider) du partage (share).


2. Créer un destinataire (Recipient) `rcp_azure_dbx` sur le Metastore Unity Catalog AWS du fournisseur (Provider) en utilisant l'identifiant de partage (sharing identifier) communiqué correspondant au Metastore Unity Catalog Azure du destinataire (Recipient)

Remarque : Nous allons mettre en place une propriété `id_client : 1` pour utiliser les partitions de l'objet partagé dont l'alias est `sch_share.fct_trx_mng`

La création d'un destinaire (Recipient) nécessite les droits suivants sur le Metastore :
```sql
GRANT CREATE_RECIPIENT ON METASTORE TO grp_demo;
```

Pour créer un destinataire (Recipient) à partir de Databricks REST API :
```bash
# Get the Azure Metastore Sharing Identifier
export TMP_AZ_METASTORE_SHARING_ID=`dbx-api -X GET ${DBX_AZ_API_URL}/api/2.1/unity-catalog/metastores  | jq -r '.metastores[]|select(.name==$ENV.DBX_AZ_METASTORE_NAME)|.cloud+":"+.region+":"+.metastore_id'`

# Create Recipient for Databricks-to-Databricks Share
dbx-api -X POST ${DBX_API_URL}/api/2.1/unity-catalog/recipients -H 'Content-Type: application/json' -d "
{
      \"name\": \"${DBX_RECIPIENT_DBX}\",
      \"authentication_type\": \"DATABRICKS\",
      \"data_recipient_global_metastore_id\": \"${TMP_AZ_METASTORE_SHARING_ID}\",
      \"properties_kvpairs\": {
        \"properties\": {\"id_client\": \"1\"}
      },
      \"comment\" : \"Recipient Databricks (share data between databricks metastore)\"
    }
"
```

Pour créer un destinataire  (Recipient) à partir des commandes SQL :
```sql
-- A recipient created for Databricks to Databricks sharing with a id_client properties
CREATE RECIPIENT rcp_azure_dbx
USING ID '<Metastore Azure Sharing identifier>'
PROPERTIES ( id_client = 1)
;

-- To get the detail of the recipient
DESCRIBE RECIPIENT rcp_azure_dbx;
```


3. Donner les droits de lecture au destinataire (Recipient) `rcp_azure_dbx` sur les éléments du partage (Share) nommé `share_aws_dbx`
```sql
GRANT SELECT ON SHARE share_aws_dbx TO RECIPIENT rcp_azure_dbx;
```

A partir de cette dernière étape, le destinataire (Recipient) `rcp_azure_dbx` pourra accéder aux objets du partage (Share) en utilisant sont Metastore Unity Catalog avec son Workspace Databricks Azure.

Note : Il faut parfois attendre quelques secondes ou minutes pour voir apparaître le nouveau fournisseur (Provider) nommé `dbx_aws_sharing` au niveau du Metastore Unity Catalog Azure après la création du destinataire (Recipient) `rcp_azure_dbx`

Le résultat devrait être le suivant : 
[![schema_03](/blog/web/20230521_blog_article_unity_catalog_dela_sharing_03.png)](/blog/web/20230521_blog_article_unity_catalog_dela_sharing_03.png)

## Accès par le Metastore Unity Catalog Azure

Une fois le partage Databricks-to-Databricks mis en place, il faut qu'un administrateur du Metastore Unity Catalog Azure puisse créer un catalogue en utilisant les informations du partage (Share) afin de pouvoir rendre accessible les objets du partage (Share) aux utilisateurs du Metastore.

Pour ce faire, il suffit uniquement d'utiliser la commande SQL de création d'un catalogue et de donner les droits d'utilisation et de lecture sur le catalogue comme pour n'importe quel autre catalogue du Metastore Unity Catalog.

La différence étant que les objets du catalogue liés au partage (Share) ne pourront être utilisés qu'en lecture seule et les données sont stockées dans la ressource AWS S3 du fournisseur (Provider) et non pas dans la ressource Azure ADLS Gen2 du destinataire (Recipient)

Création du catalogue avec une commande SQL 
```sql
CREATE CATALOG IF NOT EXISTS ctg_aws
USING SHARE `dbx_aws_sharing`.share_aws_dbx
COMMENT 'Shared data from AWS Metastore'
;
```

Remarque : Lors de la mise en place du partage Databricks-to-Databricks, il n'y a pas besoin de partager d'information de connexion entre les deux Metastore. Nous avons utilisé uniquement un identifiant de partage lié au Metastore du destinataire (Recipient), ce qui a pour effet de simplifier et sécuriser les échanges et la mise en place du partage (Share).

Exemple d'accès aux données à partir d'une requête sur un SQL Warehouse en passant par le Workspace Databricks Azure :
1. Lorsque l'on accède à l'objet `sch_share.fct_trx_mng`, on ne voit que les informations dont la colonne `id_client` est égale à la valeur `1` car le destinataire n'a le droit d'accéder qu'à cette partition des données comme défini par le fournisseur (Provider) lors de la création du destinataire (Recipient)
[![schema_04](/blog/web/20230521_blog_article_unity_catalog_dela_sharing_04.png)](/blog/web/20230521_blog_article_unity_catalog_dela_sharing_04.png)

2. Lorsque que l'on accède à l'objet `sch_share.fct_trx_ext`, on peut voir l'ensemble des données.
[![schema_05](/blog/web/20230521_blog_article_unity_catalog_dela_sharing_05.png)](/blog/web/20230521_blog_article_unity_catalog_dela_sharing_05.png)




Concernant l'accès au notebook partagé :
Pour accéder au notebook `shared_nbk`, il faut utiliser l'outil Data Explorer :
1. Aller dans `Workspace Databricks page > Data `
2. Sélectionner le catalogue (à partir des objets partagés)
3. Cliquez sur l'onglet `Other assets`
4. Cliquez sur le notebook souhaité

Remarque : Vous ne pourrez voir que les cellules du notebook au format HTML en lecture seule et vous pourrez cloner le notebook dans votre Workspace Databricks.

Visualisation de la liste des notebooks partagés avec l'outil Data Explorer
[![schema_06](/blog/web/20230521_blog_article_unity_catalog_dela_sharing_06.png)](/blog/web/20230521_blog_article_unity_catalog_dela_sharing_06.png)

Visualisation du notebook `shared_nbk` avec l'outil  Data Explorer
[![schema_07](/blog/web/20230521_blog_article_unity_catalog_dela_sharing_07.png)](/blog/web/20230521_blog_article_unity_catalog_dela_sharing_07.png)


## Lecture des logs d'audits

Pour accéder plus facilement aux logs d'audit, nous allons créer une table externe nommée `ctg_ext.sch_ext.audit_logs_json` basée sur le répertoire `s3://s3-demo-data-uc/dbx_logs/account` qui contient l'ensemble des fichiers de logs au format JSON avec les informations des évènements liés à l'Account Databricks (et aux différents Workspace Databricks).

Nous allons nous intéresser uniquement aux actions `deltaSharingQueriedTable` et `deltaSharingQueryTable` au niveau de l'Account Databricks concernant le destinataire (Recipient) `rcp_azure_dbx` pour mettre en évidence quelques informations que nous pouvons récupérer facilement à partir des logs d'audit pour suivre l'accès aux objets partagés.

Les étapes sont les suivantes :
1. Création de la table externe  `ctg_ext.sch_ext.audit_logs_json` pour accéder facilement aux fichiers JSON de la ressource AWS S3 nommée `s3://s3-demo-data-uc/dbx_logs/account`
2. Récupération des informations concernant les actions `deltaSharingQueryTable` pour le destinataire (Recipient) `rcp_azure_dbx`
3. Récupération des informations concernant les actions `deltaSharingQueriedTable` pour le destinataire (Recipient) `rcp_azure_dbx`

```sql
-- 1. Create ctg_ext.sch_ext.audit_logs_json from JSON files
CREATE TABLE ctg_ext.sch_ext.audit_logs_json
USING JSON
OPTIONS (path "s3://s3-demo-data-uc/dbx_logs/account");


-- 2. Get deltaSharingQueryTable action informations from rcp_azure_dbx recipient
select requestId
,requestParams.recipient_name
,requestParams.share
,requestParams.schema
,requestParams.name
,requestParams.user_agent
,response.statusCode
,serviceName
,sourceIPAddress
,date
from ctg_ext.sch_ext.audit_logs_json 
where actionName ='deltaSharingQueryTable'
and auditLevel = 'ACCOUNT_LEVEL'
and requestParams.recipient_name in ('rcp_azure_dbx')
order by timestamp asc


-- 3. Get deltaSharingQueriedTable action informations from rcp_azure_dbx recipient
select requestId
,requestParams.recipient_name
,response.result:numRecords
,response.result:tableName
,response.result:deltaSharingPartitionFilteringAccessed
,serviceName
,sourceIPAddress
,userAgent
from ctg_ext.sch_ext.audit_logs_json 
where actionName ='deltaSharingQueriedTable'
and auditLevel = 'ACCOUNT_LEVEL'
and requestParams.recipient_name in ('rcp_azure_dbx')
order by timestamp asc

```


Résultat de l'étape n°2 concernant les actions  `deltaSharingQueryTable` :
```csv
requestId,recipient_name,share,schema,name,user_agent,statusCode,serviceName,sourceIPAddress
CgsI3ceeowYQhsLgAzoQSHf2V13IQFqodUiz6jKNJw==,rcp_azure_dbx,share_aws_dbx,sch_share,fct_trx_mng,Delta-Sharing-Unity-Catalog-Databricks-Auth/1.0 Linux/5.4.0-1107-azure-fips OpenJDK_64-Bit_Server_VM/11.0.18+10-jvmci-22.3-b13 java/11.0.18 scala/2.12.15 java_vendor/GraalVM_Community,200,unityCatalog,
CgsI78eeowYQvvjMFjoQvIDzt07UQ3mzAJR99KJGpg==,rcp_azure_dbx,share_aws_dbx,sch_share,fct_trx_ext,Delta-Sharing-Unity-Catalog-Databricks-Auth/1.0 Linux/5.4.0-1107-azure-fips OpenJDK_64-Bit_Server_VM/11.0.18+10-jvmci-22.3-b13 java/11.0.18 scala/2.12.15 java_vendor/GraalVM_Community,200,unityCatalog,
```
Cette requête nous permet d'accéder aux informations des demandes de requêtes exécutées sur les objets partagés (le nom du destinataire, le nom du partage, le nom du schéma, le nom de la table, etc ...)

Résultat de la requête n°3 concernant les actions  `deltaSharingQueriedTable` :
```csv
requestId,recipient_name,numRecords,tableName,deltaSharingPartitionFilteringAccessed,serviceName,sourceIPAddress,userAgent
d8140290-4a65-44a2-aac0-31c7feaf4aac,rcp_azure_dbx,5,fct_trx_mng,true,unityCatalog,,Delta-Sharing-Unity-Catalog-Databricks-Auth/1.0 Linux/5.4.0-1107-azure-fips OpenJDK_64-Bit_Server_VM/11.0.18+10-jvmci-22.3-b13 java/11.0.18 scala/2.12.15 java_vendor/GraalVM_Community
854c0522-aaca-465c-8f7d-1684a003e8e1,rcp_azure_dbx,8,fct_trx_ext,false,unityCatalog,,Delta-Sharing-Unity-Catalog-Databricks-Auth/1.0 Linux/5.4.0-1107-azure-fips OpenJDK_64-Bit_Server_VM/11.0.18+10-jvmci-22.3-b13 java/11.0.18 scala/2.12.15 java_vendor/GraalVM_Community
```
Cette requête nous permet d'accéder aux informations du résultat des requêtes exécutées sur les objets partagés.
On peut voir que la requête sur la table `fct_trx_mng` a l'option `deltaSharingPartitionFilteringAccessed` activée et ne retourne que 5 lignes (ce qui correspond au filtre sur les partitions) et que la requête sur la table `fct_trx_ext` retourne 8 lignes.
On peut aussi avoir d'autres informations comme l'adresse ip, l'agent de l'outil qui a exécuté la requête (Databricks dans notre cas) et bien d'autres informations.



# Partage des données en Open Sharing

Afin de pouvoir partager les données avec un destinataire n'utilisant pas de Metastore Unity Catalog (nommé Open Sharing), nous devons réaliser les actions suivantes :
1. Créer un destinataire (Recipient) `rcp_open_all` basé sur un Token Databricks (qui aura une durée de vie définie au niveau du Metastore)
2. Donner les droits de lecture au destinataire (Recipient) `rcp_open_all` sur les objets du partage (Share) `share_aws_dbx`
3. Récupérer l'URL d'activation pour l'envoyer au destinataire (Recipient) `rcp_open_all` 
4. Le destinataire (Recipient) doit se connecter à l'URL indiquée et télécharger le fichier de configuration nommé `config.share` pour pouvoir se connecter au partage (Share) `share_aws_dbx` du fournisseur (Provider)

Détail des étapes :
1. Créer un destinataire (Recipient) `rcp_open_all` basé sur un Token Databricks

Remarque : Nous allons mettre en place une propriété `id_client : 2` pour utiliser les partitions de l'objet partagé dont l'alias est `sch_share.fct_trx_mng`

La création d'un destinataire (Recipient) nécessite les droits suivants sur le Metastore :
```sql
GRANT CREATE_RECIPIENT ON METASTORE TO 'grp_demo';
```

Pour créer un destinataire (Recipient) à partir de Databricks REST API :
```bash
# Create Recipient for Token Open Sharing
dbx-api -X POST ${DBX_API_URL}/api/2.1/unity-catalog/recipients -H 'Content-Type: application/json' -d "
{
      \"name\": \"${DBX_RECIPIENT_OPEN}\",
      \"authentication_type\": \"TOKEN\",
      \"properties_kvpairs\": {
        \"properties\": {\"id_client\": \"2\"}
      },
      \"comment\": \"Give access to shared data for external tools\"
    }
"

```

Pour créer un destinataire (Recipient) à partir des commandes SQL :
```sql
-- A recipient created for sharing outside of Databricks with a id_client properties
CREATE RECIPIENT rcp_open_all
COMMENT 'Give access to shared data for external tools'
PROPERTIES ( id_client = 2)
;
```


2. Donner les droits de lecture au destinataire (Recipient) `rcp_open_all` sur les objets du partage (Share) `share_aws_dbx`
```sql
GRANT SELECT ON SHARE share_aws_dbx TO RECIPIENT rcp_open_all;
```


3. Récupérer  l'URL d'activation pour l'envoyer au destinataire (Recipient) `rcp_open_all` 
La récupération de l'URL peut se faire en SQL avec la commande :
```sql
-- Get the activation url (activation_link parameter)
DESCRIBE RECIPIENT rcp_open_all;
-- activation_link : https://ireland.cloud.databricks.com/delta_sharing/retrieve_config.html?XXXXXXXXXXXXX
```

La récupération de l'URL peut aussi se faire avec Databricks REST API :
```bash
dbx-api -X GET ${DBX_API_URL}/api/2.1/unity-catalog/recipients/${DBX_RECIPIENT_OPEN} | jq -r '.tokens[0].activation_url'
```

4. Le destinataire (Recipient) doit se connecter à l'URL indiquée et télécharger le fichier de configuration nommé `config.share` pour pouvoir se connecter au partage (Share) `share_aws_dbx` du fournisseur (Provider)

Attention : Quelque soit la méthode utilisée, la récupération des informations de connexion ne pourra se faire qu'une seule fois. Cela est géré par Databricks.

Il est possible de récupérer les informations avec Databricks REST API : 
Note : écriture des informations de connexion dans le fichier `~/config.share`
```bash
# Get the URL Activation Code (from Metastore Unity CAtalog AWS)
export TMP_DBX_RECIPIENT_OPEN_URL=`dbx-api -X GET ${DBX_API_URL}/api/2.1/unity-catalog/recipients/${DBX_RECIPIENT_OPEN} | jq '.tokens[0].activation_url' | sed "s/.*?//" | sed 's/"//'`

# Extract information to write the config.share file (instead of download from databricks activation page) from Public API
dbx-api -X GET ${DBX_API_URL}/api/2.1/unity-catalog/public/data_sharing_activation/${TMP_DBX_RECIPIENT_OPEN_URL} > ~/config.share

```

Pour la récupération manuelle des informations de connexion `config.share`, il suffit d'accéder à l'URL d'activation communiquée :
[![schema_08](/blog/web/20230521_blog_article_unity_catalog_dela_sharing_08.png)](/blog/web/20230521_blog_article_unity_catalog_dela_sharing_08.png)

Informations : 
- Vous ne pourrez accéder à l'URL d'activation et aux objets du partage (Share) que durant la durée de validité du Token Databricks
- Il est possible d'accéder à l'URL d'activation autant de fois que vous le souhaitez (durant la période de validité) mais le téléchargement du fichier de configuration `config.share` n'est possible qu'une seule fois
    - C'est par l'intermédiaire de ce fichier de configuration `config.share` que vous allez pouvoir accéder aux objets partagés
- Il est possible de faire une rotation de Token Databricks pour réactiver l'accès aux objets partagés, mais cela nécessite de récupérer un nouveau fichier de configuration `config.share` (les clés seront différentes)

Exemple d'une rotation de Token Databricks (si par exemple l'activation n'a pas pu se faire durant la période de validité initiale) avec Databricks REST API : 
```bash
# If you need to rotate the Databricks Token
dbx-api -X POST ${DBX_API_URL}/api/2.1/unity-catalog/recipients/${DBX_RECIPIENT_OPEN}/rotate-token -H 'Content-Type: application/json' -d '{
"existing_token_expire_in_seconds": 0
}'
```


A partir de l'étape n°4, le destinataire (Recipient) peut accéder aux objets (tables delta uniquement) du partage (Share) en utilisant l'outil souhaité en fonction des connecteurs `delta-sharing` disponible (python, java, spark, etc ...)





## Access par script python

Pré-requis : le fichier de configuration `config.share` a été récupéré en local `~/config.share`

Installation de la librairie python `delta-sharing` proposé par Databricks
```bash
pip install delta-sharing
```

Exemple d'un script python permettant d'afficher le contenu des tables delta partagées :
```python
import delta_sharing
from tabulate import tabulate

# Define the profile file (config.share)
profile_file = "~/config.share"

# Define the parameter to read data
read_share = "share_aws_dbx"
read_schema = "sch_share"
read_table_mng = "fct_trx_mng"
read_table_ext = "fct_trx_ext"

# Get the data from shared table fct_trx_mng
df_pandas_mng = delta_sharing.load_as_pandas("{0}#{1}.{2}.{3}".format(profile_file,read_share,read_schema,read_table_mng))
print("Table : [{0}.{1}.{2}]".format(read_share,read_schema,read_table_mng))
print(tabulate(df_pandas_mng, headers = 'keys', tablefmt = 'pretty'))


# Get the data from shared table fct_trx_ext
df_pandas_ext = delta_sharing.load_as_pandas("{0}#{1}.{2}.{3}".format(profile_file,read_share,read_schema,read_table_ext))
print("Table : [{0}.{1}.{2}]".format(read_share,read_schema,read_table_ext))
print(tabulate(df_pandas_ext, headers = 'keys', tablefmt = 'pretty'))
```

Résultat du script :
```text
# Result :
Table : [share_aws_dbx.sch_share.fct_trx_mng]
+---+--------+---------------------+------------+---------+-----------+----------+----------------------------+
|   | id_trx |       ts_trx        | id_product | id_shop | id_client | quantity |          ts_tech           |
+---+--------+---------------------+------------+---------+-----------+----------+----------------------------+
| 0 |   8    | 2023-04-10 18:30:00 |     3      |    1    |     2     |    2     | 2023-05-19 12:52:17.070000 |
| 1 |   7    | 2023-04-10 18:30:00 |     2      |    1    |     2     |    11    | 2023-05-19 12:52:17.070000 |
| 2 |   4    | 2023-04-05 08:00:00 |     3      |    1    |     2     |    9     | 2023-05-19 12:52:17.070000 |
+---+--------+---------------------+------------+---------+-----------+----------+----------------------------+

Table : [share_aws_dbx.sch_share.fct_trx_ext]
+---+--------+---------------------+------------+---------+-----------+----------+----------------------------+
|   | id_trx |       ts_trx        | id_product | id_shop | id_client | quantity |          ts_tech           |
+---+--------+---------------------+------------+---------+-----------+----------+----------------------------+
| 0 |   1    | 2023-04-01 09:00:00 |     1      |    2    |     1     |    1     | 2023-05-19 12:52:06.195000 |
| 1 |   2    | 2023-04-01 11:00:00 |     1      |    1    |     1     |    3     | 2023-05-19 12:52:06.195000 |
| 2 |   3    | 2023-04-03 14:00:00 |     1      |    2    |     1     |    1     | 2023-05-19 12:52:06.195000 |
| 3 |   4    | 2023-04-05 08:00:00 |     3      |    1    |     2     |    9     | 2023-05-19 12:52:06.195000 |
| 4 |   5    | 2023-04-06 10:00:00 |     1      |    2    |     1     |    3     | 2023-05-19 12:52:06.195000 |
| 5 |   6    | 2023-04-06 12:00:00 |     2      |    2    |     1     |    1     | 2023-05-19 12:52:06.195000 |
| 6 |   7    | 2023-04-10 18:30:00 |     2      |    1    |     2     |    11    | 2023-05-19 12:52:06.195000 |
| 7 |   8    | 2023-04-10 18:30:00 |     3      |    1    |     2     |    2     | 2023-05-19 12:52:06.195000 |
+---+--------+---------------------+------------+---------+-----------+----------+----------------------------+
```

On peut voir que la premiere table delta `share_aws_dbx.sch_share.fct_trx_mng` ne retourne que les informations correspondant à la partition `id_client = 2` et la deuxième table delta `share_aws_dbx.sch_share.fct_trx_ext` retourne la totalité des lignes.

Avec ce script python, on peut voir qu'il est extrêmement simple d'accéder aux tables delta partagées.


Exemple d'un script python pour lister les tables delta du partage (Share) avec l'objet `SharingClient` :
```python
import delta_sharing

# Define the profile file (config.share)
profile_file = "~/config.share"

# Get the Client objet to managed the Sharing connexion
client = delta_sharing.SharingClient(profile_file)

print("Listing of All the Tables :")
for element in client.list_all_tables():
    print("  - {}".format(element))

print("\nListing of Shares : ")
l_shares = client.list_shares()
for element in l_shares:
    print("  - {}".format(element))

print("\nListing of Schema from Share [{}] : ".format(l_shares[0].name))
l_schemas = client.list_schemas(l_shares[0])
for element in l_schemas :
    print("  - {}".format(element))

print("\nListing of Tables from Schema [{}] from Share [{}] : ".format(l_schemas[0].name,l_shares[0].name))
l_tables = client.list_tables(l_schemas[0])
for element in l_tables :
    print("  - {}".format(element))

```

Résultat du script :
```text
Listing of All the Tables :
  - Table(name='fct_trx_ext', share='share_aws_dbx', schema='sch_share')
  - Table(name='fct_trx_mng', share='share_aws_dbx', schema='sch_share')

Listing of Shares : 
  - Share(name='share_aws_dbx')

Listing of Schema from Share [share_aws_dbx] : 
  - Schema(name='sch_share', share='share_aws_dbx')

Listing of Tables from Schema [sch_share] from Share [share_aws_dbx] : 
  - Table(name='fct_trx_ext', share='share_aws_dbx', schema='sch_share')
  - Table(name='fct_trx_mng', share='share_aws_dbx', schema='sch_share')
```


## Lecture des logs d'audit

Nous allons utiliser la même procédure que pour la lecture des logs d'audit du partage Databricks-to-Databricks Sharing.

Nous allons nous intéresser uniquement aux actions `deltaSharingQueriedTable` et `deltaSharingQueryTable` au niveau de l'Account Databricks pour le destinataire (Recipient) `rcp_open_all`  pour mettre en évidence quelques informations que nous pouvons récupérer facilement à partir des logs d'audit pour suivre l'accès aux objets partagés.

```sql
-- 1. Create ctg_ext.sch_ext.audit_logs_json from JSON files
CREATE TABLE ctg_ext.sch_ext.audit_logs_json
USING JSON
OPTIONS (path "s3://s3-demo-data-uc/dbx_logs/account");


-- 2. Get deltaSharingQueryTable action informations from rcp_open_all recipient
select requestId
,requestParams.recipient_name
,requestParams.share
,requestParams.schema
,requestParams.name
,requestParams.user_agent
,response.statusCode
,serviceName
,sourceIPAddress
,date
from ctg_ext.sch_ext.audit_logs_json 
where actionName ='deltaSharingQueryTable'
and auditLevel = 'ACCOUNT_LEVEL'
and requestParams.recipient_name in ('rcp_open_all')
order by timestamp asc



-- 2. Get information from deltaSharingQueriedTable action from rcp_open_all recipient
select requestId
,requestParams.recipient_name
,response.result:numRecords
,response.result:tableName
,response.result:deltaSharingPartitionFilteringAccessed
,serviceName
,sourceIPAddress
,userAgent
from ctg_ext.sch_ext.audit_logs_json 
where actionName ='deltaSharingQueriedTable'
and auditLevel = 'ACCOUNT_LEVEL'
and requestParams.recipient_name in ('rcp_open_all')
order by timestamp asc

```


Résultat de l'étape n°2 concernant les actions  `deltaSharingQueryTable` :
```csv
requestId,recipient_name,share,schema,name,user_agent,statusCode,serviceName,sourceIPAddress
d59abaa0-2829-4d4b-90ea-73e9f4ec11ee,rcp_open_all,share_aws_dbx,sch_share,fct_trx_mng,Delta-Sharing-Python/0.6.4 pandas/1.3.4 PyArrow/11.0.0 Python/3.11.3 System/macOS-13.3.1-arm64-arm-64bit,200,unityCatalog,86.247.59.138
0690bef9-413d-44ec-8541-4901273aa589,rcp_open_all,share_aws_dbx,sch_share,fct_trx_ext,Delta-Sharing-Python/0.6.4 pandas/1.3.4 PyArrow/11.0.0 Python/3.11.3 System/macOS-13.3.1-arm64-arm-64bit,200,unityCatalog,86.247.59.138
```
Cette requête nous permet d'accéder aux informations des demandes de requêtes exécutées sur les objets partagés (le nom du destinataire, le nom du partage, le nom du schéma, le nom de la table, etc ...)


Résultat de la requête n°3 concernant les actions  `deltaSharingQueriedTable` : 
```csv
requestId,recipient_name,numRecords,tableName,deltaSharingPartitionFilteringAccessed,serviceName,sourceIPAddress,userAgent
88dc2822-63c1-4384-b706-82ab9d5f5d9a,rcp_open_all,3,fct_trx_mng,true,unityCatalog,86.247.59.138,Delta-Sharing-Python/0.6.4 pandas/1.3.4 PyArrow/11.0.0 Python/3.11.3 System/macOS-13.3.1-arm64-arm-64bit
2be8d1b6-936c-40d9-89c1-60d104e9f50f,rcp_open_all,8,fct_trx_ext,false,unityCatalog,86.247.59.138,Delta-Sharing-Python/0.6.4 pandas/1.3.4 PyArrow/11.0.0 Python/3.11.3 System/macOS-13.3.1-arm64-arm-64bit
```
Cette requête nous permet d'accéder aux informations du résultat des requêtes exécutées sur les objets partagés.
On peut voir que la requête sur la table `fct_trx_mng` a l'option `deltaSharingPartitionFilteringAccessed` activée et ne retourne que 3 lignes (ce qui correspond au filtre sur les partitions) et que la requête sur la table `fct_trx_ext` retourne 8 lignes.
On peut aussi avoir d'autres informations comme l'adresse ip, l'agent de l'outil qui a exécuté la requête (Python/pandas dans notre cas) et bien d'autres informations.


# Suppression des éléments

Vous trouverez, ci-dessous, l'ensemble des instructions nécessaires pour nettoyer l'environnement.

Suppression des destinataires (Recipient) (avec Databricks REST API) :
```bash
dbx-api -X DELETE ${DBX_API_URL}/api/2.1/unity-catalog/recipients/${DBX_RECIPIENT_DBX}
dbx-api -X DELETE ${DBX_API_URL}/api/2.1/unity-catalog/recipients/${DBX_RECIPIENT_OPEN}
```

Suppression du notebook importé (avec Databricks REST API) :
```bash
dbx-api -X POST ${DBX_API_URL}/api/2.0/workspace/delete -H 'Content-Type: application/json' -d '{"path": "/Shared/read_demo_data_nbk_scala", "recursive":"false"}'
```


Suppression du partage (Share)  (avec Databricks REST API) :
```bash
# Delete Share
dbx-api -X DELETE ${DBX_API_URL}/api/2.1/unity-catalog/shares/${DBX_SHARE_NAME}
```


Suppression des catalogues du Metastore Unity Catalog (avec des instructions SQL) :
```sql
-- Delete the Catalog with CASCADE option (to delete all objects)
DROP CATALOG IF EXISTS ctg_mng CASCADE;
DROP CATALOG IF EXISTS ctg_ext CASCADE;
```

Désactivation du partage des données sur le Metastore Unity Catalog (avec Databricks REST API) :
```bash
# Get the Metastore ID (databricks)
export TMP_DBX_METASTORE_ID=`dbx-api -X GET ${DBX_API_URL}/api/2.1/unity-catalog/metastores | jq -r '.metastores[]|select(.name==$ENV.DBX_METASTORE_NAME)|.metastore_id'`

# Update the Metastore configuration to deactivate Delta Sharing (external)
dbx-api -X PATCH ${DBX_API_URL}/api/2.1/unity-catalog/metastores/${TMP_DBX_METASTORE_ID} -H 'Content-Type: application/json' -d "{
    \"delta_sharing_scope\": \"INTERNAL\"
}"
```

Suppression des données utilisées sur la ressource AWS S3 (avec l'outil AWS CLI) :
```bash
# Delete all files stored in the AWS S3 resource
aws s3 rm "s3://s3-demo-data-uc/demo/" --recursive 
aws s3 rm "s3://s3-demo-data-uc/data/" --recursive 
aws s3 rm "s3://s3-demo-data-uc/dbx_logs/" --recursive 
```

Suppression des éléments concernant l'Account Databricks Azure (avec les outils Azure CLI et Databricks REST API) :
```bash
# Delete Metastore
dbx-api -X DELETE ${DBX_AZ_API_URL}/api/2.1/unity-catalog/metastores/${DBZ_AZ_METASTORE_ID}  -H 'Content-Type: application/json' -d '{"force": "true"}'

# Delete Databricks Access Connector
az databricks access-connector delete --resource-group ${AZ_RG_NAME} --name ${AZ_DBX_CONNECTOR_NAME}

# Delete ADLS Gen2 Storage
az storage account delete -n ${AZ_ADLS2_NAME} -g ${AZ_RG_NAME}

```


Note : Pensez à désactiver les logs d'audit avec [Databricks REST API](https://docs.databricks.com/api-explorer/account/logdelivery/patchstatus) si cela n'est plus utile


# Conclusion

Avec la fonctionnalité Delta Sharing, la solution Unity Catalog permet de mettre en place une gouvernance et un partage des données de manière très simple et sécurisée avec des partenaires internes (équipes, filiales) et externes afin de mieux les valoriser et monétiser.

La gestion des objets partagés peut se faire uniquement avec des commandes SQL, ce qui rend très simple et efficace l'administration des partages (Share) et la gestion des accès pour les différents destinataires (Recipient).

Le partage des données avec Delta Sharing ne nécessite pas l'utilisation des ressources de calcul (Cluster Databricks ou SQL Warehouse) du fournisseur (Provider) pour accéder aux objets partagés.
Delta Sharing permet de partager les données, pouvant être volumineuses, de manière optimale et en limitant les coûts en donnant accès de manière transparente directement au stockage des données de manière sécurisée (AWS S3, Azure ADLS, GCP) 

Cela permet de multiplier l'usage possible des données sans avoir à les dupliquer et de pouvoir y accéder à partir d'un très grand nombre d'outils et de technologies (Spark, Python, Java, Scala, PowerBI et bien d'autres dans le futur)

En s'appuyant sur les Logs d'audit, nous avons la possibilité de tracer l'ensemble des évènements liés aux Metastores de la solution Unity Catalog au niveau de l'Account Databricks et ainsi pouvoir analyser l'usage des objets partagés par les différents destinataires (Recipient).

Au moment de l'écriture de ce document (Avril/Mai 2023), il n'était pas encore possible de partager d'autres objets que des tables delta (managées ou externes) et des notebooks (uniquement pour le partage Databricks-to-Databricks) mais la roadmap de Databricks concernant les prochaines version confirme que l'on pourra bientôt partagés bien plus de type d'objets.

Cette fonctionnalité est encore récente mais devrait se rendre indispensable dans un futur proche pour tout ceux utilisant Databricks pour la gestion d’un Data Lake ou d’un Lakehouse afin de permettre de maximiser les usages des données par l'ensemble des partenaires (interne et externe) et de maîtriser la gouvernance des données avec la solution Unity Catalog.











