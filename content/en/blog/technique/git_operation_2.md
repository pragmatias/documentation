---
Categories : ["Git"]
Tags : ["Git"]
title : "Git : Operations - Branch Focus"
date : 2023-03-27
draft : false
toc: true
---

You will find in this article, some operations to know when you work with the tool [Git](https://en.wikipedia.org/wiki/Git).

More specifically, regarding the handling of commits/branches

<!--more-->

# Modifying the name of a remote branch

In order to change the name of a branch _(error during initial naming, or change of naming standard after creation of the remote branch)_, it is possible to perform the following operations.

In the example, we take the following branch names :
* **br_src** for the source branch name
* **br_cbl** for the target branch name

The steps for doing the change are the following :
1. Get the source branch
2. Rename the source branch with the name of the target branch locally
3. Delete the source branch from the remote repository
4. Push the target branch to the remote repository


```bash
# Step n°1
git checkout br_src
# Step n°2
git branch -m br_src br_cbl
# Step n°3
git push origin :br_src
# Step n°4
git push --set-upstream origin br_cbl
```



# Merge commits of a branch

In order to make the commits of a branch more readable, it can be interesting to merge several commits into one identifiable commit.

_Note: In the example, we will work on a history of 4 commits in order to merge the 2 commits that correspond to the same operation._

1. Before starting the merge operation, we have to get the ID of the commit we want to work from by uusing the command `git log` _(It will not be affected by the merge operation)_

[![fusion_step_1](/blog/web/20230327_git_operation_2_p1.png)](/blog/web/20230327_git_operation_2_p1.png) 

Note : We get the ID `8afa079e45c3b5c7493f160db5ebefde06aef2bb` which corresponds to the last commit we do not want to modify.


2. To start the merge operation, execute the command `git rebase -i 8afa079e45c3b5c7493f160db5ebefde06aef2bb` 

[![fusion_step_2](/blog/web/20230327_git_operation_2_p2.png)](/blog/web/20230327_git_operation_2_p2.png) 

Note : It is also possible to use the command with the term **HEAD** to take into account only the **X** last commits of a branch : `git rebase -i HEAD~X`

3. The term **pick** must be modified to **squash** (or **s**) to mark the commits to be merged. _(To validate, save the changes and exit)_

[![fusion_step_3](/blog/web/20230327_git_operation_2_p3.png)](/blog/web/20230327_git_operation_2_p3.png) 

Note : 
* The commit marked as **squash** will be merged with the first commit above it that is marked as **pick**
* It is possible to to multiple **squash** operations on multple commits in a single merge operation. To do this, you must have several commits marked as **pick** followed by at least one commit marked as **squash**


4. After the validation of the previous step, Git display the description of the commits to be merged.

[![fusion_step_4](/blog/web/20230327_git_operation_2_p4.png)](/blog/web/20230327_git_operation_2_p4.png) 


5. In order to define the desired description for merging commits, you need to modify the descriptions. _(To validate, save the changes and exit)_

[![fusion_step_5](/blog/web/20230327_git_operation_2_p5.png)](/blog/web/20230327_git_operation_2_p5.png) 


Note : In the example, we delete the description of the second commit in order to have a commit with only one description at the end of the merge.

6. To check the merge operation result, you must execute the command `git log`

[![fusion_step_6](/blog/web/20230327_git_operation_2_p6.png)](/blog/web/20230327_git_operation_2_p6.png) 



# Appy changes based on a specific commit (Cherry-Pick)

In order to be able to carry over the contents of a specific commit to another branch, you need to use the **cherry-pick** operation.

_Note : It could be very interesting to perform a merge of several commits before performing a **cherry-pick** operation to carry over all the changes from a single commit._

The steps are the following :
1. Get the branch from which you wish to make the **cherry-pick** operation
2. Merge the wished commit content from source branch in the current branch
3. Check the merge operation result

```bash
# Step n°1
git checkout br_cbl
# Step n°2
git cherry-pick br_src
# Step n°3
git log
```


Note : It is possible to define which commit you want to merge with the command `git cherry-pick <commit-id>`


If there are conflicts during the **cherry-pick** operation, this must be handled as for a merge between two branches using the following procedure :
1. Modify the conflicting files
2. Take into account the changes made with the command `git add <files>`
3. Finalize the **cherry-pick** operation with the command `git cherry-pick --continue`


