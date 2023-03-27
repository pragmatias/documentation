---
Categories : ["Git"]
Tags : ["Git"]
title : "Git : Opérations - Focus Branches"
date : 2023-03-27
draft : false
toc: true
---

Vous trouverez dans cet article, quelques opérations à connaitre lorsque vous travaillez avec l'outil [Git](https://en.wikipedia.org/wiki/Git).

Plus spécifiquement, concernant la manipulation des commits/branches

<!--more-->

# Modification du nom d'une branche distante

Afin de pouvoir changer le nom d'une branche _(erreur lors du nommage initiale, ou changement de norme de nommage après la création de la branche distante)_, il est possible de réaliser les opérations suivantes.

Nous prenons dans l'exemple les noms de branche suivantes :
* **br_src** pour le nom de la branche source
* **br_cbl** pour le nom de la branche cible

Les étapes pour réaliser la modification sont les suivantes :
1. Se positionner sur la branche source
2. Renommer la branche source avec le nom de la branche cible localement
3. Supprimer la branche source du dépôt distant
4. Envoyer la branche cible sur le dépôt distant


```bash
# Étape n°1
git checkout br_src
# Étape n°2
git branch -m br_src br_cbl
# Étape n°3
git push origin :br_src
# Étape n°4
git push --set-upstream origin br_cbl
```



# Fusionner des commits d'une branche

Afin de pouvoir rendre plus lisible les commits d'une branche, il peut être intéressant de faire une fusion de plusieurs commits dans un seul commit identifiable.

_Note : Dans l'exemple, nous allons travailler sur un historique de 4 commits afin de fusionner les 2 commits qui correspondent à une même opération._

1. Avant de démarrer l'opération de fusion, il faut récupérer l'identifiant du commit à partir duquel nous souhaitons travailler en utilisant la commande `git log` _(il ne sera pas concerné par l'opération)_

[![fusion_step_1](/blog/web/20230327_git_operation_2_p1.png)](/blog/web/20230327_git_operation_2_p1.png) 

Note : On récupère l'identifiant `8afa079e45c3b5c7493f160db5ebefde06aef2bb` qui correspond au dernier commit que nous ne voulons pas modifier.


2. Pour démarrer l'opération, il faut exécuter la commande `git rebase -i 8afa079e45c3b5c7493f160db5ebefde06aef2bb` 

[![fusion_step_2](/blog/web/20230327_git_operation_2_p2.png)](/blog/web/20230327_git_operation_2_p2.png) 

Note : Il est aussi possible d'utiliser la commande avec le terme **HEAD** pour ne prendre en compte que les **X** derniers commits : `git rebase -i HEAD~X`

3. Il faut modifier le terme **pick** par **squash** (ou **s**) pour marquer les commits devant être fusionnés. _(Pour valider, il faut sauvegarder les changements effectués et quitter)_

[![fusion_step_3](/blog/web/20230327_git_operation_2_p3.png)](/blog/web/20230327_git_operation_2_p3.png) 

Note : 
* Le commit marqué comme **squash** sera fusionné avec le 1er commit au dessus qui est marqué comme **pick**
* Il est possible de faire plusieurs opérations de fusion (**squash**) sur plusieurs commits dans une même opération de fusion. Pour cela il faut avoir plusieurs commits marqués en **pick** suivi d'au moins un commit marqué en **squash**


4. Suite à la validation de l'étape précédente, Git affiche la description des commits devant être fusionnés.

[![fusion_step_4](/blog/web/20230327_git_operation_2_p4.png)](/blog/web/20230327_git_operation_2_p4.png) 


5. Afin de définir la description souhaitée concernant la fusion des commits, il faut modifier les descriptions. _(Pour valider, il faut sauvegarder les changements effectués et quitter)_

[![fusion_step_5](/blog/web/20230327_git_operation_2_p5.png)](/blog/web/20230327_git_operation_2_p5.png) 


Note : Dans l'exemple, on supprime la description du deuxième commit afin d'avoir un commit avec une seule description à la fin de la fusion.

6. Afin de vérifier que la fusion a bien eu le résultat attendu, il faut exécuter la commande `git log`

[![fusion_step_6](/blog/web/20230327_git_operation_2_p6.png)](/blog/web/20230327_git_operation_2_p6.png) 



# Appliquer des modifications en se basant sur un commit spécifique (Cherry-Pick)

Afin de pouvoir reporter le contenu d'un commit spécifique vers une autre branche, il faut utiliser l'opération **cherry-pick**

_Note : Il peut être très intéressant de réaliser une fusion de plusieurs commits avant de réaliser une opération **cherry-pick** pour reporter la totalité des changements par rapport à un seul commit._

Les étapes sont les suivantes :
1. Se positionner sur la branche à partir de laquelle on souhaite faire le report
2. Faire le report en se basant sur le dernier commit d'une branche
3. Vérifier que le report à bien au lieu

```bash
# Étape n°1
git checkout br_cbl
# Étape n°2
git cherry-pick br_src
# Étape n°3
git log
```


Note : Il est possible de définir quel commit on souhaite reporter avec la commande `git cherry-pick <commit-id>`


Si il existe des conflits lors de l'opération **cherry-pick**, il faut gérer cela comme pour un merge entre deux branches en suivant la procédure suivante :
1. Modification des fichiers en conflit
2. Prise en compte des modifications apportées avec la commande `git add <files>`
3. Finalisation de l'opération **cherry-pick** avec la commande `git cherry-pick --continue`




