import React from "react";
import PropTypes from "prop-types";
import styles from "./LoadingScreen.scss";
import { Spinner } from "../misc/Spinner";
import { useRandomMessageTransition } from "./useRandomMessageTransition";
import { Column } from "../layout/Column";

export function LoadingScreen({ logoSrc, message, infoMessages }) {
  const infoMessage = useRandomMessageTransition(infoMessages);

  return (
    <div className={styles.loadingScreen}>
      <Column center gap="lg" className={styles.center}>
        <img className={styles.logo} src={logoSrc} />
        <Spinner />
        <p>{message}</p>
      </Column>
      <Column center className={styles.bottom}>
        <h3>{infoMessage.heading}</h3>
        <p>{infoMessage.message}</p>
      </Column>
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
