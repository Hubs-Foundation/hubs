import React from "react";
import PropTypes from "prop-types";
import styles from "./LoadingScreen.scss";
import { ReactComponent as Spinner } from "../misc/Spinner.svg";

export function LoadingScreen({ logoSrc, message, tip }) {
  return (
    <div className={styles.loadingScreen}>
      <div className={styles.center}>
        <img className={styles.logo} src={logoSrc} />
        <Spinner className={styles.spinner} />
        <p>{message}</p>
      </div>
      <div className={styles.bottom}>
        <h3>Tip:</h3>
        <p>{tip}</p>
      </div>
    </div>
  );
}

LoadingScreen.propTypes = {
  logoSrc: PropTypes.string,
  message: PropTypes.string,
  tip: PropTypes.string
};
