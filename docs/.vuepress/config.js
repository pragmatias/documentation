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
            {
                title: 'Linux',
                collapsable: false,
                children: [
                    ['/wiki/opensuse','OpenSuse']
                ]
            },
            {
                title: 'Hadoop',
                children: [ 
                    ['/wiki/docker','Docker'],
                    ['/wiki/clusterhadoop','Cluster Hadoop']
                ]
            },
            {
                title: 'Teradata',
                children: [
                    ['/wiki/teradata','Tips Teradata']
                ]
            }
        ],
        search: true,
        searchMaxSuggestions: 20,
        lastUpdated: 'string',
    }

};

