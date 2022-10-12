import React, { useMemo } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { FormattedMessage, FormattedRelativeTime, useIntl } from "react-intl";
import styles from "./MediaTiles.scss";
import { ReactComponent as PeopleIcon } from "../icons/People.svg";
import { ReactComponent as StarIcon } from "../icons/Star.svg";
import { ReactComponent as AddIcon } from "../icons/Add.svg";
import { ReactComponent as PenIcon } from "../icons/Pen.svg";
import { ReactComponent as DuplicateIcon } from "../icons/Duplicate.svg";
import { ReactComponent as SearchIcon } from "../icons/Search.svg";
import { ReactComponent as HelpIcon } from "../icons/Help.svg";
import { ReactComponent as ExternalLinkIcon } from "../icons/ExternalLink.svg";

const PUBLISHER_FOR_ENTRY_TYPE = {
  sketchfab_model: "Sketchfab",
  twitch_stream: "Twitch"
};

function useThumbnailSize(isImage, isAvatar, imageAspect) {
  return useMemo(
    () => {
      let imageHeight = 220;
      if (isAvatar) imageHeight = Math.floor(imageHeight * 1.5);

      // Aspect ratio can vary per image if its an image result. Avatars are a taller portrait aspect, o/w assume 720p
      let imageWidth;
      if (isImage) {
        imageWidth = Math.floor(Math.max(imageAspect * imageHeight, imageHeight * 0.85));
      } else if (isAvatar) {
        imageWidth = Math.floor((9 / 16) * imageHeight);
      } else {
        imageWidth = Math.floor(Math.max((16 / 9) * imageHeight, imageHeight * 0.85));
      }

      return [imageWidth, imageHeight];
    },
    [isImage, isAvatar, imageAspect]
  );
}

function useThumbnail(entry, processThumbnailUrl) {
  const isImage = entry.type.endsWith("_image");
  const isAvatar = entry.type === "avatar" || entry.type === "avatar_listing";
  const imageAspect = entry.images.preview.width / entry.images.preview.height;

  const [thumbnailWidth, thumbnailHeight] = useThumbnailSize(isImage, isAvatar, imageAspect);

  const thumbnailUrl = useMemo(
    () => {
      return processThumbnailUrl
        ? processThumbnailUrl(entry, thumbnailWidth, thumbnailHeight)
        : entry.images.preview.url;
    },
    [entry, thumbnailWidth, thumbnailHeight, processThumbnailUrl]
  );

  return [thumbnailUrl, thumbnailWidth, thumbnailHeight];
}

function BaseTile({ as: TileComponent, className, name, description, tall, wide, children, ...rest }) {
  let additionalProps;

  if (TileComponent === "div") {
    additionalProps = {
      tabIndex: "0",
      role: "button"
    };
  }

  return (
    <TileComponent
      className={classNames(styles.mediaTile, { [styles.tall]: tall, [styles.wide]: wide }, className)}
      {...additionalProps}
      {...rest}
    >
      <div className={styles.thumbnailContainer}>{children}</div>
      {(name || description) && (
        <div className={styles.info}>
          <b>{name}</b>
          {description && <small className={styles.description}>{description}</small>}
        </div>
      )}
    </TileComponent>
  );
}

BaseTile.propTypes = {
  as: PropTypes.elementType,
  className: PropTypes.string,
  name: PropTypes.string,
  description: PropTypes.node,
  children: PropTypes.node,
  tall: PropTypes.bool,
  wide: PropTypes.bool
};

BaseTile.defaultProps = {
  as: "div"
};

function TileAction({ className, children, ...rest }) {
  return (
    <button type="button" className={classNames(styles.tileAction, className)} {...rest}>
      {children}
    </button>
  );
}

TileAction.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node
};

export function CreateTile({ label, type, ...rest }) {
  return (
    <BaseTile className={styles.createTile} wide={type === "scene"} tall={type === "avatar"} {...rest}>
      <div className={styles.createTileContent}>
        <AddIcon width={48} height={48} />
        <p>{label}</p>
      </div>
    </BaseTile>
  );
}

CreateTile.propTypes = {
  label: PropTypes.node,
  type: PropTypes.string
};

export function MediaTile({ entry, processThumbnailUrl, onClick, onEdit, onShowSimilar, onCopy, onInfo, ...rest }) {
  const intl = useIntl();
  const creator = entry.attributions && entry.attributions.creator;
  const publisherName =
    (entry.attributions && entry.attributions.publisher && entry.attributions.publisher.name) ||
    PUBLISHER_FOR_ENTRY_TYPE[entry.type];

  const [thumbnailUrl, thumbnailWidth, thumbnailHeight] = useThumbnail(entry, processThumbnailUrl);

  return (
    <BaseTile
      wide={entry.type === "scene" || entry.type === "scene_listing" || entry.type === "room"}
      tall={entry.type === "avatar" || entry.type === "avatar_listing"}
      name={entry.name}
      description={
        <>
          {creator && creator.name === undefined && <span>{creator}</span>}
          {creator && creator.name && !creator.url && <span>{creator.name}</span>}
          {creator &&
            creator.name &&
            creator.url && (
              <a href={creator.url} target="_blank" rel="noopener noreferrer">
                {creator.name}
              </a>
            )}
          {publisherName && (
            <>
              <a href={entry.url} target="_blank" rel="noopener noreferrer">
                <ExternalLinkIcon /> {publisherName}
              </a>
            </>
          )}
          {entry.last_activated_at && (
            <small>
              <FormattedMessage
                id="media-tile.joined-room"
                defaultMessage="Joined {relativeTime}"
                values={{
                  relativeTime: (
                    <FormattedRelativeTime
                      updateIntervalInSeconds={10}
                      value={(new Date(entry.last_activated_at).getTime() - Date.now()) / 1000}
                    />
                  )
                }}
              />
            </small>
          )}
        </>
      }
      {...rest}
    >
      <a className={styles.thumbnailLink} href={entry.url} rel="noreferrer noopener" onClick={onClick}>
        {entry.images.preview.type === "mp4" ? (
          <video
            muted
            autoPlay
            playsInline
            loop
            src={thumbnailUrl}
            alt={entry.name}
            width={thumbnailWidth}
            height={thumbnailHeight}
          />
        ) : (
          <img src={thumbnailUrl} alt={entry.name} width={thumbnailWidth} height={thumbnailHeight} />
        )}
      </a>
      {entry.favorited && <StarIcon className={styles.favoriteIcon} />}
      {entry.member_count !== undefined && (
        <div className={styles.memberCount}>
          <PeopleIcon /> <span>{entry.member_count}</span>
        </div>
      )}
      <div className={styles.tileActions}>
        {entry.type === "avatar" && (
          <TileAction
            title={intl.formatMessage({ id: "media-tile.action.edit-avatar", defaultMessage: "Edit avatar" })}
            onClick={onEdit}
          >
            <PenIcon />
          </TileAction>
        )}
        {entry.type === "scene" &&
          entry.project_id && (
            <TileAction
              onClick={onEdit}
              title={intl.formatMessage({ id: "media-tile.action.edit-scene", defaultMessage: "Edit scene" })}
            >
              <PenIcon />
            </TileAction>
          )}
        {entry.type === "avatar_listing" && (
          <TileAction
            title={intl.formatMessage({
              id: "media-tile.action.show-similar-avatars",
              defaultMessage: "Show similar avatars"
            })}
            onClick={onShowSimilar}
          >
            <SearchIcon />
          </TileAction>
        )}
        {entry.type === "avatar_listing" &&
          entry.allow_remixing && (
            <TileAction
              title={intl.formatMessage({
                id: "media-tile.action.copy-avatar",
                defaultMessage: "Copy to my avatars"
              })}
              onClick={onCopy}
            >
              <DuplicateIcon />
            </TileAction>
          )}
        {entry.type === "scene_listing" &&
          entry.allow_remixing && (
            <TileAction
              title={intl.formatMessage({
                id: "media-tile.action.copy-scene",
                defaultMessage: "Copy to my scenes"
              })}
              onClick={onCopy}
            >
              <DuplicateIcon />
            </TileAction>
          )}
        {entry.type === "room" &&
          onInfo &&
          entry.description && (
            <TileAction
              title={intl.formatMessage({
                id: "media-tile.action.room-info",
                defaultMessage: "Room info"
              })}
              onClick={onInfo}
            >
              <HelpIcon />
            </TileAction>
          )}
      </div>
    </BaseTile>
  );
}

MediaTile.propTypes = {
  entry: PropTypes.object.isRequired,
  processThumbnailUrl: PropTypes.func,
  onClick: PropTypes.func,
  onEdit: PropTypes.func,
  onShowSimilar: PropTypes.func,
  onCopy: PropTypes.func,
  onInfo: PropTypes.func
};
