---
Categories : ["Databricks","Unity Catalog"]
Tags : ["Databricks","Unity Catalog"]
title : "Databricks : Unity Catalog - Découverte - Partie 3 - Data Lineage"
date : 2023-05-12
draft : false
toc: true
---

Nous allons découvrir la fonctionnalité [Data Lineage](https://docs.databricks.com/data-governance/unity-catalog/data-lineage.html) proposée par la solution [Unity Catalog](https://docs.databricks.com/data-governance/unity-catalog/index.html).

Nous allons utiliser un Account Databricks sur AWS pour réaliser cette découverte.

_Note : Nous allons garder des termes techniques en anglais pour faciliter la compréhension_

_Note : Les travaux se basent sur l'état de la solution Unity Catalog à la fin du 1er trimestre 2023 sur AWS et Azure._

<!--more-->

# Qu'est ce qu'est le Data Lineage

Le Data Lineage consiste à cartographier l'ensemble des objets et leur utilisation afin de pouvoir visualiser le cycle de vie des données.

Lorsque l'on souhaite mettre en place une gouvernance de données, le Data Lineage apporte des informations extrêmement utiles.

Un Lineage fonctionnel consiste à mettre en place les éléments et outils pour cartographier les objets fonctionnels et leur usage dans les différentes applications et projets de l'entreprise afin de visualiser l'usage des données dans l'ensemble de l'organisation (équipes, applications, projets)
Cela permet de faciliter les travaux de rationalisation de l'usage global des données ainsi que la mise en place d'un langage fonctionnel commun à l'entreprise.

Un Lineage technique consiste à mettre en place les éléments et outils pour cartographier les objets techniques et l'utilisation des données par les différents outils techniques.
Cela permet de visualiser la relation entre les différents objets et de pouvoir identifier rapidement la provenance des données d'un objet ainsi que les éléments impactés par les changements d'un objet.

Certain outils de gouvernance de données permettant d'automatiser la capture des métadonnées pour centraliser les informations de type Data Lineage comme par exemple Apache Atlas, Azure Purview ou AWS Glue (et bien d'autres)

Dans notre cas, nous allons nous appuyer sur la solution Unity Catalog proposée par Databricks et plus précisément sur la capture des informations mis en place par cette solution pour cartographier l'ensemble des éléments liés au Data Lineage.

Remarque : Il est aussi possible de mettre en place cette cartographie de manière manuelle avec l'utilisation d'un support de type Wiki alimenté manuellement ou à l'aide de scripts pour extraire les métadonnées des différents outils lorsque cela est possible.
Cela nécessite énormément de temps et d'énergie pour rédiger, maintenir, extraire et valider les informations dans le temps (évolution des outils, évolution des applications, évolution des données, ...)


# Unity Catalog et la hiérarchie des objets

## Synthèse 

Unity Catalog est la solution de Databricks permettant d'avoir une gouvernance unifiée et centralisée pour l'ensemble des données gérées par les ressources Databricks ainsi que de sécuriser et faciliter la gestion et le partage des données à l'ensemble des acteurs internes et externes d'une organisation.

Vous pourrez avec une vue d'ensemble plus complète en parcourant la [documentation officielle](https://docs.databricks.com/data-governance/unity-catalog/index.html)

Rappel concernant la hiérarchie  des objets :
[![schema_30](/blog/web/20230512_databricks_unity_catalog_datalineage_30.png)](/blog/web/20230512_databricks_unity_catalog_datalineage_30.png) 

Les différents objets sont :
- Storage Credential : Cet objet est associé directement au Metastore et permet de stocker les accès à un cloud provider (par exemple AWS S3) permettant à la solution Unity Catalog de gérer les droits sur les données.
- External Location : Cet objet est associé au Metastore et permet de stocker le chemin vers un cloud provider (par exemple une ressource AWS S3) en combinaison avec un Storage Credential pour gérer les accès aux données
- Metastore : Objet du plus haut niveau pouvant contenir des métadonnées
- Catalog (Catalogue) : Objet de 1er niveau permettant d'organiser les données par schéma (aussi nommé Base de données)
- Schema (Schéma) : Objet de 2ème et dernier niveau permettant d'organiser les données (contient les tables, les vues et les fonctions)
- Table : Objet permettant de définir la structure et le stockage des données. 
- View (Vue) : Objet permettant d'encapsuler une requête utilisant un ou plusieurs objets (table ou vue)
- Function (Fonction) : Objet permettant de définir des opérations sur les données

Lorsque vous souhaitez accéder à un objet (par exemple une table), il sera nécessaire de renseigner le nom du catalogue et le nom du schéma où est défini l'objet.
Exemple : `select * from catalog.schema.table`



# Préparation de l'environnement

Nous allons mettre en place un ensemble d'éléments nous permettant de découvrir plus en détail la fonctionnalité de Data Lineage de la solution Unity Catalog.

## Contexte

Pré-requis :
- Création du groupe `grp_demo`
- Création de l'utilisateur `john.do.dbx@gmail.com` et ajout de l'utilisateur dans le groupe `grp_demo`
- Création d'un SQL Warehouse et donner le droit d'utilisation au groupe `grp_demo`
- Existence d'un Metastore nommé `metastore-sandbox` avec le Storage Credential nommé `sc-metastore-sandbox` permettant de stocker les données par défaut dans la ressource AWS S3 nommée `s3-dbx-metastore-uc`
- Création d'une ressource AWS S3 nommée `s3-demo-data-uc`
- Création d'un rôle AWS IAM nommé `role-databricks-demo-data-uc` et d'une politique AWS IAM nommée `policy-databricks-demo-data-uc` permettant au rôle global Databricks de gérer l'accès à la ressource AWS S3 nommée `s3-demo-data-uc`
- Création d'un Storage Credential nommé `sc-demo-data-uc` et d'un External Location nommé `el_demo_data_uc` permettant au rôle global Databricks de gérer l'accès à la ressource AWS S3 nommée `s3-demo-data-uc`

Mise en place des droits pour le groupe `grp_demo` :
1. Donner le droit de créer des catalogues au niveau du Metastore pour le groupe `grp_demo` 
2. Donner le droit de lire les fichiers externes à partir de l'objet External Location nommé `el_demo_data_uc` 
```sql
-- 1. Give Create Catalog right on Metastore to grp_demo
GRANT CREATE CATALOG ON METASTORE TO grp_demo;

-- 2. Give Read Files right on el_demo_data_uc location to grp_demo
GRANT READ FILES ON EXTERNAL LOCATION `el_demo_data_uc` TO grp_demo;
```


## Schématisation de l'environnement

Schématisation des éléments de 1er niveau du Metastore correspondant au pré-requis :
[![schema_31](/blog/web/20230512_databricks_unity_catalog_datalineage_31.png)](/blog/web/20230512_databricks_unity_catalog_datalineage_31.png) 


Schématisation du contenu du catalogue `ctg_ipp` :
[![schema_32](/blog/web/20230512_databricks_unity_catalog_datalineage_32.png)](/blog/web/20230512_databricks_unity_catalog_datalineage_32.png) 


Schématisation du contenu du catalogue `ctg_ext` : 
[![schema_33](/blog/web/20230512_databricks_unity_catalog_datalineage_33.png)](/blog/web/20230512_databricks_unity_catalog_datalineage_33.png) 


Schématisation de l'alimentation des données entre les différents objets : 
[![schema_34](/blog/web/20230512_databricks_unity_catalog_datalineage_34.png)](/blog/web/20230512_databricks_unity_catalog_datalineage_34.png) 


## Mise en place d'un jeu de données sur la ressource AWS S3
Contenu du fichier `ref_stores.csv` :
```text
id,lib,postal_code,surface,last_maj
1,BustaPhone One,75001,120,2022-01-01 00:00:00
2,BustaPhone Two,79002,70,2022-01-01 00:00:00
```

Contenu du fichier `ref_clients.csv` : 
```text
id,lib,age,contact,phone,is_member,last_maj
1,Maxence,23,max1235@ter.tt,+33232301123,No,2023-01-01 11:01:02
2,Bruce,26,br_br@ter.tt,+33230033155,Yes,2023-01-01 13:01:00
3,Charline,40,ccccharline@ter.tt,+33891234192,Yes,2023-03-02 09:00:00
```

Contenu du fichier `ref_products.csv` :
```text
id,lib,brand,os,last_maj
1,Pixel 7 Pro,Google,Android,2023-01-01 09:00:00
2,Iphone 14,Apple,IOS,2023-01-01 09:00:00
3,Galaxy S23,Samsung,Android,2023-01-01 09:00:00
```

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
aws s3 cp ref_stores.csv s3://s3-demo-data-uc/demo/ref_stores.csv 
aws s3 cp ref_clients.csv s3://s3-demo-data-uc/demo/ref_clients.csv 
aws s3 cp ref_products.csv s3://s3-demo-data-uc/demo/ref_products.csv 
aws s3 cp fct_transactions.csv s3://s3-demo-data-uc/demo/fct_transactions.csv 
```


## Mise en place des objets dans le Metastore Unity Catalog 

Note : Utilisation d'un utilisateur du groupe `grp_demo`

1. Création des catalogues
- `ctg_ipp` : Catalogue permettant de gérer les éléments managés par Unity Catalog
- `ctg_ext` : Catalogue permettant de gérer les éléments externes
```sql
-- Create Catalog (for managed data)
CREATE CATALOG IF NOT EXISTS ctg_ipp
    COMMENT 'Catalog for managed data';

-- Create Catalog (for external data)
CREATE CATALOG IF NOT EXISTS ctg_ext
    COMMENT 'Catalog for external data';
```

2. Création des schémas
La liste des schémas est la suivante :
- `ctg_ext.sch_ref` : Schéma permettant de regrouper les tables externes pour l'accès aux données référentiels
- `ctg_ipp.sch_bronze` : Schéma permettant de stocker les données brutes
- `ctg_ipp.sch_silver` : Schéma permettant de stocker les données raffinées
- `ctg_ipp.sch_gold` : Schéma permettant de stocker les données agrégées
- `ctg_ipp.sch_gold_v` : Schéma permettant de définir les vues pour l'exposition des données
- `ctg_ipp.sch_reject` : Schéma permettant de stocker les données rejetées
```sql
-- Create Schema for external data
CREATE SCHEMA IF NOT EXISTS ctg_ext.sch_ref
    COMMENT 'Schema for external referential data';

-- Create Schema for managed data
CREATE SCHEMA IF NOT EXISTS ctg_ipp.sch_bronze
    COMMENT 'Schema for Bronze Data';
CREATE SCHEMA IF NOT EXISTS ctg_ipp.sch_silver
    COMMENT 'Schema for Silver Data';
CREATE SCHEMA IF NOT EXISTS ctg_ipp.sch_gold
    COMMENT 'Schema for Gold Data';
CREATE SCHEMA IF NOT EXISTS ctg_ipp.sch_gold_v
    COMMENT 'Schema for Gold Views';
CREATE SCHEMA IF NOT EXISTS ctg_ipp.sch_reject
    COMMENT 'Schema for Reject Data';
```

3. Création des tables externes (External Table) pour accéder aux données des référentiels
```sql
-- Create external table (referential)
CREATE TABLE ctg_ext.sch_ref.ref_clients (
    id int
    ,lib string
    ,age int
    ,contact string
    ,phone string
    ,is_member string
    ,last_maj timestamp
)
USING CSV
OPTIONS (path "s3://s3-demo-data-uc/demo/ref_clients.csv",
        delimiter ",",
        header "true");

CREATE TABLE ctg_ext.sch_ref.ref_products (
    id int
    ,lib string
    ,brand string
    ,os string
    ,last_maj timestamp
)
USING CSV
OPTIONS (path "s3://s3-demo-data-uc/demo/ref_products.csv",
        delimiter ",",
        header "true");

CREATE TABLE ctg_ext.sch_ref.ref_shops (
    id int
    ,lib string
    ,postal_code string
    ,surface int
    ,last_maj timestamp
)
USING CSV
OPTIONS (path "s3://s3-demo-data-uc/demo/ref_shops.csv",
        delimiter ",",
        header "true")
        ;


-- Create managed table
CREATE TABLE ctg_ipp.sch_bronze.fct_transactions_raw (
    id_trx string
    ,ts_trx string
    ,id_product string
    ,id_shop string
    ,id_client string
    ,quantity string
)
COMMENT 'Bronze Transactions Data';


CREATE TABLE ctg_ipp.sch_reject.fct_transactions_rej (
    id_rej int
    ,ts_rej timestamp
    ,id_trx string
    ,ts_trx string
    ,id_product string
    ,id_shop string
    ,id_client string
    ,quantity string
)
COMMENT 'Reject Transactions Data';


CREATE TABLE ctg_ipp.sch_silver.fct_transactions (
    id_trx integer
    ,ts_trx timestamp
    ,id_product integer
    ,id_shop integer
    ,id_client integer
    ,quantity integer
    ,ts_tech timestamp
)
COMMENT 'Silver Transactions Data';


CREATE TABLE ctg_ipp.sch_gold.fct_transactions_agg_day (
    dt_trx date
    ,id_product integer
    ,is_member boolean
    ,quantity integer
    ,ts_tech timestamp
)
COMMENT 'Gold Transactions Data Agg Day';
```

4. Alimentation des tables managées
```sql
-- Insert Bronze Data
COPY INTO ctg_ipp.sch_bronze.fct_transactions_raw
  FROM 's3://s3-demo-data-uc/demo/fct_transactions.csv'
  FILEFORMAT = CSV
  FORMAT_OPTIONS ('encoding' = 'utf8'
                ,'inferSchema' = 'false'
                ,'nullValue' = 'N/A'
                ,'mergeSchema' = 'false'
                ,'delimiter' = ','
                ,'header' = 'true'
                ,'mode' = 'failfast')
;


-- Insert Reject Data
INSERT INTO ctg_ipp.sch_reject.fct_transactions_rej (
    id_rej
    ,ts_rej
    ,id_trx
    ,ts_trx
    ,id_product
    ,id_shop
    ,id_client
    ,quantity
)
SELECT 1 as id_rej
    ,current_timestamp() as ts_rej
    ,id_trx
    ,ts_trx
    ,id_product
    ,id_shop
    ,id_client
    ,quantity
FROM ctg_ipp.sch_bronze.fct_transactions_raw
WHERE TRY_CAST(quantity AS integer) IS NULL 
    OR TRY_CAST(quantity AS integer) < 1 ;



-- Insert Silver Data
INSERT INTO ctg_ipp.sch_silver.fct_transactions (
    id_trx
    ,ts_trx
    ,id_product
    ,id_shop
    ,id_client
    ,quantity
    ,ts_tech
)
SELECT 
    case when (id_trx = 'N/A') then -1 else cast(id_trx as integer) end as id_trx
    ,case when (ts_trx='N/A') then cast('1900-01-01 00:00:00' as timestamp) else cast(ts_trx as timestamp) end as ts_trx
    ,case when (id_product = 'N/A') then -1 else cast(id_product as integer) end as id_product
    ,case when (id_shop = 'N/A') then -1 else cast(id_shop as integer) end as id_shop
    ,case when (id_client = 'N/A') then -1 else cast(id_client as integer) end as id_client
    ,case when (quantity = 'N/A') then 0 else cast(quantity as integer) end as quantity
    ,current_timestamp() as ts_tech
FROM ctg_ipp.sch_bronze.fct_transactions_raw
WHERE case when (quantity = 'N/A') then 0 else cast(quantity as integer) end > 0 ;



-- Insert Gold Data
INSERT INTO ctg_ipp.sch_gold.fct_transactions_agg_day (
    dt_trx
    ,id_product
    ,is_member
    ,quantity
    ,ts_tech
)
SELECT cast(trx.ts_trx as date) as dt_trx
    ,trx.id_product
    ,case when (rc.is_member = 'Yes') then true else false end is_member
    ,sum(trx.quantity)  as quantity
    ,current_timestamp() as ts_tech
FROM ctg_ipp.sch_silver.fct_transactions trx
INNER JOIN ctg_ext.sch_ref.ref_clients rc
ON (rc.id = trx.id_client)
GROUP BY dt_trx
    ,trx.id_product
    ,rc.is_member;
```


5. Création des vues
```sql
-- Create Views
CREATE OR REPLACE VIEW ctg_ipp.sch_gold_v.fct_transactions_day_products
AS
SELECT atd.dt_trx
    ,rp.lib as lib_product
    ,atd.quantity
    ,atd.ts_tech
FROM ctg_ipp.sch_gold.fct_transactions_agg_day atd
LEFT OUTER JOIN ctg_ext.sch_ref.ref_products rp
ON (rp.id = atd.id_product)
where is_member = true;


CREATE OR REPLACE VIEW ctg_ipp.sch_gold_v.fct_transactions_detail
AS SELECT trx.id_trx
    ,trx.ts_trx
    ,rp.lib as lib_product
    ,rp.brand as brand_product
    ,rp.os as os_product
    ,rs.lib as lib_shop
    ,rs.postal_code as postal_code_shop
    ,rc.lib as name_client
    ,case when is_member('admins') then rc.contact else 'XXX@XXX.XX' end as contact_client
    ,trx.ts_tech
FROM ctg_ipp.sch_silver.fct_transactions trx
INNER JOIN ctg_ext.sch_ref.ref_clients rc 
ON (trx.id_client = rc.id)
LEFT OUTER JOIN ctg_ext.sch_ref.ref_shops rs 
ON (trx.id_shop = rs.id)
LEFT OUTER JOIN ctg_ext.sch_ref.ref_products rp
ON (trx.id_product = rp.id);
```



# Data Explorer

L'outil Data Explorer permet d'avoir une interface utilisateur pour l'exploration et la gestion des données (Catalogue, Schéma, Tables, Vues, Droits) et permet d'avoir de nombreuses informations sur les différents objets ainsi que sur leur utilisation. 

Cet outil est accessible dans toutes les vues du Workspace Databricks (Data Science & Engineering, Machine Learning, SQL) en cliquant sur l'option `Data` du menu latéral.

Cet outil utilise les droits d'accès de l'utilisateur du Workspace Databricks, par conséquent il est nécessaire d'avoir les droits suffisants sur les objets. 
Pour pouvoir explorer les éléments sans avoir le droit de lire les données, il faut avoir le droit `USE` sur les différents objets (Catalogue, Schéma, Table, Vue)
Pour pouvoir accéder à un échantillon des données ou à l'historique d'une table au format Delta, il faut avoir le droit `SELECT` en plus du droit `USE`.


Il est possible d'accéder aux métadonnées de l'ensemble des éléments de l'Unity Catalog sans utiliser un SQL Warehouse.
Pour les actions suivantes, il est nécessaire d'avoir un SQL Warehouse actif pour lire les données nécessaires :
- Accès au catalogue `hive_metastore`
- Accès à un échantillon des données d'une table
- Accès à l'historique d'une table Delta

Le menu `Explorer` (barre latérale) permet d'accéder aux éléments suivants :
- Option `Data` : Permet de naviguer dans la hiérarchie des éléments du Metastore (Catalogues, Schémas, Tables, Vues, ...)
- Option `External Data` : Contient la liste des éléments concernant les Storage Credential et les External Location.

Écran de l'option `Data` :
[![schema_01](/blog/web/20230512_databricks_unity_catalog_datalineage_01.png)](/blog/web/20230512_databricks_unity_catalog_datalineage_01.png) 

Écran de l'option `External Data` :
[![schema_02](/blog/web/20230512_databricks_unity_catalog_datalineage_02.png)](/blog/web/20230512_databricks_unity_catalog_datalineage_02.png) 
[![schema_03](/blog/web/20230512_databricks_unity_catalog_datalineage_03.png)](/blog/web/20230512_databricks_unity_catalog_datalineage_03.png) 
[![schema_04](/blog/web/20230512_databricks_unity_catalog_datalineage_04.png)](/blog/web/20230512_databricks_unity_catalog_datalineage_04.png) 


L'interface `Principale` permet d'accéder aux éléments suivants :
- Affichage de la liste des catalogues, visibles par l'utilisateur, avec pour chaque catalogue le timestamp de création et le propriétaire (créateur par défaut)
- Permet de créer, renommer ou supprimer un catalogue

Écran de l'interface `Principale` : 
[![schema_05](/blog/web/20230512_databricks_unity_catalog_datalineage_05.png)](/blog/web/20230512_databricks_unity_catalog_datalineage_05.png) 


L'interface `Catalog` : 
- Onglet `Schemas` : Affichage de la liste des schémas, visibles par l'utilisateurs, dans le catalogue avec pour chaque schéma le timestamp de création et le propriétaire (créateur par défaut)
- Onglet `Detail` : Affichage du détail des informations concernant le catalogue (Metastore Id, ...)
- Onglet `Permissions` : Gestion des droits sur le catalogue

Écran de l'onglet `Schemas` de l'interface `Catalog` : 
[![schema_06](/blog/web/20230512_databricks_unity_catalog_datalineage_06.png)](/blog/web/20230512_databricks_unity_catalog_datalineage_06.png) 

Écran de l'onglet `Details` de l'interface `Catalog` : 
[![schema_07](/blog/web/20230512_databricks_unity_catalog_datalineage_07.png)](/blog/web/20230512_databricks_unity_catalog_datalineage_07.png) 

L'interface `Schema` d'un catalogue : 
- Onglet `Tables` : Affichage de la liste des objets (tables et vues), visibles de l'utilisateur, dans le schéma avec leur timestamp de création et le propriétaire (créateur par défaut)
- Onglet `Details` : Détail des informations concernant le schéma
- Onglet `Permissions` : Gestion des droits sur le schéma

Écran de l'onglet `Tables` de l'interface `Schema` : 
[![schema_08](/blog/web/20230512_databricks_unity_catalog_datalineage_08.png)](/blog/web/20230512_databricks_unity_catalog_datalineage_08.png) 

Écran de l'onglet `Details` de l'interface `Schema` : 
[![schema_09](/blog/web/20230512_databricks_unity_catalog_datalineage_09.png)](/blog/web/20230512_databricks_unity_catalog_datalineage_09.png) 


L'interface `Table` d'un schéma : 
- Onglet `Columns` : Affichage de la liste des colonnes (nom et type des données) et gestion des commentaires sur les colonnes
- Onglet `Sample Data` : Affichage d'un échantillon des données de l'objet
- Onglet `Detail`: Affichage du détail des informations concernant l'objet
- Onglet `Permissions` : Gestion des droits sur l'objet
- Onglet `History` : Affichage de l'historique des versions de l'objet (lorsque c'est une table au format Delta uniquement)
- Onglet `Lineage` : Affichage des informations de Data Lineage liées à l'objet
- Informations supplémentaires : 
    - Il est possible de créer une requête ou un dashboard directement à partir de Data Explorer en cliquant sur `Create`et en sélectionnant l'une des options (`Query` ou `Quick dashboard`)
    - Il est possible de renommer ou supprimer un objet en cliquant sur le bouton avec les 3 points et en sélectionnant l'une des options (`Rename` ou `Delete`)
    - L'en-tête de l'écran permet d'afficher des informations sur l'objet comme le type, le format des données, le nom du propriétaire, le poids des données et le commentaire


Écran de l'onglet `Columns` de l'interface `Table` : 
[![schema_10](/blog/web/20230512_databricks_unity_catalog_datalineage_10.png)](/blog/web/20230512_databricks_unity_catalog_datalineage_10.png) 

Écran de l'onglet `Sample Data` de l'interface `Table` : 
[![schema_11](/blog/web/20230512_databricks_unity_catalog_datalineage_11.png)](/blog/web/20230512_databricks_unity_catalog_datalineage_11.png) 

Écran de l'onglet `Detail` de l'interface `Table` : 
[![schema_12](/blog/web/20230512_databricks_unity_catalog_datalineage_12.png)](/blog/web/20230512_databricks_unity_catalog_datalineage_12.png) 

Écran de l'onglet `History` de l'interface `Table` : 
[![schema_13](/blog/web/20230512_databricks_unity_catalog_datalineage_13.png)](/blog/web/20230512_databricks_unity_catalog_datalineage_13.png) 



# Data Lineage

## Synthèse

Cette fonctionnalité est activée par défaut lors de la mise en place de la solution Unity Catalog.

L'accès aux données de la fonctionnalité Data Lineage proposée par la solution Unity Catalog peut se faire de 3 façons différentes :
1. Accéder à l'onglet `Lineage`d'un objet (Table ou Vue) avec l'outil Data Explorer
2. Utilisation de Databricks REST API pour extraire des informations à partir de la solution Unity Catalog
3. Utilisation d'un outil de gouvernance de données qui à un connecteur Databricks permettant d'extraire les informations de la solution Unity Catalog vers une application tierce

Nous allons nous concentrer sur l'utilisation de l'outil Data Explorer pour découvrir quelles sont les informations capturées par défaut par la solution Unity Catalog.
Pour accéder aux informations de la fonctionnalité Data Lineage :
1. Allez sur `Workspace Databricks page > Data`
2. Cliquez sur le catalogue souhaité
3. Cliquez sur le schéma souhaité
4. Cliquez sur l'objet (table ou vue) souhaité
5. Cliquez sur l'option `Lineage`

Contrainte pour que les informations de Data Lineage soient capturées pour un objet :
- L'objet doit être défini dans un catalogue du Metastore
- Les requêtes doivent utiliser l'API Dataframe de Spark ou l'interface Databricks SQL
- La capture des informations se basant sur les traitements utilisant l'API Structured Streaming entre les tables Delta n'est supportée qu'à partir du Runtime 11.3 LTS  (DBR)
- Pour accéder aux informations de Data Lineage sur les objets (tables ou vues), l'utilisateur doit avoir le droit `SELECT` sur ces objets.

Fonctionnement :
- La capture des informations de Data Lineage est faite à partir des logs d'exécution des différents outils (notebooks, requêtes sql, workflow, ...) sur les 30 derniers jours (période glissante)
    - Cela signifie que les informations de Data Lineage concernant les logs d'exécution des traitements de plus de 30 jours ne sont pas disponible
- La capture se fait jusqu'à la granularité de la colonne de chaque objet

Limitation : 
- Lorsque qu'un objet est renommé, les informations de Data Lineage ne sont plus visibles
    - La capture des informations de Data Lineage est faite par rapport au nom de l'objet et non pas à l'identifiant unique de la table
    - Pour avoir à nouveau les informations de Data Lineage, il faut attendre l'exécution des traitements liés à l'objet
- Lorsqu'une colonne est renommée, les informations de Data Lineage ne sont plus visibles sur la colonne de l'objet de la même manière que pour le renommage d'un objet
- Remarque : 
    - Il est possible de renommer à nouveau l'objet (table ou vue) ou la colonne avec l'ancien nom pour retrouver l'ensemble des informations de Data lineage déjà capturé
    - Lors du renommage d'un objet (pour un objet managé dans le Metastore), l'identifiant de l'objet (et le chemin de stockage) ne change pas. Seulement le nom de l'objet ou de la colonne est modifié.


Pour chaque objet, les informations du Data Lineage sont constitués des éléments suivants :
- Affichage du graphe complet (ensemble des éléments sources et cible en partant de l'objet) et possibilité de naviguer dedans 
- Option "Upstream" : Permet de filtrer l'ensemble des éléments utiliser comme source de l'alimentation de l'objet (1er niveau)
- Option "Downstream" : Permet de filtrer l'ensemble des éléments utilisant les données de l'objet (1er niveau)

Les éléments qui peuvent être capturés par Unity Catalog pour un objet (Table ou Vue) sont :
- Les tables : L'ensemble des objets (Tables, Vues) dans le Metastore liés à l'objet concerné 
- Les notebooks : L'ensemble des notebooks ayant utilisé l'objet concerné (alimentation ou lecture)
- Les workflows : L'ensemble des workflows ayant un traitement utilisant l'objet concerné (alimentation ou lecture)
- Les pipelines : L'ensemble des pipelines ayant un traitement utilisant l'objet concerné (alimentation ou lecture)
- Les dashboards : L'ensemble des dashboards composé des requêtes SQL utilisant l'objet concerné
- Les requêtes : L'ensemble des requêtes SQL (format notebook utilisant le SQL Warehouse) ayant utilisé l'objet concerné
- Les chemins d'accès aux données : L'ensemble des chemins d'accès aux données externes utilisé par l'objet concerné


## Visualisation

Visualisation du Data Lineage à partir de la table `ctg_ipp.sch_bronze.fct_transactions_raw` en se limitant uniquement au lien de 1er niveau :
[![schema_20](/blog/web/20230512_databricks_unity_catalog_datalineage_20.png)](/blog/web/20230512_databricks_unity_catalog_datalineage_20.png) 


Visualisation du Data Lineage à partir de la colonne `quantity` de la table `ctg_ipp.sch_bronze.fct_transactions_raw` :
[![schema_21](/blog/web/20230512_databricks_unity_catalog_datalineage_21.png)](/blog/web/20230512_databricks_unity_catalog_datalineage_21.png) 

Visualisation du Data Lineage à partir de la table `ctg_ipp.sch_bronze.fct_transactions_raw`  en prenant l'ensemble des liens jusqu'aux vues du schéma `ctg_ipp.sch_gold_v`
[![schema_22](/blog/web/20230512_databricks_unity_catalog_datalineage_22.png)](/blog/web/20230512_databricks_unity_catalog_datalineage_22.png) 

Affichage de la liste des données sources utilisées pour l'alimentation de la table `ctg_ipp.sch_bronze.fct_transactions_raw` :
[![schema_23](/blog/web/20230512_databricks_unity_catalog_datalineage_23.png)](/blog/web/20230512_databricks_unity_catalog_datalineage_23.png) 

Affichage de la liste des objets dont l'une des sources de données est la table `ctg_ipp.sch_bronze.fct_transactions_raw` : 
[![schema_24](/blog/web/20230512_databricks_unity_catalog_datalineage_24.png)](/blog/web/20230512_databricks_unity_catalog_datalineage_24.png) 






## Export des données de Data Linage avec Databricks REST API

Pré-requis :
- Avoir l'outil `Curl` installé
- Avoir l'outil `jq` installé

Préparation des accès à l'API REST et des variables d'environnements : 
1. Création d'un fichier `.netrc` permettant de gérer les accès à l'API REST :
```bash
# Create the folder where the .netrc file will be stored
mkdir ~/.databricks

# Create the .netrc file
echo "machine <url workspace databricks without https://>
login token
password <token user databricks>
" > ~/.databricks/.netrc
```
2. Création des variables d'environnements et des alias :
```bash
# Create an alias to use the tool curl with .netrc file
alias dbx-api='curl --netrc-file ~/.databricks/.netrc'

# Create an environment variable with Databricks API Url
export DBX_API_URL="<url workspace databricks with https://>"
```


Récupération des informations au niveau de l'objet `ctg_ipp.sch_silver.fct_transactions` :
```bash
# 1. Get the list of upstreams elements from an object
dbx-api -X GET -H 'Content-Type: application/json' ${DBX_API_URL}/api/2.0/lineage-tracking/table-lineage -d '{"table_name": "ctg_ipp.sch_silver.fct_transactions", "include_entity_lineage": true}}' | jq '.upstreams[]'

# 2. Get the list of downstreams elements from an object
dbx-api -X GET -H 'Content-Type: application/json' ${DBX_API_URL}/api/2.0/lineage-tracking/table-lineage -d '{"table_name": "ctg_ipp.sch_silver.fct_transactions", "include_entity_lineage": true}}' | jq '.downstreams[]'
```

Résultat au format JSON de la liste des éléments utilisés pour l'alimentation de l'objet `ctg_ipp.sch_silver.fct_transactions` :
```json
{
  "tableInfo": {
    "name": "fct_transactions_raw",
    "catalog_name": "ctg_ipp",
    "schema_name": "sch_bronze",
    "table_type": "TABLE"
  },
  "queryInfos": [
    {
      "workspace_id": 1198890856567221,
      "query_id": "40af215d-e21d-4933-b207-c478b78a38d6"
    }
  ]
}
```

Résultat au format JSON de la liste des éléments utilisant l'objet `ctg_ipp.sch_silver.fct_transactions` :
```json
{
  "tableInfo": {
    "name": "fct_transactions_detail",
    "catalog_name": "ctg_ipp",
    "schema_name": "sch_gold_v",
    "table_type": "PERSISTED_VIEW"
  },
  "queryInfos": [
    {
      "workspace_id": 1198890856567221,
      "query_id": "40af215d-e21d-4933-b207-c478b78a38d6"
    },
    {
      "workspace_id": 1198890856567221,
      "query_id": "bf2570b5-bfd8-444d-b2a7-d896192f063f"
    }
  ]
}
{
  "tableInfo": {
    "name": "fct_transactions_agg_day",
    "catalog_name": "ctg_ipp",
    "schema_name": "sch_gold",
    "table_type": "TABLE"
  },
  "queryInfos": [
    {
      "workspace_id": 1198890856567221,
      "query_id": "40af215d-e21d-4933-b207-c478b78a38d6"
    },
    {
      "workspace_id": 1198890856567221,
      "query_id": "bf2570b5-bfd8-444d-b2a7-d896192f063f"
    }
  ]
}
```




Récupération des informations au niveau de la colonne `quantity` de l'objet `ctg_ipp.sch_silver.fct_transactions` :
```bash
# 1. Get the list of upstreams columns from a column
dbx-api -X GET -H 'Content-Type: application/json' ${DBX_API_URL}/api/2.0/lineage-tracking/column-lineage -d '{"table_name": "ctg_ipp.sch_silver.fct_transactions", "column_name": "quantity"}}' | jq '.upstream_cols[]'

# 2. Get the list of downstreams columns from a column
dbx-api -X GET -H 'Content-Type: application/json' ${DBX_API_URL}/api/2.0/lineage-tracking/column-lineage -d '{"table_name": "ctg_ipp.sch_silver.fct_transactions", "column_name": "quantity"}}' | jq '.downstream_cols[]'
```


Résultat au format JSON de la liste des colonnes utilisées pour l'alimentation de la colonne `quantity` de l'objet `ctg_ipp.sch_silver.fct_transactions` :
```json
{
  "name": "quantity",
  "catalog_name": "ctg_ipp",
  "schema_name": "sch_bronze",
  "table_name": "fct_transactions_raw",
  "table_type": "TABLE",
  "path": "s3://s3-dbx-metastore-uc/metastore-sandbox/13a746fa-c056-4b32-b6db-9d31c0d1eecf/tables/66cf0444-e436-4936-9106-1f930a884f23"
}
```

Résultat au format JSON de la liste des colonnes utilisant la colonne `quantity` de l'objet `ctg_ipp.sch_silver.fct_transactions` :
```json
{
  "name": "quantity",
  "catalog_name": "ctg_ipp",
  "schema_name": "sch_gold",
  "table_name": "fct_transactions_agg_day",
  "table_type": "TABLE",
  "path": "s3://s3-dbx-metastore-uc/metastore-sandbox/13a746fa-c056-4b32-b6db-9d31c0d1eecf/tables/9c724ab7-e48b-40fb-8105-a8bc292b591c"
}
```





# Suppression des éléments

Vous trouverez, ci-dessous, l'ensemble des instructions nécessaires pour nettoyer l'environnement.

Suppression des éléments de Unity Catalog en utilisant les instructions SQL :
```sql
-- Delete the Catalog with CASCADE option (to delete all objects)
DROP CATALOG IF EXISTS ctg_ipp CASCADE;
DROP CATALOG IF EXISTS ctg_ext CASCADE;
```

Suppression des données utilisées sur la ressource AWS S3 :
```bash
# Delete all files stored in the AWS S3 resource
aws s3 rm "s3://s3-demo-data-uc/demo/" --recursive 
```




# Conclusion

L'outil Data Explorer permet de faciliter l'exploration des données au sein du Metastore de la solution Unity Catalog et de gérer les droits d'accès sur les objets sans connaître les commandes SQL.

Les informations du Data Lineage capturées par la solution Unity Catalog permettent d'avoir un certain nombre d'informations sur le cycle de vie des données ainsi que sur la liste des éléments utilisant un objet spécifique.
Cela permet d'avoir facilement une liste des éléments (notebooks, workflows, pipelines, requêtes,...) utilisant l'objet et par conséquent pouvant être impactés en cas de modification de l'objet.
Cela permet aussi de permettre la visualisation et la navigation en se basant sur les informations de Data Lineage (liens entre les objets jusqu'au niveau des colonnes).

Point d'attention : La contrainte des 30 derniers jours (glissant) pour la capture des informations peut être très limitante dans le cadre d'une application ayant des traitements avec une fréquence supérieur eou égale au mois.







