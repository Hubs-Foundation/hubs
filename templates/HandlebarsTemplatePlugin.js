const Handlebars = require("handlebars");
const fs = require("fs-extra");
const path = require("path");
const chokidar = require("chokidar");

function filterUniqueTemplatePaths(pages) {
  return pages
    .map(page => page.templatePath)
    .filter((fileName, index, arr) => arr.indexOf(fileName) === index);
}

class HandlebarsTemplatePlugin {
  constructor(options) {
    this.pages = options.pages;

    if (options.helpers) {
      // Accepts an object where the key is the helper name and the value is the helper function
      Handlebars.registerHelper(options.helpers);
    }
  }

  apply(compiler) {
    // Trigger a webpack compilation whenerver the templates change
    compiler.plugin("watch-run", (compilation, callback) => {
      const uniqueFiles = filterUniqueTemplatePaths(this.pages);

      chokidar.watch(uniqueFiles).on("change", () => {
        compiler.run(err => {
          if (err) {
            throw err;
          }
        });
      });

      callback();
    });

    // Compile templates on each webpack compilation
    compiler.plugin("emit", (compilation, callback) => {
      this.compileTemplates(compiler).then(callback);
    });
  }

  // Compile all handlebars templates in the template directory and place them in the output directory
  async compileTemplates(compiler) {
    const outputPath = compiler.options.output.path;
    const uniqueTemplatePaths = filterUniqueTemplatePaths(this.pages);
    const templatePromises = {};

    // Compile all unique handlebars templates
    for (const templatePath of uniqueTemplatePaths) {
      templatePromises[templatePath] = async () => {
        const templateStr = await fs.readFile(templatePath);
        return Handlebars.compile(templateStr.toString());
      };
    }

    // Use the compiled templates to generate the pages
    const outputPromises = this.pages.map(async page => {
      const template = await templatePromises[page.templatePath]();
      const compiledStr = template({ ...page.data, compiler });
      const outputFilePath = path.join(outputPath, page.fileName);
      return fs.writeFile(outputFilePath, compiledStr);
    });

    // Compile templates in parallel
    await Promise.all(outputPromises);
  }
}

module.exports = HandlebarsTemplatePlugin;
