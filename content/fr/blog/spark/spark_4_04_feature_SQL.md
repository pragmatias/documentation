---
Categories : ["Spark"]
Tags : ["Spark"]
title : "Spark : v4.x - Fonctionnalités - Scripts SQL, Session et Conformité ANSI"
date : 2026-03-13
draft : false
toc: true
---


Vous trouverez dans cet article, des informations sur les fonctionnalité SQL (Script, Session, Conformité) à partir de [Spark v4.x](https://spark.apache.org/releases/spark-release-4-0-0.html).


<!--more-->

# Conformité ANSI SQL

## Introduction


It enables type safety, prevents implicit casting errors and enforces reserved keyword restrictions.

Le mode de conformité ANSI SQL applique une sémantique SQL plus stricte correspondant à la [norme ISO/IEC 9075](https://www.iso.org/standard/76583.html).
Cela permet de limiter les erreurs de typage, empêcher les erreurs de conversion implicite et appliquer les restrictions sur les mots-clés réservés.

## Détail

Le comportement SQL par défaut de Spark privilégie la facilité d'utilisation plutôt que la rigueur.
Les conversions de types implicites réussissent silencieusement même lorsqu'elles sont sémantiquement incorrectes. La division d'entiers retourne des entiers (troncature). Les opérations de dépassement de capacité bouclent sans erreur. Les mots-clés réservés peuvent être utilisés comme noms de colonnes sans guillemets.

La conformité ANSI SQL modifie fondamentalement ces comportements pour correspondre aux bases de données traditionnelles comme PostgreSQL, SQL Server et autres. 
Les changements affectent trois domaines principaux :
- **Rigueur du système de types** : Les requêtes échouent au lieu de retourner silencieusement des résultats tronqués ou `null`
- **Gestion des NULL** : Le mode ANSI applique une sémantique `NULL` plus stricte dans les prédicats et les opérations ensemblistes. `NULL = NULL` retourne toujours `NULL` (pas vrai). `UNION`, `INTERSECT` et `EXCEPT` traitent les valeurs `NULL` comme égales pour la déduplication (conformément à la norme SQL).
- **Mots-clés réservés** : Le mode ANSI applique les restrictions sur les mots-clés réservés au SQL. Les noms de colonnes comme `SELECT`, `FROM`, `WHERE` doivent être entourés de backticks (guillemets inversés). Cela correspond au comportement des bases de données traditionnelles mais casse les requêtes Spark SQL qui utilisent ces noms librement.

L'implémentation affecte plusieurs composants de Spark :
- **Optimiseur Catalyst** : Ajoute des règles de validation de types pendant la phase d'analyse. Rejette les requêtes avec des incompatibilités de types plus tôt dans la planification.
- **Génération de code** : Modifie le code généré pour les opérations arithmétiques afin d'inclure des vérifications de dépassement de capacité. Ajoute des instructions de branchement qui vérifient les conditions de dépassement avant de retourner les résultats.
- **Exécution à la volée (runtime)** : Encapsule les opérations dans des gestionnaires d'exceptions qui font échouer les tâches en cas de violations ANSI. Cela change la gestion des erreurs d'une propagation silencieuse de NULL à des échecs explicites.

Le mode est configuré par session via `spark.sql.ansi.enabled`. Une fois activé, toutes les requêtes de cette session suivent les règles ANSI.

### Conseils

- **`spark.sql.ansi.enabled = true`** :
    - Interrupteur principal pour la conformité ANSI. Active tous les comportements stricts : vérification du dépassement de capacité, sûreté des types, sémantique de division.
    - Doit être défini avant la création de la session pour un comportement cohérent.
    - Ne peut pas être modifié en cours de session dans certains modes de déploiement Spark.
- **`TRY_CAST` vs `CAST` en mode ANSI** :
    - `CAST()` lève des exceptions en cas d'erreurs de conversion en mode ANSI. `TRY_CAST()` retourne `NULL` mais signale explicitement l'échec de validation.
    - Utilisez `TRY_CAST()` pour les pipelines de validation de données où les lignes incorrectes doivent être filtrées/journalisées plutôt que de faire échouer la tâche entière.
- **Fonction `typeof()`** :
    - Retourne le type de données d'un résultat d'expression. Indique si le résultat est `INT`, `DECIMAL`, `DOUBLE`, etc. À utiliser pour identifier les changements de type (dans le cas d'une migration par exemple).
- **Guillemets pour les mots-clés réservés** :
    - Le mode ANSI impose l'utilisation de backticks (guillemets inversés) pour les mots réservés. Les requêtes avec des noms de colonnes comme `user`, `timestamp`, `order` doivent être réécrites. Il s'agit d'un changement critique pour les grandes bases de code SQL.
    - Exécutez une analyse statique pour identifier les requêtes affectées avant la migration.


## Avantages


1. **Amélioration de la sureté des types** : La vérification stricte des types détecte les erreurs lors de la compilation de la requête plutôt qu'à l'exécution. Les problèmes d'évolution de schéma apparaissent plus tôt. Empêche les problèmes de qualité des données de se propager par les pipelines de données.
2. **Détection d'erreurs rapide** : Les incompatibilités de types et les erreurs arithmétiques échouent immédiatement au lieu de produire silencieusement des résultats incorrects. Un pipeline qui traite des transactions financières ne corrompra pas silencieusement les données en cas de dépassement de capacité. Les erreurs apparaissent pendant les tests plutôt qu'en production.
3. **Compatibilité de migration de base de données** : Les requêtes qui fonctionnaient correctement dans la base de données source se comportent de manière identique dans Spark. (Réduit le risque de migration et la charge de test)
4. **Conformité réglementaire** : Les secteurs des services financiers et de la santé exigent un comportement de requête déterministe et auditable. Le mode ANSI fournit une sémantique prévisible qui correspond aux attentes réglementaires. 



## Limitations

1. **Modifications incompatibles avec les requêtes existantes** : Les requêtes qui s'appuyaient sur le comportement permissif de Spark échoueront. Les opérations CAST qui retournaient précédemment NULL lèvent maintenant des exceptions. Les résultats de division d'entiers changent de 0 à 0,5. Les grandes bases de code nécessitent des tests et une refactorisation approfondis.
2. **Surcoût en terme de performance** : Chaque addition, multiplication et division inclut des branches conditionnelles pour vérifier le dépassement de capacité. Les traitements avec beaucoup de calcul sur un volume important de donnée peut subir une dégradation de performance.
3. **Configuration tout ou rien** : Impossible d'activer le mode ANSI pour des requêtes ou des tables spécifiques. Le paramètre au niveau de la session affecte toutes les opérations. Une migration progressive nécessite l'exécution de deux sessions Spark distinctes avec des configurations différentes.
4. **Les erreurs peuvent faire échouer des tâches entières** : Une seule ligne avec une erreur de conversion de type fait échouer la tâche entière. En mode par défaut, les lignes incorrectes deviennent NULL et le traitement continue. Le mode ANSI manque d'une gestion d'erreur au niveau de la ligne. Nécessite une pré-validation ou un pipeline de gestion d'erreurs distinct.




## Cas d'usages (concret)

- **Cas d'usage 1 : Migration de PostgreSQL vers Spark**
    - Une entreprise migre plus de 500 requêtes SQL d'un entrepôt de données PostgreSQL vers un cluster Spark. Les requêtes contiennent des divisions d'entiers, des calculs sujets au dépassement de capacité et des dépendances de types strictes. Le mode ANSI permet d'exécuter les requêtes sans modification. Sans le mode ANSI, un pourcentage important des requêtes peut nécessiter une réécriture pour correspondre à la sémantique de PostgreSQL.
- **Cas d'usage 2 : Précision des calculs financiers**
    - Une société de services financiers calcule les intérêts courus sur des portefeuilles de prêts. La division d'entiers par défaut de Spark `principal * taux / 365` tronquerait à zéro pour les petits taux journaliers. Le mode ANSI impose une division décimale produisant des résultats précis. Cela peut éviter des erreurs de calcul de plusieurs millions de dollars.
- **Cas d'usage 3 : Pipeline de validation de la qualité des données**
    - Un pipeline ETL valide les données entrantes par rapport à des schémas de types stricts. Les enregistrements avec des conversions de types invalides doivent être rejetés et non silencieusement convertis en NULL. Le mode ANSI fait échouer les tâches dès le premier enregistrement incorrect, déclenchant des alertes. Les équipes enquêtent immédiatement sur les problèmes de qualité des données au lieu de découvrir des données corrompues en aval.



## Codes

### Exemple : Conversion des types et comportement des opérations arithmétiques

Cet exemple montre comment le mode ANSI modifie la conversion des types et les opérations arithmétiques. Il illustre les changements importants par rapport au comportement par défaut.

#### Spark : Mode par défaut
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

#### Résultat : Mode par défaut
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


#### Spark : Mode ANSI
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
#### Résultat : Mode ANSI
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




# Variables SQL de Session

## Introduction

Les [variables SQL de session](https://spark.apache.org/docs/4.1.1/sql-ref-syntax-ddl-declare-variable.html) permettent le paramétrage dynamique des requêtes sans concaténation de chaînes de caractères ni de fichiers de configuration externes. (Les variables sont limitées à la session et typées)

## Détail

Avant Spark 4.0, le paramétrage des requêtes SQL nécessitait trois approches problématiques :

1. **Interpolation des chaînes de caractères dans le code applicatif**
    * Risque : injection SQL si `country` provient d'une entrée utilisateur. Nécessite la recompilation du plan de requête pour chaque valeur de paramètre.
    * Exemple : 
```python
country = "US"
df = spark.sql(f"SELECT * FROM orders WHERE country = '{country}'")
```

2. **Propriétés de configuration Spark**
    * Syntaxe verbeuse. Limité aux types `String`. Pollution de l'espace de noms de configuration.
    * Exemple :
```python
spark.conf.set("my.param.country", "US")
spark.sql("SELECT * FROM orders WHERE country = '${spark.my.param.country}'")
```

3. **Fichiers de configuration externes**
    * Ajoute une dépendance aux systèmes externes. Possible dérive de configuration entre les environnements.
    * Exemple :
```python
params = yaml.load("config.yaml")
spark.sql(f"SELECT * FROM orders WHERE country = '{params['country']}'")
```


Spark 4.0 introduit les variables SQL qui résolvent ces problèmes. Les variables sont déclarées avec des types explicites et limitées à la session :
```sql
DECLARE min_amount DECIMAL(10,2) DEFAULT 100.0;
SELECT * FROM orders WHERE amount >= min_amount;
```

Les deux syntaxes supportées : 
1. **Instruction `DECLARE` (Norme SQL)**
    * Déclaration de type explicite. Requis en mode ANSI SQL. 
    * Exemple :
```sql
DECLARE variable_name TYPE [DEFAULT value];
```
2. **Instruction `SET` (Rétrocompatibilité)**
    * Type déduit de la valeur. Compatible avec la syntaxe des propriétés de session Spark 3.x. Les variables sont typées de manière sûre une fois définies.
    * Exemple :
```sql
SET variable_name = value;
```

La référence est résolue lors de la compilation de la requête, pas à l'exécution. Cela permet à l'optimiseur Catalyst d'utiliser les valeurs des variables pour le `pushdown` de prédicats et l'élagage de partitions (`partition pruning`).

Le système de variables maintient une table de symboles au niveau de la session. Chaque variable possède :
- **Nom** : Identifiant utilisé dans les requêtes
- **Type** : Type de données scalaire (Int, String, Decimal, Boolean, Date, Timestamp)
- **Valeur** : Valeur actuelle (mutable avec SET ultérieurs)
- **Portée** : Session uniquement (non visible par les autres sessions)


Les variables s'intègrent à la planification des requêtes. Lorsque Catalyst analyse une requête avec `variable_name`, il :
1. Recherche la variable dans la table de symboles de session
2. Remplace la référence par la valeur littérale
3. Procède à l'optimisation en utilisant la valeur concrète

Les performances d'exécution sont identiques aux littéraux codés en dur.


## Avantages

1. **Paramétrage `Type-Safe`** : Les variables ont des types explicites vérifiés à la déclaration. L'assignation d'un mauvais type produit une erreur de compilation. Cela prévient les erreurs de type à l'exécution provenant de paramètres mal configurés. 
2. **Prévention de l'injection SQL** : Les références de variables sont résolues lors de la compilation de la requête, pas par substitution de chaînes de caractères à l'exécution. Les entrées malveillantes dans les valeurs de variables ne peuvent pas altérer la structure de la requête.
3. **Configuration multi-environnement simplifiée** : Le même script SQL s'exécute en dev/rec/prod avec différentes valeurs de variables. Aucune modification de code entre les environnements. Les variables peuvent être définies à partir d'arguments en ligne de commande ou de variables d'environnement au démarrage de la session.
4. **Paramétrage pris en compte par l'optimiseur Catalyst** : L'optimiseur Catalyst voit les valeurs des variables lors de la planification. Cela permet l'élagage de partitions (`partition pruning`) et le `pushdown` de prédicats basés sur les valeurs des variables. 




## Limitations

1. **Portée limitée à la session** : Les variables ne persistent pas après la clôture de la session. Pas de variables globales partagées entre sessions concurrentes. Chaque client doit redéclarer les variables. Inadapté pour la configuration au niveau du cluster nécessitant une cohérence entre les jobs.
2. **Pas de types complexes** : Les variables ne supportent que les types scalaires. Impossible de déclarer des variables `ARRAY`, `STRUCT` ou `MAP`. Le passage de valeurs de paramètres complexes nécessite toujours des propriétés de configuration ou un stockage externe.
3. **Pas d'API de persistance des variables** : Les variables ne peuvent pas être sauvegardées dans le metastore ou un stockage externe. Aucun mécanisme intégré pour charger des variables depuis des fichiers YAML/JSON. Les équipes doivent construire une gestion de variables personnalisée au-dessus des variables SQL de base.





## Cas d'usages (concret)

- **Cas d'usage 1 : Rapports paramétrés**
    - Définir une plage de dates en début de script et l'utiliser dans plusieurs requêtes sans répétition.
- **Cas d'usage 2 : Traitement de données spécifique à l'environnement**
    - Un pipeline ETL s'exécute dans les environnements dev, rec et prod. Chaque environnement lit depuis différents préfixes de base de données (`dev_db.orders`, `prod_db.orders`). Les variables `source_database` et `target_database` sont définies à partir de variables d'environnement au démarrage du job. Le même script SQL fonctionne dans tous les environnements sans modification.


## Codes
### Exemple : Fonctionnement des variables SQL

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

#### Résultat
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




# Scripts SQL Multi-Instructions

## Introduction

Les [scripts SQL multi-instructions](https://spark.apache.org/docs/latest/sql-ref-scripting.html) permettent d'exécuter plusieurs commandes SQL à partir d'un seul ensemble d'instructions (script) avec un flux de contrôle procédural.
Cela permet de prendre en charge les déclarations de variables, la logique conditionnelle (IF/ELSE), les boucles (WHILE, FOR), la gestion des exceptions (blocs BEGIN/END) et le séquencement des instructions.

## Détail

Avant Spark 4.0, l'exécution de plusieurs instructions SQL nécessitait soit :
1. **Orchestration au niveau applicatif** : Chaque instruction est un appel API séparé. Aucune sémantique transactionnelle. La gestion des échecs nécessite des blocs try-catch dans le code applicatif.
```python
spark.sql("CREATE TABLE staging AS SELECT * FROM source")
spark.sql("DELETE FROM staging WHERE invalid = true")
spark.sql("INSERT INTO target SELECT * FROM staging")
```
2. **Outils de workflow externes** : Ajoute de la complexité opérationnelle. Nécessite une infrastructure d'orchestration séparée. Une logique SQL simple devient une configuration Python/YAML.
3. **Invocations multiples de Spark SQL** : Aucun partage d'état entre les invocations. Impossible de passer des variables. Mauvaises performances dues à l'initialisation répétée de la session.

Spark 4.0 introduit les scripts multi-instructions qui s'exécutent comme une seule unité. Les scripts contiennent plusieurs instructions SQL séparées par des points-virgules, avec un flux de contrôle procédural.

L'analyseur de script décompose l'entrée en instructions individuelles et construit un plan d'exécution. Chaque instruction s'exécute séquentiellement. Les variables déclarées dans les premières instructions sont disponibles pour les instructions ultérieures. Les instructions de flux de contrôle (IF/ELSE, WHILE) modifient l'ordre d'exécution en fonction des conditions d'exécution.

> - Les scripts s'exécutent sur le driver Spark. 
> - Le flux de contrôle est évalué sur le driver, et non distribué aux exécuteurs.
> - Chaque instruction passe par l'optimisation et l'exécution Catalyst normales.
> - Le modèle d'exécution est **séquentiel, non transactionnel** : Si l'instruction 3 échoue, les instructions 1 et 2 ont déjà validé leurs modifications. Il n'y a pas de rollback automatique. Cela diffère des procédures stockées de bases de données traditionnelles qui fournissent souvent une sémantique transactionnelle.



Constructions linguistiques clés :
- [Déclaration et Affectation de Variables](https://spark.apache.org/docs/latest/control-flow/compound-stmt.html)
- Exécution Conditionnelle : [IF](https://spark.apache.org/docs/latest/control-flow/if-stmt.html), [CASE](https://spark.apache.org/docs/latest/control-flow/case-stmt.html) 
- [Exécution Itérative](https://spark.apache.org/docs/latest/control-flow/loop-stmt.html) : [WHILE](https://spark.apache.org/docs/latest/control-flow/while-stmt.html), [FOR](https://spark.apache.org/docs/latest/control-flow/for-stmt.html), [REPEAT](https://spark.apache.org/docs/latest/control-flow/repeat-stmt.html)
- [Gestion des Exceptions](https://spark.apache.org/docs/latest/control-flow/compound-stmt.html)



## Avantages

1. **Dépendances externes réduites** : Les pipelines ETL simples ne nécessitent plus des outils d'orchestration spécifiques. Les scripts SQL peuvent implémenter la logique de validation, transformation et chargement dans un seul fichier. Cela peut réduire la complexité opérationnelle et les coûts d'infrastructure.
2. **Logique procédurale en SQL** : Les constructions IF/ELSE et WHILE permettent l'implémentation de la logique métier directement en SQL. Réduit les changements de contexte entre SQL et Python/Scala. Les équipes ayant de solides compétences SQL peuvent construire des pipelines complets sans code applicatif.
3. **Contrôle de version et portabilité** : Les scripts sont des fichiers texte brut qui résident dans le contrôle de version. Les modifications sont suivies via Git. Les scripts sont portables entre les déploiements Spark (local, cluster, Connect). Plus facile à réviser et auditer que du code applicatif réparti sur plusieurs fichiers.
4. **Exécution côté serveur** : Avec Spark Connect, le script entier est envoyé au serveur et s'exécute à distance. Réduit les allers-retours réseau par rapport à la soumission instruction par instruction. Le client ne reçoit que les résultats finaux, pas l'état intermédiaire.



## Limitations

1. **Pas de rollback transactionnel** : Les instructions échouées n'annulent pas automatiquement les instructions précédentes. Si le script crée une table de staging, charge des données, puis échoue lors de la validation, la table de staging reste. Un nettoyage manuel est requis. Ceci est fondamentalement différent des bases de données ACID.
2. **Capacités de correction des erreurs limitées** : Pas de correction des erreurs interactive. Pas de points d'arrêt. Pas d'inspection de variables pendant l'exécution. La correction d'erreur nécessite d'ajouter des instructions SELECT pour afficher les valeurs intermédiaires. Les messages d'erreur peuvent ne pas indiquer clairement quelle instruction a échoué dans les scripts complexes.
3. **Seuil de complexité** : La logique complexe est mieux implémentée dans le code applicatif avec des frameworks de tests appropriés. Les scripts doivent rester des pipelines de données linéaires, et non des applications complètes.
4. **Limitation dans la gestion des erreurs** : Impossible de capturer des types d'erreur spécifiques avec la granularité du try-catch en Python/Scala. Impossible de continuer l'exécution après certaines erreurs. Le modèle d'échec de script est tout-ou-rien pour de nombreux types d'erreur.


## Cas d'usages (concret)

- **Cas d'usage 1 : Chargement Incrémental**
    - Une boucle qui traite 24 partitions horaires une par une.
    - Un script qui ajoute de nouvelles partitions pour les 30 prochains jours, en vérifiant si elles existent déjà.
- **Cas d'usage 2 : Déploiement Spécifique à l'Environnement** 
    - Les scripts de déploiement doivent créer différentes structures de tables en dev et en prod. Le script utilise IF/ELSE basé sur une variable d'environnement pour exécuter les instructions `CREATE TABLE` appropriées. Un seul script remplace des fichiers SQL séparés pour dev et prod.


## Codes

### Exemple :  Exécution d'un script SQL multi-instructions avec Spark Connect

#### Spark

Contenu du script Spark Connect : 
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

Contenu du script SQL `example_SQL.sql` :
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

#### Résultat
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
