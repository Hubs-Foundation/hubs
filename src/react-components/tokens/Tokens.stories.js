import React from "react";
import classNames from "classnames";
import { FormattedMessage } from "react-intl";
import { StorybookAuthContextProvider } from "../auth/AuthContext";
import { Center } from "../layout/Center";
import { Divider } from "../layout/Divider";
import { Column } from "../layout/Column";
import { PageContainer } from "../layout/PageContainer";
import { Modal } from "../../react-components/modal/Modal";
// import { TokensContainer } from "./TokensContainer";
import styles from "./Tokens.scss";
import styleUtils from "../styles/style-utils.scss";
import { Button } from "../input/Button";
import { Token } from "./Token";
import { Row } from "../layout/Row";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons/faExclamationTriangle";
import { faTimes } from "@fortawesome/free-solid-svg-icons/faTimes";
import { faTimesCircle } from "@fortawesome/free-solid-svg-icons/faTimesCircle";
import { CheckboxInput } from "../input/CheckboxInput";
import { RadioInputField } from "../input/RadioInputField";
import { RadioInputOption } from "../input/RadioInput";
import { TextInputField } from "../input/TextInputField";

export default {
  title: "Token/Tokens"
};

const scopes = ["read_rooms", "write_rooms", "another_long_scope_here"];

const scopeInfo = {
  ["read_rooms"]: {
    description: "Read room data",
    appTags: [],
    accountTags: [],
    tags: ["myRooms", "favoriteRooms", "publicRooms"]
  },
  ["write_rooms"]: {
    description: "Write room data",
    appTags: [],
    accountTags: [],
    tags: ["createRooms", "updateRoom"]
  },
  ["another_long_scope_here"]: {
    description:
      "This scope does a lot of interesting things and as such we're going to need a lot of room to write about it.",
    appTags: [],
    accountTags: [],
    tags: ["myRooms", "favoriteRooms", "publicRooms"]
  }
};

const dummyTokens = [
  {
    account_id: "1",
    id: "1",
    inserted_at: 1234,
    is_revoked: false,
    scopes: ["write_rooms", "read_rooms"],
    subject_type: "app",
    token: "(Redacted)",
    updated_at: 1234
  },
  {
    account_id: "1",
    id: "2",
    inserted_at: 1234,
    is_revoked: false,
    scopes: ["write_rooms", "read_rooms"],
    subject_type: "account",
    token: "(Redacted)",
    updated_at: 1234
  },
  {
    account_id: "1",
    id: "3",
    inserted_at: 1234,
    is_revoked: false,
    scopes: ["write_rooms", "read_rooms"],
    subject_type: "account",
    token: "(Redacted)",
    updated_at: 1234
  }
];

// eslint-disable-next-line react/prop-types
export const TokenContainer = ({ children }) => (
  <StorybookAuthContextProvider>
    <PageContainer className={styles.tokenContainer}>
      <Column gap="xl" className={classNames(styles.centerPaddingSides, styleUtils.xlPadding)}>
        {children}
      </Column>
    </PageContainer>
  </StorybookAuthContextProvider>
);

export const NoAccessPage = () => {
  console.log(styles.backgroundGray);
  // TODO add the duck
  return (
    <TokenContainer className={styles.backgroundGray}>
      <Column padding="xl" className={styles.backgroundWhite}>
        <Row>
          <div className={styles.noAccessIcon}>
            <FontAwesomeIcon icon={faTimesCircle} />
          </div>{" "}
          <h2>
            <FormattedMessage
              id="tokens.administrator-privileges-required"
              defaultMessage="Administrator privileges required"
            />
          </h2>
        </Row>
        <p className={styleUtils.xsMarginBottom}>
          <FormattedMessage
            id="tokens.no-access-description1"
            defaultMessage="You do not have sufficient privileges to create API tokens."
          />
        </p>
        <p>
          <FormattedMessage
            id="tokens.no-access-description2"
            defaultMessage="If you believe you should have access to this page, please request privileges from your Hubs administrator."
          />
        </p>
      </Column>
    </TokenContainer>
  );
};

// eslint-disable-next-line react/prop-types
export const TokenListPage = ({ children }) => (
  <TokenContainer>
    {children}
    <TokenMenuHeader />
    <TokenList tokens={dummyTokens} />
  </TokenContainer>
);

export const EmptyTokenListPage = () => (
  <TokenContainer>
    <TokenMenuHeader />
    <TokenList tokens={[]} />
  </TokenContainer>
);

const TokenMenuHeader = () => (
  <Column gap="xl">
    <h1>
      <FormattedMessage id="empty-token.title" defaultMessage="API Tokens" />
    </h1>
    <p>
      <FormattedMessage id="tokens.create-tokens-description" defaultMessage="Create tokens to access the" />{" "}
      <a href="#" rel="noreferrer noopener">
        <FormattedMessage id="tokens.create-tokens-description-hubs-api" defaultMessage="Hubs API" />
      </a>.
    </p>
  </Column>
);

const noop = () => {};

// eslint-disable-next-line react/prop-types
const TokenList = ({ tokens }) => {
  return (
    <div>
      <Row spaceBetween>
        <h2>
          <FormattedMessage id="empty-token.title2" defaultMessage="Token List" />
        </h2>
        <Button preset="primary" sm>
          <FormattedMessage id="tokens.button-create-token" defaultMessage="Create token" />
        </Button>
      </Row>
      {tokens && tokens.length ? (
        <Column className={styleUtils.xlMarginY}>
          {tokens.map(token => <Token key={token.id} tokenInfo={token} onRevokeToken={noop} />)}
        </Column>
      ) : (
        <div className={styleUtils.xlMarginY}>
          <Row padding="md" className={styles.backgroundWhite}>
            <Center>
              <FormattedMessage id="tokens.no-tokens-created" defaultMessage="No tokens created." />
            </Center>
          </Row>
        </div>
      )}
    </div>
  );
};

export const RevokeTokenModalPage = () => (
  <TokenListPage>
    <div className={classNames(styles.fullscreen, styles.darken)}>
      <Center>
        <RevokeTokenModal onClose={noop} />
      </Center>
    </div>
  </TokenListPage>
);

// eslint-disable-next-line react/prop-types
export function RevokeTokenModal({ onClose }) {
  return (
    <Modal
      title={<FormattedMessage id="revoke-token-modal.title" defaultMessage="Revoke token" />}
      beforeTitle={<FontAwesomeIcon icon={faExclamationTriangle} />}
      afterTitle={<FontAwesomeIcon icon={faTimes} onClick={onClose} />}
      disableFullscreen
      className={styles.maxWidth400}
    >
      <Column padding="sm">
        <Column className={styles.revokeDescription}>
          <p className={styleUtils.xsMarginBottom}>
            <FormattedMessage
              id="revoke-token-modal.description1"
              defaultMessage="Are you sure you want to revoke this token?"
            />
          </p>
          <p>
            <FormattedMessage
              id="revoke-token-modal.description2"
              defaultMessage="Any scripts or requests relying on this token will lose access."
            />
          </p>
        </Column>
        <Row padding="sm" className={styles.revokeWarning}>
          <p>
            <FormattedMessage id="revoke-token-modal.revoke-warning-1" defaultMessage="This action is" />{" "}
            <b>
              <FormattedMessage id="revoke-token-modal.revoke-warning-2" defaultMessage="permanent" />
            </b>{" "}
            <FormattedMessage id="revoke-token-modal.revoke-warning-3" defaultMessage="and" />{" "}
            <b>
              <FormattedMessage id="revoke-token-modal.revoke-warning-4" defaultMessage="can not be undone." />
            </b>
          </p>
        </Row>
        <Row spaceBetween padding="sm">
          <Button preset="basic" sm>
            <FormattedMessage id="revoke-token-modal.cancel" defaultMessage="Cancel" />
          </Button>
          <Button preset="accent1" sm>
            <FormattedMessage id="revoke-token-modal.revoke" defaultMessage="Revoke" />
          </Button>
        </Row>
      </Column>
    </Modal>
  );
}

const selectedScopes = ["read_rooms", "write_rooms"];
// eslint-disable-next-line react/prop-types
export const NewTokenSelectScopePage = ({ children }) => (
  <TokenContainer>
    {children}
    <h1>
      <FormattedMessage id="new-token.title" defaultMessage="New Token" />
    </h1>
    <Row gap="xl" breakpointColumn="md" topMargin="sm">
      <h2 className={styleUtils.flexBasis40}>
        <FormattedMessage id="new-token.token-type" defaultMessage="Token type" />
      </h2>
      <Row className={styleUtils.flexBasis60}>
        <RadioInputField className={styles.flexDirectionRow} inputClassName={styles.flexDirectionRow}>
          <RadioInputOption
            className={classNames(styleUtils.flexBasis50, styleUtils.margin0)}
            labelClassName={styles.radioLabel}
            value={1}
            label="Account"
          />
          <RadioInputOption
            labelClassName={styles.radioLabel}
            className={classNames(styleUtils.flexBasis50, styleUtils.margin0)}
            value={2}
            label="App"
          />
        </RadioInputField>
      </Row>
    </Row>
    <Divider />
    <Column gap="xl">
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
    <Column>
      {scopes.map(scopeName => {
        const curScopeInfo = scopeInfo[scopeName];
        console.log(curScopeInfo);
        return (
          <SelectScope
            key={scopeName}
            scopeName={scopeName}
            curScopeInfo={curScopeInfo}
            selected={selectedScopes.includes(scopeName)}
          />
        );
      })}
    </Column>
    <Row spaceBetween className={styleUtils.xlMarginBottom}>
      <Button sm preset="basic">
        Back
      </Button>
      <Button sm preset="primary">
        Generate
      </Button>
    </Row>
  </TokenContainer>
);

// eslint-disable-next-line react/prop-types
const SelectScope = ({ scopeName, curScopeInfo, selected }) => {
  return (
    <Row
      padding="sm"
      breakpointColumn="md"
      className={classNames(styles.backgroundWhite, { [styles.selectedBorder]: selected })}
      topMargin="md"
    >
      <Row className={classNames(styleUtils.flexBasis40, styles.wordWrap)}>
        <CheckboxInput label={scopeName} checked={selected} labelClassName={styles.checkboxLabel} />
      </Row>
      <Column className={styleUtils.flexBasis60}>
        <p>{curScopeInfo && curScopeInfo.description}</p>
        <Row topMargin="sm">
          {curScopeInfo &&
            curScopeInfo.tags.map(tag => (
              <div key={`${scopeName}-${tag}`} className={styles.tag}>
                {tag}
              </div>
            ))}
        </Row>
      </Column>
    </Row>
  );
};

export const ModalSaveTokenPage = () => (
  <NewTokenSelectScopePage>
    <SaveAPITokenModal onClose={noop} />
  </NewTokenSelectScopePage>
);

// eslint-disable-next-line react/prop-types
export const SaveAPITokenModal = ({ onClose }) => {
  return (
    <div className={classNames(styles.fullscreen, styles.darken)}>
      <Center>
        <Modal
          title={<FormattedMessage id="save-api-token.title" defaultMessage="API Token" />}
          afterTitle={<FontAwesomeIcon icon={faTimes} onClick={onClose} />}
          disableFullscreen
          className={styles.maxWidth400}
        >
          <Column padding="sm" gap="lg" className={styleUtils.mdMarginY}>
            <p>
              <b>
                <FormattedMessage
                  id="save-api-token.description1"
                  defaultMessage="Please save this API token in a safe place."
                />
              </b>
              <br />
              <FormattedMessage
                id="save-api-token.description2"
                defaultMessage="You will not be able to see it again once you have closed this window."
              />
            </p>
            <TextInputField
              className={styles.maxWidthAuto}
              inputClassName={classNames(styles.backgroundDarkGrey, styles.textWhite)}
              label={<FormattedMessage id="save-api-token.copy-label" defaultMessage="API Token" />}
              value={"abcd1234"}
              description={<p>Copied!</p>}
              afterInput={
                <Button preset="accent6" onClick={noop}>
                  Copy
                </Button>
              }
            />
            <Row padding="sm" className={styles.backgroundLightGrey}>
              <p>
                <b>
                  <FormattedMessage id="save-api-token.scopes" defaultMessage="Scopes" />:
                </b>{" "}
                {selectedScopes &&
                  selectedScopes.map((scopeName, idx) => `${scopeName}${selectedScopes.length - 1 > idx ? ", " : ""}`)}
              </p>
            </Row>
            <Center>
              <Button preset="primary" sm>
                <FormattedMessage id="save-api-token.revoke" defaultMessage="Confirm and close" />
              </Button>
            </Center>
          </Column>
        </Modal>
      </Center>
    </div>
  );
};
