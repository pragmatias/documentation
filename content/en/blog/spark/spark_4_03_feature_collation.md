---
Categories : ["Spark"]
Tags : ["Spark"]
title : "Spark : v4.x - Features - SQL Collation Support"
date : 2026-03-10
draft : false
toc: true
---

You'll find in this article, some informations about the string SQL collation support feature from [Spark v4.x](https://spark.apache.org/releases/spark-release-4-0-0.html).

<!--more-->

# Introduction

Collation controls how Spark compares and sorts string data. Spark 4.0 introduces explicit collation specification, enabling linguistic sorting and case-insensitive operations without custom UDFs. 

Default behavior remains UTF-8 binary comparison for backward compatibility. 

Critical for multi-locale analytics, data quality rules, and migrations from traditional databases. Adds query planning overhead and can cause performance regression on large string operations. 

# Detail

Collation defines the rules for comparing string values. Traditional databases support locale-specific collation (e.g., `en_CI` or `de_AI`) that handle language-specific sorting rules and case sensitivity. 
Before Spark 4.0, all string operations used UTF-8 binary comparison: byte-by-byte matching with no linguistic awareness.

UTF-8 binary collation sorts by Unicode code point values. This means 'Z' (U+005A) sorts before 'a' (U+0061) because uppercase letters have lower code points. Accented characters sort at the end of the alphabet rather than near their base letters. Case-insensitive operations required `lower()` function calls, which create new strings and increase memory usage.

Spark 4.0 adds the `COLLATE` clause and the `spark.sql.session.collation.enabled` configuration. You can now specify collation at column definition, expression level, or session default. The implementation leverages [ICU (International Components for Unicode) library](https://icu.unicode.org/) for linguistic rules.

Three primary collation families exist in Spark 4.0:
- **UTF8_BINARY**: Default byte-by-byte comparison (backward compatible)
- **UTF8_LCASE**: Case-insensitive UTF-8 comparison (most common use case)
- **UNICODE**: Linguistic collation with locale-specific rules (e.g., UNICODE_DE for German)

The collation system integrates with the Catalyst optimizer. Spark analyzes collation requirements during query planning and injects appropriate comparison logic. This adds planning overhead but enables vectorized execution for collation-aware operations rather than falling back to row-by-row processing.


**Key Collations** :

| Identifier    | Description                                         |
| ------------- | --------------------------------------------------- |
| `UTF8_BINARY` | Historical default. Byte-by-byte binary comparison. |
| `UTF8_LCASE`  | Case-insensitive, accent-sensitive.                 |
| `*_CI_*`      | Case-insensitive.                                   |
| `*_CS_*`      | Case-sensitive.                                     |
| `*_AI_*`      | Accent-insensitive.                                 |
| `*_AS_*`      | Accent-sensitive.                                   | 
| `*fr.*`       | French linguistic order.                            |
| `*en.*`       | American Linguistic order.                          |
| `*de.*`       | Deutch Linguistic order.                            |


**Collation SQL functions** :
- [Collate](https://spark.apache.org/docs/latest/api/sql/index.html#collate) : Marks a given expression with the specified collation
- [Collation](https://spark.apache.org/docs/latest/api/sql/index.html#collation) : Returns the collation name of a given expression.
- [Collations](https://spark.apache.org/docs/latest/api/sql/index.html#collations) : Get all of the Spark SQL string collations


# Advantages

1. **Internationalization support** : Applications serving multiple regions can apply locale-specific sorting. This improves data quality for customer-facing reports and regulatory compliance.
2. **Code simplification** : Eliminates custom UDFs for case-insensitive operations. With `UTF8_LCASE` collation, comparison happens directly without applying `lower(col)` function. 
3. **Database Migration Compatibility**  : Alignment with traditional database behavior (PostgreSQL, MySQL, SQL Server, ...) that have supported collations for a long time. Teams migrating from these systems can now preserve collation semantics without query rewrites. (This reduces migration risk and testing burden.)


# Limitations

1. **Performance Overhead on Non-Binary Collations** : Linguistic collation requires [ICU library](https://unicode-org.github.io/icu/userguide/collation/) calls that are slower than binary comparison. The overhead increases with string length and complexity of collation rules.
2. **Collation Mixing Restrictions**  : Spark prohibits operations between columns with different collations without explicit `COLLATE` casting. This breaks existing queries that implicitly compare string columns if collations differ. Joins between different collations require an explicit cast, which can trigger re-shuffling.
3. **Very Limited Collation Family Support**  : Spark 4 has limited support, you need to check if your collation is managed by your spark version. With Spark 4.0.1, only UTF8 is supported with selected locale-specific collations.
4. **Limited Collation functionality Support** : Not all collations are supported for partitioned columns and no collation inference from Data Sources (You must manually specify collation in Spark object definition). 

> **When not to use Collation** : 
> * For performance-critical joins.
> * For partition keys.


# Real-World Use Cases

- **Use Case 1 : Financial Institution Customer Matching**  
    - A bank merges customer records from acquired institutions. Customer names contain accented characters (José, François, Müller). Deduplication logic needs to match "Mueller" with "Müller" according to German collation rules. `de_AI` collation provides linguistic equivalence without custom normalization functions.
- **Use Case 2 : E-Commerce Product Catalog with Locale-Specific Sorting** 
    - An international retailer displays product listings sorted alphabetically by name. Spanish customers expect "ñ" to sort between "n" and "o", while default UTF-8 binary sorts it at the end. Different collations per region enable correct sort order without maintaining separate datasets.

# Codes

## Example 1 : Case-Insensitive User Matching with UTF8_LCASE

This example demonstrates user record matching where email addresses may have inconsistent capitalization. Common scenario in data quality pipelines merging records from multiple source systems.

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

### Result

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





## Example 2 : Linguistic Sorting for International Names

This example demonstrates locale-specific collation for customer name sorting. Shows difference between binary UTF-8 sorting and German linguistic rules.

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


