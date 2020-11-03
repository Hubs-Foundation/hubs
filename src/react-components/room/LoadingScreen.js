import React from "react";
import PropTypes from "prop-types";
import styles from "./LoadingScreen.scss";
import { Spinner } from "../misc/Spinner";
import { useRandomMessageTransition } from "./useRandomMessageTransition";

export function LoadingScreen({ logoSrc, message, infoMessages }) {
  const infoMessage = useRandomMessageTransition(infoMessages);

  return (
    <div className={styles.loadingScreen}>
      <div className={styles.center}>
        <img className={styles.logo} src={logoSrc} />
        <Spinner />
        <p>{message}</p>
      </div>
      <div className={styles.bottom}>
        <h3>{infoMessage.heading}</h3>
        <p>{infoMessage.message}</p>
      </div>
    </div>
  );
}

LoadingScreen.propTypes = {
  logoSrc: PropTypes.string,
  message: PropTypes.node,
  infoMessages: PropTypes.arrayOf(
    PropTypes.shape({
      heading: PropTypes.node.isRequired,
      message: PropTypes.node.isRequired
    })
  )
};

LoadingScreen.defaultProps = {
  infoMessages: []
};
