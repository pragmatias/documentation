module.exports = {
    title: 'Documentation',
    description: 'All kind of technical stuff & more',
    base: '/',

    themeConfig: {
        nav: [
            { text: 'Home', link: '/' },
            { text: 'Wiki', link: '/wiki/' },
            { text: 'Contact', link: '/contact/' },
            { text: 'Nextcloud', link: 'https://pragmatias.synology.me' },
            { text: 'Github', link: 'https://github.com/pragmatias' }
        ],
        sidebar: [
            ['/wiki/todolist','Todo List'],
            ['/wiki/opensuse','OpenSuse'],
        ],
        search: true,
        searchMaxSuggestions: 20,
        lastUpdated: 'string',
    }

};

