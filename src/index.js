import {RawSource} from 'webpack-sources';
import {Feed} from 'feed';
import MarkdownHandler from 'markdown-handler';
// import MarkdownIt from 'markdown-it';
// import MarkdownItFrontMatter from 'markdown-it-front-matter';

export default class MarkdownRssPlugin {
  constructor(options = {}) {
    this.options = Object.assign({

      },
      options
    );
  }

  apply(compiler) {
    compiler.hooks.emit.tapAsync('MarkdownRssPlugin', (compilation, callback) => {
      const files = [];
      const mdHandler = new MarkdownHandler();
      const regex = /.*\.md$/gm;

      for (let path in compilation.assets) {
        console.log(path)
        if (path.search(regex) >= 0) {
          const md = compilation.assets[path].source().toString();

          files.push(mdHandler.parseContent(path, md));
        }
      }

      console.log(files)

      // compilation.assets[this.options.outputPath] = new RawSource(feedContent);
      callback();
    });
  }
}