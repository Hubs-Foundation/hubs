# Hubs Frontend Development Best Practices

## React

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
-