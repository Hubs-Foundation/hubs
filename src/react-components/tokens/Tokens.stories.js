import React from "react";
import { CenteredModalWrapper } from "../layout/CenteredModalWrapper";
import styles from "./Tokens.scss";
import { TokenList } from "./TokenList";
import { TokenPageLayout } from "./TokenPageLayout";
import { NoAccess } from "./NoAccess";
import { RevokeTokenModal } from "./RevokeTokenModal";
import { RevealTokenModal } from "./RevealTokenModal";
import { CreateToken } from "./CreateToken";

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
    account_id: "1234567890",
    id: "1",
    inserted_at: 1234,
    is_revoked: false,
    scopes: ["write_rooms", "read_rooms"],
    subject_type: "app",
    token: "(Redacted)",
    updated_at: 1234
  },
  {
    account_id: "1123456789",
    id: "2",
    inserted_at: 1234,
    is_revoked: false,
    scopes: ["write_rooms", "read_rooms"],
    subject_type: "account",
    token: "(Redacted)",
    updated_at: 1234
  },
  {
    account_id: "1234567890",
    id: "3",
    inserted_at: 1234,
    is_revoked: false,
    scopes: ["write_rooms", "read_rooms"],
    subject_type: "account",
    token: "(Redacted)",
    updated_at: 1234
  }
];

const noop = () => {};

export const NoAccessPage = () => {
  return (
    <TokenPageLayout className={styles.backgroundGray}>
      <NoAccess />
    </TokenPageLayout>
  );
};

// eslint-disable-next-line react/prop-types
export const TokenListPage = ({ children }) => (
  <TokenPageLayout>
    {children}
    <TokenList tokens={dummyTokens} onRevokeToken={noop} />
  </TokenPageLayout>
);

export const EmptyTokenListPage = () => (
  <TokenPageLayout>
    <TokenList tokens={[]} onRevokeToken={noop} />
  </TokenPageLayout>
);

export const RevokeTokenModalPage = () => (
  <TokenListPage>
    <CenteredModalWrapper>
      <RevokeTokenModal onClose={noop} revoke={noop} />
    </CenteredModalWrapper>
  </TokenListPage>
);

// eslint-disable-next-line react/prop-types
export function ModalRevokeToken() {
  return <RevokeTokenModal onClose={noop} revoke={noop} />;
}

const selectedScopes = ["read_rooms", "write_rooms"];
// eslint-disable-next-line react/prop-types
export const CreateTokenPage = ({ children }) => (
  <TokenPageLayout>
    {children}
    <CreateToken scopes={scopes} scopeInfo={scopeInfo} selectedScopes={selectedScopes} />
  </TokenPageLayout>
);

export const ModalSaveTokenPage = () => (
  <TokenPageLayout>
    <CenteredModalWrapper>
      <RevealTokenModal onClose={noop} token={{ token: "abcd1234" }} selectedScopes={["write_rooms"]} />
    </CenteredModalWrapper>
    <TokenList tokens={dummyTokens} onRevokeToken={noop} />
  </TokenPageLayout>
);
