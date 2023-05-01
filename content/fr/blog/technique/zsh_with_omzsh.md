---
Categories : ["ZSH","MacOS","WSL","Linux"]
Tags : ["ZSH","MacOS","WSL","Linux"]
title : "ZSH : OMZSH avec Powerlevel10k"
date : 2023-05-01
draft : true
toc: true
---

Vous trouverez dans cet article, les étapes pour installer [ZSH](https://www.zsh.org/) avec [Oh My ZSH](https://ohmyz.sh/) et le thème [Powerlevel10k](https://github.com/romkatv/powerlevel10k).

Plus spécifiquement, pour la configuration de [MacOS](https://www.apple.com/fr/macos/ventura/) et [Windows WSL](https://en.wikipedia.org/wiki/Windows_Subsystem_for_Linux).


<!--more-->

# Installation des applications

## Pour MacOS

Les étapes sont :
1. Installation de [Xcode](https://apps.apple.com/fr/app/xcode/id497799835?mt=12)
2. Installation de [Homebrew](https://brew.sh/index_fr) (package manager)
3. Installation de [iTerm2](https://iterm2.com/) , [ZSH](https://www.zsh.org/), [FZF](https://github.com/junegunn/fzf), [FD](https://github.com/sharkdp/fd), [Tree](https://www.computerhope.com/unix/tree.htm)
4. Installation de [Oh My ZSH]

Les commandes sont :
```bash
# Step 1 : Xcode
xcode-select --install

# Step 2 : Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Step 3 : iTerm2, ZSH, FZF, FD, TREE
brew install iterm2 zsh fzf fd tree

# Step 4 : Oh My ZSH
sh -c "$(curl -fsSL https://raw.githubusercontent.com/robbyrussell/oh-my-zsh/master/tools/install.sh)"

```


## Pour Windows WSL (et Linux)


Les étapes sont : 
1. Installation de [Windows Terminal](https://apps.microsoft.com/store/detail/windows-terminal/9N0DX20HK701)
2. Installation de [Windows WSL Ubuntu](https://ubuntu.com/wsl)
3. Connexion sur WSL 2 avec `Windows Terminal` et mise à jour de `Ubuntu`
4. Installation de [ZSH](https://www.zsh.org/), [FZF](https://github.com/junegunn/fzf), [FD](https://github.com/sharkdp/fd), [Tree](https://www.computerhope.com/unix/tree.htm)
5. Installation de [Oh My ZSH](https://ohmyz.sh/)

```bash
# Step 2 : Windows WSL Ubuntu

## Install WSL
wsl --install -d ubuntu

## Check version
wsl -l -v

## Set WSL2 if needed
wsl --set-version ubuntu 2


# Step 3 : Update Ubuntu
sudo apt update && sudo apt upgrade


# Step 4 : Installation of zsh fzf fd-find tree
sudo apt install zsh fzf fd-find tree


# Step 5 : Oh My ZSH
sh -c "$(curl -fsSL https://raw.githubusercontent.com/robbyrussell/oh-my-zsh/master/tools/install.sh)"
# Do you want to change your default shell to zsh? [Y/n]
Y

```




# Configuration des applications

## Alias

1. Creation du fichier de configuration pour stocker vos alias `~/.alias`
2. Ajout du lien entre le fichier de configuration d'alias`~/.alias` dans le fichier de configuration de ZSH `~/.zshrc`

Pour MacOS & Linux : 
```bash

# Step 1 : Alias file creation
touch ~/.alias

# Step 2 : Add the Alias config file in ZSH config file
echo "[[ ! -f ~/.alias ]] || source ~/.alias" >> ~/.zshrc

```

Pour Windows WSL
```bash

# Step 1 : Alias file creation
echo "alias fd=fdfind" >> ~/.alias

# Step 2 : Add the Alias config file in ZSH config file
echo "[[ ! -f ~/.alias ]] || source ~/.alias" >> ~/.zshrc

```


## Plugins Oh My ZSH 

1. Installation de [powerline fonts](https://github.com/powerline/fonts.git) (vous trouverz plus d'instructions en suivant ce [lien](https://github.com/romkatv/powerlevel10k#manual-font-installation))

Pour MacOS & Linux :
```bash
git clone https://github.com/powerline/fonts.git
cd fonts
./install.sh
```

Pour Windows (avec `Windows Terminal`)  :
```bash
# Change the current user execution policy
set-executionpolicy -scope CurrentUser -executionPolicy Unrestricted
get-executionpolicy -list

# Install Fonts
git clone https://github.com/powerline/fonts.git
cd fonts
.\install.ps1

# Change the current user execution policy
set-executionpolicy -scope CurrentUser -executionPolicy Default

```

2. Installation du thème Powerlevel10k et des plugins (manuellement)
```bash

# Install Theme 
git clone --depth=1 https://github.com/romkatv/powerlevel10k.git ${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/themes/powerlevel10k


# Install plugins
git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions
git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting
git clone --depth 1 https://github.com/unixorn/fzf-zsh-plugin.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/fzf-zsh-plugin
git clone --depth 1 https://github.com/aubreypwd/zsh-plugin-fd ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-plugin-fd 

```

3. Modification du fichier de configuration ZSH : `~/.zshrc`

```bash
# Replace the ZSH_THEME config
ZSH_THEME="powerlevel10k/powerlevel10k"

# Replace the PLUGINS config
plugins=(
    git
    zsh-autosuggestions
    zsh-syntax-highlighting
    fzf-zsh-plugin
    zsh-plugin-fd 
)

```


## Iterm2 (for MacOS)

1. Récupération du [iTerm2 color schemes](https://github.com/mbadolato/iTerm2-Color-Schemes) souhaité

2. Modification de la police d'écriture : Aller dans `iTerm2 > Preferences > Profiles > Text > Font`
    1. Choisir `MesloLGS NF`
    2. Cocher l'option : `Use ligatures`

3. Importer le schéma des couleurs : Aller dans `iTerm2 > Preferences > Profiles > Colors`
    1. Cliquer sur `Color Presets ...` et selectionner `Import...`
    2. Cliquer sur le schéma des couleurs souhaitées (cf l'étape n°1)

4. Ajouter des raccourcis : Aller dans `iTerm2 > Preferences > Profiles > Keys > Key Mappings`
    1. Choisir l'icone `+`
    2. Ajouter les raccourcis définis ci-dessous

| Shortcut | Action               | Esc+ |
| -------- | -------------------- | ---- |
| ⌘←       | Send Escape Sequence | OH   |
| ⌘→       | Send Escape Sequence | OF   |
| ⌥←       | Send Escape Sequence | b    |
| ⌥→       | Send Escape Sequence | f    |


## Windows Terminal (pour Windows WSL)

1. Récupérer le schéma des couleurs souhaité à partir de [windowsterminalthemes.dev](https://windowsterminalthemes.dev/)
2. Ouvrir l'application `Windows Terminal` et aller dans `Windows Terminal > Settings`
    1. Aller dans `Startup`
        1. Default Profile : `Ubuntu`
        2. Default terminal application : `Windows Terminal`
    2. Aller dans `Open your settings.json file`
        1. Coller le schéma des couleurs dans la balise JSON `schemes`
    3. Aller dans `Color Schemes`
        1. Choisir votre schéma
    4. Pour chaque profile (Defaults, Windows PowerShell, Command Prompt, Ubuntu, Azure CLoud Shell, Git Bash, ....)
        1. Aller dans `Appearance`
            1. Color scheme : CHoisir votre schéma
            2. Font face : `MesloLGS NF`

Exemple pour la modification du schéma dans le JSON de configuration :
```json
"schemes": 
[
    {...},
    {
        "background": "#1B1B1B",
        "black": "#1B1B1B",
        "blue": "#458588",
        "brightBlack": "#928374",
        "brightBlue": "#83A598",
        "brightCyan": "#8EC07C",
        "brightGreen": "#B8BB26",
        "brightPurple": "#D3869B",
        "brightRed": "#FB4934",
        "brightWhite": "#EBDBB2",
        "brightYellow": "#FABD2F",
        "cursorColor": "#EBDBB2",
        "cyan": "#689D6A",
        "foreground": "#EBDBB2",
        "green": "#98971A",
        "name": "GruvboxDarkHard",
        "purple": "#B16286",
        "red": "#CC241D",
        "selectionBackground": "#665C54",
        "white": "#A89984",
        "yellow": "#D79921"
    },
    {....}
]
```


## Powerlevel10K

1. Exécuter la commande `p10k configuration` dans l'application`iterm2` ou `windows terminal > ubuntu` en utilisant `zsh` 
    1. Prompt Style : `Lean`
    2. Character Set : `Unicode`
    3. Prompt Colors : `256 colors`
    4. Show current time : `24-hour format`
    5. Prompt Height : `Two lines`
    6. Prompt Connection : `Disconnected`
    7. Prompt Frame : `Left`
    8. Frame Color : `Dark`
    9. Prompt Spacing : `Sparse`
    10. Icons : `Many icons`
    11. Prompt Flow : `Concise`
    12. Enable Transient Prompt : `No`
    13. Instant Prompt Mode : `Verbose`
    14. Overwrite `~/.p10k.zsh` : `Yes`



