---
Categories : ["Spark"]
Tags : ["Spark"]
title : "Spark : v4.x - Fonctionnalités - Variant Data Type"
date : 2026-03-17
draft : false
toc: true
---

Vous trouverez dans cet article, des informations sur le type de données [Variant](https://parquet.apache.org/docs/file-format/types/variantencoding/) de [Spark v4.x](https://spark.apache.org/releases/spark-release-4-0-0.html).

<!--more-->

# Introduction

Le type de données [VARIANT](https://parquet.apache.org/docs/file-format/types/variantencoding/) permet de stocker des données semi-structurées (JSON, XML, objets imbriqués) sans schéma prédéfini.
Il permet le `schema-on-read` pour les données hétérogènes. Il stocke les données dans un format binaire efficace avec des métadonnées pour l'information des types. Il prend en charge l'accès basé sur les chemins (`variant_col:field.path`) et la conversion de types.


# Detail

Avant Spark 4.0, la gestion des données semi-structurées nécessitait de choisir entre trois approches problématiques :
1. **Stocker comme `STRING` et parser à l'exécution** : Exécution du parsing à chaque requête. Mauvaises performances. Incompatible avec le `pushdown` de prédicats.
2. **Définir un schéma `STRUCT` rigide** : Le schéma doit être connu à l'avance. L'évolution du schéma nécessite des modifications sur la table. Les champs `null` gaspillent l'espace de stockage. Les données hétérogènes ne s'adaptent pas.
3. **Utiliser `MAP<STRING, STRING>`** : Tout est en chaînes de caractères. Pas d'accès imbriqué. Conversion de type manuelle requise.

Spark 4.0 introduit le type VARIANT. Il permet de stocker des données semi-structurées dans un format binaire en colonnes qui préserve les types de données :

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

Le format de stockage se compose de trois composants :
1. **Section Valeur** : Les données réelles stockées dans un format binaire compressé. Les nombres, chaînes, booléens stockés dans des types natifs. Les structures imbriquées préservées.
2. **Section Métadonnées** : Informations de schéma pour chaque valeur. Les balises de type indiquent si la valeur est INT, STRING, OBJECT, ARRAY, etc. Permet l'extraction `type-safe` sans parsing.
3. **Index d'Offset** : Pointeurs vers les champs imbriqués pour un accès rapide basé sur les chemins. Permet l'accès par `payload:user.name` en temps `O(1)` sans scanner tout l'objet.


Cette conception permet plusieurs opérations :
1. **Accès basé sur les chemins** : Extrait les valeurs imbriquées sans parsing. La syntaxe deux-points (`:`) permet de naviguer dans la structure. Notation par points pour les objets imbriqués. Notation par crochets pour les tableaux :
```sql
variant_column:field.nested.path
```

2. **Conversion de Type** : La syntaxe double deux-points convertit le variant vers un type spécifique. Échoue si les types sont incompatibles. Utilisez TRY_CAST pour une conversion sûre : `TRY_CAST(variant_column AS INT)`.
```sql
variant_column::INT
variant_column::STRING
```

3. **Introspection de Type** : Retourne le nom du type. Permet la vérification de type à l'exécution.
```sql
schema_of_variant(variant_column)
```

L'optimiseur Catalyst prend en charge les opérations VARIANT. Le pushdown de prédicats fonctionne pour les champs de premier niveau. Par exemple, `WHERE payload:status::STRING = 'active'` peut ignorer les partitions où le champ `status` ne correspond pas. Cependant, les prédicats imbriqués peuvent ne pas être utilisable efficacement pour un `pushdown`.


Liste des fonctions pour manipuler les données de type VARIANT : [Documentation SQL](https://spark.apache.org/docs/latest/api/python/reference/pyspark.sql/functions.html#variant-functions)

## Comparaison 

| Critère               | STRING + JSON     | STRUCT  | VARIANT             |
| --------------------- | ----------------- | ------- | ------------------- |
| Schéma fixe requis    | Non               | Oui     | Non                 |
| Performance lecture   | Faible (re-parsé) | Élevée  | Bonne (pré-indexé)  |
| Performance écriture  | Élevée            | Bonne   | Bonne               |
| Schémas hétérogènes   | Oui               | Non     | Oui                 |
| Pushdown de filtres   | Limité            | Complet | Partiel             |


## Shredding

[Le `shredding`](https://parquet.apache.org/docs/file-format/types/variantshredding/) est une technique hybride. Au lieu de stocker le JSON comme une simple chaîne de caractères, Spark analyse les données et crée :
- Des colonnes de métadonnées pour les champs qui reviennent souvent (ex: id, sensor).
- Une colonne "reste" qui contient tout ce qui est trop rare ou trop complexe pour être décomposé.

**C'est un mécanisme important pour** : 
- La performance (I/O) : Si vous faites une requête pour accéder à l'information `$.sensor`, Spark ne lit physiquement que la colonne `shredded` correspondant à ce champ. Il ignore tout le reste du document JSON.
- La compression : Comme les données décomposées sont typées (ex: tous les IDs sont des entiers), les algorithmes de compression comme Snappy ou Zstd sont beaucoup plus efficaces que sur du texte brut.

La limite du `shredding` :  Cela ne transforme pas l'ensemble des éléments du Variant en colonnes. Spark utilise une limite (généralement sur le nombre de champs ou la profondeur) pour éviter de créer des milliers de colonnes dans Parquet.


> **Attention** : Le `shredding` ne se produit que si Spark détecte que les données sont suffisamment répétitives pour valoir le coup d'être extraites en colonnes. Sur un petit échantillon, il est possible que Spark décide de ne pas faire de `shredding`.


**Démonstration du format stockage** avec et sans `shredding` (avec l'utilisation de `duckdb` pour voir la structure du stockage) :
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

**Résultat de la démonstration** :

**1/ Concernant le fichier `data_variant_ns.parquet`**
- Ce fichier ne contient que deux lignes de données et par conséquent, Spark n'applique pas de `shredding` par défaut.
- Cela est confirmé en utilisant la commande `duckdb -c "DESCRIBE SELECT * FROM '~/{folder_data}/files/data_variant_ns.parquet/*.parquet';"` qui permet d'afficher la description du type de la colonne `data` qui stocke le JSON en VARIANT (qui est un `STRUCT` composé de `metadata` et `value`)
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

**2/ Concernant le fichier  `data_variant_sc.parquet`**
- Ce fichier contient 10 lignes de données et Spark applique un `Shredding` par défaut.
- Cela se confirme en utilisant la commande `duckdb -c "DESCRIBE SELECT * FROM '~/{folder_data}/files/data_variant_sc.parquet/*.parquet';"` qui permet d'afficher la description du type de la colonne `data` qui stocke le JSON en VARIANT (qui est un `STRUCT` composé de `metadata` et `value` mais avec cette fois en plus l'information `typed_value` qui est le résultat du `shredding`)
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



## Conseils

- `from_json` nécessite de connaître le schéma à l'avance, alors que `parse_json` préserve la flexibilité des données brutes tout en les optimisant.
- Utilisez `VARIANT` pour la couche Landing/Bronze (et l'exploration) et `STRUCT` pour la couche Optimisé/Gold


# Advantages

1. **Flexibilité du Schéma** : De nouveaux champs apparaissent sans `ALTER TABLE`. Les payloads d'événements évoluent au fil du temps sans casser les requêtes. Différents types d'événements stockés dans la même table. Critique pour l'event sourcing, l'intégration d'API et les environnements d'itération rapide.
2. **Meilleures performances que les données JSON** : L'encodage binaire évite la surcharge de parsing à l'exécution. Le `shredding` et les métadonnées permettent l'accès direct aux informations. Cela élimine les opérations coûteuses de regex ou parsing JSON lors de la lecture. Le stockage compressé réduit les I/O.
3. **`Schema-on-read` partiel** : Interrogez uniquement les champs dont vous avez besoin. Les champs inutilisés n'entraînent aucun coût d'extraction. Permet l'analyse exploratoire sur des schémas inconnus. Migrez progressivement vers des colonnes typées à mesure que le schéma se stabilise.
4. **Interopérabilité avec les systèmes JSON** : Parsing et sérialisation JSON directs. Compatible avec les API REST, files de messages, exports NoSQL. 




# Limitations


1. **Performances plus lentes que les types natifs** : Les agrégations sur les champs VARIANT sont plus lentes que les colonnes natives INT/DECIMAL. L'extraction et la validation de type se produisent à l'exécution. L'accès basé sur les chemins a une surcharge par rapport à l'accès direct aux colonnes. Non adapté pour l'analytique critique en performances sur des schémas stables.
2. **Pas de validation de schéma** : N'importe quel JSON peut être inséré. Aucune contrainte sur la présence ou les types de champs. Les fautes de frappe dans les noms de champs retournent silencieusement `NULL`. Les problèmes de qualité des données sont plus difficiles à détecter. Nécessite une validation au niveau applicatif.
3. **Support limité de l'optimiseur** : Les prédicats imbriqués complexes peuvent ne pas être poussés vers le stockage. La collecte de statistiques est limitée. L'optimisation des jointures est moins efficace que les types natifs. La planification de requête ne peut pas exploiter les informations de schéma pour l'optimisation.
4. **Surcharge de stockage pour les données simples** : Il est légèrement plus lourd qu'un `STRUCT` optimisé car il doit stocker des métadonnées supplémentaires pour chaque enregistrement
5. **Écosystème Immature** : Toutes les fonctions Spark ne prennent pas en charge le type VARIANT. Les outils BI et les connecteurs qui lisent directement les fichiers Parquet ne supportent pas encore tous le type VARIANT nativement.


> **Quand ne pas utiliser le type Variant** : 
> * Données hautement structurées
> * Opérations critiques en terme de performances
> * Colonnes partitionnées

# Real-World Use Cases

- **Cas d'usage 1 : Agrégation d'événements multi-sources**
    - Une plateforme de données ingère des événements provenant de plus de 20 microservices. Chaque service a des schémas d'événements différents qui évoluent indépendamment. Une table avec une colonne VARIANT stocke tous les événements sans coordination de schéma. Les requêtes extraient les champs spécifiques au service selon les besoins. L'évolution du schéma se produit sans modification du pipeline.
- **Cas d'usage 2 : Mise en cache de réponses d'API**
    - Un système met en cache les réponses API dans des tables Spark pour analyse. Les payloads API sont profondément imbriqués avec des champs optionnels. la colonne de type VARIANT stocke les réponses sans aplatissement. Les requêtes d'analyse extraient des chemins spécifiques. Les nouvelles versions d'API ajoutent des champs sans casser les requêtes existantes.


# Codes


## Exemple 1 : Manipulation du type Variant

> Note : Création d'un script SQL avec le contenu du code et utilisation de Spark SQL pour l'exécuter : `docker exec -it spark-master spark-sql --master "local[*]" --conf "spark.hadoop.hive.cli.print.header=true"  -f <script.sql> > script.log`
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

### Résultat

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


## Exemple 2 - Comparaison du plan d'exécution : VARIANT vs STRING vs STRUCT

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

### Résultat

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