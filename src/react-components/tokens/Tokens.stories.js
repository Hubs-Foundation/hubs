import React from "react";
import { StorybookAuthContextProvider } from "../auth/AuthContext";
import { Column } from "../layout/Column";
import { Container } from "../layout/Container";
import { PageContainer } from "../layout/PageContainer";
// import { TokensContainer } from "./TokensContainer";
import styles from "./Tokens.scss";

export default {
  title: "Token/Tokens"
};

const dummyTokens = [{}, {}];

export const TokenContainer = ({ className, children }) => (
  <StorybookAuthContextProvider>
    <PageContainer>
      <Container>
        <Column>{children}</Column>
      </Container>
    </PageContainer>
  </StorybookAuthContextProvider>
);

export const NoAccessPage = () => {
  console.log(styles.backgroundGray);
  return (
    <TokenContainer className={styles.backgroundGray}>
      <Column className={styles.backgroundWhite}>
        <p>Hello robin</p>
      </Column>
    </TokenContainer>
  );
};

export const TokenListPage = ({ children }) => (
  <TokenContainer>
    {children}
    <p>Token List Page</p>
    <p>
      Porro quis praesentium ratione quos repellendus. Facilis pariatur quia ea aliquid. Ipsum omnis commodi incidunt
      tenetur et. Totam voluptatibus inventore velit eaque nam velit ad est. Et soluta officiis et iusto ad. Unde natus
      ducimus assumenda. Et facilis commodi dolor voluptas. Dolorum velit atque officiis consequatur non dolor aut.
      Aliquid harum vero vel et fugiat illo. Et sed nobis quaerat incidunt temporibus ratione. Illo et dolorum deserunt
      eum possimus autem voluptatem odio. Temporibus enim quidem ducimus et sed harum. Voluptas rem assumenda corporis
      corrupti et dignissimos maiores. Sit eos est minus dicta odit. Quia consequatur et quas. Sequi tempora voluptas
      voluptatem autem repellat inventore. Qui eaque temporibus a delectus velit quam molestiae. Voluptas fugiat autem
      fugit aliquid eaque omnis impedit. Et consectetur alias adipisci et quidem. Qui consequatur dolores distinctio et
      velit. Officiis ut a quidem vel accusamus iste fugiat. Reprehenderit dolores veniam magnam aut autem odit officia.
      Quidem non voluptas veniam quam fuga. Maiores commodi voluptatem expedita quos aut sunt.
    </p>
  </TokenContainer>
);

export const EmptyTokenListPage = () => (
  <TokenContainer>
    <p>Empty Token List Page</p>
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
