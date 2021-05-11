import React from "react";
import classNames from "classnames";
import { FormattedMessage } from "react-intl";
import { StorybookAuthContextProvider } from "../auth/AuthContext";
import { Center } from "../layout/Center";
import { Column } from "../layout/Column";
import { PageContainer } from "../layout/PageContainer";
import { Modal } from "../../react-components/modal/Modal";
// import { TokensContainer } from "./TokensContainer";
import styles from "./Tokens.scss";
import { Button } from "../input/Button";
import { Token } from "./Token";
import { Row } from "../layout/Row";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons/faExclamationTriangle";
import { faTimes } from "@fortawesome/free-solid-svg-icons/faTimes";
// import { faOctagon } from "@fortawesome/free-solid-svg-icons/faOctagon";

export default {
  title: "Token/Tokens"
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

// export const TokenContainer = ({ className, children }) => (
//   <StorybookAuthContextProvider>
//     <PageContainer>
//       <Container>
//         <Column>{children}</Column>
//       </Container>
//     </PageContainer>
//   </StorybookAuthContextProvider>
// );

//  try "Center" instead of "Container > Column"
// eslint-disable-next-line react/prop-types
export const TokenContainer = ({ children }) => (
  <StorybookAuthContextProvider>
    <PageContainer>
      <Column className={styles.centerPaddingSides}>{children}</Column>
    </PageContainer>
  </StorybookAuthContextProvider>
);

export const NoAccessPage = () => {
  console.log(styles.backgroundGray);
  // TODO add the duck
  return (
    <TokenContainer className={styles.backgroundGray}>
      <Column padding="xl" className={styles.backgroundWhite}>
        <h2>
          {/* <FontAwesomeIcon icon={faOctagon} />{" "} */}
          <FormattedMessage
            id="tokens.administrator-privileges-required"
            defaultMessage="Administrator privileges required"
          />
        </h2>
        <p className={styles.marginBottomXs}>
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
      <Row spaceBetween gap="md">
        <h2>
          <FormattedMessage id="empty-token.title2" defaultMessage="Token List" />
        </h2>
        <Button preset="primary" sm>
          <FormattedMessage id="tokens.button-create-token" defaultMessage="Create token" />
        </Button>
      </Row>
      {tokens && tokens.length ? (
        tokens.map(token => <Token key={token.id} tokenInfo={token} onRevokeToken={noop} />)
      ) : (
        <Center>
          <FormattedMessage id="tokens.no-tokens-created" defaultMessage="No tokens created." />
        </Center>
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
    >
      <Column padding="sm">
        <Column className={styles.revokeDescription}>
          <p className={styles.marginBottomXs}>
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

// eslint-disable-next-line react/prop-types
export const NewTokenSelectScopePage = ({ children }) => (
  <TokenContainer>
    {children}
    <p>New Token Select Scope</p>
  </TokenContainer>
);

export const ModalSelectPage = () => (
  <NewTokenSelectScopePage>
    <p>I AM A MODAL</p>
  </NewTokenSelectScopePage>
);
