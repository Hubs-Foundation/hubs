import React from "react";
import PropTypes from "prop-types";
import styles from "../assets/stylesheets/presence-log.scss";
import classNames from "classnames";
import { proxiedUrlFor } from "../utils/media-url-utils";

function spawnImage(url) {
  document.querySelector("a-scene").emit("add_media", url);
}

export default function ImageMessage({ name, body: { src: url }, className, maySpawn }) {
  return (
    <div className={className}>
      {maySpawn && (
        <button className={classNames(styles.iconButton, styles.spawnMessage)} onClick={() => spawnImage(url)} />
      )}
      <div className={styles.mediaBody}>{name && <div className={styles.messageSource}>{name}:</div>}</div>
      <a href={url} target="_blank" rel="noopener noreferrer">
        <img src={proxiedUrlFor(url)} />
      </a>
    </div>
  );
}

ImageMessage.propTypes = {
  name: PropTypes.string,
  maySpawn: PropTypes.bool,
  body: PropTypes.object,
  className: PropTypes.string
};
