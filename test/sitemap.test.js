
/**
 * tests/sitemap.test.js
 */

const chai                 = require("chai");
const expect               = chai.expect;
const chaiAsPromised       = require("chai-as-promised");

const { generateSitemaps } = require('../src/sitemap');
const { optionsValidator } = require('../src/validation');

chai.use(chaiAsPromised);

describe("single sitemap generation", () => {

	/**
	 * URLs
	 * {{{
	 * ---------------------------------------------------------------------
	 */
	describe("from an array of URLs", () => {

		it("generates a simple sitemap from full URLs", async () => {
			expect(await generate({
				urls: ['https://website.net', 'https://website.net/about'],
			})).to.deep.equal(wrapSitemap(
				'<url><loc>https://website.net</loc></url><url><loc>https://website.net/about</loc></url>'
			));

			expect(await generate({
				urls: [{ loc: 'https://website.net' }, { loc: 'https://website.net/about' }],
			})).to.deep.equal(wrapSitemap(
				'<url><loc>https://website.net</loc></url><url><loc>https://website.net/about</loc></url>'
			));
		});

		it("generates a simple sitemap from partial URLs and a base URL", async () => {
			expect(await generate({
				baseURL:   'https://website.net',
				urls:      ['/', '/about'],
			})).to.deep.equal(wrapSitemap(
				'<url><loc>https://website.net</loc></url><url><loc>https://website.net/about</loc></url>'
			));

			expect(await generate({
				baseURL:   'https://website.net',
				urls:      [{ loc: '/' }, { loc: '/about' }],
			})).to.deep.equal(wrapSitemap(
				'<url><loc>https://website.net</loc></url><url><loc>https://website.net/about</loc></url>'
			));

			expect(await generate({
				baseURL:   'https://website.net:7000',
				urls:      ['/', '/about'],
			})).to.deep.equal(wrapSitemap(
				'<url><loc>https://website.net:7000</loc></url><url><loc>https://website.net:7000/about</loc></url>'
			));

			expect(await generate({
				baseURL:   'https://162.75.90.1',
				urls:      ['/', '/about'],
			})).to.deep.equal(wrapSitemap(
				'<url><loc>https://162.75.90.1</loc></url><url><loc>https://162.75.90.1/about</loc></url>'
			));
		});

		it("removes trailing slashes", async () => {
			expect(await generate({
				baseURL:   'https://website.net',
				urls:      ['/', '/about', '/page'],
			})).to.deep.equal(wrapSitemap([
				'<url><loc>https://website.net</loc></url><url><loc>https://website.net/about</loc></url>',
				'<url><loc>https://website.net/page</loc></url>',
			]));
		});

		it("adds trailing slashes if the 'trailingSlash' option is set", async () => {
			expect(await generate({
				trailingSlash: true,
				baseURL:   'https://website.net',
				urls:      ['/', '/about', '/page'],
			})).to.deep.equal(wrapSitemap([
				'<url><loc>https://website.net/</loc></url><url><loc>https://website.net/about/</loc></url>',
				'<url><loc>https://website.net/page/</loc></url>',
			]));
		});

		it("encodes uris properly", async () => {
			expect(await generate({
				baseURL:   'https://website.net',
				urls:      ['/search?color="always"&reverse-order'],
			})).to.deep.equal(wrapSitemap(
				'<url><loc>https://website.net/search?color=%22always%22&amp;reverse-order</loc></url>'
			));

			expect(await generate({
				baseURL:   'https://éléphant.net',
				defaults:  {},
				routes:    [],
				urls:      ['/about'],
			})).to.deep.equal(wrapSitemap(
				'<url><loc>https://%C3%A9l%C3%A9phant.net/about</loc></url>'
			));
		});

		it("takes per-url meta tags into account", async () => {
			expect(await generate({
				urls: [{
					loc:         'https://website.net/about',
					changefreq:  'monthly',
					lastmod:     '2020-01-01',
					priority:    0.3,
				}]
			})).to.deep.equal(wrapSitemap([
				'<url>',
					'<loc>https://website.net/about</loc>',
					'<lastmod>2020-01-01</lastmod>',
					'<changefreq>monthly</changefreq>',
					'<priority>0.3</priority>',
				'</url>',
			]));
		});

		it("takes default meta tags into account", async () => {
			expect(await generate({
				defaults:  {
					changefreq:  'monthly',
					lastmod:     '2020-01-01',
					priority:    0.3,
				},
				urls: ['https://website.net/about'],
			})).to.deep.equal(wrapSitemap([
				'<url>',
					'<loc>https://website.net/about</loc>',
					'<lastmod>2020-01-01</lastmod>',
					'<changefreq>monthly</changefreq>',
					'<priority>0.3</priority>',
				'</url>',
			]));
		});

		it("prioritizes per-url meta tags over global defaults", async () => {
			expect(await generate({
				defaults:  {
					changefreq:  'never',
					priority:    0.8,
				},
				urls: [{
					loc:         'https://website.net/about',
					changefreq:  'monthly',
					lastmod:     '2020-01-01',
					priority:    0.3,
				}]
			})).to.deep.equal(wrapSitemap([
				'<url>',
					'<loc>https://website.net/about</loc>',
					'<lastmod>2020-01-01</lastmod>',
					'<changefreq>monthly</changefreq>',
					'<priority>0.3</priority>',
				'</url>',
			]));
		});

		it("handles dates in various formats", async () => {
			const data = {
				urls: [
					{
						loc:      'https://website.net/about',
						lastmod:  'December 17, 1995 03:24:00',
					},
					{
						loc:      'https://website.net/info',
						lastmod:  new Date('December 17, 1995 03:24:00'),
					},
					{
						loc:      'https://website.net/page',
						lastmod:  1578485826000,
					},
				]
			};
			optionsValidator(data);
			expect(await generate(data)).to.deep.equal(wrapSitemap([
				'<url><loc>https://website.net/about</loc><lastmod>1995-12-17T02:24:00.000Z</lastmod></url>',
				'<url><loc>https://website.net/info</loc><lastmod>1995-12-17T02:24:00.000Z</lastmod></url>',
				'<url><loc>https://website.net/page</loc><lastmod>2020-01-08T12:17:06.000Z</lastmod></url>',
			]));
		});

		it("writes whole-number priorities with a decimal", async () => {
			expect(await generate({
				urls: [
					{
						loc:         'https://website.net/about',
						priority:    1.0,
					},
					{
						loc:         'https://website.net/old',
						priority:    0.0,
					},
				]
			})).to.deep.equal(wrapSitemap([
				'<url><loc>https://website.net/about</loc><priority>1.0</priority></url>',
				'<url><loc>https://website.net/old</loc><priority>0.0</priority></url>',
			]));
		});
	});
	/**
	 * }}}
	 */

	/**
	 * Routes
	 * {{{
	 * ---------------------------------------------------------------------
	 */
	describe("from an array of routes", () => {

		it("generates a sitemap from simple routes", async () => {
			expect(await generate({
				baseURL:   'https://website.net',
				routes:    [{ path: '/' }, { path: '/about' }],
			})).to.deep.equal(wrapSitemap(
				'<url><loc>https://website.net</loc></url><url><loc>https://website.net/about</loc></url>'
			));
		});

		it("handles routes with a 'loc' property", async () => {
			expect(await generate({
				baseURL:   'https://website.net',
				routes:    [{ path: '/' }, { path: '/complicated/path/here', meta: { sitemap: { loc: '/about' } } }],
			})).to.deep.equal(wrapSitemap(
				'<url><loc>https://website.net</loc></url><url><loc>https://website.net/about</loc></url>'
			));
		});

		it("removes trailing slashes", async () => {
			expect(await generate({
				baseURL:   'https://website.net',
				routes:    [{ path: '/' }, { path: '/about' }, { path: '/page/' }],
			})).to.deep.equal(wrapSitemap([
				'<url><loc>https://website.net</loc></url><url><loc>https://website.net/about</loc></url>',
				'<url><loc>https://website.net/page</loc></url>',
			]));
		});

		it("adds trailing slashes if the 'trailingSlash' option is set", async () => {
			expect(await generate({
				baseURL:   'https://website.net',
				routes:    [{ path: '/' }, { path: '/about' }, { path: '/page/' }],
				trailingSlash: true,
			})).to.deep.equal(wrapSitemap([
				'<url><loc>https://website.net/</loc></url><url><loc>https://website.net/about/</loc></url>',
				'<url><loc>https://website.net/page/</loc></url>',
			]));
		});

		it("takes per-route meta tags into account", async () => {
			expect(await generate({
				baseURL:   'https://website.net',
				routes:    [{
					path: '/about',
					meta: {
						sitemap: {
							changefreq:  'monthly',
							lastmod:     '2020-01-01',
							priority:    0.3,
						}
					}
				}]
			})).to.deep.equal(wrapSitemap([
				'<url>',
					'<loc>https://website.net/about</loc>',
					'<lastmod>2020-01-01</lastmod>',
					'<changefreq>monthly</changefreq>',
					'<priority>0.3</priority>',
				'</url>',
			]));
		});

		it("ignores other non-sitemap-related meta properties", async () => {
			expect(await generate({
				baseURL:   'https://website.net',
				routes:    [{
					path: '/about',
					meta: {
						progressbar: {
							color: 'pink',
							width: '10px',
						}
					}
				}]
			})).to.deep.equal(wrapSitemap([
				'<url><loc>https://website.net/about</loc></url>',
			]));

			expect(await generate({
				baseURL:   'https://website.net',
				routes:    [{
					path: '/about',
					meta: {
						progressbar: {
							color: 'pink',
							width: '10px',
						},
						sitemap: {
							changefreq:  'monthly',
							lastmod:     '2020-01-01',
							priority:    0.3,
						}
					}
				}]
			})).to.deep.equal(wrapSitemap([
				'<url>',
					'<loc>https://website.net/about</loc>',
					'<lastmod>2020-01-01</lastmod>',
					'<changefreq>monthly</changefreq>',
					'<priority>0.3</priority>',
				'</url>',
			]));
		});

		it("takes default meta tags into account", async () => {
			expect(await generate({
				baseURL:   'https://website.net',
				defaults:  {
					changefreq:  'monthly',
					lastmod:     '2020-01-01',
					priority:    0.3,
				},
				routes:    [{ path: '/about' }]
			})).to.deep.equal(wrapSitemap([
				'<url>',
					'<loc>https://website.net/about</loc>',
					'<lastmod>2020-01-01</lastmod>',
					'<changefreq>monthly</changefreq>',
					'<priority>0.3</priority>',
				'</url>',
			]));
		});

		it("prioritizes per-route meta tags over global defaults", async () => {
			expect(await generate({
				baseURL:   'https://website.net',
				defaults:  {
					changefreq:  'never',
					priority:    0.8,
				},
				routes:    [{
					path: '/about',
					meta: {
						sitemap: {
							changefreq:  'monthly',
							lastmod:     '2020-01-01',
							priority:    0.3,
						}
					}
				}]
			})).to.deep.equal(wrapSitemap([
				'<url>',
					'<loc>https://website.net/about</loc>',
					'<lastmod>2020-01-01</lastmod>',
					'<changefreq>monthly</changefreq>',
					'<priority>0.3</priority>',
				'</url>',
			]));
		});

		it("generates an URL for each slug", async () => {
			expect(await generate({
				baseURL:   'https://website.net',
				routes:    [{
					path: '/article/:title',
					meta: {
						sitemap: {
							slugs: [
								'my-first-article',
								'3-tricks-to-better-fold-your-socks',
							]
						}
					}
				}]
			})).to.deep.equal(wrapSitemap([
				'<url><loc>https://website.net/article/my-first-article</loc></url>',
				'<url><loc>https://website.net/article/3-tricks-to-better-fold-your-socks</loc></url>',
			]));
		});

		it("works for multiple parameters", async () => {
			expect(await generate({
				baseURL:   'https://website.net',
				routes:    [{
					path: '/article/:category/:id/:title',
					meta: {
						sitemap: {
							slugs: [
								{
									id:        1,
									category:  'blog',
									title:     'my-first-article',
								},
								{
									id:        14,
									category:  'lifehacks',
									title:     '3-tricks-to-better-fold-your-socks',
								},
							]
						}
					}
				}]
			})).to.deep.equal(wrapSitemap([
				'<url><loc>https://website.net/article/blog/1/my-first-article</loc></url>',
				'<url><loc>https://website.net/article/lifehacks/14/3-tricks-to-better-fold-your-socks</loc></url>',
			]));
		});

		it("removes duplicate slugs", async () => {
			expect(await generate({
				baseURL:   'https://website.net',
				defaults:  {},
				urls:      [],
				routes:    [{
					path: '/article/:title',
					meta: {
						sitemap: {
							slugs: [
								'my-first-article',
								'my-first-article',
								'3-tricks-to-better-fold-your-socks',
								'3-tricks-to-better-fold-your-socks',
							]
						}
					}
				}]
			})).to.deep.equal(wrapSitemap([
				'<url><loc>https://website.net/article/my-first-article</loc></url>',
				'<url><loc>https://website.net/article/3-tricks-to-better-fold-your-socks</loc></url>',
			]));
		});

		it("takes slug-specific meta tags into account", async () => {
			expect(await generate({
				baseURL:   'https://website.net',
				defaults:  {},
				urls:      [],
				routes:    [{
					path: '/article/:title',
					meta: {
						sitemap: {
							slugs: [
								'my-first-article',
								{
									title:       '3-tricks-to-better-fold-your-socks',
									changefreq:  'never',
									lastmod:     '2018-06-24',
									priority:    0.8,
								}
							]
						}
					}
				}]
			})).to.deep.equal(wrapSitemap([
				'<url><loc>https://website.net/article/my-first-article</loc></url>',
				'<url>',
					'<loc>https://website.net/article/3-tricks-to-better-fold-your-socks</loc>',
					'<lastmod>2018-06-24</lastmod>',
					'<changefreq>never</changefreq>',
					'<priority>0.8</priority>',
				'</url>',
			]));
			expect(await generate({
				baseURL:   'https://website.net',
				defaults:  {},
				urls:      [],
				routes:    [{
					path: '/article/:category/:title',
					meta: {
						sitemap: {
							slugs: [
								{
									title:       'my-first-article',
									category:    'blog',
								},
								{
									title:       '3-tricks-to-better-fold-your-socks',
									category:    'lifehacks',

									changefreq:  'never',
									lastmod:     '2018-06-24',
									priority:    0.8,
								},
							]
						}
					}
				}]
			})).to.deep.equal(wrapSitemap([
				'<url><loc>https://website.net/article/blog/my-first-article</loc></url>',
				'<url>',
					'<loc>https://website.net/article/lifehacks/3-tricks-to-better-fold-your-socks</loc>',
					'<lastmod>2018-06-24</lastmod>',
					'<changefreq>never</changefreq>',
					'<priority>0.8</priority>',
				'</url>',
			]));
		});

		it("prioritizes slug-specific meta tags over route meta tags and global defaults", async () => {
			expect(await generate({
				baseURL:   'https://website.net',
				defaults:  {
					priority:    0.1,
					changefreq:  'always',
				},
				routes:    [{
					path: '/article/:title',
					meta: {
						sitemap: {
							lastmod: '2020-01-01',
							slugs: [{
								title:       '3-tricks-to-better-fold-your-socks',
								changefreq:  'never',
								lastmod:     '2018-06-24',
								priority:    0.8,
							}]
						}
					}
				}]
			})).to.deep.equal(wrapSitemap([
				'<url>',
					'<loc>https://website.net/article/3-tricks-to-better-fold-your-socks</loc>',
					'<lastmod>2018-06-24</lastmod>',
					'<changefreq>never</changefreq>',
					'<priority>0.8</priority>',
				'</url>',
			]));
		});

		it("accepts a synchronous generator for the slugs", async () => {
			expect(await generate({
				baseURL:   'https://website.net',
				routes:    [{
					path: '/user/:id',
					meta: { sitemap: { slugs: () => [1, 2, 3] } },
				}]
			})).to.deep.equal(wrapSitemap([
				'<url><loc>https://website.net/user/1</loc></url>',
				'<url><loc>https://website.net/user/2</loc></url>',
				'<url><loc>https://website.net/user/3</loc></url>',
			]));
		});

		it("accepts an asynchronous generator for the slugs", async () => {
			expect(await generate({
				baseURL:   'https://website.net',
				routes:    [{
					path: '/user/:id',
					meta: { sitemap: { slugs: async () => [1, 2, 3] } },
				}]
			})).to.deep.equal(wrapSitemap([
				'<url><loc>https://website.net/user/1</loc></url>',
				'<url><loc>https://website.net/user/2</loc></url>',
				'<url><loc>https://website.net/user/3</loc></url>',
			]));
		});

		it("ignores routes with the 'ignoreRoute' option set to 'true'", async () => {
			expect(await generate({
				baseURL:   'https://website.net',
				routes:    [{ path: '/' }, { path: '/about' }, { path: '/ignore/me', meta: { sitemap: { ignoreRoute: true } } }],
			})).to.deep.equal(wrapSitemap(
				'<url><loc>https://website.net</loc></url><url><loc>https://website.net/about</loc></url>'
			));
		});

		it("ignores the catch-all route", async () => {
			expect(await generate({
				baseURL:   'https://website.net',
				routes:    [{ path: '/' }, { path: '/about' }, { path: '*', name: '404' }],
			})).to.deep.equal(wrapSitemap(
				'<url><loc>https://website.net</loc></url><url><loc>https://website.net/about</loc></url>'
			));
		});

		it("throws an error when dynamic routes are not given slugs", async () => {
			expect(Promise.resolve(generate({
				baseURL:   'https://website.net',
				routes:    [{ path: '/' }, { path: '/about' }, { path: '/user/:id' }],
			}))).to.be.rejected;
		});

		it("throws an error if the asynchronously generated slugs are invalid", async () => {
			expect(Promise.resolve(generate({
				baseURL:   'https://website.net',
				routes:    [{
					path: '/user/:id',
					meta: { sitemap: { slugs: async () => 5 } },
				}]
			}))).to.be.rejected;
			expect(Promise.resolve(generate({
				baseURL:   'https://website.net',
				routes:    [{
					path: '/user/:id',
					meta: { sitemap: { slugs: async () => [null] } },
				}]
			}))).to.be.rejected;
		});

		it("throws an error if the parameter of a dynamic route doesn't have an associated slug", async () => {
			expect(Promise.resolve(generate({
				baseURL:   'https://website.net',
				routes:    [{
					path: '/user/:id',
					meta: { sitemap: { slugs: [{ title: 5 }] } },
				}]
			}))).to.be.rejected;
			expect(Promise.resolve(generate({
				baseURL:   'https://website.net',
				routes:    [{
					path: '/article/:title/:id',
					meta: { sitemap: { slugs: [{ id: 5 }] } },
				}]
			}))).to.be.rejected;
		});
	});
	/**
	 * }}}
	 */

	/**
	 * Routes + URLs
	 * {{{
	 * ---------------------------------------------------------------------
	 */
	describe("from both routes and URLs", () => {

		it("generates a simple sitemap", async () => {
			expect(await generate({
				baseURL:   'https://website.net',
				urls:      ['/'],
				routes:    [{ path: '/about' }],
			})).to.deep.equal(wrapSitemap(
				'<url><loc>https://website.net</loc></url><url><loc>https://website.net/about</loc></url>'
			));
		});

		it("discards duplicate URLs", async () => {
			expect(await generate({
				baseURL:   'https://website.net',
				urls:      ['/'],
				routes:    [{ path: '/' }, { path: '/about' }],
			})).to.deep.equal(wrapSitemap(
				'<url><loc>https://website.net</loc></url><url><loc>https://website.net/about</loc></url>'
			));
		});

		it("prioritizes handwritten URLs over routes", async () => {
			expect(await generate({
				baseURL:   'https://website.net',
				urls:      ['/'],
				routes:    [{ path: '/', meta: { sitemap: { changefreq: 'always' } } }, { path: '/about' }],
			})).to.deep.equal(wrapSitemap(
				'<url><loc>https://website.net</loc></url><url><loc>https://website.net/about</loc></url>'
			));
		});
	});
	/**
	 * }}}
	 */

	/**
	 * Misc
	 * {{{
	 * ---------------------------------------------------------------------
	 */
	it("keeps tabs and line breaks when option 'pretty' is specified", async () => {
		expect((await generate({
			baseURL:   'https://website.net',
			routes:    [{ path: '/about' }],
			urls:      ['/'],
		}, true)).sitemap).to.include('\t', '\n');
	});
	/**
	 * }}}
	 */
});

describe("multiple sitemaps generation", () => {

	/**
	 * URLs
	 * {{{
	 * ---------------------------------------------------------------------
	 */
	it("generates several sitemaps and a sitemap index if the total number of URLs exceeds 50,000", async () => {
		expect(await generate({
			urls:    [...Array(50001).keys()].map(n => `https://website.com/${n+1}`)
		})).to.deep.equal({
			'sitemap-part-1': wrapSitemapXML([...Array(50000).keys()].map(n => `<url><loc>https://website.com/${n+1}</loc></url>`)),
			'sitemap-part-2': wrapSitemapXML('<url><loc>https://website.com/50001</loc></url>'),
			'sitemap-index':  wrapSitemapIndexXML([
				'<sitemap><loc>/sitemap-part-1.xml</loc></sitemap>',
				'<sitemap><loc>/sitemap-part-2.xml</loc></sitemap>',
			]),
		});

		expect(await generate({
			baseURL: 'https://website.com',
			urls:    [...Array(50001).keys()].map(n => `${n+1}`)
		})).to.deep.equal({
			'sitemap-part-1': wrapSitemapXML([...Array(50000).keys()].map(n => `<url><loc>https://website.com/${n+1}</loc></url>`)),
			'sitemap-part-2': wrapSitemapXML('<url><loc>https://website.com/50001</loc></url>'),
			'sitemap-index':  wrapSitemapIndexXML([
				'<sitemap><loc>https://website.com/sitemap-part-1.xml</loc></sitemap>',
				'<sitemap><loc>https://website.com/sitemap-part-2.xml</loc></sitemap>',
			]),
		});
	});
	/**
	 * }}}
	 */

	/**
	 * Routes
	 * {{{
	 * ---------------------------------------------------------------------
	 */
	it("generates several sitemaps and a sitemap index if the total number of routes exceeds 50,000", async () => {
		expect(await generate({
			baseURL: 'https://website.com',
			routes:  [{
				path: '/user/:id',
				meta: {
					sitemap: {
						slugs: [...Array(50001).keys()].map(n => n +1)
					}
				}
			}]
		})).to.deep.equal({
			'sitemap-part-1': wrapSitemapXML([...Array(50000).keys()].map(n => `<url><loc>https://website.com/user/${n+1}</loc></url>`)),
			'sitemap-part-2': wrapSitemapXML('<url><loc>https://website.com/user/50001</loc></url>'),
			'sitemap-index':  wrapSitemapIndexXML([
				'<sitemap><loc>https://website.com/sitemap-part-1.xml</loc></sitemap>',
				'<sitemap><loc>https://website.com/sitemap-part-2.xml</loc></sitemap>',
			]),
		});
	});
	/**
	 * }}}
	 */
});

/**
 * Call 'generateSitemaps' with some default options
 * Also take care of the removing of the formatting characters
 */
async function generate(options, pretty = false)
{
	const sitemaps = await generateSitemaps({
		baseURL:  '',
		defaults: {},

		routes:   [],
		urls:     [],

		...options,
	});

	if (!pretty) Object.keys(sitemaps).forEach(sitemap => sitemaps[sitemap] = sitemaps[sitemap].replace(/\t+|\n/g, ''));

	return sitemaps;
}

/**
 * Wrap a sitemap inside an object to mimic
 * the output of 'generateSitemaps' with a single sitemap
 */
function wrapSitemap(sitemap)
{
	return { sitemap: wrapSitemapXML(sitemap) };
}

/**
 * Wrap some XML inside the markup of a sitemap
 */
function wrapSitemapXML(xml)
{
	return '<?xml version="1.0" encoding="UTF-8"?>'
	     + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
	         + (Array.isArray(xml) ? xml.join('') : xml)
	     + '</urlset>';
}

/**
 * Wrap some XML inside the markup of a sitemap index
 */
function wrapSitemapIndexXML(xml)
{
	return '<?xml version="1.0" encoding="UTF-8"?>'
	     + '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
	         + (Array.isArray(xml) ? xml.join('') : xml)
	     + '</sitemapindex>';
}
