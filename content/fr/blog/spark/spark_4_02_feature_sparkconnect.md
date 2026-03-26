---
Categories : ["Spark"]
Tags : ["Spark"]
title : "Spark : v4.x - Fonctionnalités - Spark Connect"
date : 2026-03-30
draft : false
toc: true
---

Vous trouverez dans cet article, des informations sur la fonctionnalité [Spark Connect](https://spark.apache.org/docs/latest/spark-connect-overview.html) de [Spark v4.x](https://spark.apache.org/releases/spark-release-4-0-0.html).

<!--more-->

# Introduction

[Spark Connect](https://spark.apache.org/docs/latest/spark-connect-overview.html) est une architecture client-serveur au sein d'Apache Spark qui permet la connectivité à distance aux clusters Spark depuis n'importe quelle application.

[Spark Connect](https://spark.apache.org/docs/latest/spark-connect-overview.html) découple les applications clientes des processus du cluster Spark grâce à une architecture client-serveur basée sur [gRPC](https://grpc.io/). Les clients envoient des plans logiques sur le réseau au lieu d'exécuter du code JVM dans le driver. 

Quelques éléments importants :
- Permet d'avoir des clients légers en Python, Scala, Java et d'autres langages sans nécessiter d'avoir les binaires Spark localement. 
- Réduit l'obligation d'avoir la même version entre le code client et le cluster. 
- Ajoute une latence réseau et une sérialisation supplémentaire. 
- Ne convient pas aux requêtes fréquentes de petite taille ou aux charges de travail intensives utilisant des UDFs. 
- Idéal pour les environnements de notebooks, les microservices et les plateformes multi-tenant où l'isolation de l'infrastructure est importante.


# Détail

L'architecture Spark traditionnelle nécessite que les applications clientes s'exécutent dans le processus JVM du driver. Lorsque vous appelez une action dans PySpark, le processus Python communique avec une JVM locale via Py4J, le driver JVM coordonne ensuite avec les exécuteurs Spark et ce couplage étroit crée plusieurs problèmes :
1. **Verrouillage de Version** : Le code client et le cluster doivent utiliser des versions identiques de Spark
2. **Surcharge de Ressources** : Le driver JVM consomme de la mémoire même pour des requêtes simples
3. **Complexité de Déploiement** : Les clients nécessitent la distribution complète de Spark
4. **Limitations de Langage** : L'ajout de nouveaux bindings de langage nécessite une intégration JVM

Spark Connect résout ces problèmes en implémentant un protocole client-serveur.
Le cluster Spark exécute un serveur Spark Connect qui accepte les plans de requêtes logiques via gRPC. Les bibliothèques clientes sérialisent les opérations DataFrame en messages `protocol buffer` et les envoient au serveur. Le serveur exécute les requêtes et renvoie les résultats en streaming.

Spark Connect est composé de trois nouveaux composants :
- **Connect Server** : Serveur gRPC s'exécutant dans le processus du driver Spark, écoute sur le port 15002 par défaut. (Gère l'état de session et l'exécution des requêtes)
- **Connect Client** : Bibliothèque cliente qui traduit les appels de l'API DataFrame en messages protocol buffer. (Aucune JVM Spark locale requise)
- **Définition Protocol Buffer** : Définit le schéma de messages pour les plans, configurations et résultats. Permet une implémentation cliente indépendante du langage. (Le protocole est versionné séparément du noyau Spark)

Spark Connect maintient l'isolation des sessions (Le client ne détient plus le SparkContext). Chaque connexion cliente obtient un ID de session unique. Les variables de session, vues temporaires et données en cache sont limitées à la session. Cela permet des déploiements multi-tenant où les clients ne peuvent pas interférer les uns avec les autres.

> Attention : En production, exposez Spark Connect derrière un API Gateway. Le port gRPC (15002) ne doit pas être accessible publiquement sans authentification.


# Avantages

1. **Empreinte Client Réduite** : Les bibliothèques clientes `Connect` sont 95% plus petites que la distribution complète de Spark. Le client Python fait 5 Mo contre plus de 300 Mo pour PySpark traditionnel. Cela permet le déploiement dans des environnements aux ressources limitées comme AWS Lambda ou des conteneurs légers. (Démarrage d'application plus rapide et tailles d'images Docker réduites)
2. **Découplage de Version** : Le code client écrit pour Spark Connect 4.0 peut fonctionner avec un serveur Spark Connect 4.1 sans redéploiement, tant que le protocole reste compatible. Cela réduit les problématiques de mise à niveau des versions. Les équipes peuvent mettre à niveau le cluster sans forcer les applications clientes à se mettre à jour simultanément.
3. **Isolation de l'Infrastructure** : Les applications clientes s'exécutent complètement séparément du cluster Spark. Aucune JVM locale requise. Les défaillances dans le code client (par exemple, les fuites mémoire) n'affectent pas le driver Spark. Permet des limites de sécurité plus strictes entre les notebooks de data science et les clusters de production.
4. **Support Multi-Langage** : L'API basée sur `protocol buffer` facilite l'implémentation d'un client avec de nouveaux langages. Pas besoin de maintenir l'intégration JVM pour chaque langage.



# Limitations

1. **Latence Réseau** : Chaque opération sur un DataFrame nécessite un aller-retour réseau pour la soumission du plan. Le développement interactif avec de nombreuses petites opérations peut sembler plus lent comparé au mode local.
2. **Limitations des UDF**  : Les UDFs Python nécessitent une sérialisation et une transmission vers le serveur. Le code UDF est envoyé sous forme [d'objets pickled](https://spark.apache.org/docs/latest/api/python/user_guide/udfandudtf.html). Le débogage est plus difficile car les exceptions UDF se produisent côté serveur. Les UDFs avec de grandes fermetures (closures) (variables capturées) atteignent les limites de sérialisation. Les UDF Pandas fonctionnent mais avec une surcharge plus élevée.
3. **Pas de Mode d'Exécution Local** : Spark Connect nécessite un serveur en cours d'exécution. Il est impossible d'utiliser le mode `local[*]` pour des tests rapides. Cela ajoute de la complexité au flux de travail de développement local et nécessite Docker ou un cluster distant même pour les tests unitaires.
4. **Parité de Fonctionnalités encore en évolution** : Certaines API RDD héritées et configurations de bas niveau spécifiques ne sont pas prises en charge.
5. **Déploiement Additionnel** : Le serveur Spark Connect doit être maintenu comme un service séparé. Sur Kubernetes, cela ajoute un composant à superviser.
6. **Debugging Plus Complexe :** Les stack traces traversent le réseau, ce qui rend le debugging d'erreurs d'exécution plus difficile qu'en mode local classique. En mode classique, une erreur dans une transformation PySpark inclue la stack trace Python complète avec les numéros de ligne. Via Spark Connect, l'erreur est générée côté serveur et remontée via gRPC, la stack trace est par conséquent moins directement exploitable.

> **Warning** : 
> - Via Spark Connect, un `collect()` sur un DataFrame de 10 millions de lignes peut saturer le buffer gRPC. 
> - Lorsque vous modifiez des configurations via `spark.conf.set`, certaines options ne sont pas propagées au moteur d'exécution de la même manière que dans une session Spark classique `in-process`.


> **Quand ne pas utiliser Spark Connect** : 
> * Tâches locales à faible latence
> * Débogage complexe d'UDF
> * Environnements sans un réseau stable



# Cas d'usages (concret)

- **Cas d'usage 1 : Environnement Jupyter Multi-Tenant**
    - Une plateforme de data science est utilisée par plus de 100 utilisateurs via JupyterHub. Spark nécessite que chaque notebook lance une JVM driver sur le cluster, consommant 2-4 Go de mémoire par utilisateur. Spark Connect permet à tous les notebooks de partager un seul cluster Spark. Les utilisateurs obtiennent des sessions isolées par défaut.
- **Cas d'usage 2 : Couche API de données pour Microservices**
    - Un microservice doit exécuter des requêtes Spark SQL mais dispose d'une limite de mémoire de 512 Mo dans Kubernetes. Un driver Spark complet nécessite plus de 2 Go de mémoire. Le client Spark Connect tient dans un conteneur de 100 Mo. Le service envoie les requêtes à un cluster Spark partagé et renvoie les résultats via une API REST. Cela permet d'utiliser Spark dans des déploiements aux ressources limitées.
- **Cas d'usage 3 : Pipeline de mise à niveau continue**
    - Une plateforme exécute un cluster Spark 4.0 mais dispose de plus de 50 applications clientes dans différents dépôts. L'approche traditionnelle nécessite de coordonner les mises à niveau sur tous les dépôts. Spark Connect permet de mettre à niveau le cluster vers la version 4.1 pendant que les clients restent sur la bibliothèque cliente 4.0. Une migration progressive réduit les risques et la charge de tests.
- **Cas d'usage 4 : Environnements de Développement Partagés**
    - Des ingénieurs connectant leur éditeur de code local (VS Code, PyCharm, ...) à un cluster Spark partagé. L'éditeur de code se connecte directement au cluster via `SPARK_REMOTE`, offrant l'auto-complétion et les tests locaux sans configuration complexe.



# Codes

## Utilisation de Spark Connect avec PySpark

Pour exécuter un script PySpark en utilisant Spark Connect :
1. Création d'un script Python nommé `spark-connect-app.py` 
2. Exécution du script Python créé : `python spark-connect-app.py`

> Note : pour avoir des informations sur l'exécution du script Python avec Spark Connect, il faut aller dans l'onglet `Connect` de [l'interface applicative des jobs](http://localhost:4040/connect/)

Contenu du script Python `spark-connect-app.py` :
```python
from pyspark.sql import SparkSession
from pyspark.sql.functions import col

REMOTE_URL = "sc://localhost:15002"
REP_DATA_FILES = "file:///opt/spark/data/files"

print("Attempting to connect to Spark Connect server...")

try:
    # Use the .remote() builder method to connect
    spark = SparkSession.builder.remote(REMOTE_URL).getOrCreate()

    print("Successfully connected to Spark!")
    print(f"Spark version: {spark.version}")
    print(f"ANSI mode: {spark.conf.get('spark.sql.ansi.enabled')}")

    data = [(1, "Alice"), (2, "Bob"), (3, "Charlie")]
    df = spark.createDataFrame(data, ["id", "name"])
    filtered_df = df.filter(col("id") > 1)
    filtered_df.show()

except Exception as e:
    print(f"❌ Failed to connect or run Spark job: {e}")

finally:
    # Stop the Spark session
    if 'spark' in locals():
        spark.stop()
    print("\nSpark session stopped.")
```


Contenu du fichier de log après exécution du script Python : 
```bash
Attempting to connect to Spark Connect server...
Successfully connected to Spark!
Spark version: 4.1.1
+---+-------+
| id|   name|
+---+-------+
|  2|    Bob|
|  3|Charlie|
+---+-------+


Spark session stopped.
```



