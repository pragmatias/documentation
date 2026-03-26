---
Categories : ["Spark"]
Tags : ["Spark"]
title : "Spark : v4.x - Features - SQL Scripts, Session and ANSI compliance"
date : 2026-04-07
draft : false
toc: true
---


You'll find in this article, some informations about the SQL features (Script, Session, Compliance) from [Spark v4.x](https://spark.apache.org/releases/spark-release-4-0-0.html).

<!--more-->

# ANSI SQL Compliance

## Introduction

ANSI SQL compliance mode enforces stricter SQL semantics matching [ISO/IEC 9075 standard](https://www.iso.org/standard/76583.html). 
Enables type safety, prevents implicit casting errors, enforces reserved keyword restrictions.


## Detail

Spark's default SQL behavior prioritizes ease of use over strict correctness. 
Implicit type conversions silently succeed even when semantically wrong. Dividing integers returns integers (truncation). Overflow operations wrap around without errors. Reserved keywords can be used as column names without quoting.

ANSI SQL compliance fundamentally changes these behaviors to match traditional databases like PostgreSQL, SQL Server and more. The changes affect three primary areas:
- **Type System Strictness**  : Queries fail instead of returning truncated or `null` results silently
- **NULL Handling**  : ANSI mode enforces stricter `NULL` semantics in predicates and set operations. `NULL = NULL` always returns NULL (not true). `UNION`, `INTERSECT`, and `EXCEPT` treat `NULL` values as equal for deduplication (matching the SQL standard).
- **Reserved Keywords**  : ANSI mode enforces SQL reserved keyword restrictions. Column names like `SELECT`, `FROM`, `WHERE` must be backtick-quoted. This matches traditional databases behavior but breaks Spark SQL queries that use these names freely.

The implementation affects multiple Spark subsystems:
- **Catalyst Optimizer**: Adds type validation rules during the analysis phase. Rejects queries with type mismatches earlier in planning.
- **Code Generation**: Changes generated code for arithmetic operations to include overflow checks. Adds branch instructions that check for overflow conditions before returning results.
- **Runtime Execution**: Wraps operations in exception handlers that fail tasks on ANSI violations. This changes error handling from silent NULL propagation to explicit failures.

The mode is configured per-session via `spark.sql.ansi.enabled`. Once enabled, all queries in that session follow ANSI rules. 

### Advices

- **`spark.sql.ansi.enabled = true`**  :
    - Master switch for ANSI compliance. Enables all strict behaviors: overflow checking, type safety, division semantics. 
    - Must be set before creating the session for consistent behavior. 
    - Cannot be changed mid-session in some Spark deployment modes.
- **`TRY_CAST` vs `CAST` in ANSI Mode**  : 
    - `CAST()` throws exceptions on conversion errors in ANSI mode. `TRY_CAST()` returns `NULL` but explicitly signals validation failure. 
    - Use `TRY_CAST()` for data validation pipelines where bad rows should be filtered/logged rather than failing the entire job.
- **[typeof()](https://spark.apache.org/docs/latest/api/sql/index.html#typeof) Function**  :
    - Returns the data type of an expression result. Shows whether result is `INT`, `DECIMAL`, `DOUBLE`, etc. Use in migration validation to identify type changes.
- **Reserved Keyword Quoting**  
    - ANSI mode enforces backtick quoting for reserved words. Queries with column names like `user`, `timestamp`, `order` must be rewritten. This is a breaking change for large SQL codebases. 
    - Run static analysis to identify affected queries before migration.

## Advantages

1. **Improved Type Safety**  : Strict type checking catches errors at query compilation instead of runtime. Schema evolution issues appear earlier. Prevents data quality issues from propagating through data pipelines.
2. **Fail-Fast Error Detection**  : Type mismatches and arithmetic errors fail immediately instead of producing silent incorrect results. A pipeline that processes financial transactions won't silently corrupt data on overflow. Errors surface during testing rather than in production.
3. **Database Migration Compatibility**  : Queries that worked correctly in the source database behave identically in Spark. (Reduces migration risk and testing burden)
4. **Regulatory Compliance** : Financial services and healthcare industries require deterministic, auditable query behavior. ANSI mode provides predictable semantics that match regulatory expectations. 


## Limitations

1. **Breaking Changes to Existing Queries**  : Queries that relied on Spark's lenient behavior will fail. `CAST` operations that previously returned NULL now throw exceptions. Integer division results change from 0 to 0.5. Large codebases require extensive testing and refactoring.
2. **Performance Overhead** : Each addition, multiplication, and division includes conditional branches to check for overflow. Processing involving extensive calculations on large volumes of data may experience a decline in performance.
3. **All-or-Nothing Configuration**  : Cannot enable ANSI mode for specific queries or tables. The session-wide setting affects all operations. Gradual migration requires running two separate Spark sessions with different configurations.
4. **Error Messages Can Fail Entire Jobs** : A single row with a type conversion error fails the entire task. In default mode, bad rows become NULL and processing continues. ANSI mode lacks row-level error recovery. Requires pre-validation or a separate error handling pipeline.



## Real-World Use Cases

- **Use Case 1: PostgreSQL to Spark Migration**  
    - A company migrates 500+ SQL queries from PostgreSQL data warehouse to Spark lakehouse. Queries contain integer division, overflow-prone calculations, and strict type dependencies. ANSI mode enables running queries unmodified. Without ANSI mode, a significant percentage of queries may need to be rewritten to match PostgreSQL semantics.
- **Use Case 2: Financial Calculation Accuracy**  
    - A financial services firm calculates interest accruals on loan portfolios. Default Spark integer division `principal * rate / 365` would truncate to zero for small daily rates. ANSI mode enforces decimal division producing accurate results. Prevents multi-million dollar calculation errors.
- **Use Case 3: Data Quality Validation Pipeline** 
    - An ETL pipeline validates incoming data against strict type schemas. Records with invalid type conversions must be rejected and not silently converted to NULL. ANSI mode fails tasks on first bad record, triggering alerts. Teams investigate data quality issues immediately instead of discovering corrupted data downstream.






## Codes

### Example : Type Safety and Arithmetic Behavior

This example demonstrates how ANSI mode changes type conversion and arithmetic operations. Shows breaking changes from default behavior.

#### Spark : Default Mode
```python
# PySpark Example - Not ANSI SQL Type Safety and Arithmetic
from pyspark.sql import SparkSession
from pyspark.sql.types import IntegerType, DoubleType, StringType, StructField, StructType

URL_MASTER = "spark://spark-master:7077"


spark = SparkSession.builder \
    .appName("SPARK_DefaultSQLMode") \
    .config("spark.sql.ansi.enabled", "false") \
    .master(URL_MASTER) \
    .getOrCreate()


print("""
##########################
##### Build Datasets #####
##########################
""")

# Source system 1: Financial dataset
# Demonstrates real-world scenarios where ANSI mode prevents errors
financial_data = [
    ("LOAN001", 10000, 5.25, 365, "2024-01-15"),    # Standard loan
    ("LOAN002", 50000, 4.75, 365, "2024-01-15"),    # Large principal
    ("LOAN003", 1500, 12.50, 365, "2024-01-15"),    # High interest rate
    ("LOAN004", 2147483647, 3.00, 365, "2024-01-15"), # Near integer max (overflow risk)
    ("LOAN005", 25000, 6.00, 365, "2024-01-15"),    # Medium loan
    ("LOAN006", 8000, 0.00, 365, "2024-01-15"),     # Zero interest (division edge case)
    ("LOAN007", 100000, 7.25, 365, "2024-01-15"),   # Large loan
    ("LOAN008", 500, 15.00, 365, "2024-01-15"),     # Small principal, high rate
    ("LOAN009", 75000, 4.25, 365, "2024-01-15"),    # Standard
    ("LOAN010", 1000000, 3.50, 365, "2024-01-15"),  # Very large principal (overflow in calculations)
]

# Source system 2: Problematic Financial dataset
# Test dataset with intentionally problematic values for type conversion
problematic_data = [
    ("CONV001", "12345", "2024-01-15"),   # Valid integer string
    ("CONV002", "67890", "2024-01-15"),   # Valid integer string
    ("CONV003", "abc123", "2024-01-15"),  # Invalid integer (contains letters)
    ("CONV004", "99999", "2024-01-15"),   # Valid integer
    ("CONV005", "12.34", "2024-01-15"),   # Decimal in integer field
    ("CONV006", "", "2024-01-15"),        # Empty string
    ("CONV007", "55555", "2024-01-15"),   # Valid integer
    ("CONV008", "1e5", "2024-01-15"),     # Scientific notation
    ("CONV009", "42", "2024-01-15"),      # Valid integer
    ("CONV010", "NULL", "2024-01-15"),    # String "NULL" not actual NULL
]

financial_schema = StructType([
    StructField("loan_id",  StringType()),
    StructField("principal", IntegerType()),
    StructField("annual_rate", DoubleType()),  
    StructField("days",   IntegerType()),
    StructField("date", StringType()),
])

problematic_schema = StructType([
    StructField("record_id", StringType()),
    StructField("value_str", StringType()),
    StructField("date", StringType()),
])


# Create DataFrame in both sessions
loans_data = spark.createDataFrame(financial_data,financial_schema)
print(f"financial_data dataset: {loans_data.count()}")  
loans_data.show(truncate=False)


problems_data = spark.createDataFrame(problematic_data,problematic_schema)
print(f"problematic_data dataset: {problems_data.count()}")  
problems_data.show(truncate=False)


# Register DataFrames as temporary views for SQL access
loans_data.createOrReplaceTempView("loans_data")
problems_data.createOrReplaceTempView("problems_data")


print("""
########################################
##### 1. Integer Overflow Behavior #####
########################################
""")


overflow = spark.sql("""
    SELECT 
        loan_id,
        principal,
        principal + 1000000 as principal_plus_1m,
        CASE 
            WHEN principal + 1000000 < 0 THEN 'OVERFLOW DETECTED'
            ELSE 'OK'
        END as overflow_check
    FROM loans_data
    WHERE loan_id IN ('LOAN004', 'LOAN010')
""")

# LOAN004 (at INT max) wrapped to negative value
overflow.show(truncate=False)



print("""
####################################
##### 2. Type Casting Behavior #####
####################################
""")


cast = spark.sql("""
    SELECT 
        record_id,
        value_str,
        CAST(value_str AS INT) as value_int,
        CASE 
            WHEN CAST(value_str AS INT) IS NULL THEN 'CAST FAILED'
            ELSE 'CAST OK'
        END as cast_status
    FROM problems_data
    ORDER BY record_id
""")

# Invalid values became NULL without any error indication
cast.show(truncate=False)


spark.stop()

```

#### Result : Default Mode

```text
##########################
##### Build Datasets #####
##########################

financial_data dataset: 10
+-------+----------+-----------+----+----------+
|loan_id|principal |annual_rate|days|date      |
+-------+----------+-----------+----+----------+
|LOAN001|10000     |5.25       |365 |2024-01-15|
|LOAN002|50000     |4.75       |365 |2024-01-15|
|LOAN003|1500      |12.5       |365 |2024-01-15|
|LOAN004|2147483647|3.0        |365 |2024-01-15|
|LOAN005|25000     |6.0        |365 |2024-01-15|
|LOAN006|8000      |0.0        |365 |2024-01-15|
|LOAN007|100000    |7.25       |365 |2024-01-15|
|LOAN008|500       |15.0       |365 |2024-01-15|
|LOAN009|75000     |4.25       |365 |2024-01-15|
|LOAN010|1000000   |3.5        |365 |2024-01-15|
+-------+----------+-----------+----+----------+

problematic_data dataset: 10
+---------+---------+----------+
|record_id|value_str|date      |
+---------+---------+----------+
|CONV001  |12345    |2024-01-15|
|CONV002  |67890    |2024-01-15|
|CONV003  |abc123   |2024-01-15|
|CONV004  |99999    |2024-01-15|
|CONV005  |12.34    |2024-01-15|
|CONV006  |         |2024-01-15|
|CONV007  |55555    |2024-01-15|
|CONV008  |1e5      |2024-01-15|
|CONV009  |42       |2024-01-15|
|CONV010  |NULL     |2024-01-15|
+---------+---------+----------+


##############################################################
##### 1. Calculate daily interest using integer division #####
##############################################################

+-------+----------+-----------+------------------+-----------+
|loan_id|principal |annual_rate|daily_interest    |result_type|
+-------+----------+-----------+------------------+-----------+
|LOAN001|10000     |5.25       |1.4383561643835616|double     |
|LOAN002|50000     |4.75       |6.506849315068493 |double     |
|LOAN003|1500      |12.5       |0.5136986301369864|double     |
|LOAN004|2147483647|3.0        |176505.5052328767 |double     |
|LOAN005|25000     |6.0        |4.109589041095891 |double     |
|LOAN006|8000      |0.0        |0.0               |double     |
|LOAN007|100000    |7.25       |19.863013698630137|double     |
|LOAN008|500       |15.0       |0.2054794520547945|double     |
|LOAN009|75000     |4.25       |8.732876712328768 |double     |
|LOAN010|1000000   |3.5        |95.89041095890411 |double     |
+-------+----------+-----------+------------------+-----------+


########################################
##### 2. Integer Overflow Behavior #####
########################################

+-------+----------+-----------------+-----------------+
|loan_id|principal |principal_plus_1m|overflow_check   |
+-------+----------+-----------------+-----------------+
|LOAN004|2147483647|-2146483649      |OVERFLOW DETECTED|
|LOAN010|1000000   |2000000          |OK               |
+-------+----------+-----------------+-----------------+


####################################
##### 3. Type Casting Behavior #####
####################################

+---------+---------+---------+-----------+
|record_id|value_str|value_int|cast_status|
+---------+---------+---------+-----------+
|CONV001  |12345    |12345    |CAST OK    |
|CONV002  |67890    |67890    |CAST OK    |
|CONV003  |abc123   |NULL     |CAST FAILED|
|CONV004  |99999    |99999    |CAST OK    |
|CONV005  |12.34    |12       |CAST OK    |
|CONV006  |         |NULL     |CAST FAILED|
|CONV007  |55555    |55555    |CAST OK    |
|CONV008  |1e5      |NULL     |CAST FAILED|
|CONV009  |42       |42       |CAST OK    |
|CONV010  |NULL     |NULL     |CAST FAILED|
+---------+---------+---------+-----------+
```


#### Spark : ANSI Mode
```python
# PySpark Example - ANSI SQL Type Safety and Arithmetic
from pyspark.sql import SparkSession
from pyspark.sql.types import IntegerType, DoubleType, StringType, StructField, StructType

URL_MASTER = "spark://spark-master:7077"


spark = SparkSession.builder \
    .appName("SPARK_ANSISQLMode") \
    .config("spark.sql.ansi.enabled", "true") \
    .master(URL_MASTER) \
    .getOrCreate()


print("""
##########################
##### Build Datasets #####
##########################
""")

# Source system 1: Financial dataset
# Demonstrates real-world scenarios where ANSI mode prevents errors
financial_data = [
    ("LOAN001", 10000, 5.25, 365, "2024-01-15"),    # Standard loan
    ("LOAN002", 50000, 4.75, 365, "2024-01-15"),    # Large principal
    ("LOAN003", 1500, 12.50, 365, "2024-01-15"),    # High interest rate
    ("LOAN004", 2147483647, 3.00, 365, "2024-01-15"), # Near integer max (overflow risk)
    ("LOAN005", 25000, 6.00, 365, "2024-01-15"),    # Medium loan
    ("LOAN006", 8000, 0.00, 365, "2024-01-15"),     # Zero interest (division edge case)
    ("LOAN007", 100000, 7.25, 365, "2024-01-15"),   # Large loan
    ("LOAN008", 500, 15.00, 365, "2024-01-15"),     # Small principal, high rate
    ("LOAN009", 75000, 4.25, 365, "2024-01-15"),    # Standard
    ("LOAN010", 1000000, 3.50, 365, "2024-01-15"),  # Very large principal (overflow in calculations)
]

# Source system 2: Problematic Financial dataset
# Test dataset with intentionally problematic values for type conversion
problematic_data = [
    ("CONV001", "12345", "2024-01-15"),   # Valid integer string
    ("CONV002", "67890", "2024-01-15"),   # Valid integer string
    ("CONV003", "abc123", "2024-01-15"),  # Invalid integer (contains letters)
    ("CONV004", "99999", "2024-01-15"),   # Valid integer
    ("CONV005", "12.34", "2024-01-15"),   # Decimal in integer field
    ("CONV006", "", "2024-01-15"),        # Empty string
    ("CONV007", "55555", "2024-01-15"),   # Valid integer
    ("CONV008", "1e5", "2024-01-15"),     # Scientific notation
    ("CONV009", "42", "2024-01-15"),      # Valid integer
    ("CONV010", "NULL", "2024-01-15"),    # String "NULL" not actual NULL
]

financial_schema = StructType([
    StructField("loan_id",  StringType()),
    StructField("principal", IntegerType()),
    StructField("annual_rate", DoubleType()),  
    StructField("days",   IntegerType()),
    StructField("date", StringType()),
])

problematic_schema = StructType([
    StructField("record_id", StringType()),
    StructField("value_str", StringType()),
    StructField("date", StringType()),
])


# Create DataFrame in both sessions
loans_data = spark.createDataFrame(financial_data,financial_schema)
print(f"financial_data dataset: {loans_data.count()}")  
loans_data.show(truncate=False)


problems_data = spark.createDataFrame(problematic_data,problematic_schema)
print(f"problematic_data dataset: {problems_data.count()}")  
problems_data.show(truncate=False)


# Register DataFrames as temporary views for SQL access
loans_data.createOrReplaceTempView("loans_data")
problems_data.createOrReplaceTempView("problems_data")


print("""
########################################
##### 1. Integer Overflow Behavior #####
########################################
""")


try:
    overflow = spark.sql("""
        SELECT 
            loan_id,
            principal,
            principal + 1000000 as principal_plus_1m
        FROM loans_data
        WHERE loan_id IN ('LOAN004', 'LOAN010')
    """)
    overflow.show(truncate=False)
    print("Query completed (no overflow detected)")
except Exception as e:
    print(f"Exception Caught: {type(e).__name__}")
    print(f"Message: {str(e)[:200]}")
    print("\nThis is EXPECTED in ANSI mode - overflow is an error, not silent corruption")



print("""
####################################
##### 2. Type Casting Behavior #####
####################################
""")

try:
    cast = spark.sql("""
        SELECT 
            record_id,
            value_str,
            CAST(value_str AS INT) as value_int
        FROM problems_data
        ORDER BY record_id
    """)
    cast.show(truncate=False)
except Exception as e:
    print(f"Exception Caught: {type(e).__name__}")
    print(f"Failed on record: {str(e)[str(e).find('CONV'):str(e).find('CONV')+10] if 'CONV' in str(e) else 'unknown'}")
    print("\nThis is EXPECTED in ANSI mode - forces explicit error handling")


print("\n##### with TRY_CAST: Safe Error Handling #####")
try_cast = spark.sql("""
    SELECT 
        record_id,
        value_str,
        TRY_CAST(value_str AS INT) as value_int,
        CASE 
            WHEN TRY_CAST(value_str AS INT) IS NULL THEN 'CONVERSION_ERROR'
            ELSE 'OK'
        END as validation_status
    FROM problems_data
    ORDER BY record_id
""")
# TRY_CAST provides NULL on error but explicitly marks rows as problematic
try_cast.show(truncate=False)


spark.stop()

```
#### Result : ANSI Mode


```text
##########################
##### Build Datasets #####
##########################

financial_data dataset: 10
+-------+----------+-----------+----+----------+
|loan_id|principal |annual_rate|days|date      |
+-------+----------+-----------+----+----------+
|LOAN001|10000     |5.25       |365 |2024-01-15|
|LOAN002|50000     |4.75       |365 |2024-01-15|
|LOAN003|1500      |12.5       |365 |2024-01-15|
|LOAN004|2147483647|3.0        |365 |2024-01-15|
|LOAN005|25000     |6.0        |365 |2024-01-15|
|LOAN006|8000      |0.0        |365 |2024-01-15|
|LOAN007|100000    |7.25       |365 |2024-01-15|
|LOAN008|500       |15.0       |365 |2024-01-15|
|LOAN009|75000     |4.25       |365 |2024-01-15|
|LOAN010|1000000   |3.5        |365 |2024-01-15|
+-------+----------+-----------+----+----------+

problematic_data dataset: 10
+---------+---------+----------+
|record_id|value_str|date      |
+---------+---------+----------+
|CONV001  |12345    |2024-01-15|
|CONV002  |67890    |2024-01-15|
|CONV003  |abc123   |2024-01-15|
|CONV004  |99999    |2024-01-15|
|CONV005  |12.34    |2024-01-15|
|CONV006  |         |2024-01-15|
|CONV007  |55555    |2024-01-15|
|CONV008  |1e5      |2024-01-15|
|CONV009  |42       |2024-01-15|
|CONV010  |NULL     |2024-01-15|
+---------+---------+----------+


########################################
##### 1. Integer Overflow Behavior #####
########################################

== SQL (line 5, position 13) ==
            principal + 1000000 as principal_plus_1m
            ^^^^^^^^^^^^^^^^^^^

	at org.apache.spark.sql.errors.ExecutionErrors.arithmeticOverflowError(ExecutionErrors.scala:132)
	...
	at java.base/java.lang.Thread.run(Thread.java:1583)


Exception Caught: ArithmeticException
Message: [ARITHMETIC_OVERFLOW] integer overflow. Use 'try_add' to tolerate overflow and return NULL instead. If necessary set "spark.sql.ansi.enabled" to "false" to bypass this error. SQLSTATE: 22003
== SQL (l

This is EXPECTED in ANSI mode - overflow is an error, not silent corruption

####################################
##### 2. Type Casting Behavior #####
####################################

== SQL (line 5, position 13) ==
            CAST(value_str AS INT) as value_int
            ^^^^^^^^^^^^^^^^^^^^^^

	at org.apache.spark.sql.errors.QueryExecutionErrors$.invalidInputInCastToNumberError(QueryExecutionErrors.scala:147)
	...
	at java.base/java.lang.Thread.run(Thread.java:1583)

Exception Caught: NumberFormatException
Failed on record: unknown

This is EXPECTED in ANSI mode - forces explicit error handling

##### with TRY_CAST: Safe Error Handling #####

+---------+---------+---------+-----------------+
|record_id|value_str|value_int|validation_status|
+---------+---------+---------+-----------------+
|CONV001  |12345    |12345    |OK               |
|CONV002  |67890    |67890    |OK               |
|CONV003  |abc123   |NULL     |CONVERSION_ERROR |
|CONV004  |99999    |99999    |OK               |
|CONV005  |12.34    |NULL     |CONVERSION_ERROR |
|CONV006  |         |NULL     |CONVERSION_ERROR |
|CONV007  |55555    |55555    |OK               |
|CONV008  |1e5      |NULL     |CONVERSION_ERROR |
|CONV009  |42       |42       |OK               |
|CONV010  |NULL     |NULL     |CONVERSION_ERROR |
+---------+---------+---------+-----------------+

```




# Session SQL Variables

## Introduction

[Session SQL variables](https://spark.apache.org/docs/4.1.1/sql-ref-syntax-ddl-declare-variable.html) enable dynamic parameterization of queries without string concatenation or external configuration files. (Variables are session-scoped and type-safe. )


## Detail

Before Spark 4.0, parameterizing SQL queries required three problematic approaches:

1. **String Interpolation in Application Code**
    * Risk: SQL injection if `country` comes from user input. Requires recompiling query plan for each parameter value.
    * Example : 
```python
country = "US"
df = spark.sql(f"SELECT * FROM orders WHERE country = '{country}'")
```

2. **Spark Configuration Properties**
    * Verbose syntax. Limited to string types. Configuration namespace pollution.
    * Example :
```python
spark.conf.set("my.param.pays", "US")
spark.sql("SELECT * FROM orders WHERE country = '${spark.my.param.pays}'")
```

3. **External Configuration Files**
    * Adds dependency on external systems. Configuration drift between environments. No type safety.
    * Example :
```python
params = yaml.load("config.yaml")
spark.sql(f"SELECT * FROM orders WHERE country = '{params['country']}'")
```


Spark 4.0 introduces SQL variables that solve these problems. Variables are declared with explicit types and scoped to the session:
```sql
DECLARE min_amount DECIMAL(10,2) DEFAULT 100.0;
SELECT * FROM orders WHERE amount >= min_amount;
```

The two supported syntaxes :
1. **`DECLARE` Statement (SQL Standard)**
    * Explicit type declaration. Required in ANSI SQL mode. 
    * Example :
```sql
DECLARE variable_name TYPE [DEFAULT value];
```
2. **`SET` Statement (Backwards Compatible)**
    * Type inferred from value. Compatible with Spark 3.x session property syntax. Variables are type-safe once set.
    * Example :
```sql
SET variable_name = value;
```

The reference is resolved during query compilation, not runtime. This enables Catalyst optimizer to use variable values for predicate pushdown and partition pruning.

The variable system maintains a session-level symbol table. Each variable has:
- **Name**: Identifier used in queries
- **Type**: Scalar Data type (Int, String, Decimal, Boolean, Date, Timestamp)
- **Value**: Current value (mutable with subsequent SET)
- **Scope**: Session-only (not visible to other sessions)

Variables integrate with query planning. When Catalyst analyzes a query with `${variable_name}`, it:
1. Looks up variable in session symbol table
2. Replaces reference with literal value
3. Proceeds with optimization using concrete value

Runtime performance is identical to hardcoded literals.

## Advantages

1. **Type-Safe Parameterization** : Variables have explicit types checked at declaration. Assigning wrong type produces compilation error. Prevents runtime type errors from misconfigured parameters. 
2. **SQL Injection Prevention**  : Variable references are resolved during query compilation, not runtime string substitution. Malicious input in variable values cannot alter query structure. 
3. **Simplified Multi-Environment Configuration**  : Same SQL script runs in dev/rec/prod with different variable values. No code changes between environments. Variables can be set from command-line arguments or environment variables at session startup.
4. **Optimizer-Aware Parameterization** : Catalyst optimizer sees variable values during planning. Enables partition pruning and predicate pushdown based on variable values. 



## Limitations

1. **Session-Scoped Only** : Variables don't persist after session termination. No global variables shared across concurrent sessions. Each client must redeclare variables. Unsuitable for cluster-wide configuration that needs consistency across jobs.
2. **No Complex Types**  : Variables support only scalar types. Cannot declare `ARRAY`, `STRUCT`, or `MAP` variables. Passing complex parameter values still requires configuration properties or external storage.
3. **No Variable Persistence APIs**  : Variables cannot be saved to metastore or external storage. No built-in mechanism to load variables from YAML/JSON files. Teams must build custom variable management on top of base SQL variables.



## Real-World Use Cases

- **Use Case 1 : Parameterized Reports** 
    - Define a date range at the beginning of the script and use it in multiple queries without repetition.
- **Use Case 2 : Environment-Specific Data Processing**  
    - An ETL pipeline runs in dev, staging, and production environments. Each environment reads from different database prefixes (`dev_db.orders`, `prod_db.orders`). Variables `source_database` and `target_database` are set from environment variables at job startup. Same SQL script works across all environments without modification.




## Codes
### Example : How SQL variables session works

#### Spark 

```python
# PySpark Example : Demonstrates how variables works
from pyspark.sql import SparkSession
from pyspark.sql.types import DoubleType, StringType, StructField, StructType
from pyspark.sql.functions import to_timestamp

URL_MASTER = "spark://spark-master:7077"


spark = SparkSession.builder \
    .appName("SPARK_APPVARIABLE") \
    .config("spark.sql.ansi.enabled", "true") \
    .master(URL_MASTER) \
    .getOrCreate()


print("""
##########################
##### Build Datasets #####
##########################
""")

# Source system 1: Sensor dataset
# Demonstrates real-world scenarios where ANSI mode prevents errors
sensor_readings = [
    ("SENSOR_01", "2024-01-15 10:00:00", 22.5, 45.2, "warehouse_A", "normal"),
    ("SENSOR_02", "2024-01-15 10:05:00", 35.8, 78.5, "warehouse_A", "normal"),  # High temp
    ("SENSOR_03", "2024-01-15 10:10:00", 18.2, 42.1, "warehouse_B", "normal"),
    ("SENSOR_01", "2024-01-15 10:15:00", 23.1, 46.8, "warehouse_A", "normal"),
    ("SENSOR_02", "2024-01-15 10:20:00", 38.5, 82.3, "warehouse_A", "alert"),   # Anomaly
    ("SENSOR_04", "2024-01-15 10:25:00", 15.2, 38.5, "warehouse_C", "normal"),  # Low temp
    ("SENSOR_03", "2024-01-15 10:30:00", 19.1, 43.7, "warehouse_B", "normal"),
    ("SENSOR_01", "2024-01-15 10:35:00", 24.2, 47.5, "warehouse_A", "normal"),
    ("SENSOR_04", "2024-01-15 10:40:00", 12.8, 35.2, "warehouse_C", "alert"),   # Anomaly
    ("SENSOR_02", "2024-01-15 10:45:00", 32.1, 72.5, "warehouse_A", "normal"),
]


sensor_schema = StructType([
    StructField("sensor_id",  StringType()),
    StructField("cur_timestamp", StringType()),
    StructField("temperature", DoubleType()),  
    StructField("humidity",   DoubleType()),
    StructField("location", StringType()),
    StructField("status", StringType()),
])


# Create DataFrame
sensors_df = spark.createDataFrame(sensor_readings,sensor_schema).withColumn("cur_timestamp",to_timestamp("cur_timestamp", format="yyyy-MM-dd HH:mm:ss"))
print(f"sensor dataset: {sensors_df.count()}")  
sensors_df.show(truncate=False)

# Register DataFrames as temporary views for SQL access
sensors_df.createOrReplaceTempView("sensors_data")



print("""
########################################
##### 1. Time-Based Variable Usage #####
########################################
""")

spark.sql("DECLARE VARIABLE analysis_start TIMESTAMP DEFAULT TIMESTAMP'2024-01-15 10:00:00'")
spark.sql("DECLARE VARIABLE analysis_end TIMESTAMP DEFAULT TIMESTAMP'2024-01-15 10:15:00'")

query_time_based = """
    SELECT 
        sensor_id,
        location,
        COUNT(*) as readings_in_window,
        AVG(temperature) as avg_temp,
        MAX(temperature) - MIN(temperature) as temp_range,
        analysis_start as window_start,
        analysis_end as window_end
    FROM sensors_data
    WHERE cur_timestamp BETWEEN analysis_start AND analysis_end
    GROUP BY sensor_id, location
    ORDER BY sensor_id, location;
"""

print("EXECUTION n°1 : filter between 2024-01-15 10:00:00 and 2024-01-15 10:15:00")
time_based = spark.sql(query_time_based)
print(f"Result records: {time_based.count()}")  
time_based.show(truncate=False)


print("EXECUTION n°2 : filter between 2024-01-15 10:00:00 and 2024-01-15 10:30:00")
spark.sql("SET VARIABLE analysis_end = TIMESTAMP'2024-01-15 10:30:00'")
time_based = spark.sql(query_time_based)
print(f"Result records: {time_based.count()}")  
time_based.show(truncate=False)



print("""
################################################
##### 2. Variables vs String Interpolation #####
################################################
""")
spark.sql("DECLARE VARIABLE target_location STRING DEFAULT 'warehouse_A'")

print("UNSAFE: String interpolation (vulnerable to SQL injection)")
def get_user_input() -> str : 
    return "warehouse_A' OR '1'='1"

target_location = get_user_input() 
unsafe_interpolation = spark.sql(f"SELECT * FROM sensors_data WHERE location = '{target_location}'")
print(f"Result records: {unsafe_interpolation.count()}")  
unsafe_interpolation.show(truncate=False)


print("SAFE: Variable substitution (injection-proof)")
#Malicious input becomes a string value, not SQL code
spark.sql("SET VARIABLE target_location = \"warehouse_A' OR '1'='1\"")
safe_interpolation = spark.sql("SELECT * FROM sensors_data WHERE location = target_location")
print(f"Result records: {safe_interpolation.count()}")  
safe_interpolation.show(truncate=False)
# Variable value is treated as string literal "US' OR '1'='1"



spark.stop()

```

#### Result
```text
##########################
##### Build Datasets #####
##########################

sensor dataset: 10
+---------+-------------------+-----------+--------+-----------+------+
|sensor_id|cur_timestamp      |temperature|humidity|location   |status|
+---------+-------------------+-----------+--------+-----------+------+
|SENSOR_01|2024-01-15 10:00:00|22.5       |45.2    |warehouse_A|normal|
|SENSOR_02|2024-01-15 10:05:00|35.8       |78.5    |warehouse_A|normal|
|SENSOR_03|2024-01-15 10:10:00|18.2       |42.1    |warehouse_B|normal|
|SENSOR_01|2024-01-15 10:15:00|23.1       |46.8    |warehouse_A|normal|
|SENSOR_02|2024-01-15 10:20:00|38.5       |82.3    |warehouse_A|alert |
|SENSOR_04|2024-01-15 10:25:00|15.2       |38.5    |warehouse_C|normal|
|SENSOR_03|2024-01-15 10:30:00|19.1       |43.7    |warehouse_B|normal|
|SENSOR_01|2024-01-15 10:35:00|24.2       |47.5    |warehouse_A|normal|
|SENSOR_04|2024-01-15 10:40:00|12.8       |35.2    |warehouse_C|alert |
|SENSOR_02|2024-01-15 10:45:00|32.1       |72.5    |warehouse_A|normal|
+---------+-------------------+-----------+--------+-----------+------+


########################################
##### 1. Time-Based Variable Usage #####
########################################

EXECUTION n°1 : filter between 2024-01-15 10:00:00 and 2024-01-15 10:15:00
Result records: 3
+---------+-----------+------------------+--------+------------------+-------------------+-------------------+
|sensor_id|location   |readings_in_window|avg_temp|temp_range        |window_start       |window_end         |
+---------+-----------+------------------+--------+------------------+-------------------+-------------------+
|SENSOR_01|warehouse_A|2                 |22.8    |0.6000000000000014|2024-01-15 10:00:00|2024-01-15 10:15:00|
|SENSOR_02|warehouse_A|1                 |35.8    |0.0               |2024-01-15 10:00:00|2024-01-15 10:15:00|
|SENSOR_03|warehouse_B|1                 |18.2    |0.0               |2024-01-15 10:00:00|2024-01-15 10:15:00|
+---------+-----------+------------------+--------+------------------+-------------------+-------------------+

EXECUTION n°2 : filter between 2024-01-15 10:00:00 and 2024-01-15 10:30:00
Result records: 4
+---------+-----------+------------------+--------+------------------+-------------------+-------------------+
|sensor_id|location   |readings_in_window|avg_temp|temp_range        |window_start       |window_end         |
+---------+-----------+------------------+--------+------------------+-------------------+-------------------+
|SENSOR_01|warehouse_A|2                 |22.8    |0.6000000000000014|2024-01-15 10:00:00|2024-01-15 10:30:00|
|SENSOR_02|warehouse_A|2                 |37.15   |2.700000000000003 |2024-01-15 10:00:00|2024-01-15 10:30:00|
|SENSOR_03|warehouse_B|2                 |18.65   |0.9000000000000021|2024-01-15 10:00:00|2024-01-15 10:30:00|
|SENSOR_04|warehouse_C|1                 |15.2    |0.0               |2024-01-15 10:00:00|2024-01-15 10:30:00|
+---------+-----------+------------------+--------+------------------+-------------------+-------------------+


################################################
##### 2. Variables vs String Interpolation #####
################################################

UNSAFE: String interpolation (vulnerable to SQL injection)
Result records: 10
+---------+-------------------+-----------+--------+-----------+------+
|sensor_id|cur_timestamp      |temperature|humidity|location   |status|
+---------+-------------------+-----------+--------+-----------+------+
|SENSOR_01|2024-01-15 10:00:00|22.5       |45.2    |warehouse_A|normal|
|SENSOR_02|2024-01-15 10:05:00|35.8       |78.5    |warehouse_A|normal|
|SENSOR_03|2024-01-15 10:10:00|18.2       |42.1    |warehouse_B|normal|
|SENSOR_01|2024-01-15 10:15:00|23.1       |46.8    |warehouse_A|normal|
|SENSOR_02|2024-01-15 10:20:00|38.5       |82.3    |warehouse_A|alert |
|SENSOR_04|2024-01-15 10:25:00|15.2       |38.5    |warehouse_C|normal|
|SENSOR_03|2024-01-15 10:30:00|19.1       |43.7    |warehouse_B|normal|
|SENSOR_01|2024-01-15 10:35:00|24.2       |47.5    |warehouse_A|normal|
|SENSOR_04|2024-01-15 10:40:00|12.8       |35.2    |warehouse_C|alert |
|SENSOR_02|2024-01-15 10:45:00|32.1       |72.5    |warehouse_A|normal|
+---------+-------------------+-----------+--------+-----------+------+

SAFE: Variable substitution (injection-proof)
Result records: 0
+---------+-------------+-----------+--------+--------+------+
|sensor_id|cur_timestamp|temperature|humidity|location|status|
+---------+-------------+-----------+--------+--------+------+
+---------+-------------+-----------+--------+--------+------+


```




# Multi-Statement SQL Scripts

## Introduction

[Multi-statement SQL scripts](https://spark.apache.org/docs/latest/sql-ref-scripting.html) enable executing multiple SQL commands in a single script file with procedural control flow. 
Supports variable declarations, conditional logic (IF/ELSE), loops (WHILE, FOR), exception handling (BEGIN/END blocks), and statement sequencing. 

## Detail

Before Spark 4.0, executing multiple SQL statements required either:
1. **Application-Level Orchestration** : Each statement is a separate API call. No transactional semantics. Failure handling requires try-catch blocks in application code.
```python
spark.sql("CREATE TABLE staging AS SELECT * FROM source")
spark.sql("DELETE FROM staging WHERE invalid = true")
spark.sql("INSERT INTO target SELECT * FROM staging")
```
2. **External Workflow Tools** : Adds operational complexity. Requires separate orchestration infrastructure. Simple SQL logic becomes Python/YAML configuration.
3. **Multiple Spark SQL Invocations** : No state sharing between invocations. Cannot pass variables. Poor performance due to repeated session initialization.


Spark 4.0 introduces multi-statement scripts that execute as a single unit. Scripts contain multiple SQL statements separated by semicolons, with procedural control flow.

The script parser breaks input into individual statements and builds an execution plan. Each statement executes sequentially. Variables declared in early statements are available to later statements. Control flow statements (IF/ELSE, WHILE) alter execution order based on runtime conditions.

> - Scripts execute on the Spark driver. 
> - Control flow is evaluated on the driver, not distributed to executors.
> - Each statement goes through normal Catalyst optimization and execution. 
> - The execution model is **sequential, not transactional** : If statement 3 fails, statements 1 and 2 have already committed their changes. There is no automatic rollback. This differs from traditional database stored procedures which often provide transaction semantics.


Key language constructs :
- [Variable Declaration and Assignment](https://spark.apache.org/docs/latest/control-flow/compound-stmt.html)
- Conditional Execution : [IF](https://spark.apache.org/docs/latest/control-flow/if-stmt.html), [CASE](https://spark.apache.org/docs/latest/control-flow/case-stmt.html) 
- [Iterative Execution](https://spark.apache.org/docs/latest/control-flow/loop-stmt.html) : [WHILE](https://spark.apache.org/docs/latest/control-flow/while-stmt.html), [FOR](https://spark.apache.org/docs/latest/control-flow/for-stmt.html), [REPEAT](https://spark.apache.org/docs/latest/control-flow/repeat-stmt.html)
- [Exception Handling](https://spark.apache.org/docs/latest/control-flow/compound-stmt.html)



## Advantages

1. **Reduced External Dependencies**  : Simple ETL pipelines no longer require specific orchestration tools. SQL scripts can implement validation, transformation, and loading logic in a single file. Reduces operational complexity and infrastructure costs.
2. **Procedural Logic in SQL**  :  IF/ELSE and WHILE constructs enable business logic implementation directly in SQL. Reduces context switching between SQL and Python/Scala. Teams with strong SQL skills can build complete pipelines without application code.
3. **Version Control and Portability**  : Scripts are plain text files that live in version control. Changes are tracked through Git. Scripts are portable across Spark deployments (local, cluster, Connect). Easier to review and audit than application code spread across multiple files.
4. **Server-Side Execution**  : With Spark Connect, entire script is sent to server and executes remotely. Reduces network round-trips compared to per-statement submission. Client only receives final results, not intermediate state.


## Limitations

1. **No Transaction Rollback** : Failed statements do not automatically undo previous statements. If script creates staging table, loads data, then fails on validation, the staging table remains. Manual cleanup required. This is fundamentally different from ACID databases.
2. **Limited Debugging Capabilities** : No interactive debugger. No breakpoints. No variable inspection during execution. Debugging requires adding SELECT statements to print intermediate values. Error messages may not clearly indicate which statement failed in complex scripts.
3. **Complexity Threshold**  : Complex logic is better implemented in application code with proper testing frameworks. Scripts should remain linear data pipelines, not full applications.
4. **Error Handling Gaps**  : Cannot catch specific error types with granularity of try-catch in Python/Scala. Cannot continue execution after certain errors. Script failure model is all-or-nothing for many error types.


## Real-World Use Cases

- **Use Case 1 : Incremental Loading** 
    - A loop that processes 24 hourly partitions one by one. 
    - A Script that adds new partitions for the 30 next days, checking if already exists.
- **Use Case 2 : Environment-Specific Deployment**
    - Deployment scripts must create different table structures in dev vs prod (dev has additional debug columns). Script uses IF/ELSE based on environment variable to execute appropriate `CREATE TABLE` statements. Single script replaces separate dev and prod SQL files.




## Codes

### Example :  Execute multi-statement script with Spark Connect

#### Spark

Content of Spark Connect script : 
```python
from pyspark.sql import SparkSession

REMOTE_URL = "sc://localhost:15002"
SCRIPT_SQL_NAME = "example_SQL.sql"

# Connexion to Spark Connect
spark = SparkSession.builder \
    .remote(REMOTE_URL) \
    .appName("SPARK_SQLScript") \
    .config("spark.sql.ansi.enabled", "true") \
    .getOrCreate()

print("Successfully connected to Spark!")
print(f"Spark version: {spark.version}")

# Script reading
with open(SCRIPT_SQL_NAME, "r", encoding="utf-8") as f:
    sql_script = f.read()

# Script SQL execution with only one spark call
result = spark.sql(sql_script)
result.show()
```

Content of the `example_SQL.sql` SQL script file :
```SQL
-- Spark 4.x - SQL Scripting

BEGIN
    -- =============================================
    -- STEP n°1 : VARIABLES
    -- =============================================
    DECLARE batch_date DATE DEFAULT CURRENT_DATE();

    -- Business thresholds
    DECLARE min_valid_amount DECIMAL(10,2) DEFAULT 10.00;
    DECLARE standard_threshold DECIMAL(10,2) DEFAULT 100.00;
    DECLARE premium_threshold DECIMAL(10,2) DEFAULT 1000.00;

    -- Metrics
    DECLARE total_processed INT DEFAULT 0;
    DECLARE total_invalid INT DEFAULT 0;
    DECLARE total_revenue DECIMAL(15,2) DEFAULT 0.0;

    -- =============================================
    -- STEP n°2 : TABLES INITIALIZATION
    -- =============================================

    -- Staging table for raw data
    DROP TABLE IF EXISTS raw_orders;
    CREATE TABLE raw_orders (
        order_id BIGINT,
        customer_id BIGINT,
        order_date DATE,
        amount DECIMAL(10,2),
        status STRING,
        region STRING
    ) USING parquet;

    -- Table of validated orders
    DROP TABLE IF EXISTS validated_orders;
    CREATE TABLE validated_orders (
        order_id BIGINT,
        customer_id BIGINT,
        order_date DATE,
        amount DECIMAL(10,2),
        region STRING,
        order_category STRING,
        loyalty_points DECIMAL(10,2),
        processing_date DATE
    ) USING parquet;

    -- Quarantine table for invalid data
    DROP TABLE IF EXISTS invalid_orders;
    CREATE TABLE invalid_orders (
        order_id BIGINT,
        customer_id BIGINT,
        amount DECIMAL(10,2),
        error_reason STRING,
        quarantine_timestamp TIMESTAMP
    ) USING parquet;

    -- =============================================
    -- STEP n°3 : DATASETS
    -- =============================================

    INSERT INTO raw_orders VALUES
        (1001, 501, DATE'2024-01-15', 150.50, 'completed', 'EMEA'),
        (1002, 502, DATE'2024-01-15', 1250.00, 'completed', 'AMER'),
        (1003, 503, DATE'2024-01-15', -50.00, 'completed', 'APAC'), -- Invalid: negative
        (1004, 504, DATE'2024-01-15', 890.00, 'completed', 'EMEA'),
        (2001, 505, DATE'2024-01-16', 2100.00, 'completed', 'AMER'),
        (2002, 506, DATE'2024-01-16', NULL, 'completed', 'APAC'), -- Invalid: NULL amount
        (2003, 507, DATE'2024-01-16', 450.00, 'completed', 'EMEA'),
        (2004, 508, DATE'2024-01-16', 5.00, 'completed', 'AMER'), -- Invalid: below minimum
        (3001, 509, DATE'2024-01-17', 750.00, 'completed', 'APAC'),
        (3002, 510, DATE'2024-01-17', 1500.00, 'completed', 'EMEA'),
        (3003, 511, DATE'2024-01-17', 220.00, 'completed', 'AMER');

    -- =============================================
    -- STEP n°4 : DATA VALIDATION
    -- =============================================

    -- Quarantining invalid records
    INSERT INTO invalid_orders
    SELECT 
        order_id,
        customer_id,
        amount,
        CASE 
            WHEN amount IS NULL THEN 'NULL_AMOUNT'
            WHEN amount < 0 THEN 'NEGATIVE_AMOUNT'
            WHEN amount < min_valid_amount THEN 'BELOW_MINIMUM'
            ELSE 'UNKNOWN_ERROR'
        END AS error_reason,
        CURRENT_TIMESTAMP() AS quarantine_timestamp
    FROM raw_orders
    WHERE status = 'completed'
        AND (amount IS NULL 
            OR amount < 0 
            OR amount < min_valid_amount);

    -- Counting invalid rows
    SET total_invalid = (SELECT COUNT(*) FROM invalid_orders);
            
    -- =============================================
    -- STEP n°5 : VALID DATA TRANSFORMATION
    -- =============================================

    INSERT INTO validated_orders
    SELECT 
        order_id,
        customer_id,
        order_date,
        amount,
        region,
        -- CASE WHEN classification
        CASE 
            WHEN amount >= premium_threshold THEN 'PREMIUM'
            WHEN amount >= standard_threshold THEN 'STANDARD'
            ELSE 'BASIC'
        END AS order_category,
        -- Calculation of loyalty points
        CASE 
            WHEN amount >= premium_threshold THEN amount * 0.10
            WHEN amount >= standard_threshold THEN amount * 0.05
            ELSE amount * 0.02
        END AS loyalty_points,
        batch_date AS processing_date
    FROM raw_orders
    WHERE status = 'completed'
        AND amount IS NOT NULL
        AND amount >= min_valid_amount;
        
    -- Counting total rows processed
    SET total_processed = (SELECT COUNT(*) FROM validated_orders WHERE processing_date = batch_date);
            
    -- Revenue calculation
    SET total_revenue = (SELECT COALESCE(SUM(amount), 0) FROM validated_orders WHERE processing_date = batch_date);


    -- =============================================
    -- STEP n°6 : GENERATION OF FINAL REPORTS
    -- =============================================
    SELECT '========== EXECUTION - SUMMARY ==========' AS message;

    -- Execution report
    SELECT 'Batch Date' as `Metric`, CAST(batch_date AS STRING) as `Value`
    UNION ALL SELECT 'Total Valid Orders', CAST(total_processed AS STRING)
    UNION ALL SELECT 'Total Invalid Orders', CAST(total_invalid AS STRING)
    UNION ALL SELECT 'Total Revenue', CAST(total_revenue AS STRING)
    UNION ALL SELECT 'Invalid Ratio %', CAST(ROUND((total_invalid * 100.0) / GREATEST(total_processed + total_invalid, 1), 2) AS STRING);

    -- =============================================
    -- STEP n°7 : DROP TABLES
    -- =============================================
    DROP TABLE IF EXISTS raw_orders;
    DROP TABLE IF EXISTS validated_orders;
    DROP TABLE IF EXISTS invalid_orders;

END;

```

#### Result
```text
Successfully connected to Spark!
Spark version: 4.1.1
+--------------------+----------+
|              Metric|     Value|
+--------------------+----------+
|          Batch Date|2026-03-10|
|  Total Valid Orders|         8|
|Total Invalid Orders|         3|
|       Total Revenue|   7310.50|
|     Invalid Ratio %|     27.27|
+--------------------+----------+
```
