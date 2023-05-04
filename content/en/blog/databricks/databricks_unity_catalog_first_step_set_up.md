---
Categories : ["Databricks","Unity Catalog"]
Tags : ["Databricks","Unity Catalog"]
title : "Databricks : Unity Catalog - First Step - Set up"
date : 2023-05-04
draft : false
toc: true
---

We are going to discover the Unity Catalog solution from Databricks and more specifically how to set it up on an existing workspace.

We will use a Databricks account on AWS to perform this demonstration.


<!--more-->


# What's a metastore

A metastore is a repository allowing to store a set of metadata related to data (storage, usage, options).

A metadata is an information about a data allowing to define its context (description, rights, technical date and time of creation or update, creator, ...) and its usage (storage, structure, access, ...).

A metastore can be local to an instance of a resource (a cluster, a workspace) or central to all resources managing data.

In a company with a data governance based on a Data Lake, Datawarehouse or Lakehouse model for example, we will advise to set up a centralized metastore allowing to store all the metadata of the company's data in order to facilitate the governance, the use and the sharing of the data to all the teams



# Wha's the Unity Catalog solution

Unity Catalog is the Databricks solution that allows to have a unified and centralized governance for all the data managed by the Databricks resources as well as to secure and facilitate the management and the sharing of the data to all the internal and external actors of an organization.

The internal use is done by sharing a metastore of Unity Catalog on all Databricks workspaces.

The external use is done by using the "Delta Sharing" functionality of Unity Catalog or by using the SQL Warehouse functionality through an external tool (JDBC connector, ODC or Databricks partners).

Some examples of features offered by the Unity Catalog solution:
- Management of rights on objects by groups and users using an ANSI SQL syntax
- Management of objects that can be created in a Databricks workspace and used by all Databricks workspaces using Unity Catalog
- Possibility to share data in a simple and secure way through the Delta Sharing functionality
- Allows to capture information on the life cycle and the origin of the data (Data Lineage)
- Capture all logs to be able to audit data access and use

You can get a more complete overview by reading the [official documentation](https://docs.databricks.com/data-governance/unity-catalog/index.html)



# Objects hierarchy

Avant d'aller plus loin, nous allons introduire la hiérarchie des objets au sein de la solution Unity Catalog.
Nous allons nous concentrer uniquement sur les éléments nécessaires à la mise en place de la solution Unity Catalog.

We will introduce the object hierarchy within the Unity Catalog solution.
We will focus only on the elements that are used in our set up of the Unity Catalog solution.


Diagram of the objects hierarchy : 
[![schema_01](/blog/web/20230504_databricks_unity_catalog_schema_01.png)](/blog/web/20230504_databricks_unity_catalog_schema_01.png) 


The objects hierarchy consists of the following three levels :
1. Metastore :
    1. It is the top level object that can contain metadata
    2. There can only be one Metastore per region
    3. A Metastore must be attached to a Workspace to be used
    4. The Metastore must have the same region as the Workspace to which it is attached
2. Catalog :
    1. It is the first level of the hierarchy used to organize the data
    2. It allows to organize objects (data) by schema (also called database)
    3. If you want to have several environments in the same Metastore (in the same region) then you can create one Catalog per environment
3. Schema (or Database) : 
    1. It is the 2nd and last level of the hierarchy used to organize the data
    2. This level is used to store all the metadata about objects of type Table, View or Function

When you want to access an object (for example a table), it will be necessary to specify the Catalog and Schema where the object is defined.
Example : `select ... from catalog.schema.table`



Object used by the Unity Catalog solution to manage global access to data :
- Storage Credential : This object is directly associated with the Metastore and used to store access to a cloud provider (for example AWS S3) allowing the Unity Catalog solution to manage the rights on the data.

Objects used by the Unity Catalog solution to store and manage metadata (data usage):
- Table : Object used to define the structure and storage of data. 
    - Managed Table : The data is directly managed by the Unity Catalog solution and use the format Delta
    - External Table : The data is not directly managed by the Unity Catalog solution and can use any of the following formats : "Delta, CSV, JSON, Avro, Parquet, ORC or Text"
- View : Object used to encapsulate a query using one or more objects (table or view)
- Function : Objet used to define user defined function (operations on data)


Some information about object quotas in the Unity Catalog solution:
- A Metastore can contain up to 1000 Catalog
- A Metastore can contain up to 200 Storage Credential
- A Catalog can contain up to 10000 Schema
- A Schema can contain up to 10000 Table and 10000 Function


# Context

For this demonstration, we will only focus on the set up of a Metastore of the Unity Catalog solution on a Databricks Account on AWS.

In a project/company context, it is recommended to use the Terraform tool in order to be able to manage the infrastructure as code (IaC) and make the elements reproducible.

In the context of this demonstration, we will deliberately use command lines to make our approach clearer and more didactical.

We will mainly use the following tools:
- Databricks CLI: Command line interface to facilitate the use and configuration of Databricks resources
- AWS CLI: Command line interface to facilitate the use and configuration of AWS resources


## Diagram

Diagram of all the elements that we will put in place to use the Unity Catalog solution with a Databricks Workspace.

[![schema_02](/blog/web/20230504_databricks_unity_catalog_schema_02.png)](/blog/web/20230504_databricks_unity_catalog_schema_02.png) 


## Prerequisites

The following items are required before starting the set up :
- The Workspace must be in a Premium plan or higher
- You must have a Databricks Account on AWS
- You must have a Databricks Workspace based on the "eu-west-1" region
- You must have a Databricks user account with administrative rights on the Databricks account
- You must have an AWS user account with administration rights on AWS S3 and AWS IAM resources


In order to use the Databricks CLI and AWS CLI tools you must have created the following elements :
- A Databricks User Token to use Databricks CLI
- An AWS User Token to use AWS CLI
_Note: You will find the procedure for configuring the AWS CLI and Databricks CLI tools in the resources of this article_.


Information about the global Databricks role for managing AWS access through Unity Catalog solution :
- AWS IAM Role Unity Catalog : `arn:aws:iam::414351767826:role/unity-catalog-prod-UCMasterRole-14S5ZJVKOTYTL`
- AWS IAM ExternalId Unity Catalog : `65377825-bfee-466e-9a14-16a53b9a4e12`

Information about le Databricks Workspace ID :
-  Based on Databricks Workspace URL : `https://<databricks-instance>.com/o=XXXXX`, the workspace ID is the numeric value represented by `XXXXX`.


## Steps

To set up the  Unity Catalog solution and create a Metastore, we will perform the following steps :
1. Creation of an AWS S3 resource
2. Creation of a Policy and a Role to manage the AWS S3 resource with AWS IAM resource
3. Creation of a Databricks Metastore
4. Creation of a Databricks Storage Credential
5. Association of the Databricks Storage Credentiel with the Databricks Metastore
6. Association of the Databricks Metastore with the Databricks Workspace


# Setting up

## Step n°0 : Initialization of environment variables

Creation of environment variables allowing to define the naming of objects and to facilitate the writing of the commands.

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


## Step n°1 : Creation of the AWS S3 resource

This AWS S3 resource will be used by Unity Catalog to store "Managed" object data and metadata.

Execute the following commands using the AWS CLI : 
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

The policy and the role will allow to give administrative rights to the Unity Catalog solution to manage data access on the AWS S3 resource.

Execute the following commands using the AWS CLI :
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

## Step n°3 : Creation of a Metastore 

Create a Unity Catalog Metastore in the same region as the Workspace we want to use it with.

Execute the following commands using the Databricks CLI :
```bash
# Create metastore
databricks unity-catalog metastores create --name ${DBX_METASTORE_NAME} \
                                           --storage-root s3://${AWS_S3_DBX_UC}/${DBX_METASTORE_NAME}


# Get the metastore ID
export DBX_METASTORE_ID=`databricks unity-catalog metastores get-summary | jq 'select(.name == $ENV.DBX_METASTORE_NAME) | .metastore_id'`

# Check the metastore ID (it must not be empty)
echo ${DBX_METASTORE_ID}

```




## Step n°4 : Creation of a Storage Credential 

Created a Storage Credential to store access for the global Databricks role on the AWS S3 resource used to store Metastore data.

Execute the following commands using the Databricks CLI :
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





## Step n°5 : Association of the Databricks Storage Credentiel with the Databricks Metastore

In order for the Metastore to use the Storage Credential to access the AWS S3 resource and to be able to manage access on the data for all users, we need to associate the Storage Credential with the Metastore.

Execute the following commands using the Databricks CLI :
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




## Step n°6 : Association of the Databricks Metastore with the Databricks Workspace

To be able to use the Metastore with a Databricks Workspace, it is necessary to assign the Metastore to the Databricks Workspace at the Databricks account level.
Note: it is possible to define the name of the Catalog by default for the users of the Workspace.


Execute the following commands using the Databricks CLI :
```bash
databricks unity-catalog metastores assign --workspace-id ${DBX_WORKSPACE_ID} \
                                           --metastore-id ${DBX_METASTORE_ID} \
                                           --default-catalog-name main
```



## Step n°7 : Cleaning of environment variables

We can unset all the environment variables used when setting up Unity Catalog solution.

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

With the help of the Databricks CLI and AWS CLI tools, we were able to easily set up a Metastore on our Databricks Workspace in order to use the Unity Catalog solution.

This allowed us to easily set up a solution to manage our centralized metadata repository for all the data managed and manipulated by our Databricks resources (Cluster and SQL Warehouse).



Les avantages de l'utilisation de la solution Unity Catalog : 
- Unity Catalog permet de simplifier et centraliser la gestion des droits sur l'ensemble des objets gérés.
- Unity Catalog permet de sécuriser, faciliter et multiplier les usages sur les données grâce aux nombreux connecteurs pour SQL Warehouse ainsi que la possibilité d'exporter les informations vers d'autres outils de gestion de catalogue de données.
- Unity Catalog est un outil qui s'améliore régulièrement et qui devrait devenir la référence pour la gouvernance des données pour toutsceux qui utilisent Databricks.


The advantages of using the Unity Catalog solution : 
- Unity Catalog simplifies and centralizes the management of rights on all managed objects.
- Unity Catalog allows you to secure, facilitate and multiply the usages of data by using the numerous connectors for SQL Warehouse as well as the possibility of exporting information to other data catalog management tools.
- Unity Catalog is a tool that is regularly improved and that should become the reference for data governance for all those who use Databricks.


Some information about the limitations on the Unity Catalog solution: 
- The Workspace must be at least at the premium plan to use Unity Catalog
- A Metastore must contain all the elements concerning a region. 
- It is recommended to use a cluster with Databricks Runtime version 11.3 LTS or higher 
- The creation of a Storage Credential is only possible with an AWS IAM role when the Databricks Account is on AWS
- Part of the management of users and groups must be done at the account level and not only at the workspace level
- The groups defined locally in a workspace cannot be used with Unity Catalog, it is necessary to recreate the groups at the Databricks account level to be used by Unity Catalog (Migration).



# Resources

## Glossary

- Account Databricks : Highest level for Databricks administration
- Cluster Databricks : A set of computational resources for running Spark processing with Databricks
- Databricks Workspace ID : Identifier of the Databricks workspace
- Storage Credential : Object used to store the access for the Unity Catalog solution
- Data Lake : Used to store structured, semi-structured and unstructured data
- Data Warehouse : Used to store structured data (relational database)
- Lakehouse : Data management architecture that combines the benefits of a Data Lake with the management capabilities of a Data Warehouse
- AWS S3 : AWS Simple Storage Service for storing data/objects
- AWS IAM : AWS Identity and Access Management Service to control access to AWS services and resources.


## Connection management for the AWS CLI tool

1. Install the tool `AWS CLI` on macOS with Homebrew `brew install awscli`

2. Define a specific user for AWS CLI :
    1. Go to `IAM > Users`
    2. Click on `Add users`
    3. Fill the "User Name" : `usr_adm_cli` and click on `Next`
    4. If you have an admin group defined : 
        1. Choose `Add user to group`
        2. Choose the desired group name :  `FullAdmin` and click on `Next`
    5. If you have a policy defined :
        1. Choose `Attach policies directly`
        2. Choose the desired policy name : `AdministratorAccess` and click on `Next`
    6. If you need to define Tag : Click on `Add new tag` and add the needed tag
    7. Click on `Create user`
    8. Click on the created user `usr_adm_cli`
    9. Click on `Security credentials`
    10. Click on `Create access key`
    11. Choose `Command Line Interface (CLI)`, check the box `I understand the above .... to proceed to create an access key` and click on `Next`
    12. Fill the `Description tag value` : `administration` and click on `Create access key`
    13. Copy the `Access key` and the `Secret access key` to be able to use it with AWS CLI

3. Create configuration for AWS CLI to use the new user :
    1. Execute the command : `aws configure`
        1. Fill `AWS Access Key ID` with the `Access key` of the new user `usr_adm_cli`
        2. Fill `AWS Secret Access Key` with the `Secret access key` of the new user `usr_adm_cli`
        3. Fill `Default region name` with the default location :  `eu-west-1`
        4. Fill `Default output format` with the default output format `json`


4. Check the AWS CLI configuration
    1. Execute the commande `aws s3api list-buckets`
    2. Result :
```json
{
    "Buckets": [
        {...}
    ]
}
```



## Connection management for the Databricks CLI tool


1. Install the tool `Databricks CLI` with `pip` (requires python3)
    1. Execute the command : `pip install databricks-cli`
    2. Check the result with the command : `databricks --version` (Result : `Version 0.17.6`)

2. Create a Databricks Token
    1. Go to your Databricks workspace
    2. Click on your user and click on `User Settings`
    3. Click on `Access tokens`
    4. Click on `Generate new token`
    5. Fill the comment and define the token life time
    6. Click on `Generate`
    7. Copy the Databricks Token to be able to use it with Databricks CLI

3. Configure Databricks CLI
    1. Execute the command : `databricks configure --token`
    2. Fill the `Databricks Host (should begin with https://):` with your workspace url : `https://dbc-0a000411-23e7.cloud.databricks.com`
    3. Fill the `Access Token` with the Databricks Token created : `dapi2c0000aa000a0r0a00e000000000000`

You can see your credential with the command`cat ~/.databrickscfg`