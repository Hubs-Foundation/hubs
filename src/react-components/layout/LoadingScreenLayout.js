import React from "react";
import PropTypes from "prop-types";
import styles from "./LoadingScreenLayout.scss";
import { Column } from "../layout/Column";

export function LoadingScreenLayout({ center, bottom, logoSrc }) {
  return (
    <div className={styles.loadingScreenLayout}>
      <Column center padding gap="lg" className={styles.center}>
        <img className={styles.logo} src={logoSrc} />
        {center}
      </Column>
      {bottom && (
        <Column center className={styles.bottom}>
          {bottom}
        </Column>
      )}
    </div>
  );
}

LoadingScreenLayout.propTypes = {
  logoSrc: PropTypes.string,
  center: PropTypes.node,
  bottom: PropTypes.node
};
