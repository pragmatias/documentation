---
Categories : ["Spark"]
Tags : ["Spark"]
title : "Spark : v4.x - Fonctionnalités - Pris en charge de la collation (SQL)"
date : 2026-03-10
draft : false
toc: true
---


Vous trouverez dans cet article, des informations sur la fonctionnalité de prise en charge de la collation SQL des chaînes de caractères à partir de [Spark v4.x](https://spark.apache.org/releases/spark-release-4-0-0.html).

<!--more-->

# Introduction

La collation (SQL) contrôle la manière dont Spark compare et trie les chaîne de caractères. Spark 4.0 introduit la définition explicite de la collation, permettant le tri linguistique (par exemple, le ä allemand trié près du a) et les opérations insensibles à la casse sans UDF personnalisées. 

Le comportement par défaut reste la comparaison binaire UTF-8 pour la rétrocompatibilité. 

Essentiel pour l'analyse multi localisation, les règles de qualité des données et les migrations depuis les bases de données traditionnelles. Cela ajoute une surcharge de planification des requêtes et peut causer une régression de performance sur les opérations de chaînes très volumineuses. 

# Détail

La collation définit les règles de comparaison des valeurs de chaînes de caractères. Les bases de données traditionnelles prennent en charge la collation spécifique aux paramètres régionaux (par exemple, `en_CI` ou `de_AI`) qui gèrent les règles de tri spécifiques aux langues et la sensibilité à la casse. Avant Spark 4.0, toutes les opérations sur les chaînes utilisaient la comparaison binaire UTF-8 : une correspondance octet par octet sans prise en compte linguistique.

La collation binaire UTF-8 trie selon les valeurs des points de code Unicode. Cela signifie que `'Z' (U+005A)` est trié avant `'a' (U+0061)` car les lettres majuscules ont des points de code inférieurs. Les caractères accentués sont triés à la fin de l'alphabet plutôt que près de leurs lettres de base. Les opérations insensibles à la casse nécessitaient des appels à la fonction `lower()`, qui créent de nouvelles chaînes et augmentent l'utilisation de la mémoire.

Spark 4.0 ajoute la clause `COLLATE` et la configuration` spark.sql.session.collation.enabled`. il est désormais possible de spécifier la collation au niveau de la définition d'une colonne, d'une expression ou de la session Spark. L'implémentation s'appuie sur la [librairie ICU (International Components for Unicode)](https://icu.unicode.org/) pour les règles linguistiques.

Trois familles principales de classement existent dans Spark 4.0 :
- **UTF8_BINARY** : Comparaison octet par octet par défaut (rétrocompatible)
- **UTF8_LCASE** : Comparaison UTF-8 insensible à la casse (cas d'usage le plus courant)
- **UNICODE** : Classement linguistique avec règles spécifiques aux paramètres régionaux (par exemple, `*de.*` pour l'allemand)

Le système de collation s'intègre avec l'optimiseur Catalyst. Spark analyse les exigences de la collation lors de la planification des requêtes et applique la logique de comparaison appropriée. Cela ajoute une surcharge de planification mais permet l'exécution vectorisée pour les opérations tenant compte de la collation plutôt que de revenir à un traitement ligne par ligne.



**Collations clés** :
Pour avoir la liste des collations disponibles : `SELECT * FROM collations();`

| Identifier    | Description                                             |
| ------------- | ------------------------------------------------------- |
| `UTF8_BINARY` | Défaut historique. Comparaison binaire octet par octet. |
| `UTF8_LCASE`  | Insensible à la casse, sensible aux accents.            |
| `*_CI_*`      | Insensible à la casse.                                  |
| `*_CS_*`      | Sensible à la casse.                                    |
| `*_AI_*`      | Insensible aux accents.                                 |
| `*_AS_*`      | Sensible aux accents.                                   |
| `*fr.*`       | Ordre linguistique français.                            |
| `*en.*`       | Ordre linguistique américain.                           |
| `*de.*`       | Ordre linguistique allemand.                            |


**Fonctions SQL pour la collation** :
- [Collate](https://spark.apache.org/docs/latest/api/sql/index.html#collate) : Marque une expression donnée avec la collation spécifiée.
- [Collation](https://spark.apache.org/docs/latest/api/sql/index.html#collation) : Renvoie le nom de la collation d'une expression donnée.
- [Collations](https://spark.apache.org/docs/latest/api/sql/index.html#collations) : Récupère toutes les collations de type String pour Spark SQL.





# Avantages

1. **Prise en charge de l'internationalisation** : Les applications utilisées pour plusieurs régions peuvent appliquer un tri spécifique aux paramètres régionaux. Cela améliore la qualité des données pour les rapports destinés aux clients et pour la conformité réglementaire.
2. **Simplification du code** : Élimine les UDFs personnalisées pour les opérations insensibles à la casse. Avec la collation `UTF8_LCASE`, la comparaison se fait directement sans appliquer la fonction `lower(col)`.
3. **Compatibilité avec la migration de bases de données** : Alignement avec le comportement des bases de données traditionnelles (PostgreSQL, MySQL, SQL Server, ...) qui supportent les collations depuis longtemps. Les équipes migrant depuis ces systèmes peuvent désormais préserver la sémantique de la collation sans réécrire les requêtes. (Cela réduit les risques de migration et la charge de tests.)

# Limitations

1. **Surcharge de performance sur les classements non binaires** : La collation linguistique nécessite des appels à la [librairie ICU](https://unicode-org.github.io/icu/userguide/collation/) qui sont plus lents que la comparaison binaire. La surcharge augmente avec la longueur des chaînes et la complexité des règles de collation.
2. **Restrictions de mélange de classements** : Spark interdit les opérations entre colonnes avec des collations différentes sans conversion explicite `COLLATE`. Cela casse les requêtes existantes qui comparent implicitement des colonnes de chaînes si les collations diffèrent. Les jointures entre différentes collations nécessitent une conversion explicite, ce qui peut déclencher un re-shuffling des données.
3. **Support très limité des familles de classement** : Spark 4 a un support limité, vous devez vérifier si votre classement est géré par votre version de Spark. Avec Spark 4.0.1, seul UTF8 est supporté avec des collations spécifiques aux paramètres régionaux sélectionnés
4. **Support limité des fonctionnalités de classement** : Toutes les collations ne sont pas supportées pour les colonnes partitionnées et il n'y a pas d'inférence de collation à partir des sources de données (Vous devez spécifier manuellement la collation dans la définition des objets Spark).

> **Quand ne pas utiliser le classement** :
> * Pour les jointures critiques en termes de performance.
> * Pour les clés de partition.


# Cas d'usages (concret)

- **Cas d'usage 1 : Rapprochement de clients dans une institution financière**
    - Une banque fusionne les enregistrements de clients provenant d'institutions acquises. Les noms de clients contiennent des caractères accentués (José, François, Müller). La logique de déduplication doit faire correspondre "Mueller" avec "Müller" selon les règles de classement allemandes. Le classement `de_AI` fournit une équivalence linguistique sans fonctions personnalisées.
- **Cas d'usage 2 : Catalogue de produits e-commerce avec tri spécifique aux paramètres régionaux**
    - Un détaillant international affiche des listes de produits triées alphabétiquement par nom. Les clients espagnols s'attendent à ce que "ñ" soit trié entre "n" et "o", tandis que le tri binaire UTF-8 par défaut le place à la fin. Des classements différents par région permettent un ordre de tri correct sans maintenir des ensembles de données séparés.

# Codes

## Exemple 1 : Rapprochement d'utilisateurs avec la collation UTF8_LCASE

Cet exemple illustre le rapprochement d'enregistrements d'utilisateurs où les adresses e-mail peuvent avoir une capitalisation incohérente. Il s'agit d'un scénario courant dans les pipelines de qualité de données fusionnant des enregistrements provenant de plusieurs systèmes sources.

### Spark

```python
# PySpark Example - Case-Insensitive User Matching
from pyspark.sql import SparkSession
from pyspark.sql.functions import col

URL_MASTER = "spark://spark-master:7077"


# Initialize Spark with collation support enabled
# spark.sql.session.collation.enabled must be true (default in 4.0+)
# spark.sql.collation.defaultCollation sets session-wide default
spark = SparkSession.builder \
    .appName("SparkCollationCaseInsensitive_1") \
    .config("spark.sql.session.collation.enabled", "true") \
    .config("spark.sql.collation.defaultCollation", "UTF8_BINARY") \
    .master(URL_MASTER) \
    .getOrCreate()

print("""
##########################
##### Build Datasets #####
##########################
""")

# Source system 1: Customer records from CRM
# Emails stored with original capitalization from user input
crm_customers = [
    ("C001", "Alice.Smith@company.com", "Alice Smith", "2021-01-15"),
    ("C002", "bob.jones@enterprise.net", "Bob Jones", "2025-02-20"),
    ("C003", "Carol.WHITE@startup.io", "Carol White", "2024-03-10"),
    ("C004", "david.brown@tech.com", "David Brown", "2024-04-05"),
    ("C005", "Eve.DAVIS@innovation.com", "Eve Davis", "2025-05-12"),
]

# Source system 2: Transaction records from payment processor
# Emails normalized to lowercase by payment gateway
transaction_emails = [
    ("T001", "alice.smith@company.com", 450.00, "2026-01-10"),
    ("T002", "bob.jones@enterprise.net", 1200.00, "2026-01-15"),
    ("T003", "carol.white@startup.io", 300.00, "2026-01-20"),
    ("T004", "DAVID.BROWN@tech.com", 890.00, "2026-01-25"),
    ("T005", "eve.davis@innovation.com", 550.00, "2026-02-01"),
    ("T006", "frank.miller@unknown.com", 200.00, "2026-02-05"),
]


# Create DataFrames without collation (default UTF8_BINARY)
crm_df = spark.createDataFrame(crm_customers,["customer_id", "email", "full_name", "registration_date"])
print(f"crm_customers dataset: {crm_df.count()}")  
crm_df.show(truncate=False)

transactions_df = spark.createDataFrame(transaction_emails,["transaction_id", "email", "amount", "transaction_date"])
print(f"transaction_emails dataset: {transactions_df.count()}")  
transactions_df.show(truncate=False)


# Register DataFrames as temporary views for SQL access
crm_df.createOrReplaceTempView("crm_customers")
transactions_df.createOrReplaceTempView("transactions")


print("""
###################################
##### 1. Standard binary join #####
###################################
""")

# Standard binary join - will MISS matches due to case differences
print("=== Binary Collation Join (Default Behavior) ===")
binary_join = crm_df.join(transactions_df,crm_df.email == transactions_df.email,"inner") \
                    .select(
                            crm_df.customer_id,
                            crm_df.full_name,
                            crm_df.email.alias("crm_email"),
                            transactions_df.email.alias("txn_email"),
                            transactions_df.amount
                    )
print(f"Matched records: {binary_join.count()}")  # Will show only 2 matches
binary_join.show(truncate=False)



print("""
##############################################################
##### 2. Case-Insensitive Join with UTF8_LCASE Collation #####
##############################################################
""")
# Apply collation at expression level using SQL COLLATE syntax

# SQL approach: Apply collation in WHERE clause
case_insensitive_sql = spark.sql("""
    SELECT 
        c.customer_id,
        c.full_name,
        c.email as crm_email,
        t.email as txn_email,
        t.amount,
        t.transaction_date
    FROM crm_customers c
    INNER JOIN transactions t
        ON c.email COLLATE UTF8_LCASE = t.email COLLATE UTF8_LCASE
    ORDER BY c.customer_id
""")

print(f"Matched records: {case_insensitive_sql.count()}")  # Will show 5 matches
case_insensitive_sql.show(truncate=False)




print("""
##########################################
##### 3. Collation Defined in Schema #####
##########################################
""")
#Define collation at table level

spark.sql("""
    CREATE OR REPLACE TEMPORARY VIEW crm_customers_collated AS
    SELECT 
        customer_id,
        email COLLATE UTF8_LCASE as email,
        full_name,
        registration_date
    FROM crm_customers
""")

spark.sql("""
    CREATE OR REPLACE TEMPORARY VIEW transactions_collated AS
    SELECT 
        transaction_id,
        email COLLATE UTF8_LCASE as email,
        amount,
        transaction_date
    FROM transactions
""")

# join without explicit COLLATE - collation is inherited from schema
schema_collation_join = spark.sql("""
    SELECT 
        c.customer_id,
        c.full_name,
        c.email as crm_email,
        t.email as txn_email,
        t.amount,
        t.transaction_date
    FROM crm_customers_collated c
    INNER JOIN transactions_collated t ON c.email = t.email
    ORDER BY c.customer_id
""")

print(f"Matched records: {schema_collation_join.count()}")  # Shows 5 matches
schema_collation_join.show(truncate=False)



print("""
############################################
##### 4. Collation metadata inspection #####
############################################
""")

print("crm_customers_collated schema :")
print(spark.sql("SELECT email FROM crm_customers_collated").schema)

# Performance comparison: Show that collation join avoids string transformation
# Binary case-insensitive requires LOWER() which allocates new strings
lower_join = spark.sql("""
    SELECT 
        c.customer_id,
        c.full_name,
        COUNT(*) as match_count
    FROM crm_customers c
    INNER JOIN transactions t
        ON LOWER(c.email) = LOWER(t.email)
    GROUP BY c.customer_id, c.full_name
""")

print("\n########## Lower() Function Approach (before Spark 4.x) ##########")
lower_join.explain("formatted")  # Shows Project with lower() function calls
print(lower_join.collect())

print("\n########## Collation Function Approach (Spark 4.x) ##########")
case_insensitive_sql.explain("formatted")  # Shows no function transformation

print("\n########## Collation Column Approach (Spark 4.x) ##########")
schema_collation_join.explain("formatted")  # Shows no function transformation

spark.stop()
```

### Résultat

```text

##########################
##### Build Datasets #####
##########################

crm_customers dataset: 5
+-----------+------------------------+-----------+-----------------+
|customer_id|email                   |full_name  |registration_date|
+-----------+------------------------+-----------+-----------------+
|C001       |Alice.Smith@company.com |Alice Smith|2021-01-15       |
|C002       |bob.jones@enterprise.net|Bob Jones  |2025-02-20       |
|C003       |Carol.WHITE@startup.io  |Carol White|2024-03-10       |
|C004       |david.brown@tech.com    |David Brown|2024-04-05       |
|C005       |Eve.DAVIS@innovation.com|Eve Davis  |2025-05-12       |
+-----------+------------------------+-----------+-----------------+

transaction_emails dataset: 6
+--------------+------------------------+------+----------------+
|transaction_id|email                   |amount|transaction_date|
+--------------+------------------------+------+----------------+
|T001          |alice.smith@company.com |450.0 |2026-01-10      |
|T002          |bob.jones@enterprise.net|1200.0|2026-01-15      |
|T003          |carol.white@startup.io  |300.0 |2026-01-20      |
|T004          |DAVID.BROWN@tech.com    |890.0 |2026-01-25      |
|T005          |eve.davis@innovation.com|550.0 |2026-02-01      |
|T006          |frank.miller@unknown.com|200.0 |2026-02-05      |
+--------------+------------------------+------+----------------+


###################################
##### 1. Standard binary join #####
###################################

=== Binary Collation Join (Default Behavior) ===
Matched records: 1
+-----------+---------+------------------------+------------------------+------+
|customer_id|full_name|crm_email               |txn_email               |amount|
+-----------+---------+------------------------+------------------------+------+
|C002       |Bob Jones|bob.jones@enterprise.net|bob.jones@enterprise.net|1200.0|
+-----------+---------+------------------------+------------------------+------+


##############################################################
##### 2. Case-Insensitive Join with UTF8_LCASE Collation #####
##############################################################

Matched records: 5
+-----------+-----------+------------------------+------------------------+------+----------------+
|customer_id|full_name  |crm_email               |txn_email               |amount|transaction_date|
+-----------+-----------+------------------------+------------------------+------+----------------+
|C001       |Alice Smith|Alice.Smith@company.com |alice.smith@company.com |450.0 |2026-01-10      |
|C002       |Bob Jones  |bob.jones@enterprise.net|bob.jones@enterprise.net|1200.0|2026-01-15      |
|C003       |Carol White|Carol.WHITE@startup.io  |carol.white@startup.io  |300.0 |2026-01-20      |
|C004       |David Brown|david.brown@tech.com    |DAVID.BROWN@tech.com    |890.0 |2026-01-25      |
|C005       |Eve Davis  |Eve.DAVIS@innovation.com|eve.davis@innovation.com|550.0 |2026-02-01      |
+-----------+-----------+------------------------+------------------------+------+----------------+


##########################################
##### 3. Collation Defined in Schema #####
##########################################

Matched records: 5
+-----------+-----------+------------------------+------------------------+------+----------------+
|customer_id|full_name  |crm_email               |txn_email               |amount|transaction_date|
+-----------+-----------+------------------------+------------------------+------+----------------+
|C001       |Alice Smith|Alice.Smith@company.com |alice.smith@company.com |450.0 |2026-01-10      |
|C002       |Bob Jones  |bob.jones@enterprise.net|bob.jones@enterprise.net|1200.0|2026-01-15      |
|C003       |Carol White|Carol.WHITE@startup.io  |carol.white@startup.io  |300.0 |2026-01-20      |
|C004       |David Brown|david.brown@tech.com    |DAVID.BROWN@tech.com    |890.0 |2026-01-25      |
|C005       |Eve Davis  |Eve.DAVIS@innovation.com|eve.davis@innovation.com|550.0 |2026-02-01      |
+-----------+-----------+------------------------+------------------------+------+----------------+


############################################
##### 4. Collation metadata inspection #####
############################################

crm_customers_collated schema :
StructType([StructField('email', StringType('UTF8_LCASE'), True)])

########## Lower() Function Approach (before Spark 4.x) ##########
== Physical Plan ==
AdaptiveSparkPlan (16)
+- HashAggregate (15)
   +- Exchange (14)
      +- HashAggregate (13)
         +- Project (12)
            +- SortMergeJoin Inner (11)
               :- Sort (5)
               :  +- Exchange (4)
               :     +- Project (3)
               :        +- Filter (2)
               :           +- Scan ExistingRDD (1)
               +- Sort (10)
                  +- Exchange (9)
                     +- Project (8)
                        +- Filter (7)
                           +- Scan ExistingRDD (6)


(1) Scan ExistingRDD
Output [4]: [customer_id#0, email#1, full_name#2, registration_date#3]
Arguments: [customer_id#0, email#1, full_name#2, registration_date#3], MapPartitionsRDD[4] at applySchemaToPythonRDD at NativeMethodAccessorImpl.java:0, ExistingRDD, UnknownPartitioning(0)

(2) Filter
Input [4]: [customer_id#0, email#1, full_name#2, registration_date#3]
Condition : isnotnull(email#1)

(3) Project
Output [3]: [customer_id#0, email#1, full_name#2]
Input [4]: [customer_id#0, email#1, full_name#2, registration_date#3]

(4) Exchange
Input [3]: [customer_id#0, email#1, full_name#2]
Arguments: hashpartitioning(lower(email#1), 200), ENSURE_REQUIREMENTS, [plan_id=1080]

(5) Sort
Input [3]: [customer_id#0, email#1, full_name#2]
Arguments: [lower(email#1) ASC NULLS FIRST], false, 0

(6) Scan ExistingRDD
Output [4]: [transaction_id#25, email#26, amount#27, transaction_date#28]
Arguments: [transaction_id#25, email#26, amount#27, transaction_date#28], MapPartitionsRDD[16] at applySchemaToPythonRDD at NativeMethodAccessorImpl.java:0, ExistingRDD, UnknownPartitioning(0)

(7) Filter
Input [4]: [transaction_id#25, email#26, amount#27, transaction_date#28]
Condition : isnotnull(email#26)

(8) Project
Output [1]: [email#26]
Input [4]: [transaction_id#25, email#26, amount#27, transaction_date#28]

(9) Exchange
Input [1]: [email#26]
Arguments: hashpartitioning(lower(email#26), 200), ENSURE_REQUIREMENTS, [plan_id=1081]

(10) Sort
Input [1]: [email#26]
Arguments: [lower(email#26) ASC NULLS FIRST], false, 0

(11) SortMergeJoin
Left keys [1]: [lower(email#1)]
Right keys [1]: [lower(email#26)]
Join type: Inner
Join condition: None

(12) Project
Output [2]: [customer_id#0, full_name#2]
Input [4]: [customer_id#0, email#1, full_name#2, email#26]

(13) HashAggregate
Input [2]: [customer_id#0, full_name#2]
Keys [2]: [customer_id#0, full_name#2]
Functions [1]: [partial_count(1)]
Aggregate Attributes [1]: [count#158L]
Results [3]: [customer_id#0, full_name#2, count#159L]

(14) Exchange
Input [3]: [customer_id#0, full_name#2, count#159L]
Arguments: hashpartitioning(customer_id#0, full_name#2, 200), ENSURE_REQUIREMENTS, [plan_id=1088]

(15) HashAggregate
Input [3]: [customer_id#0, full_name#2, count#159L]
Keys [2]: [customer_id#0, full_name#2]
Functions [1]: [count(1)]
Aggregate Attributes [1]: [count(1)#157L]
Results [3]: [customer_id#0, full_name#2, count(1)#157L AS match_count#156L]

(16) AdaptiveSparkPlan
Output [3]: [customer_id#0, full_name#2, match_count#156L]
Arguments: isFinalPlan=false


[Row(customer_id='C002', full_name='Bob Jones', match_count=1), Row(customer_id='C001', full_name='Alice Smith', match_count=1), Row(customer_id='C005', full_name='Eve Davis', match_count=1), Row(customer_id='C004', full_name='David Brown', match_count=1), Row(customer_id='C003', full_name='Carol White', match_count=1)]

########## Collation Function Approach (Spark 4.x) ##########
== Physical Plan ==
AdaptiveSparkPlan (13)
+- Sort (12)
   +- Exchange (11)
      +- Project (10)
         +- SortMergeJoin Inner (9)
            :- Sort (4)
            :  +- Exchange (3)
            :     +- Project (2)
            :        +- Scan ExistingRDD (1)
            +- Sort (8)
               +- Exchange (7)
                  +- Project (6)
                     +- Scan ExistingRDD (5)


(1) Scan ExistingRDD
Output [4]: [customer_id#0, email#1, full_name#2, registration_date#3]
Arguments: [customer_id#0, email#1, full_name#2, registration_date#3], MapPartitionsRDD[4] at applySchemaToPythonRDD at NativeMethodAccessorImpl.java:0, ExistingRDD, UnknownPartitioning(0)

(2) Project
Output [3]: [customer_id#0, email#1, full_name#2]
Input [4]: [customer_id#0, email#1, full_name#2, registration_date#3]

(3) Exchange
Input [3]: [customer_id#0, email#1, full_name#2]
Arguments: hashpartitioning(collate(email#1, UTF8_LCASE), 200), ENSURE_REQUIREMENTS, [plan_id=1275]

(4) Sort
Input [3]: [customer_id#0, email#1, full_name#2]
Arguments: [collate(email#1, UTF8_LCASE) ASC NULLS FIRST], false, 0

(5) Scan ExistingRDD
Output [4]: [transaction_id#25, email#26, amount#27, transaction_date#28]
Arguments: [transaction_id#25, email#26, amount#27, transaction_date#28], MapPartitionsRDD[16] at applySchemaToPythonRDD at NativeMethodAccessorImpl.java:0, ExistingRDD, UnknownPartitioning(0)

(6) Project
Output [3]: [email#26, amount#27, transaction_date#28]
Input [4]: [transaction_id#25, email#26, amount#27, transaction_date#28]

(7) Exchange
Input [3]: [email#26, amount#27, transaction_date#28]
Arguments: hashpartitioning(collate(email#26, UTF8_LCASE), 200), ENSURE_REQUIREMENTS, [plan_id=1276]

(8) Sort
Input [3]: [email#26, amount#27, transaction_date#28]
Arguments: [collate(email#26, UTF8_LCASE) ASC NULLS FIRST], false, 0

(9) SortMergeJoin
Left keys [1]: [collate(email#1, UTF8_LCASE)]
Right keys [1]: [collate(email#26, UTF8_LCASE)]
Join type: Inner
Join condition: None

(10) Project
Output [6]: [customer_id#0, full_name#2, email#1 AS crm_email#77, email#26 AS txn_email#78, amount#27, transaction_date#28]
Input [6]: [customer_id#0, email#1, full_name#2, email#26, amount#27, transaction_date#28]

(11) Exchange
Input [6]: [customer_id#0, full_name#2, crm_email#77, txn_email#78, amount#27, transaction_date#28]
Arguments: rangepartitioning(customer_id#0 ASC NULLS FIRST, 200), ENSURE_REQUIREMENTS, [plan_id=1282]

(12) Sort
Input [6]: [customer_id#0, full_name#2, crm_email#77, txn_email#78, amount#27, transaction_date#28]
Arguments: [customer_id#0 ASC NULLS FIRST], true, 0

(13) AdaptiveSparkPlan
Output [6]: [customer_id#0, full_name#2, crm_email#77, txn_email#78, amount#27, transaction_date#28]
Arguments: isFinalPlan=false



########## Collation Column Approach (Spark 4.x) ##########
== Physical Plan ==
AdaptiveSparkPlan (13)
+- Sort (12)
   +- Exchange (11)
      +- Project (10)
         +- SortMergeJoin Inner (9)
            :- Sort (4)
            :  +- Exchange (3)
            :     +- Project (2)
            :        +- Scan ExistingRDD (1)
            +- Sort (8)
               +- Exchange (7)
                  +- Project (6)
                     +- Scan ExistingRDD (5)


(1) Scan ExistingRDD
Output [4]: [customer_id#0, email#1, full_name#2, registration_date#3]
Arguments: [customer_id#0, email#1, full_name#2, registration_date#3], MapPartitionsRDD[4] at applySchemaToPythonRDD at NativeMethodAccessorImpl.java:0, ExistingRDD, UnknownPartitioning(0)

(2) Project
Output [3]: [customer_id#0, collate(email#1, UTF8_LCASE) AS email#114, full_name#2]
Input [4]: [customer_id#0, email#1, full_name#2, registration_date#3]

(3) Exchange
Input [3]: [customer_id#0, email#114, full_name#2]
Arguments: hashpartitioning(collationkey(email#114), 200), ENSURE_REQUIREMENTS, [plan_id=1313]

(4) Sort
Input [3]: [customer_id#0, email#114, full_name#2]
Arguments: [collationkey(email#114) ASC NULLS FIRST], false, 0

(5) Scan ExistingRDD
Output [4]: [transaction_id#25, email#26, amount#27, transaction_date#28]
Arguments: [transaction_id#25, email#26, amount#27, transaction_date#28], MapPartitionsRDD[16] at applySchemaToPythonRDD at NativeMethodAccessorImpl.java:0, ExistingRDD, UnknownPartitioning(0)

(6) Project
Output [3]: [collate(email#26, UTF8_LCASE) AS email#119, amount#27, transaction_date#28]
Input [4]: [transaction_id#25, email#26, amount#27, transaction_date#28]

(7) Exchange
Input [3]: [email#119, amount#27, transaction_date#28]
Arguments: hashpartitioning(collationkey(email#119), 200), ENSURE_REQUIREMENTS, [plan_id=1314]

(8) Sort
Input [3]: [email#119, amount#27, transaction_date#28]
Arguments: [collationkey(email#119) ASC NULLS FIRST], false, 0

(9) SortMergeJoin
Left keys [1]: [collationkey(email#114)]
Right keys [1]: [collationkey(email#119)]
Join type: Inner
Join condition: None

(10) Project
Output [6]: [customer_id#0, full_name#2, email#114 AS crm_email#110, email#119 AS txn_email#111, amount#27, transaction_date#28]
Input [6]: [customer_id#0, email#114, full_name#2, email#119, amount#27, transaction_date#28]

(11) Exchange
Input [6]: [customer_id#0, full_name#2, crm_email#110, txn_email#111, amount#27, transaction_date#28]
Arguments: rangepartitioning(customer_id#0 ASC NULLS FIRST, 200), ENSURE_REQUIREMENTS, [plan_id=1320]

(12) Sort
Input [6]: [customer_id#0, full_name#2, crm_email#110, txn_email#111, amount#27, transaction_date#28]
Arguments: [customer_id#0 ASC NULLS FIRST], true, 0

(13) AdaptiveSparkPlan
Output [6]: [customer_id#0, full_name#2, crm_email#110, txn_email#111, amount#27, transaction_date#28]
Arguments: isFinalPlan=false


```





## Exemple 2 : Tri linguistique pour les noms internationaux (allemand)

Cet exemple illustre la collation spécifique aux paramètres régionaux pour le tri des noms de clients. Il montre la différence entre le tri binaire UTF-8 et les règles linguistiques allemandes.

### Spark

```python
# PySpark Example - Locale Collation Sorting
from pyspark.sql import SparkSession
from pyspark.sql.functions import col

URL_MASTER = "spark://spark-master:7077"


# Initialize Spark with collation support enabled
# spark.sql.session.collation.enabled must be true (default in 4.0+)
# spark.sql.collation.defaultCollation sets session-wide default
spark = SparkSession.builder \
    .appName("SparkCollationCaseInsensitive_1") \
    .config("spark.sql.session.collation.enabled", "true") \
    .config("spark.sql.collation.defaultCollation", "UTF8_BINARY") \
    .master(URL_MASTER) \
    .getOrCreate()

print("""
##########################
##### Build Datasets #####
##########################
""")

# Source system 1: German client from a Legacy CRM
german_customers = [
    ("D001", "Müller", "Hans", "Munich", "2024-01-10"),
    ("D002", "Mueller", "Anna", "Berlin", "2024-01-15"),
    ("D003", "Möbius", "Klaus", "Hamburg", "2024-01-22"),
    ("D004", "Moeller", "Sophie", "Frankfurt", "2024-01-28"),
    ("D007", "Äpfel", "Johann", "Dresden", "2024-02-12"),
    ("D008", "Apfel", "Lisa", "Leipzig", "2024-03-15"),
]


# Create DataFrames without collation (default UTF8_BINARY)
german_df = spark.createDataFrame(german_customers,["customer_id", "last_name", "first_name", "city", "registration_date"])
print(f"german_customers dataset: {german_df.count()}")  
german_df.show(truncate=False)

# Register DataFrames as temporary views for SQL access
german_df.createOrReplaceTempView("german_customers")


print("""
##################################################################
##### 1. Binary UTF-8 Sorting (Default Spark < 4.0 behavior) #####
##################################################################
""")
# Sorts by Unicode code point values, not linguistic rules")

binary_sort = spark.sql("""
    SELECT 
        customer_id,
        last_name,
        first_name,
        city
    FROM german_customers
    ORDER BY last_name
""")

# Result: Apfel, Moeller, Mueller, Möbius, Müller, Äpfel
binary_sort.show(truncate=False)



print("""
#####################################################
##### 2. German Linguistic Sorting (de_AI) #####
#####################################################
""")

# Sorts according to German dictionary rules (de_AI)
german_sort = spark.sql("""
    SELECT 
        customer_id,
        last_name,
        first_name,
        city
    FROM german_customers
    ORDER BY last_name COLLATE de_AI
""")

# Result: Apfel, Äpfel, Möbius, Moeller, Mueller, Müller
german_sort.show(truncate=False)


print("""
###################################################
##### 3. Linguistic Search (Finding ü with u) #####
###################################################
""")

# Binary search: exact match only
binary_search = spark.sql("""
    SELECT *
    FROM german_customers
    WHERE last_name COLLATE UTF8_BINARY = 'Muller'
""")
print("Searching for 'Muller' with binary collation:")
print(f"Matched records: {binary_search.count()}")  # Result: 0 match
binary_search.show(truncate=False) 

# German linguistic search: ü and ue are equivalent
german_search = spark.sql("""
    SELECT *
    FROM german_customers  
    WHERE last_name COLLATE de_AI = 'Muller'
""")
print("Searching for 'Muller' with 'de' collation:")
print(f"Matched records: {german_search.count()}")  # Result: 1 match
german_search.show(truncate=False)

spark.stop()

```


### Result 

```text
##########################
##### Build Datasets #####
##########################

german_customers dataset: 6
+-----------+---------+----------+---------+-----------------+
|customer_id|last_name|first_name|city     |registration_date|
+-----------+---------+----------+---------+-----------------+
|D001       |Müller   |Hans      |Munich   |2024-01-10       |
|D002       |Mueller  |Anna      |Berlin   |2024-01-15       |
|D003       |Möbius   |Klaus     |Hamburg  |2024-01-22       |
|D004       |Moeller  |Sophie    |Frankfurt|2024-01-28       |
|D007       |Äpfel    |Johann    |Dresden  |2024-02-12       |
|D008       |Apfel    |Lisa      |Leipzig  |2024-03-15       |
+-----------+---------+----------+---------+-----------------+


##################################################################
##### 1. Binary UTF-8 Sorting (Default Spark < 4.0 behavior) #####
##################################################################

+-----------+---------+----------+---------+
|customer_id|last_name|first_name|city     |
+-----------+---------+----------+---------+
|D008       |Apfel    |Lisa      |Leipzig  |
|D004       |Moeller  |Sophie    |Frankfurt|
|D002       |Mueller  |Anna      |Berlin   |
|D003       |Möbius   |Klaus     |Hamburg  |
|D001       |Müller   |Hans      |Munich   |
|D007       |Äpfel    |Johann    |Dresden  |
+-----------+---------+----------+---------+


#####################################################
##### 2. German Linguistic Sorting (de_AI) #####
#####################################################

+-----------+---------+----------+---------+
|customer_id|last_name|first_name|city     |
+-----------+---------+----------+---------+
|D007       |Äpfel    |Johann    |Dresden  |
|D008       |Apfel    |Lisa      |Leipzig  |
|D003       |Möbius   |Klaus     |Hamburg  |
|D004       |Moeller  |Sophie    |Frankfurt|
|D002       |Mueller  |Anna      |Berlin   |
|D001       |Müller   |Hans      |Munich   |
+-----------+---------+----------+---------+


###################################################
##### 3. Linguistic Search (Finding ü with u) #####
###################################################

Searching for 'Muller' with binary collation:
Matched records: 0
+-----------+---------+----------+----+-----------------+
|customer_id|last_name|first_name|city|registration_date|
+-----------+---------+----------+----+-----------------+
+-----------+---------+----------+----+-----------------+

Searching for 'Muller' with 'de' collation:
Matched records: 1
+-----------+---------+----------+------+-----------------+
|customer_id|last_name|first_name|city  |registration_date|
+-----------+---------+----------+------+-----------------+
|D001       |Müller   |Hans      |Munich|2024-01-10       |
+-----------+---------+----------+------+-----------------+



```


