const {titleCase} = require("title-case");

// This regex finds all wikilinks in a string
const wikilinkRegExp = /\[\[\s?([^\[\]\|\n\r]+)(\|[^\[\]\|\n\r]+)?\s?\]\]/g

function caselessCompare(a, b) {
    return a.toLowerCase() === b.toLowerCase();
}
// Copied from https://github.com/binyamin/eleventy-garden (MIT Licence)
module.exports = {
    layout: "layouts/post.njk" || "layouts/article.njk",
    type: "post" || "article",
    eleventyComputed: {
        title: data => titleCase(data.title || data.page.fileSlug),
        backlinks: (data) => {
            const posts = data.collections.allWritings;
            const currentFileSlug = data.page.fileSlug;

            let backlinks = [];

            // Search the other posts for backlinks
            for(const otherPost of posts) {
                const postContent = otherPost.template.frontMatter.content;

                // Get all links from otherPost
                // Hackish warning: I wanted my notes to have urls with notes/ but for them to also work in Obsidian all from the same folder, 
                // so I don't put notes/ in the .md files but add it with linkify in eleventy.js and remove it for the compare.
                // This way content files stay clean and work in Obsidian for writing and editing. Will revisit how it's done.
                const outboundLinks = (postContent.match(wikilinkRegExp) || [])
                    .map(link => (
                        // Extract link location
                        link.slice(2,-2)
                            .split("|")[0]
                            .replace(/.(md|markdown)\s?$/i, "")
                            .replace("notes/", "")
                            .trim()
                    ));

                // If the other post links here, return related info
                if(outboundLinks.some(link => caselessCompare(link, currentFileSlug))) {

                    // Construct preview for hovercards
                    let preview = postContent.slice(0, 240);
                    preview += "...";

                    backlinks.push({
                        url: otherPost.url,
                        title: otherPost.data.title,
                        preview
                    })
                }
            }

            return backlinks;
        }
    }
}