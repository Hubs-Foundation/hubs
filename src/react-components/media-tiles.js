import React, { Component } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import dayjs from "dayjs-ext";
import relativeTime from "dayjs-ext/plugin/relativeTime";
import { FormattedMessage } from "react-intl";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleLeft } from "@fortawesome/free-solid-svg-icons/faAngleLeft";
import { faAngleRight } from "@fortawesome/free-solid-svg-icons/faAngleRight";
import { faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons/faExternalLinkAlt";
import { faPencilAlt } from "@fortawesome/free-solid-svg-icons/faPencilAlt";
import { faPlus } from "@fortawesome/free-solid-svg-icons/faPlus";

import styles from "../assets/stylesheets/media-browser.scss";
import { scaledThumbnailUrlFor } from "../utils/media-url-utils";
import StateLink from "./state-link";

dayjs.extend(relativeTime);

const PUBLISHER_FOR_ENTRY_TYPE = {
  sketchfab_model: "Sketchfab",
  poly_model: "Google Poly",
  twitch_stream: "Twitch"
};

class MediaTiles extends Component {
  static propTypes = {
    result: PropTypes.object,
    history: PropTypes.object,
    urlSource: PropTypes.string,
    handleEntryClicked: PropTypes.func,
    handlePager: PropTypes.func
  };

  render() {
    const { urlSource, result } = this.props;
    const entries = (result && result.entries) || [];
    const [createTileWidth, createTileHeight] = this.getTileDimensions(false, urlSource === "avatars");
    const searchParams = new URLSearchParams((this.props.history ? this.props.history.location : location).search);
    const hasMeta = !!(result && result.meta);
    const apiSource = (hasMeta && result.meta.source) || null;
    const isVariableWidth = result && ["bing_images", "tenor"].includes(apiSource);
    const hasNext = !!(hasMeta && result.meta.next_cursor) || false;
    const hasPrevious = searchParams.get("cursor");

    return (
      <div className={styles.body}>
        <div className={classNames({ [styles.tiles]: true, [styles.tilesVariable]: isVariableWidth })}>
          {(urlSource === "avatars" || urlSource === "scenes") && (
            <div
              style={{ width: `${createTileWidth}px`, height: `${createTileHeight}px` }}
              className={classNames(styles.tile, styles.createTile)}
            >
              {urlSource === "scenes" ? (
                <a href="/spoke/new" rel="noopener noreferrer" target="_blank" className={styles.tileLink}>
                  <div className={styles.tileContent}>
                    <FontAwesomeIcon icon={faPlus} />
                    <FormattedMessage id="media-browser.create-scene" />
                  </div>
                </a>
              ) : (
                <a
                  onClick={e => {
                    e.preventDefault();
                    window.dispatchEvent(new CustomEvent("action_create_avatar"));
                  }}
                  className={styles.tileLink}
                >
                  <div className={styles.tileContent}>
                    <FontAwesomeIcon icon={faPlus} />
                    <FormattedMessage id="media-browser.create-avatar" />
                  </div>
                </a>
              )}
            </div>
          )}

          {entries.map(this.entryToTile)}
        </div>

        {result &&
          (hasNext || hasPrevious) &&
          this.props.handlePager && (
            <div className={styles.pager}>
              <a
                className={classNames({ [styles.previousPage]: true, [styles.pagerButtonDisabled]: !hasPrevious })}
                onClick={() => this.props.handlePager(-1)}
              >
                <FontAwesomeIcon icon={faAngleLeft} />
              </a>
              <div className={styles.pageNumber}>{result.meta.page}</div>
              <a
                className={classNames({ [styles.nextPage]: true, [styles.pagerButtonDisabled]: !hasNext })}
                onClick={() => this.props.handlePager(1)}
              >
                <FontAwesomeIcon icon={faAngleRight} />
              </a>
            </div>
          )}
      </div>
    );
  }

  getTileDimensions = (isImage, isAvatar, imageAspect) => {
    // Doing breakpointing here, so we can have proper image placeholder based upon dynamic aspect ratio
    const clientWidth = window.innerWidth;
    let imageHeight = clientWidth < 1079 ? (clientWidth < 768 ? (clientWidth < 400 ? 85 : 100) : 150) : 200;
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
  };

  entryToTile = (entry, idx) => {
    const imageSrc = entry.images.preview.url;
    const creator = entry.attributions && entry.attributions.creator;
    const isImage = entry.type.endsWith("_image");
    const isAvatar = ["avatar", "avatar_listing"].includes(entry.type);
    const isHub = ["hub"].includes(entry.type);
    const imageAspect = entry.images.preview.width / entry.images.preview.height;

    const [imageWidth, imageHeight] = this.getTileDimensions(isImage, isAvatar, imageAspect);

    const publisherName =
      (entry.attributions && entry.attributions.publisher && entry.attributions.publisher.name) ||
      PUBLISHER_FOR_ENTRY_TYPE[entry.type];

    return (
      <div style={{ width: `${imageWidth}px` }} className={styles.tile} key={`${entry.id}_${idx}`}>
        <a
          href={entry.url}
          rel="noreferrer noopener"
          onClick={e => this.props.handleEntryClicked && this.props.handleEntryClicked(e, entry)}
          className={styles.tileLink}
          style={{ width: `${imageWidth}px`, height: `${imageHeight}px` }}
        >
          <img
            className={classNames(styles.tileContent, styles.avatarTile)}
            src={scaledThumbnailUrlFor(imageSrc, imageWidth, imageHeight)}
          />
        </a>
        {entry.type === "avatar" && (
          <StateLink
            className={styles.editAvatar}
            stateKey="overlay"
            stateValue="avatar-editor"
            stateDetail={{ avatarId: entry.id }}
            history={this.props.history}
          >
            <FontAwesomeIcon icon={faPencilAlt} />
          </StateLink>
        )}
        {!entry.type.endsWith("_image") && (
          <div className={styles.info}>
            <a
              href={entry.url}
              rel="noreferrer noopener"
              className={styles.name}
              onClick={e => this.props.handleEntryClicked && this.props.handleEntryClicked(e, entry)}
            >
              {entry.name || "\u00A0"}
            </a>
            {!isAvatar &&
              !isHub && (
                <div className={styles.attribution}>
                  <div className={styles.creator}>
                    {creator && creator.name === undefined && <span>{creator}</span>}
                    {creator && creator.name && !creator.url && <span>{creator.name}</span>}
                    {creator &&
                      creator.name &&
                      creator.url && (
                        <a href={creator.url} target="_blank" rel="noopener noreferrer">
                          {creator.name}
                        </a>
                      )}
                  </div>
                  {publisherName && (
                    <div className={styles.publisher}>
                      <i>
                        <FontAwesomeIcon icon={faExternalLinkAlt} />
                      </i>
                      &nbsp;<a href={entry.url} target="_blank" rel="noopener noreferrer">
                        {publisherName}
                      </a>
                    </div>
                  )}
                </div>
              )}
            {isHub && (
              <div className={styles.attribution}>
                <div className={styles.lastJoined}>
                  <FormattedMessage id="media-browser.hub.joined-prefix" />
                  {dayjs(entry.last_activated_at).fromNow()}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };
}
export default MediaTiles;
