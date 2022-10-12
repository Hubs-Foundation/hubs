import React from "react";
import PropTypes from "prop-types";
import configs from "../utils/configs";

import styles from "../assets/stylesheets/presence-log.scss";
import classNames from "classnames";
import { FormattedMessage, useIntl } from "react-intl";

import { share } from "../utils/share";

export default function VideoMessage({ name, body: { src: url }, className, maySpawn, hubId }) {
  const intl = useIntl();

  const onShareClicked = share.bind(null, {
    url: url,
    title: intl.formatMessage(
      {
        id: "video-message.default-tweet",
        defaultMessage: "Taken in {shareHashtag}"
      },
      {
        shareHashtag: configs.translation("share-hashtag"),
        url: `https://${configs.SHORTLINK_DOMAIN}/${hubId}`
      }
    )
  });
  return (
    <div className={className}>
      {maySpawn && <button className={classNames(styles.iconButton, styles.share)} onClick={onShareClicked} />}
      <div className={styles.mediaBody}>
        <FormattedMessage
          id="video-message.body"
          defaultMessage="{name} took a <a>video</a>."
          values={{
            name: <b>{name}</b>,
            // eslint-disable-next-line react/display-name
            a: chunks => (
              <b>
                <a href={url} target="_blank" rel="noopener noreferrer">
                  {chunks}
                </a>
              </b>
            )
          }}
        />
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
