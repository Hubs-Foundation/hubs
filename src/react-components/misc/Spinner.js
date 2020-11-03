import React from "react";
import { ReactComponent as SpinnerSvg } from "./Spinner.svg";
import styles from "./Spinner.scss";

export function Spinner() {
  return <SpinnerSvg className={styles.spinner} />;
}
