# Hubs Frontend Development Best Practices

The Hubs UI is built with React, CSS Modules, and a number of other libraries. This guide is intended to get you up to speed with how we on the Hubs team write frontend code.

## Javascript Style

We use [Prettier](https://prettier.io/) for code formatting and a series of [ESLint](https://eslint.org/) rules for linting.

Currently the only modification we have made to the default prettier config is a 120 character line width. We as a team decided that 80 characters was not enough despite the Prettier team's [strong suggestion](https://prettier.io/docs/en/options.html#print-width).

You can look at our [.eslintrc.js](../.eslintrc.js) file for our linting rules. Documentation for the various rules are linked in that file.

## React

Hubs underwent a major redesign in 2020 and was transitioned from React class based components to React hooks in the process. There may still be some legacy code that uses class based components, but we intend to use hooks for all evergreen code.

### React Resources
- [Official React Docs](https://reactjs.org/docs/getting-started.html)

### Hooks

If you are new to React hooks we recommend the following guides to get started:
- [Official React Docs on Hooks](https://reactjs.org/docs/hooks-intro.html)
- [Thinking in React Hooks](https://wattenberger.com/blog/react-hooks)


### File / Folder Structure

- Keep files relatively small
- One component per file is generally good practice, but multiple related components can be placed in the same file
- Files should be named according to what they export
  - PascalCase for components/classes
  - camelCase for functions/hooks
  - kebab-case for multiple exports
- We tend to favor named exports instead of default exports
  - [This blog post](https://medium.com/@timoxley/named-exports-as-the-default-export-api-670b1b554f65) explains some reasons why
  - tldr;
    - Enforces the use of the exported name which makes for easier refactoring
    - Aliasing makes it easy to rename an import
    - Wildcard imports makes it easy to import all the exports
    - Tree shaking doesn't work with default exports
- Folders should group components, hooks, stylesheets, stories, and assets by feature
  - Makes it easier to find a file when working on a feature

### Component Best Practices

- Use functional components and hooks for all evergreen code
- Refactor existing class components to use hooks when possible
- Split presentational code from business logic so that they can be tested separately.
  - Presentational components should focus on styling and structure and should not contain business logic.
    - Presentational components must be testable in Storybook, so they cannot have external dependencies on AFrame / data fetching, server config, etc.
    - You can use hooks in presentational components for things like maintaining local state and handling interactions.
    - Presentational components can depend on other presentational components and hooks that manage local state
  - Business logic should be written in hooks
  - Wiring business logic to presentational components should be done in container components
    - Container components can depend on presentational components, hooks with business logic, and other container components.
    - Container components shouldn't contain html elements or their own stylesheets

## CSS / CSS Modules

Hubs uses [CSS Modules](https://github.com/css-modules/css-modules) and [SASS](https://sass-lang.com/) for styles.

You should avoid global class names whenever possible and instead rely on imported classes from css modules in your code.

SASS mixins, functions, etc. should generally be avoided whenever possible. They add complexity to stylesheets that makes them harder to read and understand.

You should avoid nested SASS rules when possible. One major reason for using them is for [selector specificity](https://developer.mozilla.org/en-US/docs/Web/CSS/Specificity). Another would be for programatically changing a single parent class that affects multiple child classes. Overuse of nested selectors bloats our stylesheets and should be avoided.

We use "t-shirt size" class suffixes for utility classes. Follow this pattern whenever you need to specify programatic sizes.

Ex.
```css
.button-2xs {}
.button-xs {}
.button-sm {}
.button-md {}
.button-lg {}
.button-xl {}
.button-2xl {}
```

All CSS colors and fonts should be defined in [theme.scss](../src/react-components/styles/theme.scss). These variables are configurable in Hubs Cloud instances. In some rare cases, you may want to explicitly enforce a color that cannot be configured (Ex. black/white text for an overlay).

Theme variables are imported using the `@use` keyword. This must be the first line in your `.scss` file. All variables will be namespaced with the filename. For `theme.scss` this would be `theme.$my-variable`.

Ex.

```scss
@use '../styles/theme';
/* rest of the styles */
```

CSS styles should be written with mobile-first media queries. This means the styles in the bare class should represent those on the smallest screen and media queries should be used for styles that are different on larger screens.

Ex.
```scss
:local(.sidebar) {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: theme.$white;
  pointer-events: auto;

  @media(min-width: theme.$breakpoint-lg) and (min-height: theme.$breakpoint-vr) {
    border-left: 1px solid theme.$lightgrey;
  }
}
```
