module.exports = function(docs) {
  const systems = docs.filter(doc => Object.keys(doc.doc.tags).includes("system"));
  const components = docs.filter(doc => Object.keys(doc.doc.tags).includes("component")).reduce((acc, doc) => {
    const namespace = doc.doc.tags.namespace || "misc";
    if (!acc[namespace]) {
      acc[namespace] = [];
    }
    acc[namespace].push(doc);
    return acc;
  }, {});
  return `
  <html>
    <head>
      <style>
        body { font-family: sans-serif; }
        article { margin-left: 1em; }
        span { font-size: 70%; color: grey; }
      </style>
    </head>
    <body>
      <h1>Docs</h1>

      <ul>
        <li>Systems
          <ul>
            ${systems
              .map(system => {
                return `<li><a href="#systems/${system.doc.tags.system}">${system.doc.tags.system}</a></li>`;
              })
              .join("")}
            </ul>
        </li>

        <li>Components
          <ul>
            ${Object.entries(components)
              .sort((a, b) => a[0] > b[0])
              .map(([namespace, components]) => {
                return `<li><a href="#components/${namespace}">${namespace}</a><ul>
                  ${components
                    .map(
                      component => `<li>
                        <a href="#components/${namespace}/${component.doc.tags.component}">
                          ${component.doc.tags.component}
                        </a>
                      </li>`
                    )
                    .join("")}
                </ul></li>`;
              })
              .join("")}
          </ul>
        </li>
      </ul>

      <h2>Systems</h2>
      ${systems
        .map(system => {
          return `<article>
            <a name="systems/${system.doc.tags.system}"></a><h4>${system.doc.tags.system}</h4>
            <p>${system.doc.desc}</p>
            <span>${system.file}</span>
          </article>`;
        })
        .join("")}

      <h2>Components</h2>
      ${Object.entries(components)
        .map(([namespace, components]) => {
          return `<a name="components/${namespace}"></a><h3>${namespace}</h3>
            ${components
              .map(
                component => `<article>
                  <a name="components/${namespace}/${component.doc.tags.component}"></a>
                  <h4>${component.doc.tags.component}</h4>
                  <p>${component.doc.desc}</p>
                  <span>${component.file}</span>
                </article>`
              )
              .join("")}
          `;
        })
        .join("")}
    </body>
  </html>
  `;
};
