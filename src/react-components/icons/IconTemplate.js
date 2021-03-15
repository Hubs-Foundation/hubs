/**
 * https://react-svgr.com/docs/custom-templates/
 *
 * This template is used in both the Storybook Webpack Config and app Webpack Config.
 *
 * Set the default icon color to #000 so we can set icon fill/stroke via CSS or via props.
 *
 * Set Color via CSS for any icon:
 *
 * svg {
 *   *[stroke=\#000] {
 *     stroke: white;
 *   }
 *
 *   *[fill=\#000] {
 *     fill: white;
 *   }
 * }
 *
 *
 * Set Color Via React Props:
 *
 * <IconComponent color="red" />
 *
 */
function defaultTemplate({ template }, opts, { imports, interfaces, componentName, props, jsx, exports }) {
  const plugins = ["jsx"];
  if (opts.typescript) {
    plugins.push("typescript");
  }
  const typeScriptTpl = template.smart({ plugins });
  return typeScriptTpl.ast`${imports}
${interfaces}
function ${componentName}(${props}) {
  return ${jsx};
}

${componentName}.defaultProps = {
  color: "#000",
  title: "${componentName.name
    .match(/[A-Z][a-z]+/g)
    .slice(1)
    .join(" ")}"
};

${exports}
  `;
}

module.exports = defaultTemplate;
