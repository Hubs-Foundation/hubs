import React, { useEffect } from "react";
import PropTypes from "prop-types";
import styles from "./Page.scss";
import { DialogContainer, useDialog } from "./dialog-context";
import { Header } from "./Header";
import { Footer } from "./Footer";

export function Page({ children, showAdmin, signedIn, email, onSignOut, onSignIn }) {
  const { showDialog, hideDialog } = useDialog();

  useEffect(() => {
    if (authVerify) {
      this.showAuthDialog(true, false);

      this.verifyAuth().then(verified => {
        this.showAuthDialog(false, verified);
      });
      return;
    }
    if (showSignIn) {
      this.showSignInDialog(false);
    }
  }, []);

  return (
    <div className={styles.page}>
      <DialogContainer>
        <Header showAdmin={showAdmin} signedIn={signedIn} email={email} onSignIn={onSignIn} onSignOut={onSignOut} />
        {children}
        <Footer />
      </DialogContainer>
    </div>
  );
}

Page.propTypes = {
  children: PropTypes.node,
  showAdmin: PropTypes.bool,
  signedIn: PropTypes.bool,
  email: PropTypes.string,
  onSignOut: PropTypes.func.isRequired,
  onSignIn: PropTypes.func.isRequired
};
