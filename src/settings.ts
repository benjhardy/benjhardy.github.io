export const profile = {
	fullName: 'Ben Hardy',
	title: 'PhD',
	institute: 'Remcom Inc',
	author_name: 'BM Hardy', // Author name to be highlighted in the papers section
	research_areas: [
		// { title: 'Physics', description: 'Brief description of the research interest', field: 'physics' },
	],
}

// Set equal to an empty string to hide the icon that you don't want to display
export const social = {
	email: 'ben.hardy@remcom.com',
	linkedin: 'https://www.linkedin.com/in/ben-hardy-phd-a6162b218/',
	x: '',
	github: '',
	gitlab: '',
	scholar: 'https://scholar.google.com/citations?hl=en&user=uBzZ5-UAAAAJ',
	inspire: '',
	arxiv: 'https://arxiv.org/search/physics?searchtype=author&query=Hardy,+B+M',
}

export const template = {
	website_url: 'https://benjhardy.github.io/', // Astro needs to know your site’s deployed URL to generate a sitemap. It must start with http:// or https://
	menu_left: false,
	transitions: true,
	lightTheme: 'light', // Select one of the Daisy UI Themes or create your own
	darkTheme: 'dark', // Select one of the Daisy UI Themes or create your own
	excerptLength: 200,
	postPerPage: 5,
    base: '' // Repository name starting with /
}

export const seo = {
	default_title: 'Ben Hardy PhD',
	default_description: '.',
	default_image: '',
}
