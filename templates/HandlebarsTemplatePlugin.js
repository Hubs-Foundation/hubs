const Handlebars = require("handlebars");
const fs = require("fs-extra");
const path = require("path");
const chokidar = require("chokidar");

class HandlebarsTemplatePlugin {
  constructor(options) {
    this.templatesPath = options.templatesPath;
    this.templateExtension = options.templateExtension || ".hbs";
    this.templateOptions = options.templateOptions || {};

    if (options.helpers) {
      Object.keys(options.helpers).forEach(helperName => {
        Handlebars.registerHelper(helperName, options.helpers[helperName]);
      });
    }
  }

  apply(compiler) {
    compiler.plugin("watch-run", (compilation, callback) => {
      chokidar
        .watch(path.join(this.templatesPath, "*" + this.templateExtension))
        .on("change", () => {
          compiler.run(err => {
            if (err) {
              throw err;
            }
          });
        });

      callback();
    });

    compiler.plugin("emit", (compilation, callback) => {
      this.compileTemplates(compiler, compilation).then(callback);
    });
  }

  // Compile all handlebars templates in the template directory and place them in the output directory.
  async compileTemplates(compiler, compilation) {
    const outputPath = compiler.options.output.path;
    const templateFiles = await fs.readdir(this.templatesPath);

    const templatePromises = templateFiles
      .filter(filename => filename.indexOf(this.templateExtension) !== -1)
      .map(fileName => {
        const filePath = path.join(this.templatesPath, fileName);
        const outputFileName = fileName.replace(
          this.templateExtension,
          ".html"
        );
        const outputFilePath = path.join(outputPath, outputFileName);

        return this.compileTemplate(filePath, outputFilePath);
      });

    await Promise.all(templatePromises);
  }

  // Compile a single handlebars template given a file path and output file path.
  async compileTemplate(filePath, outputFilePath) {
    const templateStr = await fs.readFile(filePath);
    const template = Handlebars.compile(templateStr.toString());
    const compiledStr = template(this.templateOptions);
    return fs.writeFile(outputFilePath, compiledStr);
  }
}

module.exports = HandlebarsTemplatePlugin;
