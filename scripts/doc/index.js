module.exports = function (docs) {
  const systems = docs.filter(doc => Object.keys(doc.doc.tags).includes("system"));
  const components = docs
    .filter(doc => Object.keys(doc.doc.tags).includes("component"))
    .reduce((acc, doc) => {
      const namespace = doc.doc.tags.namespace || "misc";
      if (!acc[namespace]) {
        acc[namespace] = [];
      }
      acc[namespace].push(doc);
      return acc;
    }, {});
  return `
# Component Docs
- Systems
${systems
  .map(system => {
    return `  - [${system.doc.tags.system}](#systems/${system.doc.tags.system})`;
  })
  .join("\n")}
- Components
${Object.entries(components)
  .sort((a, b) => a[0] > b[0])
  .map(([namespace, components]) => {
    return `  - [${namespace}](#components/${namespace})
${components
  .map(component => `    - [${component.doc.tags.component}](#components/${namespace}/${component.doc.tags.component})`)
  .join("\n")}`;
  })
  .join("\n")}

## Systems
${systems
  .map(system => {
    return `
<a name="systems/${system.doc.tags.system}"></a>
#### ${system.doc.tags.system}

${system.doc.desc}

\`${system.file}\`
    `;
  })
  .join("\n")}

## Components
${Object.entries(components)
  .map(([namespace, components]) => {
    return `
<a name="components/${namespace}"></a>
### ${namespace}
      ${components
        .map(
          component => `
<a name="components/${namespace}/${component.doc.tags.component}"></a>
#### ${component.doc.tags.component}

${component.doc.desc}

\`${component.file}\`
          `
        )
        .join("\n")}
    `;
  })
  .join("\n")}
  `;
};
