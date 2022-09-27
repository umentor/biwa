const path = require("path");
const fs = require("fs");
const utils = require("./utils");

const CONTENT_FOR_REGEX = /@@contentFor\(['"](.*?)['"],\n(.*?)\n\)/gs;
const LAYOUT_CONTENT_FOR_REGEX = /@@content\(['"](.*?)['"]/g;

class BiwaHtmlWebpackPlugin {
  constructor(config) {
    this.source = config.source; // source from the context
    this.layouts = config.layouts; // source from the context
    this.context = null;
    this.destination = config.destination;

    // handlers
    this.process = this.process.bind(this);
  }

  processFile(compilation, file) {
    let content = fs.readFileSync(file, "utf-8");
    compilation.fileDependencies.add(file);
    return this.processPartials(this.processLayouts(content));
  }

  // replaces instances of @@content("name") in a layout with @@contentFor("name", ...) from the content

  processNamedContent(layout, content) {
    let newLayout = layout;

    // look for named content hooks @@content("name") in the layout
    if (layout.match(LAYOUT_CONTENT_FOR_REGEX)) {
      let matches = [];
      let contentFors = {};

      // look for named content hooks @@contentFor("name", ...) in the content itself
      if (content.match(CONTENT_FOR_REGEX)) {
        while ((matches = CONTENT_FOR_REGEX.exec(content))) {
          contentFors[matches[1]] = matches[2];
        }
      }

      // replace any @@content("name") with the requisite @@contentFor
      if (Object.keys(contentFors).length) {
        for (let name in contentFors) {
          newLayout = newLayout.replace(`@@content("${name}")`, contentFors[name]);
        }
      }
    }

    // replace any remaining @@content("name") with nothing
    newLayout = newLayout.replace(/@@content\(['"].*?['"]\)/g, "");

    return newLayout;
  }

  // replaces instances of @@content in the layout with the actual body of the content

  processMainContent(layout, content) {
    let newContent = content;

    // remove any instances of @@contentFor("name", ...) in the body of the content
    newContent = newContent.replace(CONTENT_FOR_REGEX, "");
    // remove any instances of @@layout in the body of the content
    newContent = newContent.replace(/^@@layout.*$/m, "");

    return layout.replace(/@@content$/m, newContent);
  }

  processLayouts(content) {
    const match = content.match(/^@@layout\(["'](.*?)["'](?:,\s*({[^\n]*}\s*))?\)/m);

    if (match) {
      const layoutPath = path.join(this.context, this.layouts, `${match[1]}.html`);

      // process any partials that might be in the layout itself
      let layoutContent = this.processPartials(fs.readFileSync(layoutPath, "utf-8"));

      // replace any variables in the layout passed in the @@layout call
      layoutContent = utils.replaceVars(layoutContent, match[2]);

      // replace named @@content sections, like @@content("hero")
      layoutContent = this.processNamedContent(layoutContent, content);

      // replace main @@content in the layout with the actual content that was just passed in
      return this.processMainContent(layoutContent, content);
    } else {
      return content;
    }
  }

  processPartials(content) {
    const includeRegex = new RegExp(
      /^\s*@@include\(([^,)]*)(?:,\s*({[\W\w\s\d:,\[\]{}"]*}\s*))?\)/,
      "gm"
    );

    content = content.replace(includeRegex, (reg, partial, args) => {
      let partialPath = path.join(this.context, partial.replace(/['"]/g, ""));
      const basename = path.basename(partialPath);
      partialPath = partialPath.replace(basename, `_${basename}`);

      try {
        return utils.replaceVars(fs.readFileSync(`${partialPath}.html`, "utf-8").toString(), args);
      } catch (e) {
        utils.logger.error(`ERROR: Could not find partial ${partial}`);
        process.exit(0);
      }
    });

    return content;
  }

  process(compilation, callback) {
    const { context } = this.compiler.options;
    this.context = path.join(context, this.source);
    const files = utils.getRequiredFiles(this.context, "");

    utils.logger.info(`Working on ${files.length} .html files`);

    files.forEach(file => {
      const sourcePath = path.join(this.context, file);
      const destinationPath = this.destination ? path.join(this.destination, file) : file;
      const layoutsPath = path.join(this.context, this.layouts);
      const content = this.processFile(compilation, sourcePath);

      if (
        !sourcePath.match(new RegExp(`${layoutsPath}/`)) &&
        !path.basename(sourcePath).match(/^_/)
      ) {
        compilation.assets[destinationPath] = {
          source: () => content,
          size: () => content.length
        };
      }
    });

    callback();
  }

  apply(compiler) {
    this.compiler = compiler;
    compiler.hooks.emit.tapAsync("BiwaHtmlWebpackPlugin", this.process);
  }
}

module.exports = BiwaHtmlWebpackPlugin;
