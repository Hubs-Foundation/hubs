import React from "react";
import PropTypes from "prop-types";

import styles from "../assets/stylesheets/presence-log.scss";
import configs from "../utils/configs";
import classNames from "classnames";

import { share } from "../utils/share";
import { getLandingPageForPhoto } from "../utils/phoenix-utils";
import { FormattedMessage, useIntl } from "react-intl";

export default function PhotoMessage({ name, body: { src: url }, className, maySpawn, hubId }) {
  const intl = useIntl();

  const landingPageUrl = getLandingPageForPhoto(url);

  const onShareClicked = share.bind(null, {
    url: landingPageUrl,
    title: intl.formatMessage(
      {
        id: "photo-message.default-tweet",
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
          id="photo-message.body"
          defaultMessage="{name} took a <a>photo</a>."
          values={{
            name: <b>{name}</b>,
            // eslint-disable-next-line react/display-name
            a: chunks => (
              <b>
                <a href={landingPageUrl} target="_blank" rel="noopener noreferrer">
                  {chunks}
                </a>
              </b>
            )
          }}
        />
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
