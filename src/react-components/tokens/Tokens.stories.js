import React from "react";
import { StorybookAuthContextProvider } from "../auth/AuthContext";
import { Column } from "../layout/Column";
import { Container } from "../layout/Container";
import { PageContainer } from "../layout/PageContainer";
// import { TokensContainer } from "./TokensContainer";

export default {
  title: "Token/Tokens"
};

const dummyTokens = [{}, {}];

export const TokenContainer = ({ children }) => (
  <StorybookAuthContextProvider>
    <PageContainer>
      <Container>
        <Column>{children}</Column>
      </Container>
    </PageContainer>
  </StorybookAuthContextProvider>
);

export const NoAccessPage = () => (
  <TokenContainer>
    <p>No access</p>
  </TokenContainer>
);

export const TokenListPage = ({ children }) => (
  <TokenContainer>
    {children}
    <p>Token List Page</p>
  </TokenContainer>
);

export const RevokeTokenModal = () => (
  <TokenListPage>
    <p>I AM REVOKE TOKEN MODAL</p>
  </TokenListPage>
);

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
