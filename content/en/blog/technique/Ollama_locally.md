---
Categories : ["Ollama","LLMs","VS Code","Podman"]
Tags : ["Ollama","LLMs","VS Code","Podman"]
title : "LLMs : Using Ollama with Podman and VS Code"
date : 2024-07-24
draft : fals
toc: true
---

You will find in this article, some information to use [Ollama](https://ollama.com/) ([LLMs](https://en.wikipedia.org/wiki/Large_language_model)) with [Podman](https://podman.io/) and [VS Code](https://code.visualstudio.com/).

<!--more-->


# Ollama

[Ollama](https://ollama.com/) is a free and open-source tool used to run open [LLMs (Large Language Models)](https://en.wikipedia.org/wiki/Large_language_model) locally on your system.

[Ollama](https://ollama.com/) is designed to take advantage of Nvidia or AMD GPUs. If all you have is a good CPU, performance will be very slow.

You will find the supported GPU list in the [official documentation](https://github.com/ollama/ollama/blob/main/docs/gpu.md).

You will need to have a good amount of memory to use it, i recommend you to have 32 Go.

You will find all available LLMs models in the [official library](https://ollama.com/library).

Some examples of available models :
- [llama3](https://ollama.com/library/llama3) : Meta Llama 3, a family of models developed by Meta Inc.
- [codellama](https://ollama.com/library/codellama) : Code Llama is a model for generating and discussing code, built on top of Llama 2.
- [gemma2](https://ollama.com/library/gemma2) : Google Gemma 2, featuring a brand new architecture designed for class leading performance and efficiency
- [codegemma](https://ollama.com/library/codegemma) : CodeGemma is a collection of powerful, lightweight models that can perform a variety of coding tasks like fill-in-the-middle code completion, code generation, natural language understanding, mathematical reasoning, and instruction following. 
- [starcoder2](https://ollama.com/library/starcoder2) : StarCoder2 is the next generation of transparently trained open code LLMs 

Useful commands :
- `ollama list`: List models
- `ollama ps` : List running models
- `ollama pull <model>` : Pull a model from a registry
- `ollama show <model>` : Display information for a model
- `ollama run <model>` : Run a model
- `ollama rm <model>` : Remove a model


# Podman

[Podman](https://docs.podman.io/en/latest/) is a daemonless, open-source, Linux native tool designed to make it easy to find, run, build, share and deploy applications using [Open Containers Initiative (OCI)](https://opencontainers.org/) Containers and Container Images. 

[Podman](https://docs.podman.io/en/latest/) provides a command line interface (CLI) familiar to anyone who has used the Docker Container Engine.

[Podman](https://docs.podman.io/en/latest/) manages the entire container ecosystem which includes pods, containers, container images, and container volumes using the [libpod](https://github.com/containers/podman) library

Core concepts :
- Pods are groups of containers that run together and share the same resources, similar to Kubernetes pods.
- A container is an isolated environment where an application runs without affecting the rest of the system and without the system impacting the application..
- A container image is a static file with executable code that can create a container on a computing system. A container image is immutable—meaning it cannot be changed, and can be deployed consistently in any environment
- A container volume is a persistent storage that could be used by a container

*Warning : To achieve optimal performance, i recommend using the [GPU Passthrough](https://docs.nvidia.com/ai-enterprise/deployment-guide-rhel-with-kvm/0.1.0/podman.html).*


# VS Code

[VS Code](https://code.visualstudio.com/) is a multi-platform source-code editor developed by Microsoft. 
[VS Code](https://code.visualstudio.com/) can be extended via extensions available through a [central repository](https://marketplace.visualstudio.com/vscode).

[Continue](https://www.continue.dev/) is an open-source AI code assistant which allow to connect any models inside the IDE.

We will use the [VS Code Continue](https://marketplace.visualstudio.com/items?itemName=Continue.continue) extension to work with our [Ollama](https://ollama.com/) configuration (local or remote). Additionally, you can leverage various providers and services, such as [Open AI](https://openai.com/), [Anthropic](https://www.anthropic.com/), [Mistral](https://mistral.ai/), [Gemini](https://gemini.google.com/) and others.

## To Install the VS Code Continue extension

The steps are as follows : 
1. Open VS Code 
2. Click on the extensions menu in the left panel
3. Filter the result with the term `Continue.continue`

[![continue_step_1](/blog/web/20240724_ollama_locally_p1.png)](/blog/web/20240724_ollama_locally_p1.png) 

4. Install the extension named "Continue - Codestral, Claude, and more"
5. Select the Continue icon in the left panel 

[![continue_step_2](/blog/web/20240724_ollama_locally_p2.png)](/blog/web/20240724_ollama_locally_p2.png) 


## To configure the VS Code Continue extension

You can access at the `config.json` file in two different ways.

First way by the VS Code interface :
1. Open VS Code
2. Click on the Continue menu in the left panel
3. Click on the Configure Continue option on the bottom right of the new left panel

[![continue_step_3](/blog/web/20240724_ollama_locally_p3.png)](/blog/web/20240724_ollama_locally_p3.png) 

Second way by the VS Code command :
1. Go to VS Code
2. Open the command Palette with the combination `Ctrl + Shift + p`
3. Use the search term `continue option` and select the `Continue : open config.json` option

[![continue_step_4](/blog/web/20240724_ollama_locally_p4.png)](/blog/web/20240724_ollama_locally_p4.png) 


# Local configuration 

## Setting up Ollama locally

We will use the following parameters :
- Ollama Model : `llama3:8b`

To install and use [Ollama](https://ollama.com/) : 
1. Go to the [official website](https://ollama.com/download) and download the desired version (Linux, Windows or Mac).
2. Follow the instruction to install the tool
3. Open a terminal
5. Execute the command : `Ollama pull llama3:8b` *(Or choose the desired model from the Ollama library)*
6. Execute the command : `Ollama run llama3:8b`

*Note : If you don't have a GPU, then [Ollama](https://ollama.com/) will display the following warning `No NVIDIA/AMD GPU detected. Ollama will run in CPU-only mode.`*
*Note : use the command `/bye` to end the prompt*


[![ollama_local_step_1](/blog/web/20240724_ollama_locally_p5.png)](/blog/web/20240724_ollama_locally_p5.png) 


## VS Code Continue extension configuration 

Example of [VS Code Continue](https://marketplace.visualstudio.com/items?itemName=Continue.continue) extension configuration to use a local [Ollama](https://ollama.com/) server :
```JSON
{
  "models": [
    {
      "title": "CodeLlama",
      "provider" : "ollama",
      "model" : "codellama:7b",
    },
    {
      "title": "Llama3",
      "provider" : "ollama",
      "model" : "llama3:8b",
    }
  ],
  "tabAutocompleteModel": {
    "title": "Starcoder",
    "provider": "ollama",
    "model": "starcoder2:3b",
  },
  "embeddingsProvider": {
    "title": "Nomic",
    "provider": "ollama",
    "model": "nomic-embed-text",
  }
}
```



# Remote configuration

## Setting up Ollama remotely (with Podman)

**Purpose** : To deploy [Ollama](https://ollama.com/) anywhere and in particular on a recent computer with a good GPU, allowing it to be used from any computer connected to the same network.

We will use the following parameters :
- Pod name : `llms-pod`
- Container name : `llms-pod-ollama`
- [Ollama](https://ollama.com/) model : `llama3:8b`
- Default port number : `11434`

The steps are as follows : 
1. Create a pod with specific Port (API) : `podman pod create --name llms-pod -p 11434:11434`
2. Create a container in the created pod : `podman run -dt --pod llms-pod --name llms-pod-ollama docker.io/ollama/ollama:latest` 
3. Pull a specific model : `podman exec -it llms-pod-ollama ollama pull llama3:8b` 
4. Run a specific model : `podman exec -it llms-pod-ollama ollama run llama3:8b` ` 

*Note : You will find some scripts to manage the pod more easily in this [github repo](https://github.com/pragmatias/ollama_local).*

[![ollama_local_step_2](/blog/web/20240724_ollama_locally_p6.png)](/blog/web/20240724_ollama_locally_p6.png) 


## VS Code Continue extension configuration 

Example of [VS Code Continue](https://marketplace.visualstudio.com/items?itemName=Continue.continue) extension configuration to use a remote [Ollama](https://ollama.com/) server :
```JSON
{
  "models": [
    {
      "title": "CodeLlama",
      "provider" : "ollama",
      "model" : "codellama:7b",
      "apiBase": "http://localhost:11434"
    },
    {
      "title": "Llama3",
      "provider" : "ollama",
      "model" : "llama3:8b",
      "apiBase": "http://localhost:11434"
    }
  ],
  "tabAutocompleteModel": {
    "title": "Starcoder",
    "provider": "ollama",
    "model": "starcoder2:3b",
    "apiBase": "http://localhost:11434"
  },
  "embeddingsProvider": {
    "title": "Nomic",
    "provider": "ollama",
    "model": "nomic-embed-text",
    "apiBase": "http://localhost:11434"
  }
}
```


# Conclusion

It is very easy to use [LLMs](https://en.wikipedia.org/wiki/Large_language_model) locally with a particular focus on privacy concerns (personal data, sensitive data, etc.) or those who cannot afford commercial offerings, with [Ollama](https://ollama.com/) (available on Linux, Windows and Mac) and [VS Code](https://code.visualstudio.com/). 
However, you really need to have a recent GPU and enough memory to be able to use it effectively.