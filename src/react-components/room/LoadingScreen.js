import React from "react";
import PropTypes from "prop-types";
import styles from "./LoadingScreen.scss";
import { ReactComponent as Spinner } from "../misc/Spinner.svg";

export function LoadingScreen({ logoSrc, message, bottomHeader, bottomMessage }) {
  return (
    <div className={styles.loadingScreen}>
      <div className={styles.center}>
        <img className={styles.logo} src={logoSrc} />
        <Spinner className={styles.spinner} />
        <p>{message}</p>
      </div>
      <div className={styles.bottom}>
        <h3>{bottomHeader}</h3>
        <p>{bottomMessage}</p>
      </div>
    </div>
  );
}

LoadingScreen.propTypes = {
  logoSrc: PropTypes.string,
  message: PropTypes.node,
  bottomHeader: PropTypes.node,
  bottomMessage: PropTypes.node
};
