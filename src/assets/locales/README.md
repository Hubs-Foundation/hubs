# Localization

The Hubs redesign has a lot of new text and we need help from people like you to translate it. Follow the steps below to get started.

## CLI Tools

### `npm run intl-extract`

This script extracts all existing messages in the Hubs codebase to a temporary file, `extracted-messages.json`. This file includes the message id, default message, and where the translation is used in the codebase.

### `npm run intl-extract-en-locale`

This script extracts all existing messages in the Hubs codebase to a temporary file `en.json`. It does not contain any metadata, just the id and English translation. It can be used as a template for other locales.

### Coming Soon

Our goal is to integrate with [Mozilla Pontoon](https://pontoon.mozilla.org) in the near future.

## Adding Locales

1. Add an entry to `AVAILABLE_LOCALES` in [locale_config.js](locale_config.js) with the appropriate locale code and in-language translation of the language.
2. Copy an existing locale (e.g. [en.json](en.json)) to a new file using appropriate locale code as filename. (e.g. [zh.json](zh.json))
   * For locales that have duplicate codes (e.g. `zh` and `zh-ch`), edit `FALLBACK_LOCALES` in [locale_config.js](locale_config.js) to define the fallback locale so that the locale file doesn't need to be duplicated.
3. Edit your new locale file with your translations.

## Adding to existing Locales
Add your new message to the Hubs client in the appropriate json file in this directory. Be sure to follow the best practices guide below. The default message should be in English.

## Best Practices
The best practices for localization are the following:

### 1. Message ids cannot contain variables.
This is due to the message extraction relying on static code analysis.

Example:
```jsx
import { FormattedMessage, defineMessages, useIntl } from "react-intl";

// Good
<FormattedMessage id="sign-in-modal.complete" defaultMessage="Sign in complete" />

// Bad
<FormattedMessage id={`sign-in-modal.${step}`} />

// Good
const messages = defineMessages({
  prompt: {
    id: "sign-in-modal.prompt",
    defaultMessage: "Please sign in"
  },
  complete: {
    id: "sign-in-modal.complete",
    defaultMessage: "Sign in complete"
  }
});

function SignInModal({ step }) {
  const intl = useIntl();

  return <p>{intl.formatMessage(messages[step])}</p>;
}

// Bad
function SignInModal({ step }) {
  return <p><FormattedMessage id={`sign-in-modal.${step}`} /></p>;
}
```

### 2. Message ids should be namespaced with the component/parent component name.
We are not using auto-generated ids due to backwards-compatibility issues with our existing translations. As such, we need to ensure that there are no collisions. Name the translation ids by starting with the component name in dash/kebab case. If the component is split up into multiple local components and is only used in the context of a parent component, use the parent component name.

Example:
```jsx

// Good
function SignInModal() {
 return <FormattedMessage id="sign-in-modal.complete" defaultMessage="Sign in complete" />;
}

// Bad
function SignInModal() {
 return <FormattedMessage id="sign-in.complete" defaultMessage="Sign in complete" />;
}

// Good
function ObjectListItem({ item }) {
 return (
  <li>
    {item.name}
    <button>
      <FormattedMessage id="object-list.select" defaultMessage="Select Object" />
    </button>
  </li>
  );
}

export function ObjectList({ objects }) {
 return <ul>{objects.map(o => <ObjectListItem item={o} />)}</ul>;
}
```

### 3. Always specify a default message.
Default messages will be used to provide context to translators, they are the fallback message if it is not defined for another language, and they are used as the English translation by default.

```jsx
// Good
<FormattedMessage id="sign-in-modal.complete" defaultMessage="Sign in complete" />

// Bad
<FormattedMessage id={`sign-in-modal.complete`} />

// Good
const signInCompleteMessage = defineMessage({
  id: "sign-in-modal.complete",
  defaultMessage: "Sign in complete"
});

// Bad
const signInCompleteMessage = defineMessage({
  id: "sign-in-modal.complete"
});
```

### 4. All strings presented to users should be localized including accessibility features
It is not enough to localize just the visible text. All labels, alt text, and callouts should also be localized.

```jsx
<img alt={<FormattedMessage id="logo.alt-text" defaultMessage="Hubs Logo" />} src="logo.png" />

<div aria-label={<FormattedMessage id="element.label" defaultMessage="This is a label" />}></div>

<div title={<FormattedMessage id="element.title" defaultMessage="This is a title" />}></div>
```

### 5. Use react-intl's formatter for formatting concatenated strings.
Different languages have different grammatical rules and sentence structure. Relying on string concatenation that works in English will not always make sense in another language. Use react-intl's `values` prop to format messages with variables or rich formatting. If formatting gets too complicated break it up into multiple messages.

```jsx
// Bad
<p>
  <small>
    By proceeding, you agree to the{" "}
    {showTerms && (
      <>
        <a rel="noopener noreferrer" target="_blank" href={termsUrl}>
          terms of use
        </a>{" "}
      </>
    )}
    {showTerms && showPrivacy && "and "}
    {showPrivacy && (
      <a rel="noopener noreferrer" target="_blank" href={privacyUrl}>
        privacy notice
      </a>
    )}.
  </small>
</p>
```
```jsx
// Good
export function LegalMessage({ termsUrl, privacyUrl }) {
  const toslink = useCallback(
    chunks => (
      <a rel="noopener noreferrer" target="_blank" href={termsUrl}>
        {chunks}
      </a>
    ),
    [termsUrl]
  );

  const privacylink = useCallback(
    chunks => (
      <a rel="noopener noreferrer" target="_blank" href={privacyUrl}>
        {chunks}
      </a>
    ),
    [privacyUrl]
  );

  if (termsUrl && privacyUrl) {
    return (
      <FormattedMessage
        id="legal-message.tos-and-privacy"
        defaultMessage="By proceeding, you agree to the <toslink>terms of use</toslink> and <privacylink>privacy notice</privacylink>."
        values={{
          toslink,
          privacylink
        }}
      />
    );
  }

  if (termsUrl && !privacyUrl) {
    return (
      <FormattedMessage
        id="legal-message.tos"
        defaultMessage="By proceeding, you agree to the <toslink>terms of use</toslink>."
        values={{
          toslink
        }}
      />
    );
  }

  if (!termsUrl && privacyUrl) {
    return (
      <FormattedMessage
        id="legal-message.privacy"
        defaultMessage="By proceeding, you agree to the <privacylink>privacy notice</privacylink>."
        values={{
          privacylink
        }}
      />
    );
  }

  return null;
}
```

6. Reference messages as objects or defineMessages keys, not ids
Message objects contain an id and a default message. Pass the whole object into a component and use `intl.formatMessage` to render it. Alternately, use a `defineMessages` function to define messages with keys and use that key to reference the message.

```jsx
const errorMessages = defineMessages({
  unknown: {
    id: "error-message.unknown",
    defaultMessage: "An unknown error occured"
  },
  notFound: {
    id: "error-message.not-found",
    defaultMessage: "Page not found"
  }
});

// Good
function ErrorMessage({ message }) {
  const intl = useIntl();

  return <code>{intl.formatMessage(message)}</code>
}

<ErrorMessage message={errorMessages.unknown} />

// Good
function ErrorMessage({ type }) {
  const intl = useIntl();

  return <code>{intl.formatMessage(errorMessages[type])}</code>
}

<ErrorMessage type="unknown" />
```
