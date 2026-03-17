---
Categories : ["Spark"]
Tags : ["Spark"]
title : "Spark : v4.x - Features - Variant Data Type"
date : 2026-03-17
draft : false
toc: true
---


You'll find in this article, some informations about the [Variant Data Type](https://parquet.apache.org/docs/file-format/types/variantencoding/) from [Spark v4.x](https://spark.apache.org/releases/spark-release-4-0-0.html).

<!--more-->

# Introduction

[The VARIANT data type](https://parquet.apache.org/docs/file-format/types/variantencoding/) stores semi-structured data (JSON, XML, nested objects) without predefined schema. 
It enables `schema-on-read` for heterogeneous data. It stores data in efficient binary format with metadata for type information. It supports path-based access (`variant_col:field.path`) and type casting. 


# Detail

Before Spark 4.0, handling semi-structured data required choosing between three problematic approaches :

1. **Store as `STRING` and Parse at runtime** : Parsing overhead on every query. No type safety. Poor performance. Incompatible with predicate `pushdown`.
2. **Define rigid `STRUCT` schema** : Schema must be known upfront. Schema evolution requires table alterations. `Null` fields waste storage. Heterogeneous data doesn't fit.
3. **Use `MAP<STRING, STRING>`** : Everything is strings. No nested access. Manual type conversion required. Poor query optimizer integration.

Spark 4.0 introduces the VARIANT type. It allows storing semi-structured data in a binary columnar format that preserves type information :

```sql
CREATE TABLE events (
    event_id STRING,
    timestamp TIMESTAMP,
    payload VARIANT
);

INSERT INTO events VALUES (
    'EVT001',
    TIMESTAMP'2024-01-15 10:00:00',
    PARSE_JSON('{"user": {"id": 12345, "name": "Alice"}, "action": "purchase", "amount": 99.99}')
);

SELECT 
    event_id,
    payload:user.name::STRING AS user_name,
    payload:amount::DOUBLE AS amount
FROM events
WHERE payload:action::STRING = 'purchase';
```

The storage format consists of three components :
1. **Value Section**: Actual data stored in compressed binary format. Numbers, strings, booleans stored in native types. Nested structures preserved.
2. **Metadata Section**: Schema information for each value. Type tags indicate whether value is INT, STRING, OBJECT, ARRAY, etc. Enables type-safe extraction without parsing.
3. **Offset Index**: Pointers to nested fields for fast path-based access. Enables `payload:user.name` access in `O(1)` time without scanning entire object.

This design enables several operations :
1. **Path-Based Access** : Extracts nested values without parsing. Syntax (`:`) navigates into structure. Dot notation for nested objects. Bracket notation for arrays: `payload:items[0].price`.
```sql
variant_column:field.nested.path
```

2. **Type Casting** : Double-colon syntax casts variant to specific type. Fails if types incompatible. Use TRY_CAST for safe conversion: `TRY_CAST(variant_column AS INT)`.
```sql
variant_column::INT
variant_column::STRING
```

3. **Type Introspection** : Returns type name. Enables runtime type checking.
```sql
schema_of_variant(variant_column)
```

The Catalyst optimizer support VARIANT operations. Predicate pushdown works for top-level fields. For example, `WHERE payload:status::STRING = 'active'` can skip partitions where the `status` field doesn't match. However, deeply nested predicates may not push down efficiently.

List of functions for manipulating VARIANT data : [SQL Documentation](https://spark.apache.org/docs/latest/api/python/reference/pyspark.sql/functions.html#variant-functions)

## Comparison 

| Criterion             | STRING + JSON   | STRUCT   | VARIANT            |
| --------------------- | --------------- | -------- | ------------------ |
| Fixed schema required | No              | Yes      | No                 |
| Read performance      | Low (re-parsed) | High     | Good (pre-indexed) |
| Write performance     | High            | Good     | Good               |
| Heterogeneous schemas | Yes             | No       | Yes                |
| Filter pushdown       | Limited         | Complete | Partial            |

## Shredding

[Variant Shredding](https://parquet.apache.org/docs/file-format/types/variantshredding/) is a hybrid technique. Instead of storing JSON as a simple character string, Spark analyzes the data and creates:
- Metadata columns for fields that appear frequently (e.g., id, sensor).
- A "remainder" column that contains everything that is too rare or too complex to be broken down.

**This is an important mechanism for** :
- Performance (I/O): If you run a query to access the `$.sensor` information, Spark physically reads only the `shredded` column corresponding to that field. It ignores all the rest of the JSON document.
- Compression: Since the decomposed data is typed (e.g., all IDs are integers), compression algorithms like Snappy or Zstd are much more efficient than on raw text.

The limitation of `shredding` : It does not transform all elements of the Variant into columns. Spark uses a limit (generally on the number of fields or depth) to avoid creating thousands of columns in Parquet.


> **Warning** : `Shredding` only occurs if Spark detects that the data is repetitive enough to be worth extracting into columns. On a small sample, it is possible that Spark decides not to perform `shredding`.


**Demonstration of the storage format** with and without `shredding` (using `duckdb` to check the storage structure) :
```python
from pyspark.sql import SparkSession
from pyspark.sql.types import StructType, StructField, VariantType, IntegerType, StringType
from pyspark.sql.functions import col, parse_json

REP_DATA_FILES = "file:///opt/spark/data/files"
URL_MASTER = "spark://spark-master:7077"
FILE_NAME_NS = "data_variant_ns"
FILE_NAME_SC = "data_variant_sc"


schema = StructType([
    StructField("id", IntegerType(), nullable=False),
    StructField("data_raw", StringType(), nullable=False),
    StructField("data", VariantType(), nullable=True)
])

raw_data_small = [
    (1,'{"sensor": "temp", "value": 22.5, "unit": "C"}',None),
    (2,'{"sensor": "pressure", "value": 1013}',None)
]

raw_data_more = [
    (3,'{"sensor": "temp", "value": 23, "unit": "C"}',None),
    (4,'{"sensor": "pressure", "value": 900}',None),
    (5,'{"sensor": "temp", "value": 23.5, "unit": "C"}',None),
    (6,'{"sensor": "pressure", "value": 1000}',None),
    (7,'{"sensor": "temp", "value": 23.5, "unit": "C"}',None),
    (8,'{"sensor": "pressure", "value": 1000}',None),
    (9,'{"sensor": "temp", "value": 22, "unit": "C"}',None),
    (10,'{"sensor": "pressure", "value": 856}',None)
]

# Spark Instance for Shredding Demo
spark = SparkSession.builder \
    .appName("SPARK_VARIANTModeShredding") \
    .master(URL_MASTER) \
    .getOrCreate()


# Load Dataframe with small dataset
df_variant_ns = spark.createDataFrame(raw_data_small, schema)
# Cast STRING to VARIANT (col : data)
df_variant_ns = df_variant_ns.withColumn("data", parse_json(col("data_raw")))
# Write dataframe into parquet file (no shredding)
df_variant_ns.write.format("parquet").mode("overwrite").save(f"{REP_DATA_FILES}/{FILE_NAME_NS}.parquet")


# Load Dataframe with complete dataset
df_variant_sc = spark.createDataFrame((raw_data_small + raw_data_more), schema)
# Cast STRING to VARIANT (col : data)
df_variant_sc = df_variant_sc.withColumn("data", parse_json(col("data_raw")))
# Write dataframe into parquet file (shredding)
df_variant_sc.write.format("parquet").mode("overwrite").save(f"{REP_DATA_FILES}/{FILE_NAME_SC}.parquet")

spark.stop()
```


**Demonstration results** :

**1/ Regarding the `data_variant_ns.parquet` file**
- This file contains only two rows of data so Spark does not apply `shredding` by default.
- This is confirmed by using the command `duckdb -c "DESCRIBE SELECT * FROM '~/{folder_data}/files/data_variant_ns.parquet/*.parquet';"` which displays the description of the data column type that stores the JSON as VARIANT (which is a STRUCT composed of `metadata` and `value`)

```log
┌─────────────┬─────────────────────────────────────┬─────────┬─────────┬─────────┬─────────┐
│ column_name │             column_type             │  null   │   key   │ default │  extra  │
│   varchar   │               varchar               │ varchar │ varchar │ varchar │ varchar │
├─────────────┼─────────────────────────────────────┼─────────┼─────────┼─────────┼─────────┤
│ id          │ INTEGER                             │ YES     │ NULL    │ NULL    │ NULL    │
│ data_raw    │ VARCHAR                             │ YES     │ NULL    │ NULL    │ NULL    │
│ data        │ STRUCT(metadata BLOB, "value" BLOB) │ YES     │ NULL    │ NULL    │ NULL    │
└─────────────┴─────────────────────────────────────┴─────────┴─────────┴─────────┴─────────┘
```

**2/ Regarding the `data_variant_sc.parquet` file**
- This file contains 10 rows of data and Spark applies `shredding` by default.
- This is confirmed by using the command `duckdb -c "DESCRIBE SELECT * FROM '~/{folder_data}/files/data_variant_sc.parquet/*.parquet';"` which displays the description of the data column type that stores the JSON as VARIANT (which is a STRUCT composed of `metadata` and `value` but this time with the additional `typed_value` information which is the result of `shredding`)
```log
┌─────────────┬────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┬─────────┬─────────┬─────────┬─────────┐
│ column_name │                                                                                                    column_type                                                                                                     │  null   │   key   │ default │  extra  │
│   varchar   │                                                                                                      varchar                                                                                                       │ varchar │ varchar │ varchar │ varchar │
├─────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┼─────────┼─────────┼─────────┼─────────┤
│ id          │ INTEGER                                                                                                                                                                                                            │ YES     │ NULL    │ NULL    │ NULL    │
│ data_raw    │ VARCHAR                                                                                                                                                                                                            │ YES     │ NULL    │ NULL    │ NULL    │
│ data        │ STRUCT(metadata BLOB, "value" BLOB, typed_value STRUCT(sensor STRUCT("value" BLOB, typed_value VARCHAR), unit STRUCT("value" BLOB, typed_value VARCHAR), "value" STRUCT("value" BLOB, typed_value DECIMAL(18,1)))) │ YES     │ NULL    │ NULL    │ NULL    │
└─────────────┴────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┴─────────┴─────────┴─────────┴─────────┘
```



## Advices

- `from_json` requires you to know the schema upfront, whereas `parse_json` preserves the flexibility of the raw data while optimizing it.
- Use `VARIANT` for the landing/raw layer (and exploration) and `STRUCT` for the Gold/Serving layer.


# Advantages

1. **Schema Flexibility** : New fields appear without `ALTER TABLE`. Event payloads evolve over time without breaking queries. Different event types stored in same table. Critical for event sourcing, API integration, and rapid iteration environments.
2. **Better Performance than JSON Strings** : Binary encoding avoids repeated parsing overhead. Shredding and metadata enables direct field access. Eliminates expensive regex or JSON parsing during read operations. Compressed storage reduces I/O.
3. **Partial `Schema-on-read`**  : Query only the fields you need. Unused fields incur no extraction cost. Enables exploratory analysis on unknown schemas. Gradually migrate to typed columns as schema stabilizes.
4. **Interoperability with JSON Systems**  : Direct JSON parsing and serialization. Compatible with REST APIs, message queues, NoSQL exports. 



# Limitations



1. **Performance Slower Than Native Types**  : Aggregations on VARIANT fields are slower than native INT/DECIMAL columns. Type extraction and validation happen at runtime. Path-based access has overhead compared to direct column access. Not suitable for performance-critical analytics on stable schemas.
2. **No Schema Validation**  : Any JSON can be inserted. No constraints on field presence or types. Typos in field names silently return `NULL`. Data quality issues harder to detect. Requires application-level validation.
3. **Limited Optimizer Support**  : Complex nested predicates may not push down to storage. Statistics collection is limited. Join optimization less effective than native types. Query planning cannot leverage schema information for optimization.
4. **Storage Overhead for Simple Data**  : It is slightly heavier than a perfectly optimized `STRUCT` because it must store metadata for each record
5. **Immature Ecosystem**  : Not all Spark functions support VARIANT. BI tools and connectors that read Parquet files directly do not all yet support the native VARIANT format.


> **When not to use Variant** : 
> * Highly structured data
> * Performance-critical operations
> * Partitionned columns


# Real-World Use Cases

- **Use Case 1 : Multi-Source Event Aggregation**  
    - A data platform ingests events from 20+ microservices. Each service has different event schemas that evolve independently. A table with a VARIANT column stores all events without schema coordination. Queries extract service-specific fields as needed. Schema evolution happens without pipeline changes.
- **Use Case 2 : API Response Caching**  
    - A system caches API responses in Spark tables for analysis. API payloads are deeply nested with optional fields. VARIANT stores responses without flattening. Analysis queries extract specific paths. New API versions add fields without breaking existing queries.


# Codes

## Example 1 : Working with Variant Types

> Note: Create an SQL script containing the code and use Spark SQL to execute it : `docker exec -it spark-master spark-sql --master "local[*]" --conf "spark.hadoop.hive.cli.print.header=true"  -f <script.sql> > script.log`
### SQL

```sql
-- SQL Example - Work with variant Type

-- ============================================================================
-- INIT: Create Events Table with VARIANT Column
-- ============================================================================

SELECT '=== Create events table with event dataset ===' as section;

DROP TABLE IF EXISTS events;
CREATE TABLE events (
    event_id STRING,
    timestamp TIMESTAMP,
    event_type STRING,
    payload VARIANT
);

-- Dataset
-- Each event type has different payload structure
INSERT INTO events VALUES
    ('EVT001', TIMESTAMP'2024-01-15 10:00:00', 'user_login',
     PARSE_JSON('{"user_id": 12345, "username": "alice", "ip_address": "192.168.1.100", "device": "mobile"}')),
    ('EVT002', TIMESTAMP'2024-01-15 10:05:00', 'purchase',
     PARSE_JSON('{"user_id": 12345, "order_id": "ORD123", "amount": 99.99, "currency": "USD", "items": [{"sku": "PROD001", "quantity": 2, "price": 49.99}]}')),
    ('EVT003', TIMESTAMP'2024-01-15 10:10:00', 'user_login',
     PARSE_JSON('{"user_id": 67890, "username": "bob", "ip_address": "10.0.0.50", "device": "desktop", "session_id": "sess_xyz"}')),
    ('EVT004', TIMESTAMP'2024-01-15 10:15:00', 'page_view',
     PARSE_JSON('{"user_id": 12345, "page_url": "/products/electronics", "referrer": "https://google.com", "duration_seconds": 45}')),
    ('EVT005', TIMESTAMP'2024-01-15 10:20:00', 'purchase',
     PARSE_JSON('{"user_id": 67890, "order_id": "ORD124", "amount": 149.50, "currency": "USD", "items": [{"sku": "PROD002", "quantity": 1, "price": 149.50}], "discount_code": "SAVE10"}')),
    ('EVT006', TIMESTAMP'2024-01-15 10:25:00', 'error',
     PARSE_JSON('{"error_code": "E500", "error_message": "Database connection timeout", "service": "payment-api", "stack_trace": "com.example.PaymentService.processPayment"}')),
    ('EVT007', TIMESTAMP'2024-01-15 10:30:00', 'page_view',
     PARSE_JSON('{"user_id": 67890, "page_url": "/checkout", "referrer": "/cart", "duration_seconds": 120, "cart_items": 1}')),
    ('EVT008', TIMESTAMP'2024-01-15 10:35:00', 'user_logout',
     PARSE_JSON('{"user_id": 12345, "username": "alice", "session_duration_minutes": 35}')),
    ('EVT009', TIMESTAMP'2024-01-15 10:40:00', 'error',
     PARSE_JSON('{"error_code": "E404", "error_message": "Product not found", "service": "catalog-api", "requested_sku": "PROD999"}')),
    ('EVT010', TIMESTAMP'2024-01-15 10:45:00', 'purchase',
     PARSE_JSON('{"user_id": 12345, "order_id": "ORD125", "amount": 299.99, "currency": "USD", "items": [{"sku": "PROD003", "quantity": 3, "price": 99.99}], "shipping_address": {"country": "US", "zip": "94105"}}'));

-- ============================================================================
-- QUERY 1: Path-Based Field Extraction
-- ============================================================================

SELECT '=== Query 1: Path-Based Field Extraction ===' as section;

SELECT 
    event_id,
    event_type,
    payload:user_id AS user_id,
    payload:username AS username,
    payload:order_id AS order_id
FROM events
WHERE payload:user_id IS NOT NULL
ORDER BY timestamp;

-- ============================================================================
-- QUERY 2: Type Casting with Double-Colon Syntax
-- ============================================================================

SELECT '=== Query 2: Type Casting with Double-Colon Syntax ===' as section;

SELECT 
    event_id,
    timestamp,
    payload:user_id::STRING AS user_id,
    payload:order_id::STRING AS order_id,
    payload:amount::DECIMAL(10,2) AS amount,
    payload:currency::STRING AS currency,
    payload:discount_code::STRING AS discount_code
FROM events
WHERE event_type = 'purchase'
ORDER BY payload:amount::DECIMAL DESC;

-- ============================================================================
-- QUERY 3: Nested Field Access
-- ============================================================================

SELECT '=== Query 3: Nested Field Accesss ===' as section;

-- Access nested shipping address
SELECT 
    event_id,
    payload:order_id AS order_id,
    payload:shipping_address.country::STRING AS country,
    payload:shipping_address.zip::STRING AS zip_code,
    payload:items[0].sku::STRING AS first_item_sku,
    payload:items[0].quantity::INT AS first_item_qty
FROM events
WHERE payload:shipping_address IS NOT NULL;

-- ============================================================================
-- QUERY 4: Type Introspection
-- ============================================================================

SELECT '=== Query 4: Type Introspection ===' as section;

SELECT 
    event_type,
    schema_of_variant(payload:user_id) AS user_id_type,
    schema_of_variant(payload:amount) AS amount_type,
    schema_of_variant(payload:items) AS items_type,
    COUNT(*) AS event_count
FROM events
GROUP BY event_type, schema_of_variant(payload:user_id), schema_of_variant(payload:amount),schema_of_variant(payload:items)
ORDER BY event_type;

-- ============================================================================
-- QUERY 5: Aggregations with VARIANT Fields
-- ============================================================================

SELECT '=== Query 5: Aggregations with VARIANT Fields ===' as section;

SELECT 
    payload:user_id::STRING AS user_id,
    COUNT(*) AS purchase_count,
    SUM(payload:amount::DECIMAL(10,2)) AS total_revenue,
    AVG(payload:amount::DECIMAL(10,2)) AS avg_order_value,
    MIN(payload:amount::DECIMAL(10,2)) AS min_purchase,
    MAX(payload:amount::DECIMAL(10,2)) AS max_purchase
FROM events
WHERE event_type = 'purchase'
  AND payload:amount IS NOT NULL
GROUP BY payload:user_id::STRING
ORDER BY total_revenue DESC;

-- ============================================================================
-- QUERY 6: Conditional Logic Based on Variant Content
-- ============================================================================

SELECT '=== Query 6: Conditional Logic Based on Variant Content ===' as section;

SELECT 
    event_id,
    event_type,
    payload:user_id::STRING AS user_id,
    CASE 
        WHEN event_type = 'purchase' AND payload:amount::DECIMAL(10,2) > 200 THEN 'High Value'
        WHEN event_type = 'purchase' AND payload:amount::DECIMAL(10,2) > 100 THEN 'Medium Value'
        WHEN event_type = 'purchase' THEN 'Low Value'
        WHEN event_type = 'error' AND payload:error_code::STRING LIKE 'E5%' THEN 'Critical Error'
        WHEN event_type = 'error' THEN 'Minor Error'
        ELSE 'Standard Event'
    END AS event_category,
    CASE 
        WHEN event_type = 'purchase' THEN payload:amount::DECIMAL(10,2)
        ELSE 0
    END AS monetary_value
FROM events
ORDER BY timestamp;

```

### Result

```text
section
=== Create events table with event dataset ===
Time taken: 2.28 seconds, Fetched 1 row(s)
Response code
Time taken: 1.41 seconds
Response code
Time taken: 0.602 seconds
Response code
Time taken: 1.314 seconds


section
=== Query 1: Path-Based Field Extraction ===
Time taken: 0.059 seconds, Fetched 1 row(s)
event_id	event_type	user_id	username	order_id
EVT001	user_login	12345	"alice"	NULL
EVT002	purchase	12345	NULL	"ORD123"
EVT003	user_login	67890	"bob"	NULL
EVT004	page_view	12345	NULL	NULL
EVT005	purchase	67890	NULL	"ORD124"
EVT007	page_view	67890	NULL	NULL
EVT008	user_logout	12345	"alice"	NULL
EVT010	purchase	12345	NULL	"ORD125"
Time taken: 1.815 seconds, Fetched 8 row(s)


section
=== Query 2: Type Casting with Double-Colon Syntax ===
Time taken: 0.112 seconds, Fetched 1 row(s)
event_id	timestamp	user_id	order_id	amount	currency	discount_code
EVT010	2024-01-15 10:45:00	12345	ORD125	299.99	USD	NULL
EVT005	2024-01-15 10:20:00	67890	ORD124	149.50	USD	SAVE10
EVT002	2024-01-15 10:05:00	12345	ORD123	99.99	USD	NULL
Time taken: 0.972 seconds, Fetched 3 row(s)


section
=== Query 3: Nested Field Accesss ===
Time taken: 0.166 seconds, Fetched 1 row(s)
event_id	order_id	country	zip_code	first_item_sku	first_item_qty
EVT010	"ORD125"	US	94105	PROD003	3
Time taken: 0.427 seconds, Fetched 1 row(s)


section
=== Query 4: Type Introspection ===
Time taken: 0.099 seconds, Fetched 1 row(s)
event_type	user_id_type	amount_type	items_type	event_count
error	NULL	NULL	NULL	2
page_view	BIGINT	NULL	NULL	2
purchase	BIGINT	DECIMAL(5,2)	ARRAY<OBJECT<price: DECIMAL(4,2), quantity: BIGINT, sku: STRING>>	1
purchase	BIGINT	DECIMAL(4,2)	ARRAY<OBJECT<price: DECIMAL(4,2), quantity: BIGINT, sku: STRING>>	1
purchase	BIGINT	DECIMAL(4,1)	ARRAY<OBJECT<price: DECIMAL(4,1), quantity: BIGINT, sku: STRING>>	1
user_login	BIGINT	NULL	NULL	2
user_logout	BIGINT	NULL	NULL	1
Time taken: 1.193 seconds, Fetched 7 row(s)


section
=== Query 5: Aggregations with VARIANT Fields ===
Time taken: 0.09 seconds, Fetched 1 row(s)
user_id	purchase_count	total_revenue	avg_order_value	min_purchase	max_purchase
12345	2	399.98	199.990000	99.99	299.99
67890	1	149.50	149.500000	149.50	149.50
Time taken: 1.202 seconds, Fetched 2 row(s)


section
=== Query 6: Conditional Logic Based on Variant Content ===
Time taken: 0.096 seconds, Fetched 1 row(s)
event_id	event_type	user_id	event_category	monetary_value
EVT001	user_login	12345	Standard Event	0.00
EVT002	purchase	12345	Low Value	99.99
EVT003	user_login	67890	Standard Event	0.00
EVT004	page_view	12345	Standard Event	0.00
EVT005	purchase	67890	Medium Value	149.50
EVT006	error	NULL	Critical Error	0.00
EVT007	page_view	67890	Standard Event	0.00
EVT008	user_logout	12345	Standard Event	0.00
EVT009	error	NULL	Minor Error	0.00
EVT010	purchase	12345	High Value	299.99
Time taken: 0.705 seconds, Fetched 10 row(s)
```


## Example 2 - Comparison of Execution Plans:  : VARIANT vs STRING vs STRUCT

### Spark 
```python
from pyspark.sql import SparkSession
from pyspark.sql.functions import col, get_json_object, from_json, expr
from pyspark.sql.types import DoubleType, StringType, StructType, StructField


REP_DATA_FILES = "file:///opt/spark/data/files"
URL_MASTER = "spark://spark-master:7077"

spark = SparkSession.builder \
    .appName("SPARK_VARIANTModePERF") \
    .master(URL_MASTER) \
    .getOrCreate()

# Reference dataset 
transactions = [
    ("TXN-001", '{"amount": 1500.00, "currency": "EUR", "merchant": "AMZN", "category": "retail"}'),
    ("TXN-002", '{"amount": 230.50,  "currency": "USD", "merchant": "UBER", "category": "transport", "surge": 1.2}'),
    ("TXN-003", '{"amount": 89750.0, "currency": "EUR", "merchant": "AIRBNB", "category": "travel", "nights": 5}'),
    ("TXN-004", '{"amount": 45.00,   "currency": "GBP", "merchant": "NETFLIX", "category": "entertainment"}'),
    ("TXN-005", '{"amount": 3200.0,  "currency": "EUR", "merchant": "APPLE", "category": "electronics", "items": 2}'),
    ("TXN-006", '{"amount": 800.00,  "currency": "EUR", "merchant": "AMZN", "category": "retail"}'),
    ("TXN-007", '{"amount": 1100.0,  "currency": "USD", "merchant": "GOOGLE", "category": "software"}'),
    ("TXN-008", '{"amount": 6500.0,  "currency": "EUR", "merchant": "BOOKING", "category": "travel", "nights": 3}'),
    ("TXN-009", '{"amount": 320.75,  "currency": "GBP", "merchant": "SPOTIFY", "category": "entertainment"}'),
    ("TXN-010", '{"amount": 2200.0,  "currency": "EUR", "merchant": "AMZN", "category": "retail"}'),
]

df = spark.createDataFrame(transactions, ["txn_id", "payload_str"])

# Approach n°1 : STRING + get_json_object (Spark 3)
df_str = df.withColumn("amount_str",   get_json_object(col("payload_str"), "$.amount")) \
           .withColumn("currency_str", get_json_object(col("payload_str"), "$.currency"))
df_str.write.format("parquet").mode("overwrite").save(f"{REP_DATA_FILES}/df_str")
df_temp0 = spark.read.parquet(f"{REP_DATA_FILES}/df_str")
df_temp0.createOrReplaceTempView("df_str")

# Approach 2: Typed STRUCT (best performance for stable and known schemas)
txn_schema = StructType([
    StructField("amount",   DoubleType()),
    StructField("currency", StringType()),
    StructField("merchant", StringType()),
    StructField("category", StringType()),
])
df_struct = df.withColumn("payload_struct", from_json(col("payload_str"), txn_schema))
df_struct.write.format("parquet").mode("overwrite").save(f"{REP_DATA_FILES}/df_struct")
df_temp1 = spark.read.parquet(f"{REP_DATA_FILES}/df_struct")
df_temp1.createOrReplaceTempView("df_struct")

# Approach 3: VARIANT (Spark 4.0 — best for heterogeneous or evolving schemas)
df_variant = df.withColumn("payload_variant", expr("PARSE_JSON(payload_str)"))
df_variant.write.format("parquet").mode("overwrite").save(f"{REP_DATA_FILES}/df_variant")
df_temp2 = spark.read.parquet(f"{REP_DATA_FILES}/df_variant")
df_temp2.createOrReplaceTempView("df_variant")

# Reference query : aggregation by currency
print("=== STRING ===")
spark.sql("""
    SELECT currency_str
          ,SUM(CAST(amount_str AS DOUBLE)) AS total
    FROM df_str 
    GROUP BY currency_str
""").explain(mode="formatted")

print("=== STRUCT ===")
spark.sql("""
    SELECT payload_struct.currency
          ,SUM(payload_struct.amount) AS total
    FROM df_struct 
    GROUP BY payload_struct.currency
""").explain(mode="formatted")

print("=== VARIANT ===")
spark.sql("""
    SELECT payload_variant:currency::STRING AS currency
        ,SUM(payload_variant:amount::DOUBLE) AS total
    FROM df_variant 
    GROUP BY payload_variant:currency::STRING
""").explain(mode="formatted")

spark.stop()
```

### Result

```text
=== STRING ===
== Physical Plan ==
AdaptiveSparkPlan (5)
+- HashAggregate (4)
   +- Exchange (3)
      +- HashAggregate (2)
         +- Scan parquet  (1)

(1) Scan parquet 
Output [2]: [amount_str#6, currency_str#7]
Batched: true
Location: InMemoryFileIndex [file:/opt/spark/data/files/df_str]
ReadSchema: struct<amount_str:string,currency_str:string>

(2) HashAggregate
Input [2]: [amount_str#6, currency_str#7]
Keys [1]: [currency_str#7]
Functions [1]: [partial_sum(cast(amount_str#6 as double))]
Aggregate Attributes [1]: [sum#18]
Results [2]: [currency_str#7, sum#19]

(3) Exchange
Input [2]: [currency_str#7, sum#19]
Arguments: hashpartitioning(currency_str#7, 200), ENSURE_REQUIREMENTS, [plan_id=78]

(4) HashAggregate
Input [2]: [currency_str#7, sum#19]
Keys [1]: [currency_str#7]
Functions [1]: [sum(cast(amount_str#6 as double))]
Aggregate Attributes [1]: [sum(cast(amount_str#6 as double))#17]
Results [2]: [currency_str#7, sum(cast(amount_str#6 as double))#17 AS total#16]

(5) AdaptiveSparkPlan
Output [2]: [currency_str#7, total#16]
Arguments: isFinalPlan=false



=== STRUCT ===
== Physical Plan ==
AdaptiveSparkPlan (6)
+- HashAggregate (5)
   +- Exchange (4)
      +- HashAggregate (3)
         +- Project (2)
            +- Scan parquet  (1)

(1) Scan parquet 
Output [1]: [payload_struct#11]
Batched: true
Location: InMemoryFileIndex [file:/opt/spark/data/files/df_struct]
ReadSchema: struct<payload_struct:struct<amount:double,currency:string>>

(2) Project
Output [2]: [payload_struct#11.amount AS _extract_amount#26, payload_struct#11.currency AS _groupingexpression#25]
Input [1]: [payload_struct#11]

(3) HashAggregate
Input [2]: [_extract_amount#26, _groupingexpression#25]
Keys [1]: [_groupingexpression#25]
Functions [1]: [partial_sum(_extract_amount#26)]
Aggregate Attributes [1]: [sum#30]
Results [2]: [_groupingexpression#25, sum#31]

(4) Exchange
Input [2]: [_groupingexpression#25, sum#31]
Arguments: hashpartitioning(_groupingexpression#25, 200), ENSURE_REQUIREMENTS, [plan_id=93]

(5) HashAggregate
Input [2]: [_groupingexpression#25, sum#31]
Keys [1]: [_groupingexpression#25]
Functions [1]: [sum(_extract_amount#26)]
Aggregate Attributes [1]: [sum(_extract_amount#26)#24]
Results [2]: [_groupingexpression#25 AS currency#22, sum(_extract_amount#26)#24 AS total#20]

(6) AdaptiveSparkPlan
Output [2]: [currency#22, total#20]
Arguments: isFinalPlan=false



=== VARIANT ===
== Physical Plan ==
AdaptiveSparkPlan (6)
+- HashAggregate (5)
   +- Exchange (4)
      +- HashAggregate (3)
         +- Project (2)
            +- Scan parquet  (1)


(1) Scan parquet 
Output [1]: [payload_variant#39]
Batched: true
Location: InMemoryFileIndex [file:/opt/spark/data/files/df_variant]
ReadSchema: struct<payload_variant:struct<0:variant,1:variant>>

(2) Project
Output [2]: [payload_variant#39.0 AS payload_variant#15, cast(payload_variant#39.1 as string) AS _groupingexpression#38]
Input [1]: [payload_variant#39]

(3) HashAggregate
Input [2]: [payload_variant#15, _groupingexpression#38]
Keys [1]: [_groupingexpression#38]
Functions [1]: [partial_sum(cast(variant_get(payload_variant#15, $.amount, VariantType, true, Some(Etc/UTC)) as double))]
Aggregate Attributes [1]: [sum#40]
Results [2]: [_groupingexpression#38, sum#41]

(4) Exchange
Input [2]: [_groupingexpression#38, sum#41]
Arguments: hashpartitioning(_groupingexpression#38, 200), ENSURE_REQUIREMENTS, [plan_id=108]

(5) HashAggregate
Input [2]: [_groupingexpression#38, sum#41]
Keys [1]: [_groupingexpression#38]
Functions [1]: [sum(cast(variant_get(payload_variant#15, $.amount, VariantType, true, Some(Etc/UTC)) as double))]
Aggregate Attributes [1]: [sum(cast(variant_get(payload_variant#15, $.amount, VariantType, true, Some(Etc/UTC)) as double))#37]
Results [2]: [_groupingexpression#38 AS currency#33, sum(cast(variant_get(payload_variant#15, $.amount, VariantType, true, Some(Etc/UTC)) as double))#37 AS total#35]

(6) AdaptiveSparkPlan
Output [2]: [currency#33, total#35]
Arguments: isFinalPlan=false

```