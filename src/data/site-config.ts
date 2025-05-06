export type Image = {
    src: string;
    alt?: string;
    caption?: string;
};

export type Link = {
    text: string;
    href: string;
};

export type Hero = {
    title?: string;
    text?: string;
    image?: Image;
    actions?: Link[];
};

export type Subscribe = {
    title?: string;
    text?: string;
    formUrl: string;
};

export type SiteConfig = {
    website: string;
    logo?: Image;
    title: string;
    subtitle?: string;
    description: string;
    image?: Image;
    headerNavLinks?: Link[];
    footerNavLinks?: Link[];
    socialLinks?: Link[];
    hero?: Hero;
    subscribe?: Subscribe;
    postsPerPage?: number;
    projectsPerPage?: number;
};

const siteConfig: SiteConfig = {
    website: 'https://benjhardy.github.io/',
    title: 'Ben Hardy PhD',
    subtitle: 'Portfolio, Experience, and Blog',
    description: 'Ben Hardy\'s portfolio, experience, and blog.',
    image: {
        src: '/Me.jpg',
        alt: 'Me at Astro Coffee in Detroit, MI',
    },
    headerNavLinks: [
        {
            text: 'Home',
            href: '/'
        },
        {
            text: 'Projects',
            href: '/projects'
        },
        {
            text: 'Experience',
            href: '/experience'
        }//,
        //{
        //    text: 'Blog',
        //    href: '/blog'
        //},
        //{
        //    text: 'Tags',
        //    href: '/tags'
        //}
    ],
    footerNavLinks: [
        {
            text: 'About',
            href: '/about'
        },
        {
            text: 'Contact',
            href: '/contact'
        }

    ],
    socialLinks: [
        {
            text: 'LinkedIn',
            href: 'https://www.linkedin.com/in/ben-hardy-phd-a6162b218/'
        },
        {
            text: 'GitHub',
            href: 'https://github.com/benjhardy/'
        },
        {
            text: 'Lichess',
            href: 'https://lichess.org/@/blacbeanburgr'
        },

    ],
    hero: {
        title: 'Thank you for taking time to check out my portfolio!',
        text: "I\'m Ben Hardy, an Application Engineer with a PhD in Physics. I'm passionate about creating useful and innovative software solutions related to simulation, AI, and modern engineering practices. I have a strong background in physics and engineering, and I enjoy solving complex problems with creative solutions. I have experience in a variety of programming languages and frameworks, and I'm always looking to learn new technologies and improve my skills.",
        image: {
            src: '/Me.jpg',
            alt: 'A younger version of me at Astro Coffee in Detroit, MI',
        },
        actions: [
            {
                text: 'Get in Touch',
                href: '/contact'
            }
        ]
    },
    subscribe: {
        title: 'Subscribe to THE HARDY PARTY newsletter',
        text: 'If you want to stay up to date with my latest projects and the freshest memes, subscribe to my newsletter!',
        formUrl: '#'
    },
    postsPerPage: 8,
    projectsPerPage: 8
};

export default siteConfig;
