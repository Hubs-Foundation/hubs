import React from "react";
import PropTypes from "prop-types";
import styles from "./RoomTile.scss";
import { scaledThumbnailUrlFor } from "../../utils/media-url-utils";
import { FormattedMessage } from "react-intl";
import dayjs from "dayjs-ext";
import relativeTime from "dayjs-ext/plugin/relativeTime";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar } from "@fortawesome/free-solid-svg-icons/faStar";
import { faUsers } from "@fortawesome/free-solid-svg-icons/faUsers";

dayjs.extend(relativeTime);

// TODO: Don't hardcode this or make MediaGrid pull from a single set of constants.
const thumbnailWidth = 355;
const thumbnailHeight = 200;

export function RoomTile({ room, ...rest }) {
  const thumbnailUrl = scaledThumbnailUrlFor(room.images.preview.url, thumbnailWidth, thumbnailHeight);

  return (
    <a
      className={styles.roomTile}
      href={room.url}
      rel="noreferrer noopener"
      style={{ width: thumbnailWidth }}
      {...rest}
    >
      <div className={styles.thumbnailContainer}>
        <img src={thumbnailUrl} alt={room.name} width={thumbnailWidth} height={thumbnailHeight} />
        {room.favorited && <FontAwesomeIcon className={styles.favoriteIcon} icon={faStar} />}
        <div className={styles.memberCount}>
          <FontAwesomeIcon icon={faUsers} /> <span>{room.member_count}</span>
        </div>
      </div>
      <div className={styles.roomInfo}>
        <h3>{room.name}</h3>
        {room.last_activated_at && (
          <small>
            <FormattedMessage id="media-browser.hub.joined-prefix" /> {dayjs(room.last_activated_at).fromNow()}
          </small>
        )}
      </div>
    </a>
  );
}

RoomTile.propTypes = {
  room: PropTypes.object
};
