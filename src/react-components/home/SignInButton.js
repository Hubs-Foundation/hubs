import React from "react";
import { FormattedMessage } from "react-intl";
import styles from "./SignInButton.scss";
import { Button } from "../input/Button";

export function SignInButton({ mobile }) {
  return (
    <Button className={mobile ? styles.mobileSignIn : styles.SignInButton} thick preset="signin" as="a" href="/signin">
      <FormattedMessage id="sign-in-button" defaultMessage="sign in/sign up" />
    </Button>
  );
}
