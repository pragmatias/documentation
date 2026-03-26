---
Categories : ["Spark"]
Tags : ["Spark"]
title : "Spark : v4.x - Introduction"
date : 2026-03-23
draft : false
toc: true
---

You'll find in this article some information about [Spark](https://spark.apache.org/) [v4.x](https://spark.apache.org/releases/spark-release-4-0-0.html) and how to create a local cluster with [Docker](https://www.docker.com/).

<!--more-->


# What's Spark

[Apache Spark](https://en.wikipedia.org/wiki/Apache_Spark) is a fast, general‑purpose cluster‑computing system that unifies batch, streaming, machine‑learning, and graph workloads under a single execution engine. It was created to address the limitations of Hadoop MapReduce by leveraging in‑memory data structures and an advanced optimizer. 

Core features :
- [RDD (Resilient Distributed Dataset)](https://spark.apache.org/docs/latest/rdd-programming-guide.html) : Immutable, fault‑tolerant distributed collections that expose transformations (map, filter, reduce) and actions
- [DataFrames / Datasets](https://spark.apache.org/docs/latest/sql-programming-guide.html) : Schema‑aware, relational API that blends SQL and programmatic access.
- [Spark SQL](https://spark.apache.org/docs/latest/sql-programming-guide.html) : SQL engine on top of Catalyst and Tungsten, supporting ANSI SQL, UDFs, and built‑in functions.
- [Catalyst Optimizer](https://www.databricks.com/glossary/catalyst-optimizer) : A rule‑based planner that rewrites logical plans into an efficient physical plan.
- [Tungsten Execution Engine](https://www.databricks.com/glossary/tungsten) : Binary, off‑heap storage and code generation for CPU‑efficient processing.
- [Structured Streaming](https://spark.apache.org/docs/latest/streaming/index.html) : Continuous query model that treats streaming data as an unbounded DataFrame.
- [MLlib](https://spark.apache.org/docs/latest/ml-guide.html) : Scalable machine‑learning library built on top of Spark Core and Spark SQL.
- [GraphX](https://spark.apache.org/docs/latest/graphx-programming-guide.html) : Graph processing API that operates on the same underlying cluster as DataFrames.


# What's new with Spark v4.x

[Apache Spark 4.0](https://spark.apache.org/news/spark-4-0-0-released.html) was officially released in May 2025 and [Spark 4.1.1](https://spark.apache.org/news/spark-4-1-1-released.html) was released in January 2026.
[Apache Spark 4.0](https://spark.apache.org/news/spark-4-0-0-released.html) represents the first major version release since [Spark 3.0](https://spark.apache.org/news/spark-3-0-0-released.html) in June 2020. 

This release is a real shift toward making Spark a "SQL-first" engine that rivals traditional cloud data warehouses in usability while improving capabilities in distributed computing. 

New key features : 
- [Spark Connect](https://spark.apache.org/docs/latest/spark-connect-overview.html) : Spark Connect decouples client applications from Spark cluster processes through a gRPC-based client-server architecture
- [Collation Support](https://issues.apache.org/jira/browse/SPARK-46830) : Spark 4.0 introduces explicit collation specification, enabling linguistic sorting (e.g., German ä sorting near a) and case-insensitive operations without custom UDFs.
- [ANSI SQL Compliance](https://spark.apache.org/docs/latest/sql-ref-ansi-compliance.html) : ANSI SQL compliance mode enforces stricter SQL semantics matching [ISO/IEC 9075 standard](https://www.iso.org/standard/76584.html)
- [Session SQL Variables](https://issues.apache.org/jira/browse/SPARK-42849) : Session SQL variables enable dynamic parameterization of queries without string concatenation or external configuration files.
- [Multi-Statement SQL Scripts](https://spark.apache.org/docs/latest/sql-ref-scripting.html) : Multi-statement SQL scripts enable executing multiple SQL commands in a single script file with procedural control flow. 
- [Variant Data Type](https://spark.apache.org/docs/latest/api/python/reference/pyspark.sql/api/pyspark.sql.types.VariantType.html) : The VARIANT data type stores semi-structured data (JSON, XML, nested objects) without predefined schema.
- [Spark Declarative Pipeline (SDP)](https://spark.apache.org/docs/latest/declarative-pipelines-programming-guide.html) : Declarative framework for building reliable, maintainable, and testable data pipelines on Spark. (Simplifies ELT development)
- [And many performance improvement for Structured Streaming, Python API, ...](https://www.databricks.com/blog/introducing-apache-spark-40)


Some examples of Spark 4.x support among managed service providers (February 2026) :
- [Databricks](https://docs.databricks.com/aws/en/release-notes/runtime/) : Spark v4.0 is supported starting from Databricks Runtime 17.2 (September 2025) and Spark 4.1 is supported starting from Databricks Runtime 18.0 (January 2026)
- [Snowflake](https://docs.snowflake.com/fr/user-guide/spark-connector) : There does not appear to be a Snowflake Connector supporting Spark 4.x yet. Spark 3.5 is the most recent supported version.
- [AWS EMR](https://docs.aws.amazon.com/emr/latest/ReleaseGuide/emr-7120-release.html) : EMR version 7.12.0 (latest version available) supports Spark 3.5.6.
- [AWS Glue](https://docs.aws.amazon.com/fr_fr/glue/latest/dg/release-notes.html) : Glue version 5.1 (latest version available) supports Spark 3.5.6.
- [Azure Fabric](https://learn.microsoft.com/fr-fr/fabric/data-engineering/runtime-2-0#limitations-and-notes) : Runtime 1.3 (latest GA version in February 2026) supports Spark 3.5. Runtime 2.0 under development will support Spark 4.0 (no release date, experimental status)


## Additional Information

- Support :
    - Support for Java 17 and Java 21
    - Support for Python 3.10+
    - Support for Scala 2.13
- Enhanced [Adaptative Query Execution (AQE)](https://spark.apache.org/docs/latest/sql-performance-tuning.html#adaptive-query-execution)
    - [Data Skew Optimization](https://spark.apache.org/docs/latest/sql-performance-tuning.html#splitting-skewed-shuffle-partitions) : It can dynamically split skewed partitions into smaller parts to better distribute the workload across cluster cores.
    - [Post-shuffle Partition Coalescing](https://spark.apache.org/docs/latest/sql-performance-tuning.html#coalescing-post-shuffle-partitions) : AQE can now merge partitions after a shuffle operation if they are too small, which reduces the number of tasks and scheduling overhead. This optimizes the execution plan without requiring manual configuration.
    - [Join Conversion](https://spark.apache.org/docs/latest/sql-performance-tuning.html#converting-sort-merge-join-to-broadcast-join) : AQE can convert `sort-merge` joins into `broadcast-hash` joins if one of the tables is small enough, which is much more efficient. In version 4.x, this detection and conversion are more robust and granular.
- Structured Streaming : 
    - [State Store Data Source](https://spark.apache.org/docs/latest/streaming/structured-streaming-state-data-source.html) : Access internal streaming state as a Table/DataFrame (for debugging, monitoring, and auditing).
    - [TransformWithState - The new arbitrary stateful operator](https://spark.apache.org/docs/latest/streaming/structured-streaming-transform-with-state.html) : 
        - The transformWithState API : Designed to be flexible and extensible.
        - Multiple State Variables : Instead of a single monolithic object, it allows declaring multiple types of state variables for the same key. 
        - Schema Evolution : Allows modifying the structure of your state data (adding or removing fields) without breaking compatibility with existing `checkpoints`.
        - Improved Timer Management : Management of time (Event Time and Processing Time) has been simplified and made more robust.
- Observability :
    - [Structured Logs](https://spark.apache.org/docs/latest/configuration.html#structured-logging) : Spark 4.0 is transitioning from an unstructured text log format to a structured JSON format.


# How to create a local cluster

To test this new version of Spark, we will create a Docker image and the necessary elements to set up a cluster composed of one Driver and two Workers.
The directories used for this project are:

- `application` : Directory to store all PySpark scripts
- `data` : Directory to store datasets (input and output)
- `logs` : Directory to store execution logs from the Spark cluster
- `spark-image-docker` : Directory to store the files needed to create the Docker image



## Create a docker image

Steps from the spark-image-docker directory:
1. Create the `spark-defaults.conf` file to define the configuration elements for the Spark cluster
2. Create the `spark-env.sh` file to define the environment elements for the Spark cluster
3. Create the `spark-start.sh` file to define the execution script for Spark cluster applications
4. Create the `Dockerfile` to define the content of the Spark image for creating the Spark cluster
5. Execute the Docker image build command : `docker build -t spark4 spark-image-docker --no-cache`


Content of the `spark-defaults.conf` file :
```bash
# --- History Server Configuration ---
spark.eventLog.enabled              true
spark.eventLog.dir                  file:///opt/spark/event_logs
spark.history.fs.logDirectory       file:///opt/spark/event_logs

# --- Database Configurations ---
spark.sql.warehouse.dir             file:///opt/spark/data/warehouse
```

Content of the `spark-env.sh` file :
```bash
#!/bin/env bash

export SPARK_LOCAL_IP=`hostname -i`
export SPARK_PUBLIC_DNS=`hostname -f`
```

Content of the `spark-start.sh` file :
```bash
#!/bin/bash

# Start the SSH daemon
/usr/sbin/sshd
if [ $? -ne 0 ]; then
    echo "Failed to start SSH server. Exiting."
    exit 1
fi

if [ "$SPARK_MODE" = "master" ]; then
    echo "Starting Spark Master..."
    # Spark Master/Driver
    $SPARK_HOME/sbin/start-master.sh
    # Spark Connect 
    $SPARK_HOME/sbin/start-connect-server.sh
    # History server
    $SPARK_HOME/sbin/start-history-server.sh 
elif [ "$SPARK_MODE" = "worker" ]; then
    echo "Starting Spark Worker..."
    # Spark Worker
    $SPARK_HOME/sbin/start-worker.sh $SPARK_MASTER_URL
else
    echo "Unknown SPARK_MODE: $SPARK_MODE"
    exit 1
fi

# Keep the container alive
tail -f $SPARK_HOME/logs/*
```


Content of the `Dockerfile` file :
```docker
# Use OpenJDK base image
FROM eclipse-temurin:21-jdk-jammy

# Define env variables
ENV SPARK_MASTER="spark://spark-master:7077"
ENV SPARK_MASTER_HOST=spark-master
ENV SPARK_MASTER_PORT=7077
ENV PYSPARK_PYTHON=python3
ENV SPARK_HOME=/opt/spark
ENV PATH=$PATH:$SPARK_HOME/bin:$SPARK_HOME/sbin
# Define Spark Version
ENV SPARK_VERSION="4.1.1"


# Install tools
RUN apt-get update \
    && apt-get install -y --no-install-recommends wget tar iputils-ping rsync openssh-server openssh-client \
    && apt-get install -y --no-install-recommends python3 python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Manage SSH informations
RUN mkdir -p /root/.ssh/ \
    && ssh-keygen -t rsa -f /root/.ssh/id_rsa -q -N "" \
    && cat /root/.ssh/id_rsa.pub >> /root/.ssh/authorized_keys \
    && chmod 600 /root/.ssh/authorized_keys \
    && echo "Host *" >> /root/.ssh/config \
    && echo "    StrictHostKeyChecking no" >> /root/.ssh/config \
    && chmod 600 /root/.ssh/config \
    && mkdir -p /var/run/sshd \
    && ssh-keygen -A

# Download and install Spark
RUN wget https://archive.apache.org/dist/spark/spark-${SPARK_VERSION}/spark-${SPARK_VERSION}-bin-hadoop3.tgz
RUN tar -xzf spark-${SPARK_VERSION}-bin-hadoop3.tgz \
    && rm spark-${SPARK_VERSION}-bin-hadoop3.tgz \
    && mv spark-${SPARK_VERSION}-bin-hadoop3 ${SPARK_HOME} \ 
    && chown -R root:root ${SPARK_HOME} \
    && mkdir -p ${SPARK_HOME}/logs \
    && mkdir -p ${SPARK_HOME}/event_logs


# Load and set up Spark configuration for logging and history server
COPY spark-defaults.conf $SPARK_HOME/conf/spark-defaults.conf

# Load and set up Spark configuration scripts (env and start)
COPY spark-env.sh $SPARK_HOME/conf/spark-env.sh
COPY spark-start.sh $SPARK_HOME/spark-start.sh
RUN chmod +x $SPARK_HOME/conf/spark-env.sh
RUN chmod +x $SPARK_HOME/spark-start.sh

# Expose needed ports
EXPOSE 7077 8080 4040 15002 22

# Entrypoint config
CMD ["/opt/spark/spark-start.sh"]

```


Content of the log from the build command : 
```bash
[+] Building 36.2s (15/15) FINISHED                                                                                                                                                                     => [internal] load build definition from Dockerfile
 => => transferring dockerfile: 3.01kB
 => [internal] load metadata for docker.io/library/eclipse-temurin:21-jdk-jammy
 => [internal] load .dockerignore
 => => transferring context: 2B
 => [ 1/10] FROM docker.io/library/eclipse-temurin:21-jdk-jammy@sha256:9119073a0b783fd380fbf4b131a40955525c8e2a66083681c87fb15a39ae01d0
 => => resolve docker.io/library/eclipse-temurin:21-jdk-jammy@sha256:9119073a0b783fd380fbf4b131a40955525c8e2a66083681c87fb15a39ae01d0
 => => sha256:9119073a0b783fd380fbf4b131a40955525c8e2a66083681c87fb15a39ae01d0 5.25kB / 5.25kB
 => => sha256:86cbb2dbf3b68d3c30280722d5597afc845af596fe7f6398db56e5c9f9e0bc4e 1.94kB / 1.94kB
 => => sha256:b3aadbf953f8337a9a81487d7a8a93b72853d9e50781b984c57c7552c8778c7a 5.94kB / 5.94kB
 => => sha256:b1cba2e842ca52b95817f958faf99734080c78e92e43ce609cde9244867b49ed 29.54MB / 29.54MB
 => => sha256:1dde4b555a697f85138e99e7759480373b71f47cbad9f7c0fa6cba34f2f5fe1e 20.69MB / 20.69MB
 => => sha256:878e917e8d81357d9636aab51478d4fe889d01e89988159f87e55dbc3bba337b 157.87MB / 157.87MB
 => => sha256:2049ec1cef96e43c3946f1be57d5efb77052e16d9e7f1fa3d7c8e4030155eac7 158B / 158B
 => => sha256:9760149be10a5530ec0649fba4393ef8c2a058a9a97978c7cf43287b890dfcc0 2.28kB / 2.28kB
 => => extracting sha256:b1cba2e842ca52b95817f958faf99734080c78e92e43ce609cde9244867b49ed
 => => extracting sha256:1dde4b555a697f85138e99e7759480373b71f47cbad9f7c0fa6cba34f2f5fe1e
 => => extracting sha256:878e917e8d81357d9636aab51478d4fe889d01e89988159f87e55dbc3bba337b
 => => extracting sha256:2049ec1cef96e43c3946f1be57d5efb77052e16d9e7f1fa3d7c8e4030155eac7
 => => extracting sha256:9760149be10a5530ec0649fba4393ef8c2a058a9a97978c7cf43287b890dfcc0
 => [internal] load build context
 => => transferring context: 2.11kB
 => [ 2/10] RUN apt-get update     && apt-get install -y --no-install-recommends wget tar iputils-ping rsync openssh-server openssh-client     && apt-get install -y --no-install-recommends python3 python3-pip     && rm -rf /var/lib/apt/lists/*
 => [ 3/10] RUN mkdir -p /root/.ssh/     && ssh-keygen -t rsa -f /root/.ssh/id_rsa -q -N ""     && cat /root/.ssh/id_rsa.pub >> /root/.ssh/authorized_keys     && chmod 600 /root/.ssh/authorized_keys     && echo "Host *" >> /root/.ssh/config     && echo "    StrictHostKeyChecking no" >> /root/.ssh/config     && chmod 600 /root/.ssh/config     &&
 => [ 4/10] RUN wget https://archive.apache.org/dist/spark/spark-4.1.1/spark-4.1.1-bin-hadoop3.tgz
 => [ 5/10] RUN tar -xzf spark-4.1.1-bin-hadoop3.tgz     && rm spark-4.1.1-bin-hadoop3.tgz     && mv spark-4.1.1-bin-hadoop3 /opt/spark     && chown -R root:root /opt/spark     && mkdir -p /opt/spark/logs     && mkdir -p /opt/spark/event_logs
 => [ 6/10] COPY spark-defaults.conf /opt/spark/conf/spark-defaults.conf
 => [ 7/10] COPY spark-env.sh /opt/spark/conf/spark-env.sh
 => [ 8/10] COPY spark-start.sh /opt/spark/spark-start.sh
 => [ 9/10] RUN chmod +x /opt/spark/conf/spark-env.sh
 => [10/10] RUN chmod +x /opt/spark/spark-start.sh
 => exporting to image
 => => exporting layers
 => => writing image sha256:ecbea515a6ce1fce621a2b7c8962957862f7069fa2c4f1fc30352fdb8abcb72c
 => => naming to docker.io/library/spark4
```



## Create a docker compose file

Steps to perform from the root directory :
1. Create the `compose.yml` file to define the various elements of the cluster, which will consist of one `Master` node and two `Worker` nodes
2. Start the local cluster with the command `docker compose up -d`
3. Stop the local cluster with the command `docker compose down`



Content of the `compose.yml` :
```yaml
services:
  spark-master:
    image: spark4
    container_name: spark-master
    hostname: spark-master
    environment:
      - SPARK_MODE=master
      - SPARK_RPC_AUTHENTICATION_ENABLED=false
      - SPARK_RPC_ENCRYPTION_ENABLED=false
      - SPARK_LOCAL_STORAGE_ENCRYPTION_ENABLED=false
      - SPARK_SSL_ENABLED=false
      - SPARK_PUBLIC_DNS=spark-master
      - SPARK_MASTER_HOST=spark-master
      - SPARK_MASTER_PORT=7077
      - SPARK_DRIVER_MEMORY=1g
      - SPARK_DRIVER_CORES=1
      - SPARK_EXECUTOR_MEMORY=1g
      - SPARK_MASTER_WEBUI_PORT=8080
    ports:
      - "4040:4040"   # Application UI (Job Details)
      - "8080:8080"   # Interface web du master
      - "7077:7077"   # Port de communication Spark
      - "15002:15002" # Port Spark Connect
      - "18080:18080" # Interface History Server
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
    volumes:
      - ./data:/opt/spark/data
      - ./logs/events:/opt/spark/event_logs
      - ./application/src:/home/root/src
    networks:
      - spark-network


  spark-worker-1:
    image: spark4
    container_name: spark-worker-1
    hostname: spark-worker-1
    depends_on:
      - spark-master
    environment:
      - SPARK_MODE=worker
      - SPARK_MASTER_URL=spark://spark-master:7077
      - SPARK_RPC_AUTHENTICATE=false
      - SPARK_RPC_ENCRYPTION=false
      - SPARK_LOCAL_STORAGE_ENCRYPTION=false
      - SPARK_SSL_ENABLED=no
      - SPARK_PUBLIC_DNS=spark-worker-1
      - SPARK_MASTER_HOST=spark-master
      - SPARK_MASTER_PORT=7077
      - SPARK_WORKER_CORES=2
      - SPARK_WORKER_MEMORY=2g
      - SPARK_EXECUTOR_MEMORY=1g
      - SPARK_WORKER_WEBUI_PORT=8081
    ports:
      - "8081:8081"   # Interface web du worker
    volumes:
      - ./data:/opt/spark/data
    networks:
      - spark-network
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G


  spark-worker-2:
    image: spark4
    container_name: spark-worker-2
    hostname: spark-worker-2
    depends_on:
      - spark-master
    environment:
      - SPARK_MODE=worker
      - SPARK_MASTER_URL=spark://spark-master:7077
      - SPARK_RPC_AUTHENTICATE=false
      - SPARK_RPC_ENCRYPTION=false
      - SPARK_LOCAL_STORAGE_ENCRYPTION=false
      - SPARK_SSL_ENABLED=no
      - SPARK_PUBLIC_DNS=spark-worker-2
      - SPARK_MASTER_HOST=spark-master
      - SPARK_MASTER_PORT=7077
      - SPARK_WORKER_CORES=2
      - SPARK_WORKER_MEMORY=2g
      - SPARK_EXECUTOR_MEMORY=1g
      - SPARK_WORKER_WEBUI_PORT=8081
    ports:
      - "8082:8081"   # Interface web du worker
    volumes:
      - ./data:/opt/spark/data
    networks:
      - spark-network
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G


networks:
  spark-network:
    driver: bridge

```


Content of the log from the command `docker-compose up -d` : 
```bash
[+] up 4/4
 ✔ Network spark4_spark-network Created
 ✔ Container spark-master       Created
 ✔ Container spark-worker-1     Created
 ✔ Container spark-worker-2     Created
```


Content of the log from the stop command `docker-compose down` : 
```bash
[+] down 4/4
 ✔ Container spark-worker-2     Removed
 ✔ Container spark-worker-1     Removed
 ✔ Container spark-master       Removed
 ✔ Network spark4_spark-network Removed
```

# How to execute a PySpark application

## List of ports and interfaces

Based on the configuration in the compose.yml file:
- `4040` : Communication port for the [application UI (Jobs UI)](http://localhost:4040/jobs/)
- `7077` : Communication port for the Spark cluster (Internal)
- `8080` : Communication port for the [Master node web interface (driver)](http://localhost:8080/)
- `8081` : Communication port for [Worker #1 node web interface](http://localhost:8081/)
- `8082` : Communication port for [Worker #2 node web interface](http://localhost:8082/)
- `15002` : Communication port for the Spark Connect server
- `18080` : Communication port for the [History Server interface](http://localhost:18080/)



## Script execution on the cluster

To execute a PySpark script directly on the local cluster:
1. Create a Python script named `spark-submit-app.py` in the `application/src` directory
2. Execute the following Docker command to run the created Python script : `docker exec -it spark-master spark-submit --master spark://spark-master:7077 --conf spark.driver.host=spark-master --name "TestApp" /home/root/src/spark-submit-app.py`
3. After successful execution of the script, you will find a new file named `test.parquet` in the `data/files` directory, corresponding to the file created in the example

> Note: the user's `application/src` directory is mapped by default, in the configuration defined in the `compose.yml` file, to the `/home/root/src` directory

Content of the `spark-submit-app.py` Python script:
```python
from pyspark.sql import SparkSession

REP_DATA_FILES = "file:///opt/spark/data/files"

spark = SparkSession.builder \
    .appName("TestSubmitApp") \
    .master("spark://spark-master:7077") \
    .getOrCreate()

data = [(1, "Alice"), (2, "Bob"), (3, "Charlie")]
df = spark.createDataFrame(data, ["id", "name"])
df.show()
df.write.mode("overwrite").format("parquet").save(f"{REP_DATA_FILES}/test.parquet")

spark.stop()
```


Content of the log from the execution command : 
```bash
WARNING: Using incubator modules: jdk.incubator.vector
Using Spark's default log4j profile: org/apache/spark/log4j2-defaults.properties
26/02/27 16:31:13 INFO SparkContext: Running Spark version 4.1.1
26/02/27 16:31:13 INFO SparkContext: OS info Linux, 6.6.87.2-microsoft-standard-WSL2, amd64
26/02/27 16:31:13 INFO SparkContext: Java version 21.0.10+7-LTS
26/02/27 16:31:13 WARN NativeCodeLoader: Unable to load native-hadoop library for your platform... using builtin-java classes where applicable
26/02/27 16:31:13 INFO ResourceUtils: ==============================================================
26/02/27 16:31:13 INFO ResourceUtils: No custom resources configured for spark.driver.
26/02/27 16:31:13 INFO ResourceUtils: ==============================================================
26/02/27 16:31:13 INFO SparkContext: Submitted application: TestSubmitApp
26/02/27 16:31:13 INFO SecurityManager: Changing view acls to: root
26/02/27 16:31:13 INFO SecurityManager: Changing modify acls to: root
26/02/27 16:31:13 INFO SecurityManager: Changing view acls groups to: root
26/02/27 16:31:13 INFO SecurityManager: Changing modify acls groups to: root
26/02/27 16:31:13 INFO SecurityManager: SecurityManager: authentication disabled; ui acls disabled; users with view permissions: root groups with view permissions: EMPTY; users with modify permissions: root; groups with modify permissions: EMPTY; RPC SSL disabled
26/02/27 16:31:13 INFO Utils: Successfully started service 'sparkDriver' on port 34403.
26/02/27 16:31:13 INFO SparkEnv: Registering MapOutputTracker
26/02/27 16:31:13 INFO SparkEnv: Registering BlockManagerMaster
26/02/27 16:31:13 INFO BlockManagerMasterEndpoint: Using org.apache.spark.storage.DefaultTopologyMapper for getting topology information
26/02/27 16:31:13 INFO BlockManagerMasterEndpoint: BlockManagerMasterEndpoint up
26/02/27 16:31:13 INFO SparkEnv: Registering BlockManagerMasterHeartbeat
26/02/27 16:31:13 INFO DiskBlockManager: Created local directory at /tmp/blockmgr-f5f0ee24-17ba-442b-9614-1ee27607cec2
26/02/27 16:31:13 INFO SparkEnv: Registering OutputCommitCoordinator
26/02/27 16:31:14 INFO JettyUtils: Start Jetty 172.19.0.2:4040 for SparkUI
26/02/27 16:31:14 WARN Utils: Service 'SparkUI' could not bind on port 4040. Attempting port 4041.
26/02/27 16:31:14 INFO Utils: Successfully started service 'SparkUI' on port 4041.
26/02/27 16:31:14 INFO ResourceProfile: Default ResourceProfile created, executor resources: Map(memory -> name: memory, amount: 1024, script: , vendor: , offHeap -> name: offHeap, amount: 0, script: , vendor: ), task resources: Map(cpus -> name: cpus, amount: 1.0)
26/02/27 16:31:14 INFO ResourceProfile: Limiting resource is cpu
26/02/27 16:31:14 INFO ResourceProfileManager: Added ResourceProfile id: 0
26/02/27 16:31:14 INFO SecurityManager: Changing view acls to: root
26/02/27 16:31:14 INFO SecurityManager: Changing modify acls to: root
26/02/27 16:31:14 INFO SecurityManager: Changing view acls groups to: root
26/02/27 16:31:14 INFO SecurityManager: Changing modify acls groups to: root
26/02/27 16:31:14 INFO SecurityManager: SecurityManager: authentication disabled; ui acls disabled; users with view permissions: root groups with view permissions: EMPTY; users with modify permissions: root; groups with modify permissions: EMPTY; RPC SSL disabled
26/02/27 16:31:14 INFO StandaloneAppClient$ClientEndpoint: Connecting to master spark://spark-master:7077...
26/02/27 16:31:14 INFO TransportClientFactory: Successfully created connection to spark-master/172.19.0.2:7077 after 17 ms (0 ms spent in bootstraps)
26/02/27 16:31:14 INFO StandaloneSchedulerBackend: Connected to Spark cluster with app ID app-20260227163114-0001
26/02/27 16:31:14 INFO Utils: Successfully started service 'org.apache.spark.network.netty.NettyBlockTransferService' on port 41333.
26/02/27 16:31:14 INFO NettyBlockTransferService: Server created on spark-master:41333
26/02/27 16:31:14 INFO StandaloneAppClient$ClientEndpoint: Executor added: app-20260227163114-0001/0 on worker-20260227161953-172.19.0.4-40325 (172.19.0.4:40325) with 2 core(s)
26/02/27 16:31:14 INFO BlockManager: Using org.apache.spark.storage.RandomBlockReplicationPolicy for block replication policy
26/02/27 16:31:14 INFO StandaloneSchedulerBackend: Granted executor ID app-20260227163114-0001/0 on hostPort 172.19.0.4:40325 with 2 core(s), 1024.0 MiB RAM
26/02/27 16:31:14 INFO StandaloneAppClient$ClientEndpoint: Executor added: app-20260227163114-0001/1 on worker-20260227161953-172.19.0.3-38037 (172.19.0.3:38037) with 2 core(s)
26/02/27 16:31:14 INFO StandaloneSchedulerBackend: Granted executor ID app-20260227163114-0001/1 on hostPort 172.19.0.3:38037 with 2 core(s), 1024.0 MiB RAM
26/02/27 16:31:14 INFO StandaloneAppClient$ClientEndpoint: Executor updated: app-20260227163114-0001/0 is now RUNNING
26/02/27 16:31:14 INFO StandaloneAppClient$ClientEndpoint: Executor updated: app-20260227163114-0001/1 is now RUNNING
26/02/27 16:31:14 INFO BlockManagerMaster: Registering BlockManager BlockManagerId(driver, spark-master, 41333, None)
26/02/27 16:31:14 INFO BlockManagerMasterEndpoint: Registering block manager spark-master:41333 with 413.9 MiB RAM, BlockManagerId(driver, spark-master, 41333, None)
26/02/27 16:31:14 INFO BlockManagerMaster: Registered BlockManager BlockManagerId(driver, spark-master, 41333, None)
26/02/27 16:31:14 INFO BlockManager: Initialized BlockManager: BlockManagerId(driver, spark-master, 41333, None)
26/02/27 16:31:15 INFO RollingEventLogFilesWriter: Logging events to file:/opt/spark/event_logs/eventlog_v2_app-20260227163114-0001/events_1_app-20260227163114-0001.zstd
26/02/27 16:31:15 INFO StandaloneSchedulerBackend: SchedulerBackend is ready for scheduling beginning after reached minRegisteredResourcesRatio: 0.0
26/02/27 16:31:16 INFO StandaloneSchedulerBackend$StandaloneDriverEndpoint: Registered executor NettyRpcEndpointRef(spark-client://Executor) (172.19.0.3:39714) with ID 1, ResourceProfileId 0
26/02/27 16:31:16 INFO StandaloneSchedulerBackend$StandaloneDriverEndpoint: Registered executor NettyRpcEndpointRef(spark-client://Executor) (172.19.0.4:55040) with ID 0, ResourceProfileId 0
26/02/27 16:31:16 INFO BlockManagerMasterEndpoint: Registering block manager 172.19.0.4:39007 with 434.4 MiB RAM, BlockManagerId(0, 172.19.0.4, 39007, None)
26/02/27 16:31:16 INFO BlockManagerMasterEndpoint: Registering block manager 172.19.0.3:40421 with 434.4 MiB RAM, BlockManagerId(1, 172.19.0.3, 40421, None)
26/02/27 16:31:18 INFO SharedState: Setting hive.metastore.warehouse.dir ('null') to the value of spark.sql.warehouse.dir.
26/02/27 16:31:18 INFO SharedState: Warehouse path is 'file:/opt/spark/data/warehouse'.
26/02/27 16:31:19 INFO CodeGenerator: Code generated in 314.329914 ms
26/02/27 16:31:19 INFO SparkContext: Starting job: showString at NativeMethodAccessorImpl.java:0
26/02/27 16:31:19 INFO DAGScheduler: Got job 0 (showString at NativeMethodAccessorImpl.java:0) with 1 output partitions
26/02/27 16:31:19 INFO DAGScheduler: Final stage: ResultStage 0 (showString at NativeMethodAccessorImpl.java:0)
26/02/27 16:31:19 INFO DAGScheduler: Parents of final stage: List()
26/02/27 16:31:19 INFO DAGScheduler: Missing parents: List()
26/02/27 16:31:19 INFO DAGScheduler: Missing parents found for ResultStage 0: List()
26/02/27 16:31:19 INFO DAGScheduler: Submitting ResultStage 0 (MapPartitionsRDD[6] at showString at NativeMethodAccessorImpl.java:0), which has no missing parents
26/02/27 16:31:20 INFO MemoryStore: MemoryStore started with capacity 413.9 MiB
26/02/27 16:31:20 INFO MemoryStore: Block broadcast_0 stored as values in memory (estimated size 13.7 KiB, free 413.9 MiB)
26/02/27 16:31:20 INFO MemoryStore: Block broadcast_0_piece0 stored as bytes in memory (estimated size 7.1 KiB, free 413.9 MiB)
26/02/27 16:31:20 INFO SparkContext: Created broadcast 0 from broadcast at DAGScheduler.scala:1686
26/02/27 16:31:20 INFO DAGScheduler: Submitting 1 missing tasks from ResultStage 0 (MapPartitionsRDD[6] at showString at NativeMethodAccessorImpl.java:0) (first 15 tasks are for partitions Vector(0))
26/02/27 16:31:20 INFO TaskSchedulerImpl: Adding task set 0.0 with 1 tasks resource profile 0
26/02/27 16:31:20 INFO TaskSetManager: Starting task 0.0 in stage 0.0 (TID 0) (172.19.0.4,executor 0, partition 0, PROCESS_LOCAL, 9679 bytes) 
26/02/27 16:31:21 INFO TaskSetManager: Finished task 0.0 in stage 0.0 (TID 0) in 1178 ms on 172.19.0.4 (executor 0) (1/1)
26/02/27 16:31:21 INFO TaskSchedulerImpl: Removed TaskSet 0.0 whose tasks have all completed, from pool 
26/02/27 16:31:21 INFO PythonAccumulatorV2: Connected to AccumulatorServer at host: 127.0.0.1 port: 49893
26/02/27 16:31:21 INFO DAGScheduler: ResultStage 0 (showString at NativeMethodAccessorImpl.java:0) finished in 1397 ms
26/02/27 16:31:21 INFO DAGScheduler: Job 0 is finished. Cancelling potential speculative or zombie tasks for this job
26/02/27 16:31:21 INFO TaskSchedulerImpl: Canceling stage 0
26/02/27 16:31:21 INFO TaskSchedulerImpl: Killing all running tasks in stage 0: Stage finished
26/02/27 16:31:21 INFO DAGScheduler: Job 0 finished: showString at NativeMethodAccessorImpl.java:0, took 1480.625651 ms
26/02/27 16:31:21 INFO SparkContext: Starting job: showString at NativeMethodAccessorImpl.java:0
26/02/27 16:31:21 INFO DAGScheduler: Got job 1 (showString at NativeMethodAccessorImpl.java:0) with 3 output partitions
26/02/27 16:31:21 INFO DAGScheduler: Final stage: ResultStage 1 (showString at NativeMethodAccessorImpl.java:0)
26/02/27 16:31:21 INFO DAGScheduler: Parents of final stage: List()
26/02/27 16:31:21 INFO DAGScheduler: Missing parents: List()
26/02/27 16:31:21 INFO DAGScheduler: Missing parents found for ResultStage 1: List()
26/02/27 16:31:21 INFO DAGScheduler: Submitting ResultStage 1 (MapPartitionsRDD[6] at showString at NativeMethodAccessorImpl.java:0), which has no missing parents
26/02/27 16:31:21 INFO MemoryStore: Block broadcast_1 stored as values in memory (estimated size 13.7 KiB, free 413.9 MiB)
26/02/27 16:31:21 INFO MemoryStore: Block broadcast_1_piece0 stored as bytes in memory (estimated size 7.1 KiB, free 413.9 MiB)
26/02/27 16:31:21 INFO SparkContext: Created broadcast 1 from broadcast at DAGScheduler.scala:1686
26/02/27 16:31:21 INFO DAGScheduler: Submitting 3 missing tasks from ResultStage 1 (MapPartitionsRDD[6] at showString at NativeMethodAccessorImpl.java:0) (first 15 tasks are for partitions Vector(1, 2, 3))
26/02/27 16:31:21 INFO TaskSchedulerImpl: Adding task set 1.0 with 3 tasks resource profile 0
26/02/27 16:31:21 INFO TaskSetManager: Starting task 0.0 in stage 1.0 (TID 1) (172.19.0.4,executor 0, partition 1, PROCESS_LOCAL, 9716 bytes) 
26/02/27 16:31:21 INFO TaskSetManager: Starting task 1.0 in stage 1.0 (TID 2) (172.19.0.3,executor 1, partition 2, PROCESS_LOCAL, 9714 bytes) 
26/02/27 16:31:21 INFO TaskSetManager: Starting task 2.0 in stage 1.0 (TID 3) (172.19.0.4,executor 0, partition 3, PROCESS_LOCAL, 9718 bytes) 
26/02/27 16:31:21 INFO TaskSetManager: Finished task 0.0 in stage 1.0 (TID 1) in 179 ms on 172.19.0.4 (executor 0) (1/3)
26/02/27 16:31:21 INFO TaskSetManager: Finished task 2.0 in stage 1.0 (TID 3) in 211 ms on 172.19.0.4 (executor 0) (2/3)
26/02/27 16:31:22 INFO TaskSetManager: Finished task 1.0 in stage 1.0 (TID 2) in 1160 ms on 172.19.0.3 (executor 1) (3/3)
26/02/27 16:31:22 INFO TaskSchedulerImpl: Removed TaskSet 1.0 whose tasks have all completed, from pool 
26/02/27 16:31:22 INFO DAGScheduler: ResultStage 1 (showString at NativeMethodAccessorImpl.java:0) finished in 1168 ms
26/02/27 16:31:22 INFO DAGScheduler: Job 1 is finished. Cancelling potential speculative or zombie tasks for this job
26/02/27 16:31:22 INFO TaskSchedulerImpl: Canceling stage 1
26/02/27 16:31:22 INFO TaskSchedulerImpl: Killing all running tasks in stage 1: Stage finished
26/02/27 16:31:22 INFO DAGScheduler: Job 1 finished: showString at NativeMethodAccessorImpl.java:0, took 1170.986858 ms
26/02/27 16:31:22 INFO CodeGenerator: Code generated in 10.428925 ms
+---+-------+
| id|   name|
+---+-------+
|  1|  Alice|
|  2|    Bob|
|  3|Charlie|
+---+-------+

26/02/27 16:31:22 INFO ParquetUtils: Using default output committer for Parquet: org.apache.parquet.hadoop.ParquetOutputCommitter
26/02/27 16:31:22 INFO FileOutputCommitter: File Output Committer Algorithm version is 1
26/02/27 16:31:22 INFO FileOutputCommitter: FileOutputCommitter skip cleanup _temporary folders under output directory:false, ignore cleanup failures: false
26/02/27 16:31:22 INFO SQLHadoopMapReduceCommitProtocol: Using user defined output committer class org.apache.parquet.hadoop.ParquetOutputCommitter
26/02/27 16:31:22 INFO FileOutputCommitter: File Output Committer Algorithm version is 1
26/02/27 16:31:22 INFO FileOutputCommitter: FileOutputCommitter skip cleanup _temporary folders under output directory:false, ignore cleanup failures: false
26/02/27 16:31:22 INFO SQLHadoopMapReduceCommitProtocol: Using output committer class org.apache.parquet.hadoop.ParquetOutputCommitter
26/02/27 16:31:22 INFO CodeGenerator: Code generated in 8.009026 ms
26/02/27 16:31:22 INFO SparkContext: Starting job: save at NativeMethodAccessorImpl.java:0
26/02/27 16:31:22 INFO DAGScheduler: Got job 2 (save at NativeMethodAccessorImpl.java:0) with 4 output partitions
26/02/27 16:31:22 INFO DAGScheduler: Final stage: ResultStage 2 (save at NativeMethodAccessorImpl.java:0)
26/02/27 16:31:22 INFO DAGScheduler: Parents of final stage: List()
26/02/27 16:31:22 INFO DAGScheduler: Missing parents: List()
26/02/27 16:31:22 INFO DAGScheduler: Missing parents found for ResultStage 2: List()
26/02/27 16:31:22 INFO DAGScheduler: Submitting ResultStage 2 (MapPartitionsRDD[8] at save at NativeMethodAccessorImpl.java:0), which has no missing parents
26/02/27 16:31:23 INFO MemoryStore: Block broadcast_2 stored as values in memory (estimated size 238.7 KiB, free 413.7 MiB)
26/02/27 16:31:23 INFO MemoryStore: Block broadcast_2_piece0 stored as bytes in memory (estimated size 86.9 KiB, free 413.6 MiB)
26/02/27 16:31:23 INFO SparkContext: Created broadcast 2 from broadcast at DAGScheduler.scala:1686
26/02/27 16:31:23 INFO DAGScheduler: Submitting 4 missing tasks from ResultStage 2 (MapPartitionsRDD[8] at save at NativeMethodAccessorImpl.java:0) (first 15 tasks are for partitions Vector(0, 1, 2, 3))
26/02/27 16:31:23 INFO TaskSchedulerImpl: Adding task set 2.0 with 4 tasks resource profile 0
26/02/27 16:31:23 INFO TaskSetManager: Starting task 0.0 in stage 2.0 (TID 4) (172.19.0.4,executor 0, partition 0, PROCESS_LOCAL, 9679 bytes) 
26/02/27 16:31:23 INFO TaskSetManager: Starting task 1.0 in stage 2.0 (TID 5) (172.19.0.3,executor 1, partition 1, PROCESS_LOCAL, 9716 bytes) 
26/02/27 16:31:23 INFO TaskSetManager: Starting task 2.0 in stage 2.0 (TID 6) (172.19.0.4,executor 0, partition 2, PROCESS_LOCAL, 9714 bytes) 
26/02/27 16:31:23 INFO TaskSetManager: Starting task 3.0 in stage 2.0 (TID 7) (172.19.0.3,executor 1, partition 3, PROCESS_LOCAL, 9718 bytes) 
26/02/27 16:31:23 INFO TaskSetManager: Finished task 2.0 in stage 2.0 (TID 6) in 778 ms on 172.19.0.4 (executor 0) (1/4)
26/02/27 16:31:23 INFO TaskSetManager: Finished task 0.0 in stage 2.0 (TID 4) in 778 ms on 172.19.0.4 (executor 0) (2/4)
26/02/27 16:31:23 INFO TaskSetManager: Finished task 1.0 in stage 2.0 (TID 5) in 789 ms on 172.19.0.3 (executor 1) (3/4)
26/02/27 16:31:23 INFO TaskSetManager: Finished task 3.0 in stage 2.0 (TID 7) in 788 ms on 172.19.0.3 (executor 1) (4/4)
26/02/27 16:31:23 INFO TaskSchedulerImpl: Removed TaskSet 2.0 whose tasks have all completed, from pool 
26/02/27 16:31:23 INFO DAGScheduler: ResultStage 2 (save at NativeMethodAccessorImpl.java:0) finished in 865 ms
26/02/27 16:31:23 INFO DAGScheduler: Job 2 is finished. Cancelling potential speculative or zombie tasks for this job
26/02/27 16:31:23 INFO TaskSchedulerImpl: Canceling stage 2
26/02/27 16:31:23 INFO TaskSchedulerImpl: Killing all running tasks in stage 2: Stage finished
26/02/27 16:31:23 INFO DAGScheduler: Job 2 finished: save at NativeMethodAccessorImpl.java:0, took 868.464989 ms
26/02/27 16:31:23 INFO FileFormatWriter: Start to commit write Job 1d2cef1f-35fd-49e3-9031-06b56f61da8c.
26/02/27 16:31:24 INFO FileFormatWriter: Write Job 1d2cef1f-35fd-49e3-9031-06b56f61da8c committed. Elapsed time: 261 ms.
26/02/27 16:31:24 INFO FileFormatWriter: Finished processing stats for write job 1d2cef1f-35fd-49e3-9031-06b56f61da8c.
26/02/27 16:31:24 INFO SparkContext: SparkContext is stopping with exitCode 0 from stop at NativeMethodAccessorImpl.java:0.
26/02/27 16:31:24 INFO SparkUI: Stopped Spark web UI at http://spark-master:4041
26/02/27 16:31:24 INFO StandaloneSchedulerBackend: Shutting down all executors
26/02/27 16:31:24 INFO StandaloneSchedulerBackend$StandaloneDriverEndpoint: Asking each executor to shut down
26/02/27 16:31:24 INFO MapOutputTrackerMasterEndpoint: MapOutputTrackerMasterEndpoint stopped!
26/02/27 16:31:24 INFO MemoryStore: MemoryStore cleared
26/02/27 16:31:24 INFO BlockManager: BlockManager stopped
26/02/27 16:31:24 INFO BlockManagerMaster: BlockManagerMaster stopped
26/02/27 16:31:24 INFO OutputCommitCoordinator$OutputCommitCoordinatorEndpoint: OutputCommitCoordinator stopped!
26/02/27 16:31:24 INFO SparkContext: Successfully stopped SparkContext (Uptime: 10922 ms)
```


## Script execution using Spark Connect 

To execute a PySpark script using Spark Connect:
1. Create a Python script named `spark-connect-app.py` in the `application/src` directory
2. Execute the created Python script: `python spark-connect-app.py`
3. After successful execution of the script, you will find a new file named `test_connect.parquet` in the `data/files directory`, corresponding to the file created in the example

> Note: to get information about the execution of the Python script with Spark Connect, you need to go to the `Connect` tab in [the Jobs application interface](http://localhost:4040/connect/)

Content of the `spark-connect-app.py` Python script : 
```python

from pyspark.sql import SparkSession
from pyspark.sql.types import StructType, StructField, StringType

REMOTE_URL = "sc://localhost:15002"
REP_DATA_FILES = "file:///opt/spark/data/files"

print("Attempting to connect to Spark Connect server...")

try:
    # Use the .remote() builder method to connect
    spark = SparkSession.builder.remote(REMOTE_URL).getOrCreate()

    print("Successfully connected to Spark!")
    print(f"Spark version: {spark.version}")

    data = [(1, "Alice"), (2, "Bob"), (3, "Charlie")]
    df = spark.createDataFrame(data, ["id", "name"])
    
    df.show()
    df.write.mode("overwrite").format("parquet").save(f"{REP_DATA_FILES}/test.parquet")

except Exception as e:
    print(f"❌ Failed to connect or run Spark job: {e}")

finally:
    # Stop the Spark session
    if 'spark' in locals():
        spark.stop()
    print("\nSpark session stopped.")
```


Content of the log from the Python script execution : 
```bash
Attempting to connect to Spark Connect server...
Successfully connected to Spark!
Spark version: 4.1.1
+---+-------+
| id|   name|
+---+-------+
|  1|  Alice|
|  2|    Bob|
|  3|Charlie|
+---+-------+


Spark session stopped.
```



