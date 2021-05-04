const _postMeta = [];
const RawSource = require('webpack-sources').RawSource;
const Feed = require('feed').Feed;
const fs = require('fs');
const yaml = require('js-yaml');
const markdownit = require('markdown-it')()
  .use(require('markdown-it-front-matter'), fm => {
    _postMeta.push(yaml.load(fm));
  });

module.exports = class MarkdownRssPlugin {
  constructor(options = {}) {
    this.options = Object.assign({
      outputPath: '/',
      outputFile: 'feed',
      updated: new Date(),
      generator: 'Feed for node.js',
      language: "en",
      includeContent: false,
    }, options);
  }

  apply(compiler) {
    compiler.hooks.emit.tapAsync('MarkdownRssPlugin', (compilation, callback) => {
      const markdown = new Map();
      const regex = /^((?!node_modules).)*\.md$/gm;

      compilation.chunks.forEach((chunk) => {
        chunk.getModules().forEach((module) => {
          if (module.buildInfo && module.buildInfo.fileDependencies) {
            module.buildInfo.fileDependencies.forEach((filepath) => {
              if (filepath.search(regex) >= 0) {
                const md = fs.readFileSync(filepath, 'utf8');

                // render to get front matter in plugin callback (at imports)
                markdown.set(filepath.split('/').pop(), markdownit.render(md));
              }
            });
          }
        });
      });

      const feed = new Feed({
        title: this.options.title,
        description: this.options.description,
        id: this.options.id,
        link: this.options.link,
        language: this.options.language,
        image: this.options.image,
        favicon: this.options.favicon,
        copyright: this.options.copyright,
        feedLinks: this.options.feedLinks,
        author: this.options.author,
        generator: this.options.generator
      });

      _postMeta.forEach(meta => feed.addItem({
        title: meta.title,
        id: meta.slug,
        link: `${this.options.link}${meta.slug}`,
        description: meta.description,
        date: meta.date,
        content: this.options.includeContent ? markdown.get(`${meta.slug}.md`) : null,
        author: [this.options.author]
      }));

      compilation.assets[`${this.options.outputPath}${this.options.outputFile}.xml`] = new RawSource(feed.rss2());
      compilation.assets[`${this.options.outputPath}${this.options.outputFile}.json`] = new RawSource(feed.json1());
      compilation.assets[`${this.options.outputPath}${this.options.outputFile}.atom`] = new RawSource(feed.atom1());
      callback();
    });
  }
}