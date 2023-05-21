---
Categories : ["Databricks","Unity Catalog"]
Tags : ["Databricks","Unity Catalog"]
title : "Databricks : Unity Catalog - First Step - Part 4 - Delta Sharing"
date : 2023-05-21
draft : false
toc: true
---

We are going to discover the [Delta Sharing](https://www.databricks.com/fr/product/delta-sharing) functionality offered by Databricks with the [Unity Catalog](https://docs.databricks.com/data-governance/unity-catalog/index.html) solution.

We are going to use a Databricks Account on AWS as a provider and a Databricks Account on Azure as a recipient for the sharing of objects with the Delta Sharing functionality for this discovery.

_Note: The information in this paper regards the March/April 2023 period._

<!--more-->

# What's Data Sharing

Data Sharing is a practice that consists in sharing data between different partners.

This can be for regulatory or contractual needs, but also to enhance and monetize data and products.

There is a very strong security and data governance issue when sharing data with partners or competitors in order to avoid any risk of data leakage and to guarantee the traceability of actions regarding the data usage.

We can use the Data Sharing when setting up a Data Mesh to share data from different products between different teams.

It is also common to set up a REST API interface to allow external partners to retrieve data by managing access rights directly through it, but there are solutions that greatly facilitate and secure this data sharing.
The REST API interface is not necessarily the most efficient way to exchange large dataset between partners (for example in the context of a Data Lake or a Lakehouse).

Among the existing solutions, we are going to focus on the "Delta Sharing" functionality proposed by Databricks with the Unity Catalog solution in order to set up a data sharing with external partners.


# Unity Catalog and the object hierarchy


Unity Catalog is the Databricks solution that allows to have a unified and centralized governance for all the data managed by the Databricks resources as well as to secure and facilitate the management and the sharing of the data to all the internal and external actors of an organization.

You can get a more complete overview by reading the [official documentation](https://docs.databricks.com/data-governance/unity-catalog/index.html)

Reminder concerning the hierarchy of objects :
[![schema_00](/blog/web/20230521_blog_article_unity_catalog_dela_sharing_00.png)](/blog/web/20230521_blog_article_unity_catalog_dela_sharing_00.png)

The objects are :
- Storage Credential : This object is directly associated with the Metastore and is used to store access to a cloud provider (for example AWS S3) allowing the Unity Catalog solution to manage data rights
- External Location : This object is associated with the Metastore and allows you to store the path to a cloud provider (for example an AWS S3 resource) in combination with a Storage Credential to manage data access
- Metastore : Top-level object that can contain metadata
- Catalog : 1st level object allowing to organize data by Schema (also called Database)
- Schema : 2nd and last level object used to organize data (contains tables, views and functions)
- Table : Object used to define the structure and storage of data.
- Share : A logical grouping of the tables you want to share.
- Recipient : An object that identifies a partner (or group of users) who will have access to the shared data.
- Provider : An object that represents a partner who is sharing data.

When you want to access an object (for example a table), it will be necessary to use the name of the Catalog and the name of the Schema where the object is defined.
Example : `select * from catalog.schema.table`

Note: The concepts of Share, Recipient and Provider are specific to the Delta Sharing feature.


# What's the Delta Sharing feature

This functionality is based on an [open protocol](https://github.com/delta-io/delta-sharing/blob/main/PROTOCOL.md) developed by Databricks to allow the sharing of data in a secure way between several platforms.

This functionality is based on the Unity Catalog solution in order to centralize data governance (catalog management and data rights).

The Delta Sharing Server is managed by the Unity Catalog solution and allows a recipient to have direct access to the data on the storage without going through a cluster or a SQL Warehouse

Diagram of how Delta Sharing works : 
[![schema_20](/blog/web/20230521_blog_article_unity_catalog_dela_sharing_20.png)](/blog/web/20230521_blog_article_unity_catalog_dela_sharing_20.png)
The operation is as follows:
1. The recipient requests the reading of a shared table
2. The provider (with the Delta Sharing Server managed by Unity Catalog) will control access to the shared table
3. The provider will send the access links (valid for a very short period) to the storage where the data is actually located (without going through a cluster or SQL Warehouse)
4. The recipient will directly access the storage to retrieve the data from the shared table in read-only mode


The three main use cases, according to Databricks, for the use of this functionality : 
- Internal Data Sharing (subsidiaries, teams)
    - Create a Data Mesh to exchange data from different products between different subsidiaries, teams, applications
- External Data Sharing (companies)
    - Share data with partners and suppliers, whether or not they are on the Databricks platform
- Data monetization 
    - Distribute and monetize your products (data) with customers who are or are not on the Databricks platform


Some benefits of this feature: 
- A provider can easily define shares on a specific version or partition of a delta table
- Tables are shared live and can be updated by the provider only
- All clients that can read parquet data can access the shared data
- Data transfer relies on S3/ADLS/GCS resources only, therefore transfer is extremely efficient and inexpensive


The "Delta Sharing" feature can be used in three different ways:
1. [Open Sharing](https://docs.databricks.com/data-sharing/share-data-open.html)
    1. This allows any client not using Databricks with the Unity Catalog solution to access the shared data
    2. It is necessary to use a specific library to be able to read data through Delta Sharing
    3. The recipients of this type of sharing are based on the lifetime of a Databricks token (defined in the Unity Catalog Metastore of the supplier)
2. [Databricks-to-Databricks Sharing](https://docs.databricks.com/data-sharing/share-data-databricks.html)
    1. This corresponds to the sharing of data between two Metastores of the Unity Catalog solution (in the same Databricks Account or in different Databricks Accounts (AWS, Azure or GCP))
    3. One of the advantages of this type of sharing is that neither the Recipient nor the Provider needs to manage a Databricks token to access the shared data.
    4. The security of this sharing (including access verification, authentication and audit) is managed entirely through the Delta Sharing functionality and the Databricks platform.
    5. It is also possible to share read-only notebooks
3. Marketplace:
    1. This corresponds to the fact of declaring oneself as a Databricks partner in order to be able to propose these shared data on the Databricks Marketplace. We are not going to develop this sharing method in the context of this discovery.

The objects specific to this functionality that have been implemented in the Unity Catalog solution are :
- `Provider`: This defines the data provider for the recipient
- `Recipient` : This allows you to define the different recipients (users) to manage access rights on the shared data
- `Share`: This is a collection of read-only tables and notebooks that allow data from a Metastore to be shared with recipients 
    - The sharing of notebooks only concerns recipients who also use the Unity Catalog solution


Information about shares : 
- This is a logical wrapper that allows you to group all the objects (delta tables and notebooks) that you want to share in read-only mode.
- Unity Catalog writes the information about the shares in the following storage directory (AWS S3): `s3://s3-dbx-metastore-uc/metastore-sandbox/<Metastore ID>/delta-sharing/shares/<Share ID>/*`
- It is possible to add all the tables of the Metastore in a share
    - You only need to have `SELECT` and `USE` rights on the objects you want to add in the share
- Access rights to the share can only be given to the defined recipients
- The name of a share can be a name already used by a catalog or a schema (no restriction, but it is recommended to have a different name to facilitate the shares management)
- It is possible to share only Delta tables whether they are managed or external
    - It is possible to define a shared partition based on the existing partitions of the Delta table to automatically limit data access according to the properties of each recipient
        - Managing partitions at the share level can be extremely useful if you have defined partitions on information such as country, period or recipient ID to automatically limit access to data.
        - This allows you to set constraints on partitions at the share level only once and to be able to set properties for each recipient (Recipient)
    - It is possible to define whether the history of a Delta table is shared or not
    - It is possible to define whether the Change Data Feed of a Delta table is shared or not
- It is recommended to set up aliases for each object added to the share 
    - When no alias is defined for the schema name, the source schema name will be used
    - When no alias is defined for the name of the schema and the name of the table then the name of the source schema and the name of the source table will be used
    - It is not possible to update an alias after adding the object to the share. (It is necessary to remove and add the object again to modify the alias)
- Information specific to notebook sharing (in the case of Databricks-to-Databricks sharing only):
    - When the notebook is shared, it is actually exported in HTML format to a directory in Unity Catalog's managed storage (AWS S3) (specifically the `s3://s3-dbx-metastore-uc/metastore-sandbox/<Metastore ID>/delta-sharing/shares/<Share ID>/notebooks_files/*` directory), which has the effect of keeping a specific version of the notebook that is to be shared.
    - When the notebook that has been shared is modified, this has no impact on the shared notebook. You have to remove it and add it again to the share to share the latest version of the notebook.


Information about recipients :
- This is an object at the Metastore level that allows you to define access for a partner/customer
- Read access to the share is managed on the recipient object 
- A recipient can access all the shares in a Metastore according to the rights given by the share owners
- A recipient cannot access Metatore Unity Catalogs, only authorized shares.
- In order to create a recipient it is necessary to activate the Delta Sharing feature for the Metastore
- There are two types of recipient :
    - Open Sharing : the recipient uses a Databricks token whose validity period is defined at the Metastore level
    - Databricks-to-Databricks Sharing : the recipient uses a Metastore sharing ID (no validity period)
- Users of a Metastore cannot access shares of the same Metastore


Resources about some connectors allowing to access shared data without using a Databricks resource:
- [Python & Pandas](https://github.com/delta-io/delta-sharing#python-connector)
- [Apache spark](https://github.com/delta-io/delta-sharing#apache-spark-connector)
- [Power BI](https://learn.microsoft.com/en-us/power-query/connectors/delta-sharing)
- [Java](https://github.com/databrickslabs/delta-sharing-java-connector)



# What are the Audit Logs

When you are a provider, it is essential to be able to track the use of your data by the recipients defined.

This can allow you to define billing rules when you want to monetize access to data, but also to simply track the use of shared objects.

Some examples of captured events in the Metastore of the Unity Catalog solution (not exhaustive):
- Create and Delete a share
- Create and Delete a recipient
- Request access from a recipient
- Execute a query on a shared object from a recipient
- Result (metadata) of the query on a shared object from a recipient

To do this, it is necessary to set up the storage of audit logs for events related to the Metastore of the Unity Catalog solution.

The storage of audit logs requires the implementation of a log configuration at the level of the Databricks account.

Some informations : 
- Audit logs are not retrieved in real time, but every X minutes and stored in storage resource specified at the log configuration level in the Account Databricks.
- The audit log files are in JSON format.
- The audit log files for the Metastore Unity Catalog are stored in a subdirectory named `workspace=0`.
    - When you will set up the log configuration, you must be careful not to filter the Databricks Workspace identifier or to take into account the Databricks Workspace identifier with the value `0` otherwise you will not get the logs concerning the events related to the Unity Catalog Metastore.
- You will not be able to update or delete a log configuration at the Databricks Account level, you can only deactivate it and create a new one (even if you use the same name, the configuration identifier will be different with a unique identifier)

All the events captured at the account level and more specifically concerning Unity Catalog are traced in the audit log and can be analyzed. We have voluntarily limited our analysis to two types of actions for this demonstration.

You will find an exhaustive list of actions/events that you can analyze in the [official documentation](https://docs.databricks.com/administration-guide/account-settings/audit-logs.html#events).


# Set-up the environment

We are going to set up a set of elements allowing us to discover in more detail the Delta Sharing functionality of the Unity Catalog solution.

## Context

Prerequisite:
- Existence of an AWS S3 resource named `s3-dbx-metastore-uc`
- Existence of an AWS S3 resource named `s3-demo-data-uc`
- Existence of a Metastore named `metastore-sandbox` with the Storage Credential named `sc-metastore-sandbox` allowing to store the default data in the AWS S3 resource named `s3-dbx-metastore-uc`
- Existence of an AWS IAM role named `role-databricks-demo-data-uc` and an AWS IAM policy named `policy-databricks-demo-data-uc` allowing the global Databricks role to manage access to the AWS S3 resource named `s3-demo-data-uc`
- Existence of a Storage Credential named `sc-demo-data-uc` and an External Location named `el_demo_data_uc` allowing the global Databricks role to manage the access to the AWS S3 resource named `s3-demo-data-uc`
- Existence of the `grp_demo` group
- Existence of the user `john.do.dbx@gmail.com` in the group `grp_demo`
- Existence of a SQL Warehouse with the right of use for the group `grp_demo`


Setting up rights for the `grp_demo` group :
1. Give the right to create catalogs at the Metastore level for the `grp_demo` group 
2. Give the right to read external files from the External Location object named `el_demo_data_uc`. 
3. Give the right to create a share space at the Metastore level for the group `grp_demo`.
4. Give the right to create a recipient at the Metastore level for the group `grp_demo`.
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



## Diagram of the environment

Concerning the elements on AWS
Diagram of the objects in the Metastore Unity Catalog on AWS:
[![schema_21](/blog/web/20230521_blog_article_unity_catalog_dela_sharing_21.png)](/blog/web/20230521_blog_article_unity_catalog_dela_sharing_21.png)
List of items:
- Metastore `metastore-sandbox` : Main metastore at the AWS Databricks Account level
- Storage Credential `sc-metastore-sandbox` : Login information to manage access rights to the AWS resource named `s3-dbx-metastore-uc`.
- Storage Credential `sc-demo-data-uc` and External Location `el-demo-data-uc`: Login information to manage access rights to the AWS resource named `s3-demo-data-uc`.
- Catalog `ctg_mng`: Logical object to organize and manage managed data
- Catalog `ctg_ext`: Logical object to organize and manage external data


Diagram of all the objects that we will set up and use on the Unity Catalog Metastore on AWS:
[![schema_22](/blog/web/20230521_blog_article_unity_catalog_dela_sharing_22.png)](/blog/web/20230521_blog_article_unity_catalog_dela_sharing_22.png)
List of items:
- Catalog `ctg_mng` and Schema `sch_mng` : Logical object to organize and manage managed data
- Catalog `ctg_ext` and Schema `sch_ext` : Logical object to organize and manage external data
- Table `fct_transactions_mng`: Unity Catalog managed table containing transaction information and partitioned on the `id_client` column
- Table `fct_transactions_ext`: External table containing transaction information not partitioned but with the Change Data Feed enabled in the AWS S3 resource named `s3-demo-data-uc/data/fct_transactions_ext`
- Table `fct_transactions_csv` : External table allowing direct access to the CSV source file of the transactions in the AWS S3 resource named `s3-demo-data-uc/demo/fct_transactions.csv`.
- Table `audit_logs_json` : External table allowing direct access to all the audit log files based on the data of the AWS S3 resource named `s3_demo_data_uc/dbx_logs/account`
- Sharing `share_aws_dbx` : Logical object to organize and manage shared objects
    - The `sch_share` schema Alias allows you to group objects from different catalogs and schemas into a single logical schema for data sharing
    - The `fct_trx_mng` table alias allows you to make data from the `fct_transactions_mng` table available without having to communicate the table name
    - The Alias of the `fct_trx_ext` table allows you to provide the data of the `fct_transactions_ext` table without having to communicate the table name
- Recipient `rcp_azure_dbx` : Object allowing users of the Metastore Unity Catalog Azure to access the data of the `share_aws_dbx`share.
- Recipient `rcp_open_all` : Object allowing users not using Metastore Unity Catalog to access data from the `share_aws_dbx` share


Concerning the elements on Azure:
Diagram of all the elements that we will implement and use on the Unity Catalog Metastore on Azure:
[![schema_23](/blog/web/20230521_blog_article_unity_catalog_dela_sharing_23.png)](/blog/web/20230521_blog_article_unity_catalog_dela_sharing_23.png)
List of elements :
- Metastore `metastore-az`: Main metastore at the Azure Databricks Account level
- Storage Credential `sc-metastore-az`: Login information to manage access rights to the Azure ADLS Gen2 resource named `adls-dbx-metastore-uc`.
- Catalog `ctg_aws`: Logical object to synchronize with the `share_aws_dbx` share and access all elements of the `sch_share` shared schema



## Environment variable

In order to facilitate the implementation of the various elements throughout this discovery, we will set up some environment variables to use with the Databricks REST API tool.

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


## Setting up a dataset on the AWS S3 resource

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
aws s3 cp fct_transactions.csv s3://s3-demo-data-uc/demo/fct_transactions.csv 
```

## Setting up the objects on the Unity Catalog Metastore
Note : Using a user from `grp_demo` group 

1. Creation of catalogs
- `ctg_mng` : Catalog to manage the elements managed by Unity Catalog
- `ctg_ext` : Catalog to manage external elements
```sql
-- Create Catalog (for managed data)
CREATE CATALOG IF NOT EXISTS ctg_mn
    COMMENT 'Catalog for managed data';

-- Create Catalog (for external data)
CREATE CATALOG IF NOT EXISTS ctg_ext
    COMMENT 'Catalog for external data';
```


2. Creation of schemas
The list of schemas :
- `ctg_ext.sch_ext` : Schema to manage the external elements
- `ctg_mng.sch_mng` : Schema to manage the elements managed by Unity Catalog
```sql
-- Create Schema for external data
CREATE SCHEMA IF NOT EXISTS ctg_ext.sch_ext
    COMMENT 'Schema for external data';

-- Create Schema for managed data
CREATE SCHEMA IF NOT EXISTS ctg_mng.sch_mng
    COMMENT 'Schema for managed Data';
```


3. Creation of tables
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


4. Populate tables
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


## Creating a notebook to be able to share it


We will import a scala notebook named `read_demo_data_nbk_scala` into the `Shared` directory of the Databricks AWS Workspace with Databricks REST API :
```bash 
dbx-api -X POST ${DBX_API_URL}/api/2.0/workspace/import -H 'Content-Type: application/json' -d "{ 
    \"path\": \"/Shared/read_demo_data_nbk_scala\",
    \"content\": \"Ly8gRGF0YWJyaWNrcyBub3RlYm9vayBzb3VyY2UKdmFsIGRmID0gc3BhcmsudGFibGUoImN0Z19tbnQuc2NoX21uZy5mY3RfdHJhbnNhY3Rpb25zX21uZyIpCgovLyBDT01NQU5EIC0tLS0tLS0tLS0KCmRpc3BsYXkoZGYp\",
    \"language\": \"SCALA\",
    \"overwrite\": \"true\",
    \"format\":\"SOURCE\"
}"
```

Imported Notebook Content :
[![schema_01](/blog/web/20230521_blog_article_unity_catalog_dela_sharing_01.png)](/blog/web/20230521_blog_article_unity_catalog_dela_sharing_01.png)



# Configuring the audit logs on the Metastore

We will start with the configuration of audit logs in order to be able to keep track of all events related to the Unity Catalog Metastore (for the Delta Sharing feature).

It is possible to capture all the events at the Databricks Account level or at the level of each Databricks Workspace.
In our case, we are going to focus on the Databricks Account level because it is at this level that the events related to the Metastore Unity Catalog are captured.

For this demonstration, we will focus only on events concerning requests from recipients on shared objects, but the audit logs contain much more information.

Goals  :
- We want to capture audit logs in AWS S3 resource named `s3-demo-data-uc/dbx_logs`
- We do not want to filter Workspace Databricks identifiers in order to capture all the audit logs offered by Databricks


You need to follow these steps: (based on the [official documentation](https://docs.databricks.com/administration-guide/account-settings/audit-logs.html#configure-audit-log-delivery ))
1. Create an AWS IAM role and AWS IAM policy for Databricks to access (and write to) the AWS S3 resource named `s3-demo-data-uc/dbx_logs`
2. Creation of a Databricks Credential at the Databricks Account level to store connection information (AWS IAM role created)
3. Create a Storage Databricks at the Account Databricks level to store the path to the AWS S3 resource named `s3-demo-data-uc/dbx_logs`
4. Creation of the log configuration at the Account Databricks level based on the Credential Databricks and the Storage Databricks


# Activate the Delta Sharing feature on the Metastore

The management (creation and deletion) of shares does not require the activation of the Delta Sharing feature on the Metastore.
Enabling the Delta Sharing feature is mandatory only when you want to manage recipients and configure access to shared objects.

To enable this feature, perform the following action:
1. Update the Metastore configuration with the following information:
     - The `delta_sharing_scope` information must be set to `INTERNAL_AND_EXTERNAL`
         - `INTERNAL` value means the feature is disabled
     - The `delta_sharing_recipient_token_lifetime_in_seconds` information must be filled with the number of seconds of validity of the Databricks Token (for example with the value `86400` for one day)
         - The recipient using a Databricks Token will be able to access shared objects only during the validity period of the Databricks Token
     - The `delta_sharing_organization_name` information must be filled with the name representing your organization as a provider (for example: `dbx_aws_sharing`)
         - This is the name that recipients, using Databricks, will see as the share provider


Performing the action with Databricks REST API :
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



# Create a share in the Metastore

Creating a share can be done with Databricks REST API or directly with SQL commands.

The creation of a share requires the following rights on the Metastore:
- Right to create share objects on the Metastore
- Right to use catalogs and schemas containing the data to be shared
- Right to read the delta tables containing the data to be shared
```sql
GRANT CREATE_SHARE ON METASTORE TO grp_demo;
GRANT USE, USE SCHEMA, SELECT ON CATALOG ctg_mng TO grp_demo;
GRANT USE, USE SCHEMA, SELECT ON CATALOG ctg_ext TO grp_demo;
```


The creation of the share allows you to define all the data to be shared :
1. Create the `share_aws_dbx` share at the Metastore Unity Catalog level
2. Add the table `ctg_ext.sch_ext.fct_transactions_ext` using the alias `sch_share.fct_trx_ext`
     1. Enable the Change Data Feed in the data sharing (option `cdf_enable: true`)
     2. Allow access from version n°0 of the data history (option `start_version: 0`)
3. Add the table `ctg_mng.sch_mng.fct_transactions_mng` using the alias `sch_share.fct_trx_mng`
     1. Allow access to only the latest version of data (no access to history) (option `history_data_sharing_status: false`)
     2. Add partition management to allow access to data only for the partition (id_client) which is equal to the value of the property named `ìd_client` associated with the recipient when it was created. (Each recipient will have a different value for the `id_client` property to highlight this access policy which cannot be bypassed by the recipient)
4. Add the `/Shared/read_demo_data_nbk_scala` notebook in share manually (API didn't work during our tests)

Using Databricks REST APIs :
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


Using SQL commands :
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

For step n°4 (adding the notebook in the Share), it is not possible to do it directly with SQL commands and we have not managed to do it using Databricks REST API, therefore we will do it manually by using Data Explorer:
1. Go to `Workspace Databricks page > Data > Delta Sharing > Shared by me`
2. Click on the desired share (Share) `share_aws_dbx`
3. Click on `Manage assets` and select the option `Add notebook file`
4. Fill in the information `Notebook file` with the path and name of the file to share `/Shared/read_demo_data_nbk_scala`
5. Fill in the `Share as` information with the name you want to display in the share for the notebook `shared_nbk`

Result of creating and adding elements in the Share:
[![schema_02](/blog/web/20230521_blog_article_unity_catalog_dela_sharing_02.png)](/blog/web/20230521_blog_article_unity_catalog_dela_sharing_02.png)



# Sharing data with a Unity Catalog Metastore on Azure

Sharing data between two Unity Catalog Metastores is called "Databricks-to-Databricks Sharing".

To achieve this Databricks-to-Databricks sharing, we will use a Unity Catalog Metastore on a Databricks Azure Account in the France Central location.
As a reminder, the main Unity Catalog Metastore (provider) is on a Databricks AWS Account and in the eu-west-1 (Ireland) location

## Unity Catalog setup on Azure

To do this, we will start by setting up a Metastore on a Databricks Workspace on Azure.

Prerequisites:
- You must have installed the Azure CLI tool and configure the connection to Azure
- You must have created a Databricks Workspace in a Resource Group and your account must have Databricks Workspace administration rights.
- You must have the Databricks Azure Account administration rights
     - This right can be given by an account with the "Azure AD Global Administrator" role by connecting to the Databricks Azure Account
- You must have the rights to create the various resources necessary in an Azure Group Resource

The steps required to set up a Unity Catalog Metastore on Azure are :
1. Creation of a storage (ADLS Gen2 obligatorily) in the same region as the Metastore
2. Creating a Databricks Access Connector
3. Assign the Databricks Access Connector with the created storage (ALDLS Gen2)
4. Creation of a Metastore
5. Association of the Metastore with the Workspace Databricks
6. Creation of a Credential Storage (for managing access rights)
7. Association of Credential Storage with the Metastore


To speed up the process but keep an educational approach, we will use Azure CLI and Databricks REST API to perform the steps:
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

If creating the `Databricks Access Connector` (step #2) does not work with the Azure CLI tool, you can do it manually by following this steps :
1. Go to `Microsoft Azure page > Resource Group`
2. Click on the desired resource group
3. Click on `Create`
4. Fill in the `Search the Marketplace` information with the value `access connector for azure databricks`
5. Click on `Create > Access Connector for Azure Databricks`
6. Click on `Create`
7. Fill in the `Subscription` , `Resource group`, `Name` and `Region` information with the desired values
8. Click on `Review + create`
9. Click on `Create`

Note: Regarding the SQL Warehouse resource on Azure, a SQL Warehouse 2X-Small requires a value of at least 8 for the quota named `Total Regional Spot vCPUs`


## Setting up a Databricks-to-Databricks recipient

In order to be able to share data with a recipient using a Unity Catalog Metastore, we need to perform the following actions:
1. Request the Unity Catalog Metastore sharing identifier of the recipient
2. Create a `rcp_azure_dbx` recipient on the Unity Catalog AWS Metastore of the provider using the shared identifier corresponding to the Unity Catalog Azure Metastore of the recipient
3. Give read rights to the recipient `rcp_azure_dbx` on the elements of the share named `share_aws_dbx`

Details of the steps:
1. Request the Unity Catalog Metastore sharing identifier of the recipient

The share identifier is a character string composed of the following information : `<Metastore Cloud Provider>:<Metastore Region>:<Metastore ID>`

There are several ways to get this identifier for the recipient:
- The 1st way (which is the simplest) is to connect to Worspace Databricks and execute the command `select current_metastore()` on a SQL Warehouse (or `spark.sql("select current_metastore()")` in a notebook attached to a cluster with access rights to the Metastore Unity Catalog)
- The 2nd way is using Databricks REST API
```bash
# Get Metastore Sharing ID
dbx-api -X GET ${DBX_AZ_API_URL}/api/2.1/unity-catalog/metastores  | jq -r '.metastores[]|select(.name==$ENV.DBX_AZ_METASTORE_NAME)|.cloud+":"+.region+":"+.metastore_id'
```
- Le 3ème moyen est d'utiliser l'outil Data Explorer
    1. Allez dans `Workspace Databricks page > Data > Delta Sharing > Shared with me`
    2. Cliquez sur `Copy sharing identifier`

Once the share identifier has been retrieved, it must be sent to the provider of the share.

2. Create a `rcp_azure_dbx` recipient on the Unity Catalog AWS Metastore of the provider using the shared identifier corresponding to the Unity Catalog Azure Metastore of the recipient


Note: We will set up a `id_client: 1` property to use the partitions of the shared object whose alias is `sch_share.fct_trx_mng`

The creation of a recipient requires the following rights on the Metastore:
```sql
GRANT CREATE_RECIPIENT ON METASTORE TO grp_demo;
```

To create a recipient with Databricks REST API :
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

To create a recipient with SQL commands :
```sql
-- A recipient created for Databricks to Databricks sharing with a id_client properties
CREATE RECIPIENT rcp_azure_dbx
USING ID '<Metastore Azure Sharing identifier>'
PROPERTIES ( id_client = 1)
;

-- To get the detail of the recipient
DESCRIBE RECIPIENT rcp_azure_dbx;
```


3. Give read rights to the recipient `rcp_azure_dbx` on the elements of the share named `share_aws_dbx`
```sql
GRANT SELECT ON SHARE share_aws_dbx TO RECIPIENT rcp_azure_dbx;
```

From this last step, the `rcp_azure_dbx` recipient will be able to access the objects of the share using his Metastore Unity Catalog with his Workspace Databricks on Azure.

Note: It may take a few seconds or minutes to see the new provider named `dbx_aws_sharing` appear in the Metastore Unity Catalog on Azure after creating the recipient `rcp_azure_dbx` on AWS

The result should be the following:
[![schema_03](/blog/web/20230521_blog_article_unity_catalog_dela_sharing_03.png)](/blog/web/20230521_blog_article_unity_catalog_dela_sharing_03.png)

## Access through the Unity Catalog Metastore on Azure

Once the Databricks-to-Databricks share has been set up, an administrator of the Metastore Unity Catalog Azure must be able to create a catalog using the information from the share in order to be able to make the objects of the share accessible to Metastore users.

To do this, all you have to do is use the SQL commands to create a catalog and give the rights to use and read the catalog (and objects) as for any other catalog in the Metastore Unity Catalog.

The difference being that the catalog objects linked to the share can only be used in read-only mode and the data is stored in the AWS S3 resource of the provider and not in the Azure ADLS Gen2 resource of the recipient.

Creation of the catalog with an SQL command : 
```sql
CREATE CATALOG IF NOT EXISTS ctg_aws
USING SHARE `dbx_aws_sharing`.share_aws_dbx
COMMENT 'Shared data from AWS Metastore'
;
```

Note: When setting up Databricks-to-Databricks sharing, there is no need to share connection information between the two Metastores. We only used a sharing identifier linked to the Metastore of the recipient, which has the effect of simplifying and securing exchanges and setting up the share.

Example of data access from a query on a SQL Warehouse via the Azure Workspace Databricks :
1. When we access the `sch_share.fct_trx_mng` object, we only see the information whose `id_client` column is equal to the value `1` because the recipient only has the right to access to this data partition as defined by the provider when creating the recipient
[![schema_04](/blog/web/20230521_blog_article_unity_catalog_dela_sharing_04.png)](/blog/web/20230521_blog_article_unity_catalog_dela_sharing_04.png)

2. When we access the `sch_share.fct_trx_ext` object, we can see all the data.
[![schema_05](/blog/web/20230521_blog_article_unity_catalog_dela_sharing_05.png)](/blog/web/20230521_blog_article_unity_catalog_dela_sharing_05.png)


Regarding access to the shared notebook:
To access the `shared_nbk` notebook, use the Data Explorer tool:
1. Go to `Workspace Databricks page > Data `
2. Select Catalog (from Shared Objects)
3. Click on the `Other assets` tab
4. Click on the desired notebook

Note: You will only be able to see the cells of the notebook in read-only HTML format and you will be able to clone the notebook into your Workspace Databricks.

Visualization of the list of notebooks shared with the Data Explorer tool
[![schema_06](/blog/web/20230521_blog_article_unity_catalog_dela_sharing_06.png)](/blog/web/20230521_blog_article_unity_catalog_dela_sharing_06.png)

Visualization of the `shared_nbk` notebook with the Data Explorer tool
[![schema_07](/blog/web/20230521_blog_article_unity_catalog_dela_sharing_07.png)](/blog/web/20230521_blog_article_unity_catalog_dela_sharing_07.png)


## Reading audit logs

To access the audit logs more easily, we will create an external table named `ctg_ext.sch_ext.audit_logs_json` based on the `s3://s3-demo-data-uc/dbx_logs/account` directory which contains all log files in JSON format with information on events related to the Databricks Account (and to the different Databricks Workspaces).

We will focus only on the `deltaSharingQueriedTable` and `deltaSharingQueryTable` actions at the Databricks Account level regarding the `rcp_azure_dbx` recipient to highlight some information that we can easily retrieve from the audit logs to track access to shared objects.

The steps are :
1. Create the external table `ctg_ext.sch_ext.audit_logs_json` to easily access the JSON files of the AWS S3 resource named `s3://s3-demo-data-uc/dbx_logs/account`
2. Retrieve information about `deltaSharingQueryTable` actions from the `rcp_azure_dbx` recipient
3. Retrieving `deltaSharingQueriedTable` action information from the `rcp_azure_dbx` recipient

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

Result of query n°2 for `deltaSharingQueryTable` actions :
```text
requestId,recipient_name,share,schema,name,user_agent,statusCode,serviceName,sourceIPAddress
CgsI3ceeowYQhsLgAzoQSHf2V13IQFqodUiz6jKNJw==,rcp_azure_dbx,share_aws_dbx,sch_share,fct_trx_mng,Delta-Sharing-Unity-Catalog-Databricks-Auth/1.0 Linux/5.4.0-1107-azure-fips OpenJDK_64-Bit_Server_VM/11.0.18+10-jvmci-22.3-b13 java/11.0.18 scala/2.12.15 java_vendor/GraalVM_Community,200,unityCatalog,
CgsI78eeowYQvvjMFjoQvIDzt07UQ3mzAJR99KJGpg==,rcp_azure_dbx,share_aws_dbx,sch_share,fct_trx_ext,Delta-Sharing-Unity-Catalog-Databricks-Auth/1.0 Linux/5.4.0-1107-azure-fips OpenJDK_64-Bit_Server_VM/11.0.18+10-jvmci-22.3-b13 java/11.0.18 scala/2.12.15 java_vendor/GraalVM_Community,200,unityCatalog,
```
This query allows us to access information from query requests executed on shared objects (recipient name, share name, schema name, table name, etc...)

Result of query n°3 for `deltaSharingQueriedTable` actions :
```text
requestId,recipient_name,numRecords,tableName,deltaSharingPartitionFilteringAccessed,serviceName,sourceIPAddress,userAgent
d8140290-4a65-44a2-aac0-31c7feaf4aac,rcp_azure_dbx,5,fct_trx_mng,true,unityCatalog,,Delta-Sharing-Unity-Catalog-Databricks-Auth/1.0 Linux/5.4.0-1107-azure-fips OpenJDK_64-Bit_Server_VM/11.0.18+10-jvmci-22.3-b13 java/11.0.18 scala/2.12.15 java_vendor/GraalVM_Community
854c0522-aaca-465c-8f7d-1684a003e8e1,rcp_azure_dbx,8,fct_trx_ext,false,unityCatalog,,Delta-Sharing-Unity-Catalog-Databricks-Auth/1.0 Linux/5.4.0-1107-azure-fips OpenJDK_64-Bit_Server_VM/11.0.18+10-jvmci-22.3-b13 java/11.0.18 scala/2.12.15 java_vendor/GraalVM_Community
```
This query allows us to access the information of the result of the queries executed on the shared objects.
We can see that the query on the `fct_trx_mng` table has the `deltaSharingPartitionFilteringAccessed` option enabled and returns only 3 rows (which corresponds to the filter on the partitions) and that the query on the `fct_trx_ext` table returns 8 rows.
We can also have other information such as the ip address, the agent of the tool that executed the request (Databricks in our case) and many more informations.



# Data sharing in Open Sharing

In order to be able to share the data with a recipient not using Metastore Unity Catalog (named Open Sharing), we must perform the following actions :
1. Create the `rcp_open_all` recipient based on a Databricks Token (which will have a lifetime defined at the Metastore level)
2. Give read rights to the `rcp_open_all` recipient on the objects of the `share_aws_dbx` share 
3. Retrieve the activation URL to send to the `rcp_open_all` recipient
4. The recipient must connect to the given URL and download the configuration file named `config.share` to be able to connect to the `share_aws_dbx` share


Details of the steps:
1. Create the `rcp_open_all` recipient based on a Databricks Token

Note: We will set up a `id_client: 2` property to use the partitions of the shared object whose alias is `sch_share.fct_trx_mng`

The creation of a recipient requires the following rights on the Metastore:
```sql
GRANT CREATE_RECIPIENT ON METASTORE TO 'grp_demo';
```

To create a recipient with Databricks REST API :
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

To create a recipient with SQL commands :
```sql
-- A recipient created for sharing outside of Databricks with a id_client properties
CREATE RECIPIENT rcp_open_all
COMMENT 'Give access to shared data for external tools'
PROPERTIES ( id_client = 2)
;
```


2. Give read rights to the `rcp_open_all` recipient on the objects of the `share_aws_dbx` share 
```sql
GRANT SELECT ON SHARE share_aws_dbx TO RECIPIENT rcp_open_all;
```


3. Retrieve the activation URL to send to the `rcp_open_all` recipient
The URL retrieval can be done with a SQL command (by the provider) :
```sql
-- Get the activation url (activation_link parameter)
DESCRIBE RECIPIENT rcp_open_all;
-- activation_link : https://ireland.cloud.databricks.com/delta_sharing/retrieve_config.html?XXXXXXXXXXXXX
```

The URL retrieval can be done with the Databricks REST API (by the provider) :
```bash
dbx-api -X GET ${DBX_API_URL}/api/2.1/unity-catalog/recipients/${DBX_RECIPIENT_OPEN} | jq -r '.tokens[0].activation_url'
```

4. The recipient must connect to the given URL and download the configuration file named `config.share` to be able to connect to the `share_aws_dbx` share

Warning: Whatever the method used, the retrieve of connection information can only be done once. This is managed by Databricks.

It is possible to retrieve the information with Databricks REST API:
Note: writing connection information in the file `~/config.share`
```bash
# Get the URL Activation Code (from Metastore Unity CAtalog AWS)
export TMP_DBX_RECIPIENT_OPEN_URL=`dbx-api -X GET ${DBX_API_URL}/api/2.1/unity-catalog/recipients/${DBX_RECIPIENT_OPEN} | jq '.tokens[0].activation_url' | sed "s/.*?//" | sed 's/"//'`

# Extract information to write the config.share file (instead of download from databricks activation page) from Public API
dbx-api -X GET ${DBX_API_URL}/api/2.1/unity-catalog/public/data_sharing_activation/${TMP_DBX_RECIPIENT_OPEN_URL} > ~/config.share
```

For manual retrieval of `config.share` connection information, simply access the provided activation URL:
[![schema_08](/blog/web/20230521_blog_article_unity_catalog_dela_sharing_08.png)](/blog/web/20230521_blog_article_unity_catalog_dela_sharing_08.png)


Information :
- You will only be able to access the activation URL and the objects of the share during the validity period of the Token Databricks
- It is possible to access the activation URL as many times as you want (during the validity period) but the download of the configuration file `config.share` is only possible once
     - It is through this configuration file `config.share` that you will be able to access shared objects
- It is possible to rotate Token Databricks to re-enable access to shared objects, but this requires getting a new configuration file `config.share` (the keys will be different)

Example of a rotation of Databricks Token (if for example the activation could not be done during the initial validity period) with Databricks REST API :
```bash
# If you need to rotate the Databricks Token
dbx-api -X POST ${DBX_API_URL}/api/2.1/unity-catalog/recipients/${DBX_RECIPIENT_OPEN}/rotate-token -H 'Content-Type: application/json' -d '{
"existing_token_expire_in_seconds": 0
}'
```

From step n°4, the recipient can access the objects (delta tables only) of the share using the desired tool depending on the `delta-sharing` connectors available (python, java, sparks, etc ...)



## Access by python script

Prerequisites: the configuration file `config.share` has been retrieved locally `~/config.share`

Installation of the `delta-sharing` python library proposed by Databricks
```bash
pip install delta-sharing
```

Example of a python script to display the contents of shared delta tables :
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

Script result :
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

We can see that the first delta table `share_aws_dbx.sch_share.fct_trx_mng` only returns the information corresponding to the partition `id_client = 2` and the second delta table `share_aws_dbx.sch_share.fct_trx_ext` returns all the rows.

With this python script, we can see that it is extremely easy to access shared delta tables.

Example of a python script to list the delta tables of the share with the `SharingClient` object :
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

Script result :
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

We will use the same procedure as for reading the Databricks-to-Databricks Sharing audit logs.

We will only focus on the `deltaSharingQueriedTable` and `deltaSharingQueryTable` actions at the Databricks Account level for the `rcp_open_all` recipient to highlight some information that we can easily retrieve from the audit logs to track access to shared objects.

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

Result of query n°2 for `deltaSharingQueryTable` actions :
```text
requestId,recipient_name,share,schema,name,user_agent,statusCode,serviceName,sourceIPAddress
d59abaa0-2829-4d4b-90ea-73e9f4ec11ee,rcp_open_all,share_aws_dbx,sch_share,fct_trx_mng,Delta-Sharing-Python/0.6.4 pandas/1.3.4 PyArrow/11.0.0 Python/3.11.3 System/macOS-13.3.1-arm64-arm-64bit,200,unityCatalog,86.247.59.138
0690bef9-413d-44ec-8541-4901273aa589,rcp_open_all,share_aws_dbx,sch_share,fct_trx_ext,Delta-Sharing-Python/0.6.4 pandas/1.3.4 PyArrow/11.0.0 Python/3.11.3 System/macOS-13.3.1-arm64-arm-64bit,200,unityCatalog,86.247.59.138
```
This query allows us to access information from query requests executed on shared objects (recipient name, share name, schema name, table name, etc...)

Result of query n°3 for `deltaSharingQueriedTable` actions :
```text
requestId,recipient_name,numRecords,tableName,deltaSharingPartitionFilteringAccessed,serviceName,sourceIPAddress,userAgent
88dc2822-63c1-4384-b706-82ab9d5f5d9a,rcp_open_all,3,fct_trx_mng,true,unityCatalog,86.247.59.138,Delta-Sharing-Python/0.6.4 pandas/1.3.4 PyArrow/11.0.0 Python/3.11.3 System/macOS-13.3.1-arm64-arm-64bit
2be8d1b6-936c-40d9-89c1-60d104e9f50f,rcp_open_all,8,fct_trx_ext,false,unityCatalog,86.247.59.138,Delta-Sharing-Python/0.6.4 pandas/1.3.4 PyArrow/11.0.0 Python/3.11.3 System/macOS-13.3.1-arm64-arm-64bit
```
This query allows us to access the information of the result of the queries executed on the shared objects.
We can see that the query on the `fct_trx_mng` table has the `deltaSharingPartitionFilteringAccessed` option enabled and returns only 5 rows (which corresponds to the filter on the partitions) and that the query on the `fct_trx_ext` table returns 8 rows.
We can also have other information such as the ip address, the agent of the tool that executed the request (Python/pandas in our case) and many other information.





# Clean environment

You will find, below, all the instructions necessary to clean the environment.

Deleting recipients (with Databricks REST API) :
```bash
dbx-api -X DELETE ${DBX_API_URL}/api/2.1/unity-catalog/recipients/${DBX_RECIPIENT_DBX}
dbx-api -X DELETE ${DBX_API_URL}/api/2.1/unity-catalog/recipients/${DBX_RECIPIENT_OPEN}
```

Deleting imported notebook (with Databricks REST API) :
```bash
dbx-api -X POST ${DBX_API_URL}/api/2.0/workspace/delete -H 'Content-Type: application/json' -d '{"path": "/Shared/read_demo_data_nbk_scala", "recursive":"false"}'
```


Deleting share (with Databricks REST API) :
```bash
# Delete Share
dbx-api -X DELETE ${DBX_API_URL}/api/2.1/unity-catalog/shares/${DBX_SHARE_NAME}
```


Deleting catalog in Metastore Unity Catalog (with SQL commands) :
```sql
-- Delete the Catalog with CASCADE option (to delete all objects)
DROP CATALOG IF EXISTS ctg_mng CASCADE;
DROP CATALOG IF EXISTS ctg_ext CASCADE;
```

Deactivating data sharing feature on the Unity Catalog Metastore (with Databricks REST API):
```bash
# Get the Metastore ID (databricks)
export TMP_DBX_METASTORE_ID=`dbx-api -X GET ${DBX_API_URL}/api/2.1/unity-catalog/metastores | jq -r '.metastores[]|select(.name==$ENV.DBX_METASTORE_NAME)|.metastore_id'`

# Update the Metastore configuration to deactivate Delta Sharing (external)
dbx-api -X PATCH ${DBX_API_URL}/api/2.1/unity-catalog/metastores/${TMP_DBX_METASTORE_ID} -H 'Content-Type: application/json' -d "{
    \"delta_sharing_scope\": \"INTERNAL\"
}"
```

Deleting data stored in the AWS S3 resource (with AWS CLI) :
```bash
# Delete all files stored in the AWS S3 resource
aws s3 rm "s3://s3-demo-data-uc/demo/" --recursive 
aws s3 rm "s3://s3-demo-data-uc/data/" --recursive 
aws s3 rm "s3://s3-demo-data-uc/dbx_logs/" --recursive 
```

Deleting all elements in the Azure Databricks Account (with Azure CLI and Databricks REST API) :
```bash
# Delete Metastore
dbx-api -X DELETE ${DBX_AZ_API_URL}/api/2.1/unity-catalog/metastores/${DBZ_AZ_METASTORE_ID}  -H 'Content-Type: application/json' -d '{"force": "true"}'

# Delete Databricks Access Connector
az databricks access-connector delete --resource-group ${AZ_RG_NAME} --name ${AZ_DBX_CONNECTOR_NAME}

# Delete ADLS Gen2 Storage
az storage account delete -n ${AZ_ADLS2_NAME} -g ${AZ_RG_NAME}

```

Note : Consider disabling audit logs configuration with [Databricks REST API](https://docs.databricks.com/api-explorer/account/logdelivery/patchstatus) if this is no longer needed

# Conclusion

With the Delta Sharing functionality, the Unity Catalog solution makes it possible to set up governance and data sharing in a very simple and secure way with internal (teams, subsidiaries) and external partners in order to better enhance and monetize them.

The management of shared objects can be done only with SQL commands, which makes the administration of shares and the management of access for the different recipients very simple and efficient.

Data sharing with Delta Sharing does not require the use of Databricks computing resources (Cluster or SQL Warehouse) of the provider to access shared objects.
Delta Sharing makes it possible to share data, which can be voluminous, in an efficient way and by limiting costs by providing transparent access directly to data storage in a secure way (AWS S3, Azure ADLS, GCP)

This makes it possible to multiply the data usage without having to duplicate it and to be able to access it from a very large number of tools and technologies (Spark, Python, Java, Scala, PowerBI and many others in the futur)

By relying on audit logs, we have the possibility of tracking all the events related to the Metastores of the Unity Catalog solution at the account level and to be able to analyze the use of shared objects by the different recipients.

At the time of writing this document (April/May 2023), it was not yet possible to share other objects than delta tables (managed or external) and notebooks (only for Databricks-to-Databricks) but the Databricks roadmap for the next versions confirms that we will soon be able to share many more types of objects.

This functionality is still recent but should become essential in the near future for all Databricks users for the management and governance of a Data Lake or a Lakehouse in order to maximize the data usage by all partners (internal and external) with the Unity Catalog solution.










