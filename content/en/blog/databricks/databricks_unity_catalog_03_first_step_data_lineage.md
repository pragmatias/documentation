---
Categories : ["Databricks","Unity Catalog"]
Tags : ["Databricks","Unity Catalog"]
title : "Databricks : Unity Catalog - First Step - Part 3 - Data Lineage"
date : 2023-05-12
draft : false
toc: true
---

We are going to discover the [Data Lineage](https://docs.databricks.com/data-governance/unity-catalog/data-lineage.html) functionality offered by the [Unity Catalog](https://docs.databricks.com/data-governance/unity-catalog/index.html) solution.

We will use a Databricks Account on AWS to perfrom this discovery.

_Note: Work is based on the state of the Unity Catalog solution at the end of Q1 2023 on AWS and Azure._

<!--more-->

# What's the Data Lineage

Data Lineage consists of mapping all the objects and their use in order to visualize (and extract information about) the data life cycle.

When you want to set up a data governance, the data lineage provides extremely useful information.

A functional lineage consists of setting up the elements and tools to map the functional objects and their use in the different applications and projects of the company in order to visualize the use of data throughout the organization (teams, applications, projects)
This makes it easier to rationalize the global usage of the data and to build a common functional language for the company.

A technical lineage consists of setting up the elements and tools to map the technical objects and the use of the data by the different technical tools.
This makes it possible to visualize the relationship between the different objects and to quickly identify the source of the data of an object as well as the elements impacted by the changes of an object.

Some data governance tools automate the capture of metadata to centralize data lineage information such as Apache Atlas, Azure Purview or AWS Glue (and many others)

In our case, we will rely on the Unity Catalog solution proposed by Databricks and more precisely on the capture of information implemented by this solution to map all elements related to Data Lineage.

Note: It is also possible to set up this mapping in a manual way with the use of a Wiki fed manually or with scripts to extract the metadata of the various tools when it is possible.
This requires a lot of time and energy to write, maintain, extract and validate the information over time (evolution of tools, evolution of applications, evolution of data, ...)


# Unity Catalog and the object hierarchy

Unity Catalog is the Databricks solution that allows to have a unified and centralized governance for all the data managed by the Databricks resources as well as to secure and facilitate the management and the sharing of the data to all the internal and external actors of an organization.


You can get a more complete overview by reading the [official documentation](https://docs.databricks.com/data-governance/unity-catalog/index.html)


Reminder concerning the hierarchy of objects :
[![schema_01](/blog/web/20230510_databricks_unity_catalog_schema_01.png)](/blog/web/20230510_databricks_unity_catalog_schema_01.png) 

The objects are :
- Storage Credential : This object is directly associated with the Metastore and is used to store access to a cloud provider (for example AWS S3) allowing the Unity Catalog solution to manage data rights
- External Location : This object is associated with the Metastore and allows you to store the path to a cloud provider (for example an AWS S3 resource) in combination with a Storage Credential to manage data access
- Metastore : Top-level object that can contain metadata
- Catalog : 1st level object allowing to organize data by Schema (also called Database)
- Schema : 2nd and last level object used to organize data (contains tables, views and functions)
- Table : Object used to define the structure and storage of data.. 
- View : Object used to encapsulate a query using one or more objects (table or view)
- Function : Object allowing to define operations on the data

When you want to access an object (for example a table), it will be necessary to use the name of the Catalog and the name of the Schema where the object is defined.
Example : `select * from catalog.schema.table`



# Set-up the environment

We are going to set up a set of elements that will allow us to discover the Data Lineage functionality of the Unity Catalog solution in more detail.

## Context

Prerequisite:
- Creation of the `grp_demo` group
- Creation of the `john.do.dbx@gmail.com` user and add the user to group `grp_demo`.
- Creation of a SQL Warehouse and give the right to use it to the group `grp_demo`.
- Existence of a Metastore named `metastore-sandbox` with the Storage Credential named `sc-metastore-sandbox` allowing to store the data by default in the AWS S3 resource named `s3-dbx-metastore-uc`
- Creation of an AWS S3 resource named `s3-demo-data-uc`
- Creation of an AWS IAM role named `role-databricks-demo-data-uc` and an AWS IAM policy named `policy-databricks-demo-data-uc` allowing the global Databricks role to manage access to the AWS S3 resource named `s3-demo-data-uc`
- Creation of a Storage Credential named `sc-demo-data-uc` and an External Location named `el_demo_data_uc` allowing the global Databricks role to manage access to the AWS S3 resource named `s3-demo-data-uc`


Setting up rights for the `grp_demo` group :
1. Give the right to create catalogs at the Metastore level for the `grp_demo` group 
2. Give the right to read external files from the External Location object named `el_demo_data_uc`.
```sql
-- 1. Give Create Catalog right on Metastore to grp_demo
GRANT CREATE CATALOG ON METASTORE TO grp_demo;

-- 2. Give Read Files right on el_demo_data_uc location to grp_demo
GRANT READ FILES ON EXTERNAL LOCATION `el_demo_data_uc` TO grp_demo;
```


## Diagram of the environment

Diagram of the 1st level elements of the Metastore corresponding to the pre-requisite :
[![schema_31](/blog/web/20230512_databricks_unity_catalog_datalineage_31.png)](/blog/web/20230512_databricks_unity_catalog_datalineage_31.png) 


Diagram of the catalogue `ctg_ipp` content :
[![schema_32](/blog/web/20230512_databricks_unity_catalog_datalineage_32.png)](/blog/web/20230512_databricks_unity_catalog_datalineage_32.png) 


Diagram of the catalogue `ctg_ext` content :
[![schema_33](/blog/web/20230512_databricks_unity_catalog_datalineage_33.png)](/blog/web/20230512_databricks_unity_catalog_datalineage_33.png) 


Diagram of the data ingestion between the different objects : 
[![schema_34](/blog/web/20230512_databricks_unity_catalog_datalineage_34.png)](/blog/web/20230512_databricks_unity_catalog_datalineage_34.png) 


## Setting up a dataset on the AWS S3 resource
Content of the file `ref_stores.csv` :
```text
id,lib,postal_code,surface,last_maj
1,BustaPhone One,75001,120,2022-01-01 00:00:00
2,BustaPhone Two,79002,70,2022-01-01 00:00:00
```

Content of the file `ref_clients.csv` : 
```text
id,lib,age,contact,phone,is_member,last_maj
1,Maxence,23,max1235@ter.tt,+33232301123,No,2023-01-01 11:01:02
2,Bruce,26,br_br@ter.tt,+33230033155,Yes,2023-01-01 13:01:00
3,Charline,40,ccccharline@ter.tt,+33891234192,Yes,2023-03-02 09:00:00
```

Content of the file `ref_products.csv` :
```text
id,lib,brand,os,last_maj
1,Pixel 7 Pro,Google,Android,2023-01-01 09:00:00
2,Iphone 14,Apple,IOS,2023-01-01 09:00:00
3,Galaxy S23,Samsung,Android,2023-01-01 09:00:00
```

Content of the file `fct_transactions.csv` :
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

Copying data to the `demo` directory of the AWS S3 resource named `s3-demo-data-uc` with the AWS CLI tool :
```bash
aws s3 cp ref_stores.csv s3://s3-demo-data-uc/demo/ref_stores.csv 
aws s3 cp ref_clients.csv s3://s3-demo-data-uc/demo/ref_clients.csv 
aws s3 cp ref_products.csv s3://s3-demo-data-uc/demo/ref_products.csv 
aws s3 cp fct_transactions.csv s3://s3-demo-data-uc/demo/fct_transactions.csv 
```


## Setting up the objects on the Unity Catalog Metastore

Note : Using a user from `grp_demo` group 

1. Creation of catalogs
- `ctg_ipp` : Catalog to manage the elements managed by Unity Catalog
- `ctg_ext` : Catalog to manage external elements
```sql
-- Create Catalog (for managed data)
CREATE CATALOG IF NOT EXISTS ctg_ipp
    COMMENT 'Catalog for managed data';

-- Create Catalog (for external data)
CREATE CATALOG IF NOT EXISTS ctg_ext
    COMMENT 'Catalog for external data';
```

2. Creation of schemas
The list of schemas :
- `ctg_ext.sch_ref` : Schema for grouping external tables to access the referential data
- `ctg_ipp.sch_bronze` : Schema for storing raw data
- `ctg_ipp.sch_silver` : Schema for storing refined data
- `ctg_ipp.sch_gold` : Schema for storing aggregated data
- `ctg_ipp.sch_gold_v` : Schema to define views for data exposure
- `ctg_ipp.sch_reject` : Schema for storing rejected data
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

3. Creation of external tables to access referential data
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

4. Ingestion of data in managed tables
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


5. Creation of views
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

The Data Explorer tool provides a user interface for exploring and managing data (Catalog, Schema, Tables, Views, Rights) and provides a lot of information about the different objects and their use.

This tool is accessible in all views of the Databricks Workspace (Data Science & Engineering, Machine Learning, SQL) by clicking on the `Data` option of the side menu.

This tool uses the access rights of the Databricks Workspace user, therefore it is necessary to have sufficient rights on the objects. 
To be able to explore the elements without having the right to read the data, it is necessary to have the `USE` right on the different objects (Catalog, Schema, Table, View)
To be able to access a sample of the data or the history of a table in Delta format, you must have the `SELECT` right in addition to the `USE` right.

It is possible to access the metadata of all Unity Catalog objects without using a SQL Warehouse.
For the following actions, it is necessary to have an active SQL Warehouse to read the necessary data:
- Access to the `hive_metastore` catalog objects
- Access to a sample of the data from a table
- Access to the history of a Delta table


The `Explorer` menu (sidebar) provides access to the following elements :
- `Data` option : Allows to navigate in the hierarchy of the Metastore elements (Catalogs, Schemas, Tables, Views, ...)
- `External Data` option : Contains the list of elements concerning the Storage Credential and the External Location.

Screenshot of `Data` option :
[![schema_01](/blog/web/20230512_databricks_unity_catalog_datalineage_01.png)](/blog/web/20230512_databricks_unity_catalog_datalineage_01.png) 

Screenshot of `External Data` option :
[![schema_02](/blog/web/20230512_databricks_unity_catalog_datalineage_02.png)](/blog/web/20230512_databricks_unity_catalog_datalineage_02.png) 
[![schema_03](/blog/web/20230512_databricks_unity_catalog_datalineage_03.png)](/blog/web/20230512_databricks_unity_catalog_datalineage_03.png) 
[![schema_04](/blog/web/20230512_databricks_unity_catalog_datalineage_04.png)](/blog/web/20230512_databricks_unity_catalog_datalineage_04.png) 


The `Main` interface provides access to the following elements :
- Display the list of catalogs, visible by the user, with for each catalog the timestamp of creation and the owner (creator by default)
- Allows you to create, rename or delete a catalog


Screenshot of `Main` interface :
[![schema_05](/blog/web/20230512_databricks_unity_catalog_datalineage_05.png)](/blog/web/20230512_databricks_unity_catalog_datalineage_05.png) 


`Catalog` interface : 
- `Schemas` tab : Display of the list of schemas in the catalog, visible by the user, with for each schema the creation timestamp and the owner (creator by default)
- `Detail` tab : Display of detailed information about the catalog (Metastore Id, ...)
- `Permissions` tab : Rights management on the catalog

Screenshot of `Schemas` tab of `Catalog` interface :
[![schema_06](/blog/web/20230512_databricks_unity_catalog_datalineage_06.png)](/blog/web/20230512_databricks_unity_catalog_datalineage_06.png) 


Screenshot of `Details` tab of `Catalog` interface :
[![schema_07](/blog/web/20230512_databricks_unity_catalog_datalineage_07.png)](/blog/web/20230512_databricks_unity_catalog_datalineage_07.png) 



The `Schema` interface of a catalog : 
- `Tables` tab: Display of the list of objects (tables and views) in the schema, visible to the user, with their creation timestamp and owner (creator by default)
- `Details` tab: Display of detailed information about the schema
- `Permissions` tab : Rights management on the catalog


Screenshot of `Tables` tab of `Schema` interface :
[![schema_08](/blog/web/20230512_databricks_unity_catalog_datalineage_08.png)](/blog/web/20230512_databricks_unity_catalog_datalineage_08.png) 

Screenshot of `Details` tab of `Schema` interface :
[![schema_09](/blog/web/20230512_databricks_unity_catalog_datalineage_09.png)](/blog/web/20230512_databricks_unity_catalog_datalineage_09.png) 


`Table` interface of a schema : 
- `Columns` tab : Display of the list of columns (name and type of data) and management of comments on the columns
- `Sample Data` tab: Display a sample of the object data
- `Detail` tab : Display of detailed information about the object
- `Permissions` tab : Rights management on the catalog
- `History` tab : Displays the version history of the object (when it is a Delta table only)
- `Lineage` tab : Display Data Lineage information related to the object
- Additional information: 
    - It is possible to create a query or a dashboard directly from Data Explorer by clicking on `Create` and selecting one of the options (`Query` or `Quick dashboard`)
    - It is possible to rename or delete an object by clicking on the button with the 3 dots and selecting one of the options (`Rename` or `Delete`)
    - The header of the interface displays information about the object such as type, data format, owner name, data size and comment


Screenshot of `Columns` tab of `Table` interface :
[![schema_10](/blog/web/20230512_databricks_unity_catalog_datalineage_10.png)](/blog/web/20230512_databricks_unity_catalog_datalineage_10.png) 

Screenshot of `Sample Data` tab of `Table` interface :
[![schema_11](/blog/web/20230512_databricks_unity_catalog_datalineage_11.png)](/blog/web/20230512_databricks_unity_catalog_datalineage_11.png) 

Screenshot of `Detail` tab of `Table` interface :
[![schema_12](/blog/web/20230512_databricks_unity_catalog_datalineage_12.png)](/blog/web/20230512_databricks_unity_catalog_datalineage_12.png) 

Screenshot of `History` tab of `Table` interface :
[![schema_13](/blog/web/20230512_databricks_unity_catalog_datalineage_13.png)](/blog/web/20230512_databricks_unity_catalog_datalineage_13.png) 



# Data Lineage

## Synthesis

This feature is enabled by default when the Unity Catalog solution is set up.

The access to the data of the Data Lineage functionality proposed by the Unity Catalog solution can be done in 3 different ways:
1. Access the `Lineage` tab of an object (Table or View) with the Data Explorer tool
2. Using Databricks REST API to extract information from the Unity Catalog solution
3. Use of a data governance tool that has a Databricks connector to extract information from the Unity Catalog solution to a third party application


We will focus on using the Data Explorer tool to find out what information is captured by default by the Unity Catalog solution.
To access at the Data Lineage information:
1. Go to `Workspace Databricks page > Data`.
2. Click on the desired catalog
3. Click on the desired schema
4. Click on the desired object (table or view)
5. Click on the `Lineage` option


Constraint for capturing Data Lineage information for an object :
- The object must be defined in a Metastore catalog
- Queries must use the Spark Dataframe API or the Databricks SQL interface
- Capturing information based on processing using the Structured Streaming API between Delta tables is only supported in Runtime 11.3 LTS (DBR) and higher
- To access Data Lineage information on objects (tables or views), the user must have the `SELECT` right on these objects.


Information about the capture :
- Data Lineage information is captured from the execution logs of the different tools (notebooks, sql queries, workflow, ...) over the last 30 days (rolling window)
    - This means that Data Lineage information about the execution logs of processes older than 30 days is not available
- The capture is done down to the column granularity of each object

Limitation : 
- When an object is renamed, the Data Lineage information is no longer available
    - Data Lineage information is captured based on the name of the object and not on the unique identifier of the table
    - To have the Data Lineage information again, you have to wait the execution of the treatments using the object
- When a column is renamed, the Data Lineage information is no longer available on the column of the object in the same way as for the renaming of an object
- Note : 
    - It is possible to rename an object (table or view) or a column with the old name again to make available all the data lineage information already captured
    - When renaming an object (for an managed object in the Metastore), the object ID (and storage path) does not change. Only the name of the object or column is modified.


For each object, the information of the Data Lineage is composed of the following elements
- Display of the full graph (all the source and target elements based on the object) and possibility to navigate in it 
- `Upstream` option : Allows to filter the set of elements used as source of the object's power supply (1st level)
- `Downstream` option : Allows to filter all the elements using the data of the object (1st level)

The elements that can be captured by Unity Catalog for an object (Table or View) are :
- Tables: All the objects (Tables, Views) in the Metastore related to the concerned object  
- Notebooks: All the notebooks that have used the concerned object (ingest or read)
- Workflows: All the workflows having a treatment that have used the concerned object (ingest or read)
- Pipelines : All the pipelines having a treatment that have used the concerned object (ingest or read)
- Dashboards: All the dashboards build with SQL queries that have used the concerned object
- Queries: All the SQL queries (notebook format using the SQL Warehouse) that have used the concerned object
- Data access paths: All the external data access paths used by the concerned object



## Visualization

Visualization of the Data Lineage based on the `ctg_ipp.sch_bronze.fct_transactions_raw` table limited to the first level relation :
[![schema_20](/blog/web/20230512_databricks_unity_catalog_datalineage_20.png)](/blog/web/20230512_databricks_unity_catalog_datalineage_20.png) 


Visualization of the Data Lineage based on the `quantity` column of the `ctg_ipp.sch_bronze.fct_transactions_raw` table :
[![schema_21](/blog/web/20230512_databricks_unity_catalog_datalineage_21.png)](/blog/web/20230512_databricks_unity_catalog_datalineage_21.png) 


Visualization of the Data Lineage based from `ctg_ipp.sch_bronze.fct_transactions_raw` by taking all the related objects up to the views of the `ctg_ipp.sch_gold_v` schema :
[![schema_22](/blog/web/20230512_databricks_unity_catalog_datalineage_22.png)](/blog/web/20230512_databricks_unity_catalog_datalineage_22.png) 


Display of the list of source data used by the ingestion into the `ctg_ipp.sch_bronze.fct_transactions_raw` table :
[![schema_23](/blog/web/20230512_databricks_unity_catalog_datalineage_23.png)](/blog/web/20230512_databricks_unity_catalog_datalineage_23.png) 


Display of the list of objects that have the `ctg_ipp.sch_bronze.fct_transactions_raw` table as one of their data sources :
[![schema_24](/blog/web/20230512_databricks_unity_catalog_datalineage_24.png)](/blog/web/20230512_databricks_unity_catalog_datalineage_24.png) 






## Data Lineage information export with Databricks REST API

Prerequisite :
- Have the `Curl` tool installed
- Have the `jq` tool installed

Set up the REST API access and environment variables : 
1. Creation opf a `.netrc` file to mange the access to the REST API :
```bash
# Create the folder where the .netrc file will be stored
mkdir ~/.databricks

# Create the .netrc file
echo "machine <url workspace databricks without https://>
login token
password <token user databricks>
" > ~/.databricks/.netrc
```
2. Creation of the environment variables and alias :
```bash
# Create an alias to use the tool curl with .netrc file
alias dbx-api='curl --netrc-file ~/.databricks/.netrc'

# Create an environment variable with Databricks API Url
export DBX_API_URL="<url workspace databricks with https://>"
```


Get informations at the `ctg_ipp.sch_silver.fct_transactions` object level :
```bash
# 1. Get the list of upstreams elements from an object
dbx-api -X GET -H 'Content-Type: application/json' ${DBX_API_URL}/api/2.0/lineage-tracking/table-lineage -d '{"table_name": "ctg_ipp.sch_silver.fct_transactions", "include_entity_lineage": true}}' | jq '.upstreams[]'

# 2. Get the list of downstreams elements from an object
dbx-api -X GET -H 'Content-Type: application/json' ${DBX_API_URL}/api/2.0/lineage-tracking/table-lineage -d '{"table_name": "ctg_ipp.sch_silver.fct_transactions", "include_entity_lineage": true}}' | jq '.downstreams[]'
```

JSON result of the list of elements used to ingest data into the `ctg_ipp.sch_silver.fct_transactions` object :
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

JSON result of the list of elements using the `ctg_ipp.sch_silver.fct_transactions` object 
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



Get information from `ctg_ipp.sch_silver.fct_transactions` object at the `quantity` column level :
```bash
# 1. Get the list of upstreams columns from a column
dbx-api -X GET -H 'Content-Type: application/json' ${DBX_API_URL}/api/2.0/lineage-tracking/column-lineage -d '{"table_name": "ctg_ipp.sch_silver.fct_transactions", "column_name": "quantity"}}' | jq '.upstream_cols[]'

# 2. Get the list of downstreams columns from a column
dbx-api -X GET -H 'Content-Type: application/json' ${DBX_API_URL}/api/2.0/lineage-tracking/column-lineage -d '{"table_name": "ctg_ipp.sch_silver.fct_transactions", "column_name": "quantity"}}' | jq '.downstream_cols[]'
```


JSON result of the list of columns used to ingest data into the `quantity` column of the `ctg_ipp.sch_silver.fct_transactions` object : 
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


JSON result of the list of columns using the `quantity` column from the `ctg_ipp.sch_silver.fct_transactions` object :
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



# Clean environment

You will find, below, all the instructions needed to clean the environment.

Drop elements from Unity Catalog using SQL statements:
```sql
-- Delete the Catalog with CASCADE option (to delete all objects)
DROP CATALOG IF EXISTS ctg_ipp CASCADE;
DROP CATALOG IF EXISTS ctg_ext CASCADE;
```

Deleting data used on the AWS S3 resource:
```bash
# Delete all files stored in the AWS S3 resource
aws s3 rm "s3://s3-demo-data-uc/demo/" --recursive 
```



# Conclusion

The Data Explorer tool makes it easy to explore data in the Unity Catalog Metastore and to manage rights on objects without knowing SQL commands.

The Data Lineage information captured by the Unity Catalog solution allows to have a certain amount of information on the data life cycle as well as on the list of elements using a specific object.
This makes it easy to have a list of elements (notebooks, workflows, pipelines, queries, etc.) that use the object and may be impacted by a modification of an object.
This also allows for visualization and navigation based on Data Lineage information (links between objects down to the column level).

Warning: The constraint of the last 30 days (rolling window) for the capture of information can be very limiting in the context of an application having treatments with a frequency greater than or equal to one month.


