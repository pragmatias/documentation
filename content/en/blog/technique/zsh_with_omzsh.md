---
Categories : ["ZSH","MacOS","WSL","Linux"]
Tags : ["ZSH","MacOS","WSL","Linux"]
title : "ZSH : Oh My ZSH with Powerlevel10k"
date : 2023-05-01
draft : false
toc: true
---

You will find in this article, the steps to install [ZSH](https://www.zsh.org/) with [Oh My ZSH](https://ohmyz.sh/) and the theme [Powerlevel10k](https://github.com/romkatv/powerlevel10k).

More specifically, for [MacOS](https://www.apple.com/fr/macos/ventura/) and [Windows WSL](https://en.wikipedia.org/wiki/Windows_Subsystem_for_Linux) configuration.


<!--more-->

# Tools installation

## For MacOS

The steps are :
1. Installation of [Xcode](https://apps.apple.com/fr/app/xcode/id497799835?mt=12)
2. Installation of [Homebrew](https://brew.sh/index_fr) (package manager)
3. Installation of [iTerm2](https://iterm2.com/) , [ZSH](https://www.zsh.org/), [FZF](https://github.com/junegunn/fzf), [FD](https://github.com/sharkdp/fd), [Tree](https://www.computerhope.com/unix/tree.htm)
4. Installation of [Oh My ZSH](https://ohmyz.sh/)

The commands are :
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


## For Windows WSL (and Linux)


The steps are : 
1. Installation of [Windows Terminal](https://apps.microsoft.com/store/detail/windows-terminal/9N0DX20HK701)
2. Installation of [Windows WSL Ubuntu](https://ubuntu.com/wsl)
3. Connect to WSL 2 with `Windows Terminal` and update `Ubuntu`
4. Installation of [ZSH](https://www.zsh.org/), [FZF](https://github.com/junegunn/fzf), [FD](https://github.com/sharkdp/fd), [Tree](https://www.computerhope.com/unix/tree.htm)
5. Installation of [Oh My ZSH](https://ohmyz.sh/)

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




# Tools configuration

## Alias

1. Create a config file to store all your alias `~/.alias`
2. Add the link to the alias config file `~/.alias` in your ZSH config file `~/.zshrc`

For MacOS & Linux : 
```bash

# Step 1 : Alias file creation
touch ~/.alias

# Step 2 : Add the Alias config file in ZSH config file
echo "[[ ! -f ~/.alias ]] || source ~/.alias" >> ~/.zshrc

```

For Windows WSL
```bash

# Step 1 : Alias file creation
echo "alias fd=fdfind" >> ~/.alias

# Step 2 : Add the Alias config file in ZSH config file
echo "[[ ! -f ~/.alias ]] || source ~/.alias" >> ~/.zshrc

```


## Oh My ZSH Plugins

1. Installation of [powerline fonts](https://github.com/powerline/fonts.git) (you'll find more instructions on this [link](https://github.com/romkatv/powerlevel10k#manual-font-installation))

For MacOS & Linux :
```bash
git clone https://github.com/powerline/fonts.git
cd fonts
./install.sh
```

For Windows (with `Windows Terminal`)  :
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

2. Installation of the Powerlevel10k theme and the plugins (manually)
```bash

# Install Theme 
git clone --depth=1 https://github.com/romkatv/powerlevel10k.git ${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/themes/powerlevel10k


# Install plugins
git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions
git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting
git clone --depth 1 https://github.com/unixorn/fzf-zsh-plugin.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/fzf-zsh-plugin
git clone --depth 1 https://github.com/aubreypwd/zsh-plugin-fd ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-plugin-fd 

```

3. Modification of the ZSH config file : `~/.zshrc`

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

1. Get the desired [iTerm2 color schemes](https://github.com/mbadolato/iTerm2-Color-Schemes)

2. Change fonts : Navigate to `iTerm2 > Preferences > Profiles > Text > Font`
    1. Choose `MesloLGS NF`
    2. Check option : `Use ligatures`

3. Import color scheme : Navigate to `iTerm2 > Preferences > Profiles > Colors`
    1. Click on `Color Presets ...` and choose `Import...`
    2. Click on your desired iTerm2 color scheme (from step n°1)

4. Add Key mapping : Navigate to `iTerm2 > Preferences > Profiles > Keys > Key Mappings`
    1. Choose the icon `+`
    2. Add the following key map

| Shortcut | Action | Esc+ |
|:--|:--:|:--|
| `⌘←` | Send Escape Sequence | `OH` |
| `⌘→` | Send Escape Sequence | `OF` |
| `⌥←` | Send Escape Sequence | `b` |
| `⌥→` | Send Escape Sequence | `f` |


## Windows Terminal (for Windows WSL)

1. Get your desired color scheme from [windowsterminalthemes.dev](https://windowsterminalthemes.dev/)
2. Open the Windows Terminal and navigate to `Windows Terminal > Settings`
    1. Go to `Startup`
        1. Default Profile : `Ubuntu`
        2. Default terminal application : `Windows Terminal`
    2. Go to `Open your settings.json file`
        1. Paste the color scheme in the `schemes` JSON key
    3. Go to `Color Schemes`
        1. choose your schemes name
    4. For each profile (Defaults, Windows PowerShell, Command Prompt, Ubuntu, Azure CLoud Shell, Git Bash, ....)
        1. Go to `Appearance`
            1. Color scheme : Use your color scheme
            2. Font face : `MesloLGS NF`

Example for the scheme modification in the JSON config file :
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


## Powerlevel10K configuration

1. Execute the command `p10k configuration` in the `iterm2` or `ubuntu` terminal with `zsh` 
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



