---
Categories : ["Ollama","LLMs","VS Code","Podman"]
Tags : ["Ollama","LLMs","VS Code","Podman"]
title : "LLMs : Utilisation de Ollama avec Podman et VS Code"
date : 2024-07-24
draft : fals
toc: true
---

Vous trouverez dans cet article, des informations pour utiliser [Ollama](https://ollama.com/) ([LLMs](https://en.wikipedia.org/wiki/Large_language_model)) avec [Podman](https://podman.io/) et [VS Code](https://code.visualstudio.com/).

<!--more-->

# Ollama

[Ollama](https://ollama.com/) est un outil gratuit et open-source conçu pour exécuter localement des [LLMs (Large Language Models)](https://en.wikipedia.org/wiki/Large_language_model) libre sur votre système.

[Ollama](https://ollama.com/) est conçu pour tirer avantage des cartes graphiques Nvidia ou AMD. Si vous n'avez qu'un CPU, vous aurez une très mauvaise performance du modèle.

Vous trouverez la liste des GPU prises en charge dans la [documentation officielle](https://github.com/ollama/ollama/blob/main/docs/gpu.md).

Il est nécessaire d'avoir une quantité importante de mémoire pour l'utiliser. Je vous recommande de disposer d'au moins 32 Go.

Vous trouverez tous les modèles LLM disponibles dans la [bibliothèque officielle](https://ollama.com/library).

Quelques exemples de modèles disponibles :
- [llama3](https://ollama.com/library/llama3) : Meta Llama 3, une famille de modèles développée par Meta Inc.
- [codellama](https://ollama.com/library/codellama) : Code Llama est un modèle conçu pour générer et discuter du code, construit sur la base de Llama 2.
- [gemma2](https://ollama.com/library/gemma2) : Google Gemma 2, présentant une nouvelle architecture conçue pour offrir des performances et une efficacité exceptionnelles.
- [codegemma](https://ollama.com/library/codegemma) : CodeGemma est un ensemble de modèles puissants et légers qui peuvent accomplir diverses tâches de codage, telles que la finition automatique du code, la génération de code, la compréhension naturelle du langage, la raison mathématique et l'exécution d'instructions.
- [starcoder2](https://ollama.com/library/starcoder2) : StarCoder2 est la prochaine génération de modèles decode ouverts entraînés de manière transparente.

Commandes utiles :
- `ollama list`: Liste les modèles récupérés
- `ollama ps` : Liste les modèles en cours d'exécution
- `ollama pull <model>` : Récupère un modèle à partir d'un dépôt
- `ollama show <model>` : Affiche des informations concernant un modèle
- `ollama run <model>` : Execution d'un modèle
- `ollama rm <model>` : Suppression d'un modèle


# Podman

[Podman](https://docs.podman.io/en/latest/) est un outil sans démon, open-source, natif Linux, conçu pour faciliter la recherche, l'exécution, la construction, le partage et le déploiement d'applications en utilisant les conteneurs et les Images de Conteneur [Open Containers Initiative (OCI)](https://opencontainers.org/).

[Podman](https://docs.podman.io/en/latest/) propose une ligne de commande (CLI) familière aux utilisateurs de l'outil Docker.

[Podman](https://docs.podman.io/en/latest/) gère l'ensemble de l'écosystème de conteneurs, qui inclut les pods, les conteneurs, les images de conteneurs et les volumes, en utilisant la bibliothèque [libpod](https://github.com/containers/podman).

Concepts fondamentaux :
- Un pod est un groupe de conteneurs qui fonctionnent ensemble et partagent les mêmes ressources, similaire aux pods Kubernetes.
- Un conteneur est un environnement isolé dans lequel une application peut fonctionner sans affecter le reste du système ou être influencé par celui-ci.
- Une image de conteneur est un fichier statique contenant du code exécutable qui peut créer un conteneur sur un système informatique. Une image de conteneur est immuable – cela signifie qu'elle ne peut pas être modifiée et peut être déployée de manière cohérente dans n'importe quel environnement.
- Un volume de conteneur est un stockage durable qui peut être utilisé par un conteneur.

*Attention : Pour obtenir une performance optimale, je vous recommande d'utiliser le [GPU Passthrough](https://docs.nvidia.com/ai-enterprise/deployment-guide-rhel-with-kvm/0.1.0/podman.html).*


# VS Code

[VS Code](https://code.visualstudio.com/) est un éditeur de code extensible et multi-plateformes développé par Microsoft.

[VS Code](https://code.visualstudio.com/) peut être étendu via des extensions disponibles dans un [dépôt central](https://marketplace.visualstudio.com/vscode).

[Continue](https://www.continue.dev/) est un assistant de code AI open-source qui permet de connecter n'importe quels modèles à un IDE.

Nous utiliserons l'extension [VS Code Continue](https://marketplace.visualstudio.com/items?itemName=Continue.continue) pour travailler avec notre configuration [Ollama](https://ollama.com/) (locale ou distante). En outre, vous pouvez utiliser différents fournisseurs et services, tels que [Open AI](https://openai.com/), [Anthropic](https://www.anthropic.com/), [Mistral](https://mistral.ai/), [Gemini](https://gemini.google.com/), et d'autres.


## Installation de l'extension VS Code Continue

Les étapes à suivre : 
1. Ouvrez VS Code 
2. Cliquez sur le menu "extensions" dans le panneau à gauche
3. Filtrez les résultats avec le terme `Continue.continue`

[![continue_step_1](/blog/web/20240724_ollama_locally_p1.png)](/blog/web/20240724_ollama_locally_p1.png) 

4. Installez l'extension nommée "Continue - Codestral, Claude, and more"
5. Sélectionnez l'icone Continue dans le panneau de gauche

[![continue_step_2](/blog/web/20240724_ollama_locally_p2.png)](/blog/web/20240724_ollama_locally_p2.png) 


## Configuration de l'extension VS Code Continue

Vous pouvez accéder au fichier `config.json`  de deux manières différentes.

Première manière par l'interface de VS Code :
1. Ouvrez VS Code
2. Cliquez sur le menu Continue dans le panneau de gauche
3. Cliquez sur l'option Configure Continue en bas à droite du nouveau panneau de gauche

[![continue_step_3](/blog/web/20240724_ollama_locally_p3.png)](/blog/web/20240724_ollama_locally_p3.png) 

Seconde manière par la Palette de commande de VS Code :
1. Ouvrez VS Code
2. Ouvrez la Palette de commande avec la combinaison `Ctrl + Shift + p`
3. Utilisez le terme `continue option` dans l'espace de recherche et sélectionnez l'option `Continue : open config.json`

[![continue_step_4](/blog/web/20240724_ollama_locally_p4.png)](/blog/web/20240724_ollama_locally_p4.png) 


# Configuration locale

## Mise en place de Ollama en locale

Nous utiliserons les paramètres suivantes :
- Modèle Ollama : `llama3:8b`

Pour installer et utiliser [Ollama](https://ollama.com/) : 
1. Allez sur le [site officiel](https://ollama.com/download) et télécharger la version souhaitée (Linux, Windows or Mac).
2. Suivez les instructions d'installation de l'outil
3. Ouvrez un terminal
5. Exécutez la commande : `Ollama pull llama3:8b` *(Ou choisissez le model souhaité à partir de la librarie Ollama)*
6. Exécutez la commande : `Ollama run llama3:8b`

*Note : Si vous n'avez pas de GPU, alors [Ollama](https://ollama.com/) affichera le warning suivant :  `No NVIDIA/AMD GPU detected. Ollama will run in CPU-only mode.`*
*Note : utilisez la commande `/bye` pour terminer le prompt*


[![ollama_local_step_1](/blog/web/20240724_ollama_locally_p5.png)](/blog/web/20240724_ollama_locally_p5.png) 


## Configuration de l'extension VS Code Continue

Exemple d'une configuration de [VS Code Continue](https://marketplace.visualstudio.com/items?itemName=Continue.continue) pour utiliser un serveur locale de [Ollama](https://ollama.com/) :
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



# Configuration distante

## Mise en place de Ollama avec Podman

**Objectif :** Déployer [Ollama](https://ollama.com/) sur n'importe quel machine, et plus particulièrement sur une machine avec un ou plusieurs GPU récents, permettant une utilisation optimale à partir de tout ordinateur connecté au même réseau.

Nous utiliserons les paramètres suivants :
- Nom du pod : `llms-pod`
- Nom du conteneur : `llms-pod-ollama`
- Modèle [Ollama](https://ollama.com/) : `llama3:8b`
- Numéro du port par défaut : `11434`

Les étapes à suivre sont les suivantes : 
1. Création d'un pod avec la définition du port (API) : `podman pod create --name llms-pod -p 11434:11434`
2. Création d'un conteneur dans le pod créé : `podman run -dt --pod llms-pod --name llms-pod-ollama docker.io/ollama/ollama:latest` 
3. Récupération d'un modèle spécifique : `podman exec -it llms-pod-ollama ollama pull llama3:8b` 
4. Exécution d'un modèle spécifique : `podman exec -it llms-pod-ollama ollama run llama3:8b` ` 

*Note : Vous trouverez des scripts pour gérer le pod plus facilement dans ce [dépôt github](https://github.com/pragmatias/ollama_local).*

[![ollama_local_step_2](/blog/web/20240724_ollama_locally_p6.png)](/blog/web/20240724_ollama_locally_p6.png) 


## Configuration de l'extension VS Code Continue

Exemple d'une configuration de [VS Code Continue](https://marketplace.visualstudio.com/items?itemName=Continue.continue) pour utiliser un serveur distant de [Ollama](https://ollama.com/) :
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

Il est très facile d'utiliser des [LLMs](https://en.wikipedia.org/wiki/Large_language_model) localement, pour toutes les personnes ayant une attention particulière concernant l'usage de leurs données (vie privée, données sensibles, ...) ou n'ayant pas les moyens d'utiliser les offres commerciales, avec [Ollama](https://ollama.com/) *(disponible sur les plateformes Linux, Windows et Mac)* et [VS Code](https://code.visualstudio.com/). 
Cependant, il est indispensable d'avoir un GPU récent et une quantité de mémoire suffisante pour pouvoir l'utiliser efficacement.



