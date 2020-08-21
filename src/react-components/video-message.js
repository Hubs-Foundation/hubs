import React from "react";
import PropTypes from "prop-types";
import configs from "../utils/configs";

import { getMessages } from "../utils/i18n";
import styles from "../assets/stylesheets/presence-log.scss";
import classNames from "classnames";

import { share } from "../utils/share";

export default function VideoMessage({ name, body: { src: url }, className, maySpawn, hubId }) {
  const onShareClicked = share.bind(null, {
    url: url,
    title: `Taken in ${getMessages()["share-hashtag"]}, join me at https://${configs.SHORTLINK_DOMAIN}/${hubId}`
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
            <a href={url} target="_blank" rel="noopener noreferrer">
              video
            </a>
          </b>.
        </span>
      </div>
    </div>
  );
}
VideoMessage.propTypes = {
  name: PropTypes.string,
  maySpawn: PropTypes.bool,
  body: PropTypes.object,
  className: PropTypes.string,
  hubId: PropTypes.string
};
