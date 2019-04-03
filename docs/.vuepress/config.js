module.exports = {
    title: 'Documentation',
    description: 'All kind of technical stuff & more',
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

