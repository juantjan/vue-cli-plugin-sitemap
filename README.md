# vue-cli-plugin-sitemap
![license badge](https://badgen.net/badge/license/ISC/green)
![latest release badge](https://badgen.net/github/release/cheap-glitch/vue-cli-plugin-sitemap?color=green)
[![codecov badge](https://codecov.io/gh/cheap-glitch/vue-cli-plugin-fontawesome/branch/master/graph/badge.svg)](https://codecov.io/gh/cheap-glitch/vue-cli-plugin-fontawesome)

**vue-cli-plugin-sitemap** generates sitemaps  for your webapps. You  can use it
on its own or integrate it in the definition of your routes. Features:
 * generate sitemaps from an array of routes
 * support for dynamic routes
 * automatically escape the URLs and enforce a (non-)trailing slash policy
 * optionally prettify the output

#### What are sitemaps?

From [sitemaps.org](https://www.sitemaps.org):
> Sitemaps are an easy way for webmasters  to inform search engines about pages on
> their sites that are available for crawling.  In its simplest form, a sitemap is
> an XML file that lists URLs for a site along with additional metadata about each
> URL (when it was  last updated, how often it usually  changes, and how important
> it is,  relative to  other URLs  in the site)  so that  search engines  can more
> intelligently crawl  the site.  Web crawlers usually  discover pages  from links
> within the  site and from  other sites. Sitemaps  supplement this data  to allow
> crawlers that  support sitemaps  to pick up  all URLs in  the sitemap  and learn
> about those URLs using the associated  metadata. Using the sitemap protocol does
> not guarantee that web pages are  included in search engines, but provides hints
> for web crawlers to do a better job of crawling your site.

## Installation

```
vue add sitemap
```

The plugin will  add a script called `sitemap` to  your `package.json`. No other
files will be modified.

## Usage

The sitemap  will be  generated upon  building your app.  To examine  the output
without triggering the  whole build process, you can run  the following command,
which will generate a sitemap in the current working directory:
```
npm run sitemap
```

## Configuration

### URL meta tags

In the sitemap format,  each URL can be associated with  some optional meta tags
to help the crawlers navigate the pages and prioritize the critical URLs:

  Meta tag   |                                                   Accepted values                                                         | Default value if absent
------------ | ------------------------------------------------------------------------------------------------------------------------- | -----------------------
`lastmod`    | a date string in the [W3C format](https://www.w3.org/TR/NOTE-datetime), a JavaScript timestamp string, or a `Date` object | Ø
`changefreq` | `"always"`, `"hourly"`, `"daily"`, `"weekly"`, `"monthly"`, `"yearly"`, `"never"`                                         | Ø
`priority`   | a multiple of `0.1` between `0.0` and `1.0`                                                                               | `0.5`

For  more  information  on  those  meta  tags,  you  can  consult  the  official
[specification](https://www.sitemaps.org/protocol.html#xmlTagDefinitions).

### Global settings

All the  global settings are optional  and can be omitted,  except for `baseURL`
that must be provided for routes-based sitemaps.

```javascript
// vue.config.js

module.exports = {
	pluginOptions: {
		// […]

		sitemap: {
			// Only generate for production builds (default: 'false')
			productionOnly: true,

			// If set to 'true', add a trailing slash at the end of every URL
			// Remove it if set to 'false' (the default)
			trailingSlash: false,

			// Insert line breaks and indent the tags to make the generated
			// file more readable (default: 'false')
			pretty: true,

			// Define an URL which will serve as a prefix for every URL in the sitemap
			// If it is provided, all URLs must be partial (e.g. '/page/subpage')
			// and not start with the domain name
			//
			// Note that this is required if some routes are provided, because
			// every URL in the sitemap must be a full URL that includes the protocol and domain
			baseURL: 'https://webapp.com',

			// Default meta tags for every URL
			// These will be overridden by URL-specific tags
			defaults: {
				lastmod:    '2020-01-01',
				changefreq: 'weekly',
				priority:   1.0,
			},
		}
	}
}

```

### Generating from routes



### Generating from static URLs

You can also directly provide some static URLs to the plugin:
```javascript
sitemap: {
	// […]

	urls: [
		{
			// The only required property is 'loc'
			loc: 'https://website.com/'
		},
		{
			loc: 'https://website.com/about,

			// These meta tags will only apply to this specific URL
			changefreq: 'never',
			priority:   1.0,
		},
		{
			// If you provided 'baseURL', locations must be partial URLs
			loc: '/article/lorem-ipsum-dolor-sit-amet',
		},
	]
}
```

If both routes and  URLs are provided, they will be merged  together in a single
sitemap. In  the case  of duplicated  locations, static  URLs will  prevail over
their matching routes.

## License

This software is distributed under the ISC license.
