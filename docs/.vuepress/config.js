module.exports = {
    title: 'Pragmatias Documentation',
    description: 'Wiki / Documentation / Stuff',
    base: '/',

    themeConfig: {
        nav: [
            { text: 'Home', link: '/' },
            { text: 'Contact', link: '/contact/' },
            { text: 'Repository', link: 'https://github.com/pragmatias' }
        ],
        sidebar: [
            ['/wiki/','Wiki'],
            ['/wiki/opensuse','OpenSuse'],
            ['/wiki/clusterhadoop','Cluster Hadoop'],
        ],
        search: true,
        searchMaxSuggestions: 20,
        lastUpdated: 'string',
    }

};

