import React from "react";
import PropTypes from "prop-types";

import styles from "../assets/stylesheets/presence-log.scss";
import classNames from "classnames";

import { share } from "../utils/share";
import { getLandingPageForPhoto } from "../utils/phoenix-utils";

export default function PhotoMessage({ name, body: { src: url }, className, maySpawn, hubId }) {
  const landingPageUrl = getLandingPageForPhoto(url);
  const onShareClicked = share.bind(null, {
    url: landingPageUrl,
    title: `Taken in #hubs, join me at https://hub.link/${hubId}`
  });
  return (
    <div className={className}>
      {maySpawn && <button className={classNames(styles.iconButton, styles.share)} onClick={onShareClicked} />}
      <div className={styles.mediaBody}>
        <span>
          <b>{name}</b>
        </span>
        <span>
          {"took a "}
          <b>
            <a href={landingPageUrl} target="_blank" rel="noopener noreferrer">
              photo
            </a>
          </b>.
        </span>
      </div>
      <a href={landingPageUrl} target="_blank" rel="noopener noreferrer">
        <img src={url} />
      </a>
    </div>
  );
}
PhotoMessage.propTypes = {
  name: PropTypes.string,
  maySpawn: PropTypes.bool,
  body: PropTypes.object,
  className: PropTypes.string,
  hubId: PropTypes.string
};
