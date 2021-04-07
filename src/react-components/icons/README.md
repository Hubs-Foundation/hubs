# Icons

We use [svgr](https://react-svgr.com/) for our icons. This library allows you to import a SVG as a React component. The components are generated using the [IconTemplate.js](./IconTemplate.js) file.

Icons are kept in a Figma design document. To add an icon, export it from Figma with all colors set to black. The black colors can then be replaced in CSS stylesheets using the following code:

```scss
svg {
  *[stroke=\#000] {
    stroke: theme.$blue-pressed;
  }

  *[fill=\#000] {
    fill: theme.$blue-pressed;
  }
}
```

SVGR configuration properties are set in the webpack config. There is an identical config in the Storybook webpack config.