import React from "react";
import PropTypes from "PropTypes";
import { PagesContainer } from "../layout/PagesContainer";
import { StorybookAuthContextProvider } from "../auth/AuthContext";
import { Column } from "../layout/Column";
import classNames from "classnames";
import styleUtils from "../styles/style-utils.scss";
import styles from "./Tokens.scss";

export const TokenPageLayout = ({ children }) => (
  <StorybookAuthContextProvider>
    <PagesContainer className={styles.tokenContainer}>
      <Column gap="xl" className={classNames(styles.centerPaddingSides, styleUtils.xlPadding)}>
        {children}
      </Column>
    </PagesContainer>
  </StorybookAuthContextProvider>
);

TokenPageLayout.propTypes = {
  children: PropTypes.node
};
