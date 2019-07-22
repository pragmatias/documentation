---
Categories : ["Git"]
Tags : ["Git"]
title : "Git : Operations"
date : 2019-06-24
draft : false
toc: true
---

You'll find in this article, some informations/commands to know to work with the [Git](https://en.wikipedia.org/wiki/Git) tool.

<!--more-->

# What's Git

Git is a distributed version-control system for tracking changes in text file created by Linus Torvalds in 2005.

A full documentation is available from [official website](https://git-scm.com/doc).

# Setting up Git

## Git installation

For OpenSUSE : 

- Execute the following command : `$ sudo zypper in --no-recommend git`

For Windows : 

- Go on the [official website](https://git-scm.com/download/win) to download the tool and install it on your workstation. 

## Vocabulary definition

The states :

- Untracked : The file is not tracked by Git
- Unmodified : The file is tracked by Git but has not yet been modified
- Modified : The file is tracked by Git and has been modified
- Staged : The file is tracked by Git but has not yen been committed

Diagram :
[![diagram](/blog/web/20190528_git_lifecycle.png)](/blog/web/20190528_git_lifecycle.png) 

## Git config

You will find more information on [official website](https://git-scm.com/book/en/v2/Customizing-Git-Git-Configuration).

Retrieve the list of configuration parameters :

- all the parameters :  `$ git config --list` 
- All the global parameters : `$ git config --list --global` 
- All the parameters and their origin : `$ git config --list --show-origin` 

Define of user parameters :

- User name : `$ git config --global user.name "user"`
- User email : `$ git config --global user.email "user@mail"`

Define of system parameters :

- To avoid automatically changing the end of line character format between Windows (CRLF) and Linux (LF) : `$ git config --global core.autocrlf false`


# Setting up a Git repository (Github)

1/ [Initialization](https://git-scm.com/docs/git-init) of Git in an existing folder
To initializing Git in a folder : `$ git init`
To link to a remote repository : `$ git remote add <remote_name> <remote_url>`


2/ [Cloning](https://git-scm.com/docs/git-clone) of an existing remote repository (example with github)
To retrieve a remote repository on your workspace : `$ git clone <url> <folder>`


# Management of files with Git

You will find, below, a list of operations to know to manage files with Git.

| Command | Comment |
|:--|:--|
| `$ git status` | Analysis of the state of all elements |
| `$ git status -s` | Analysis of the state of all elements with a synthetic display |
| `$ git add <fichier ou pattern>` | Tracking a new file |
| `$ git add -f <fichier ou pattern>` | Force the tracking of a new file (gitignore) |
| `$ git add -A` | Tracking all the new files |
| `$ git commit -m "<message>"` | Commit of all elements in the _staged_ space with a message |
| `$ git commit --amend"` | Commit all elements in the _staged_ space in the preceding _commit_ |
| `$ git rm <fichier ou pattern>` | Deleting a file in the current directory if it has already been _commit_ |
| `$ git rm --cached <fichier ou pattern>` | Deleting a file from the _staged_ space but not from the current folder |
| `$ git checkout -- <fichier ou pattern>` | Cancelling changes to a file not present in the _staged_ state |


# Management of a remote repository

You will find, below, a list of the operations to know to be able to manage a [remote repository](https://git-scm.com/book/en/v2/Git-Branching-Remote-Branches) with Git

| Command | Comment |
|:--|:--|
| `$ git remote -v` | List the remote repositories |
| `$ git remote add <remote_name> <remote_url>` | Add a remote repository |
| `$ git fetch <remote_name>` | Retrieving metadata from a remote repository |
| `$ git chekout <remote_name>/<branch>` | Retrieving all the elements of a branch from a remote repository |
| `$ git push <remote_name> <branhc>` | Sending new _commit_ to a branch of a remote repository |
| `$ git remote show <remote_name>` | Inspect a remote repository |
| `$ git remote rename <remote_name_old> <renomte_name_new>` | Modify the local name used to define a remote repository |
| `$ git remote remove <remote_name>` | Deleting a remote repository |



# Definition of a .gitignore file

It is possible to ignore some files/folders with Git using a [.gitignore](https://git-scm.com/docs/gitignore) file.

Example of a **.gitignore** file content

```git
# ignore all .a files
*.a

# ignore all .a or .o files
*.[oa]

# ignore all files ending by ~
*~

# but do track lib.a, even though you're ignoring .a files above
!lib.a

# only ignore the TODO file in the current directory, not subdir/TODO
/TODO

# ignore all files in any directory named build
build/

# ignore doc/notes.txt, but not doc/server/arch.txt
doc/*.txt

# ignore all .pdf files in the doc/ directory and any of its subdirectories
doc/**/*.pdf
```


# Retrieving differences and change history

Some commands to see the [differences](https://git-scm.com/docs/git-diff) between _commit_ :

| Command | Comment |
|:--|:--|
| `$ git diff` | Difference between the working directory and the last _commit_ |
| `$ git diff --cached` | Difference between files added for the next _commit_ and the last _commit_ |
| `$ git diff <commit_1> <commit_2> <pattern>` | List of differences between two _commit_ for all files corresponding to the choosen pattern |


Some commands to read [a _commit_ history](https://git-scm.com/docs/git-log) :

| Command | Comment |
|:--|:--|
| `$ git log` | See the history of all _commit_ |
| `$ git log -2` | See the history of the two last _commit_ |
| `$ git log -p -1` | See the history of the last _commit_ with details of the differences between them |
| `$ git log -stat -1` | See the history of the last _commit_ with statitics |
| `$ git log --pretty=format:"<format>"` | See the history of the _commit_ in the choosen format |
| `$ git log --oneline --decorate"` | Example of command ... |
| `$ git log --oneline --decorate --graph --all"` | Example of command ... |


Example of options that can be used as a format :
| Option | Description |
|:--|:--|
| %H | Commit hash |
| %h | Abbreviated commit hash |
| %T | Tree hash |
| %t | Abbreviated tree hash |
| %P | Parent hashes |
| %p | Abbreviated parent hashes |
| %an | Author name |
| %ae | Author email |
| %ad | Author date (format respects the --date=option) |
| %ar | Author date, relative |
| %cn | Committer name |
| %ce | Committer email |
| %cd | Committer date |
| %cr | Committer date, relative |
| %s | Subject |


# Tags management
| Command | Comment |
|:--|:--|
| `$ git tag` | List existing tags |
| `$ git tag -l <pattern>` | List the tags corresponding to a pattern |
| `$ git tag -a <tag> -m "<message>"` | Creating an annotated tag |
| `$ git tag <tag>` | Creating a lightweight tag |
| `$ git tag -d <tag>` | Deleting a tag |
| `$ git show <tag>` | Retrieving the description of an annotated tag |
| `$ git tag -a <tag> <checksum>` | Creating a tag on an existing commit (checksum) |
| `$ git push <remote> <tag>` | Send the tag on the remote repository |
| `$ git push <remote> --tags` | Send all tags ont the remote reporitoty |
| `$ git push <remote> --delete <tag>` | Deleting a tag from the remote repository |
| `$ git checkout <tag>` | Retrieving the content of a tag in a detached branch |
| `$ git checkout -b <branch> <tag>` | Retrieving the content of a tag in a new branch |


# Alias management

You can set aliases to access git command faster.

```git
$ git config --global alias.co checkout
$ git config --global alias.br branch
$ git config --global alias.ci commit
$ git config --global alias.st status
$ git config --global alias.unstage 'reset HEAD --'
$ git config --global alias.last 'log -1 HEAD'
```


# Branch management with Git

| Commande | Commentaire |
|:--|:--|
| `$ git branch` | List of branches |
| `$ git branch -v` | List of branches with the last _commit_ |
| `$ git branch --merged` | List of branches merged with the current branche |
| `$ git branch test` | Creating a new branch named _test_ |
| `$ git branch -d corf1` | Removing the branch _corf1_  |
| `$ git checkout master` | Switch branche (on the branch _master_) |
| `$ git checkout -b devf1` | Creating the _devf1_ branch and switch on the branch _devf1_ |
| `$ git merge corf1` | Merge the branch _corf1_ on the current branch |


# Others operations

The **rebase** operation to apply the set of modifications of a branch by rewriting the history : [documentation](https://git-scm.com/docs/git-rebase).
