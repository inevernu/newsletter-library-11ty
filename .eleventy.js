const { DateTime } = require("luxon");
const fs = require("fs");
const pluginRss = require("@11ty/eleventy-plugin-rss");
const pluginSyntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const pluginNavigation = require("@11ty/eleventy-navigation");
const markdownIt = require("markdown-it");
const markdownItAnchor = require("markdown-it-anchor");
const embedYouTube = require("eleventy-plugin-youtube-embed");
const purgeCssPlugin = require("eleventy-plugin-purgecss");
require('dotenv').config();// Loads environment variables from .env. They are also made available to templates using env.js.
const theMode = process.env.MODE;// What's the mode we are in.
const theOutput = process.env.OUTPUT;// Where should the generated files be output.

module.exports = function(eleventyConfig) {
  eleventyConfig.addPlugin(pluginRss);
  eleventyConfig.addPlugin(pluginSyntaxHighlight);
  eleventyConfig.addPlugin(pluginNavigation);
  eleventyConfig.addPlugin(embedYouTube, {// Transforms YouTube links into lite embeds. The embed class refers to my own theme, change as needed.
    embedClass: 'alignwide',
    lite: true
  });
  
  // Set to false to see every page rendered (ref: https://www.11ty.dev/docs/config/#enable-quiet-mode-to-reduce-console-noise)
  eleventyConfig.setQuietMode(true);
  eleventyConfig.setDataDeepMerge(true);

  // Registers PurgeCSS, which makes stylesheets smaller by inspecting the content they are used in, then discarding any CSS that is not referenced.
  // Note that gulpfile.js also switches output to the directory listed in .env, which is where PurgeCSS grabs the CSS it works on.
  if (theMode === "PROD") {
    eleventyConfig.addPlugin(purgeCssPlugin, {
      // Optional: Set quiet: true to suppress terminal output
      quiet: false,
    });
  }

  // Just definiting aliases for layouts to be called more easily.
  eleventyConfig.addLayoutAlias("page", "layouts/page.njk");
  eleventyConfig.addLayoutAlias("flex", "layouts/flex-page.njk");
  eleventyConfig.addLayoutAlias("post", "layouts/post.njk");
  eleventyConfig.addLayoutAlias("article", "layouts/article.njk");
  eleventyConfig.addLayoutAlias("dispatch", "layouts/dispatch.njk");
  eleventyConfig.addLayoutAlias("issue", "layouts/issue.njk");

  // Create custom date formats.
  eleventyConfig.addFilter("shortDate", dateObj => {
    return DateTime.fromJSDate(dateObj, {zone: 'utc'}).toFormat("LLL dd");
  });
  eleventyConfig.addFilter("mypostDate", dateObj => {
    return DateTime.fromJSDate(dateObj, {zone: 'utc'}).toFormat("LLL dd, yyyy");
  });
  eleventyConfig.addFilter("htmlDateString", (dateObj) => {
    return DateTime.fromJSDate(dateObj, {zone: 'utc'}).toFormat('yyyy-LL-dd');
  });

  // Make excerpt available (ref: https://www.11ty.dev/docs/data-frontmatter-customize/#changing-where-your-excerpt-is-stored)
  eleventyConfig.setFrontMatterParsingOptions({
      excerpt: true,
      excerpt_alias: 'excerpt',
  });

  // Get the first `n` elements of a collection.
  eleventyConfig.addFilter("head", (array, n) => {
    if( n < 0 ) {
      return array.slice(n);
    }

    return array.slice(0, n);
  });

  eleventyConfig.addFilter("min", (...numbers) => {
    return Math.min.apply(null, numbers);
  });

  // Creates the tags collection and launches creation of tags pages
  eleventyConfig.addCollection("tagList", function(collection) {
    let tagSet = new Set();
    collection.getAll().forEach(function(item) {
      if( "tags" in item.data ) {
        let tags = item.data.tags;

        tags = tags.filter(function(item) {
          switch(item) {
            // this list should match the `filter` list in tags.njk
            case "all":
            case "nav":
            case "post":
            case "posts":
              return false;
          }

          return true;
        });

        for (const tag of tags) {
          tagSet.add(tag);
        }
      }
    });

    // Returning an array in addCollection works in Eleventy 0.5.3
    return [...tagSet];
  });

  // Makes a collection out of every file in the issues folder. (ref: https://www.11ty.dev/docs/collections/)
  eleventyConfig.addCollection("issues", function(collectionApi) {
    return collectionApi.getFilteredByGlob("_input/issues/*.njk");
  });

  // Makes a collection out of every file in the articles folder.
  eleventyConfig.addCollection("allWritings", function(collectionApi) {
    return collectionApi.getFilteredByGlob("_input/posts/*.md");
  });

  // Makes a collection out of every template in the posts folder that has 'article' as layout.
  eleventyConfig.addCollection("articles", function (collection) {
    return collection.getAllSorted().filter((post) => post.data.layout === 'article' );
  });

  // Makes a collection out of every template in the posts folder that has 'dispatch' as layout.
  // There is no demo of the dispatch pages, I left this part here so you can better understand some of the other code decisions.
  // On my version of this theme, I have articles, members articles (Dispatches), the newsletter issues, and notes.
  eleventyConfig.addCollection("dispatches", function (collection) {
    return collection.getAllSorted().filter((post) => post.data.layout === 'dispatch' );
  });

  // Makes a collection out of every template in the posts folder that has 'post' as layout.
  eleventyConfig.addCollection("posts", function (collection) {
    return collection.getAllSorted().filter((post) => post.data.layout === 'post' );
  });

  // Takes categories in posts' frontmatter and makes a collection from it. (Used here to regroup notes by issues.)
  eleventyConfig.addCollection("issueNos", function (collection) {
    return collection.getAllSorted().filter((post) => post.data.categories);
  });

  // Takes customcols in posts' frontmatter and makes a collection from it. (Not currently in use.)
  eleventyConfig.addCollection("customCollections", function (collection) {
    return collection.getAllSorted().filter((post) => post.data.customcols);
  });

  // Fetches all posts from an arbitrary group of tags. (Not currently in use.)
  eleventyConfig.addCollection("theMetaverse", function(collectionApi) {
    return collectionApi.getFilteredByTags("metaverse", "gaming", "ar");
  });

  // Static passtroughs, copies these files to the output directory.
  eleventyConfig.addPassthroughCopy("_input/assets/css");
  eleventyConfig.addPassthroughCopy("_input/assets/images");
  eleventyConfig.addPassthroughCopy('_input/assets/js');

  // Markdownit configurations and plugins.
  let markdownLibrary = markdownIt({
    html: true,
    breaks: true,
    linkify: true
  }).use(require('markdown-it-footnote'))// Footnotes plugin for markdown-it markdown parser.
  .use(require('markdown-it-attrs'))// Add classes, identifiers and attributes to your markdown with {.class #identifier attr=value attr2="spaced value"} curly brackets.
  .use(require('markdown-it-image-figures'),{// Image Markdown is transformed in <figure> and adds <figcaption> option.
    figcaption: true
  })
  .use(require('markdown-it-container'), '', {// Fenced container plugin for markdown-it markdown parser. (https://www.npmjs.com/package/markdown-it-container)
    validate: () => true,
    render: (tokens, idx) => {
      if (tokens[idx].nesting === 1) {
        const classList = tokens[idx].info.trim()
        return `<div ${classList && `class="${classList}"`}>`;
      } else {
        return `</div>`;
      }
    }
  })
  .use(markdownItAnchor, {// Adds an anchor to every Markdown header.
    permalink: true,
    permalinkClass: "direct-link",
    permalinkSymbol: "⨳"
  })
  .use(function(markdownLibrary) {
    // Recognize Mediawiki / digital gardern links [[text]]. (ref: https://github.com/binyamin/eleventy-garden (Thanks!))
    // (Also have a look at posts.11tydata.js in _input/posts/.)
    markdownLibrary.linkify.add("[[", {
      validate: /^\s?([^\[\]\|\n\r]+)(\|[^\[\]\|\n\r]+)?\s?\]\]/,
      normalize: match => {
        const parts = match.raw.slice(2,-2).split("|");
        parts[0] = parts[0].replace(/.(md|markdown)\s?$/i, "");
        match.text = (parts[1] || parts[0]).trim();
        // The part below is pretty hacky, I want backlinks to work between notes (which are in /notes/), articles (which are in / (root)), 
        // and dispatches (also in /) but I also have them all in the same _input folder so I can edit them all in Obsidian and the backlinks work there. 
        // So I add notes/ to the urls when outputing the html, but also remove it in posts.11tydata.js for the compare which creates the preview. 
        // The ?note-no is the flag for 11ty not to add /notes/ to urls pointing to articles and dispatches. I'll have to revisit this.
        if(parts[0].indexOf('?note=no') != -1) {
          match.url = `/${parts[0].trim()}/`;
          match.url.replace('?note=no','');
        } else {
          match.url = `/notes/${parts[0].trim()}/`;
        }
      }
    })
  });

  // Adds the markdownify filter and the use of markdown for .md
  eleventyConfig.addFilter("markdownify", string => {
    return markdownLibrary.render(string)
  });
  eleventyConfig.setLibrary("md", markdownLibrary);

  // Creates a shortcode to declare start and end of markdown in a .njk template (ref: https://dinhanhthi.com/11ty-nunjucks/#markdown-inside-.njk)
  eleventyConfig.addPairedShortcode("markdown", (content, inline = null) => {
    return inline
      ? markdownLibrary.renderInline(content)
      : markdownLibrary.render(content);
  });

  // Browsersync Overrides
  eleventyConfig.setBrowserSyncConfig({
    callbacks: {
      ready: function(err, browserSync) {
        const content_404 = fs.readFileSync('_site/404.html');

        browserSync.addMiddleware("*", (req, res) => {
          // Provides the 404 content without redirect.
          res.write(content_404);
          res.end();
        });
      },
    },
    ui: false,
    ghostMode: false
  });

  return {
    templateFormats: [
      "md",
      "njk",
      "html"
    ],

    // Outputs the site in the location defined by the environement variable, see at the top of this file for more.
    // Leading or trailing slashes are all normalized away, so don’t worry about those.

    // If you don’t have a subdirectory, use "" or "/" (they do the same thing)
    // This is only used for link URLs (it does not affect your file structure)
    // Best paired with the `url` filter: https://www.11ty.dev/docs/filters/url/

    // You can also pass this in on the command line using `--pathprefix`
    // pathPrefix: "/",

    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk",

    dir: {
      input: "_input",
      includes: "_includes",
      data: "_data",
      output: theOutput
    }
  };
};
