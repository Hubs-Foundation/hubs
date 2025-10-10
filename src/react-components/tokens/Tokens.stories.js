import React from "react";
import { CenteredModalWrapper } from "../layout/CenteredModalWrapper";
import { TokenList } from "./TokenList";
import { TokenPageLayout } from "./TokenPageLayout";
import { NoAccess } from "./NoAccess";
import { RevokeTokenModal } from "./RevokeTokenModal";
import { RevealTokenModal } from "./RevealTokenModal";
import { CreateToken } from "./CreateToken";
import { StorybookAuthContextProvider } from "../auth/AuthContext";

export default {
  title: "Token/Tokens"
};

const scopes = ["read_rooms", "write_rooms", "another_long_scope_here"];

const dummyTokens = [
  {
    account_id: 1234567890,
    id: "1",
    inserted_at: "2023-08-19T10:30:00Z",
    is_revoked: false,
    scopes: ["write_rooms", "read_rooms"],
    subject_type: "app",
    token: "(Redacted)",
    updated_at: "2023-08-19T10:30:00Z"
  },
  {
    account_id: 1123456789,
    id: "2",
    inserted_at: "2023-08-18T15:45:00Z",
    is_revoked: false,
    scopes: ["write_rooms", "read_rooms"],
    subject_type: "account",
    token: "(Redacted)",
    updated_at: "2023-08-18T15:45:00Z"
  },
  {
    account_id: 1234567890,
    id: "3",
    inserted_at: "2023-08-17T09:15:00Z",
    is_revoked: false,
    scopes: ["write_rooms", "read_rooms"],
    subject_type: "account",
    token: "(Redacted)",
    updated_at: "2023-08-17T09:15:00Z"
  }
];

const noop = () => {};

// eslint-disable-next-line react/prop-types
const StorybookWrapper = ({ children }) => {
  return (
    <StorybookAuthContextProvider>
      <TokenPageLayout>{children}</TokenPageLayout>
    </StorybookAuthContextProvider>
  );
};

export const NoAccessPage = () => {
  return (
    <StorybookWrapper>
      <NoAccess />
    </StorybookWrapper>
  );
};

// eslint-disable-next-line react/prop-types
export const TokenListPage = ({ children }) => (
  <StorybookWrapper>
    {children}
    <TokenList tokens={dummyTokens} onRevokeToken={noop} isFetching={false} />
  </StorybookWrapper>
);

export const EmptyTokenListPage = () => (
  <StorybookWrapper>
    <TokenList tokens={[]} onRevokeToken={noop} isFetching={false} />
  </StorybookWrapper>
);

export const RevokeTokenModalPage = () => (
  <TokenListPage>
    <CenteredModalWrapper>
      <RevokeTokenModal onClose={noop} onRevoke={noop} isPending={false} />
    </CenteredModalWrapper>
  </TokenListPage>
);

export function ModalRevokeToken() {
  return <RevokeTokenModal onClose={noop} onRevoke={noop} isPending={false} />;
}

const selectedScopes = ["read_rooms", "write_rooms"];
// eslint-disable-next-line react/prop-types
export const CreateTokenPage = ({ children }) => (
  <StorybookWrapper>
    {children}
    <CreateToken scopes={scopes} selectedScopes={selectedScopes} isPending={false} />
  </StorybookWrapper>
);

export const ModalSaveTokenPage = () => (
  <StorybookWrapper>
    <CenteredModalWrapper>
      <RevealTokenModal onClose={noop} token={"abcd1234"} selectedScopes={["write_rooms"]} />
    </CenteredModalWrapper>
    <TokenList tokens={dummyTokens} onRevokeToken={noop} isFetching={false} />
  </StorybookWrapper>
);
