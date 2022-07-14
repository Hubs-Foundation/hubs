import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { FormattedMessage } from "react-intl";
import { Divider } from "../layout/Divider";
import { Column } from "../layout/Column";
import styles from "./Tokens.scss";
import styleUtils from "../styles/style-utils.scss";
import { Button } from "../input/Button";
import { Row } from "../layout/Row";
import { CheckboxInput } from "../input/CheckboxInput";
import { RadioInputField } from "../input/RadioInputField";
import { RadioInputOption } from "../input/RadioInput";
import { useIntl, defineMessages } from "react-intl";
import { SpinWhileTrue } from "../layout/SpinWhileTrue";

const tokenTypes = ["account", "app"];

export const CreateToken = ({
  scopes,
  selectedScopes,
  toggleSelectedScopes,
  selectedTokenType,
  toggleTokenType,
  error,
  showNoScopesSelectedError,
  onCreateToken,
  onCreateTokenCancelled,
  isPending
}) => (
  <div>
    <h1>
      <FormattedMessage id="new-token.title" defaultMessage="New Token" />
    </h1>
    <SpinWhileTrue isSpinning={isPending}>
      {error && (
        <Row padding="sm" className={styles.revokeWarning}>
          <p>{`An Error occured: ${error}`}</p>
        </Row>
      )}
      <Row gap="xl" breakpointColumn="md" className={styleUtils.smMarginY}>
        <h2 className={styleUtils.flexBasis40}>
          <FormattedMessage id="new-token.token-type" defaultMessage="Token type" />
        </h2>
        <Row className={styleUtils.flexBasis60}>
          <RadioInputField className={styles.flexDirectionRow} inputClassName={styles.flexDirectionRow}>
            {tokenTypes.map(tokenType => (
              <RadioInputOption
                key={tokenType}
                className={classNames(styleUtils.flexBasis50, styleUtils.margin0)}
                labelClassName={styles.radioLabel}
                checked={tokenType === selectedTokenType}
                onChange={() => toggleTokenType(tokenType)}
                value={tokenType}
                label={tokenType.charAt(0).toUpperCase() + tokenType.slice(1)}
              />
            ))}
          </RadioInputField>
        </Row>
      </Row>
      <Divider />
      <Column gap="xl" className={styleUtils.mdMarginY}>
        <h2>
          <FormattedMessage id="new-token.select-scopes-title" defaultMessage="Select scopes" />
        </h2>
        <p>
          <FormattedMessage
            id="new-token.select-scopes-description"
            defaultMessage="Set the level of access this token will have by choosing from the scopes list."
          />
        </p>
      </Column>
      <Column className={styleUtils.mdMarginY}>
        {scopes.map(scopeName => {
          return (
            <SelectScope
              key={scopeName}
              scopeName={scopeName}
              toggleSelectedScopes={toggleSelectedScopes}
              selected={selectedScopes.includes(scopeName)}
            />
          );
        })}
      </Column>
      {showNoScopesSelectedError && (
        <Row className={styleUtils.mdMarginY}>
          <p className={styleUtils.textError}>
            <FormattedMessage
              id="new-token.warning-at-least-one-scope"
              defaultMessage="Please select at least one scope."
            />
          </p>
        </Row>
      )}
      <Row spaceBetween className={styleUtils.xlMarginBottom}>
        <Button sm preset="basic" onClick={onCreateTokenCancelled}>
          <FormattedMessage id="new-token.back" defaultMessage="Back" />
        </Button>
        <Button
          sm
          preset="primary"
          onClick={() => onCreateToken({ tokenType: selectedTokenType, scopes: selectedScopes })}
        >
          <FormattedMessage id="new-token.generate" defaultMessage="Generate" />
        </Button>
      </Row>
    </SpinWhileTrue>
  </div>
);

CreateToken.propTypes = {
  scopes: PropTypes.array,
  selectedScopes: PropTypes.array,
  toggleSelectedScopes: PropTypes.func,
  error: PropTypes.string,
  showNoScopesSelectedError: PropTypes.bool,
  toggleTokenType: PropTypes.func,
  selectedTokenType: PropTypes.string,
  onCreateToken: PropTypes.func,
  onCreateTokenCancelled: PropTypes.func,
  isPending: PropTypes.bool
};

// Scope info that is localized by language
// Ideally this would be fetched from the backend then compared with the localized information,
// but to ensure translations, we're defining it here.
const scopeInfo = {
  write_rooms: defineMessages({
    description: {
      id: "new-token-scopes.write-rooms.description",
      defaultMessage: "Write room data"
    }
  }),
  read_rooms: defineMessages({
    description: {
      id: "new-token-scopes.read-rooms.description",
      defaultMessage: "Read room data"
    }
  }),
  // For storybook long scope example in Tokens.stories.js
  another_long_scope_here: defineMessages({
    description: {
      id: "new-token-scopes.write-rooms.description",
      defaultMessage: "Write room data"
    }
  })
};

const SelectScope = ({ scopeName, selected, toggleSelectedScopes }) => {
  const intl = useIntl();
  const { description = null } = scopeInfo[scopeName];
  return (
    <Row
      padding="sm"
      breakpointColumn="md"
      className={classNames(styles.backgroundWhite, {
        [styles.unselectedBorder]: !selected,
        [styles.selectedBorder]: selected
      })}
      topMargin="md"
    >
      <Row className={classNames(styleUtils.flexBasis40, styles.wordWrap)}>
        <CheckboxInput
          label={scopeName}
          checked={selected}
          labelClassName={styles.checkboxLabel}
          onChange={() => toggleSelectedScopes(scopeName)}
        />
      </Row>
      <Column className={styleUtils.flexBasis60}>
        <p>{description && intl.formatMessage(description)}</p>
      </Column>
    </Row>
  );
};

SelectScope.propTypes = {
  scopeName: PropTypes.string,
  selected: PropTypes.bool,
  toggleSelectedScopes: PropTypes.func
};
