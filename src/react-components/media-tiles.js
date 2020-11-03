import React, { Component } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import dayjs from "dayjs-ext";
import relativeTime from "dayjs-ext/plugin/relativeTime";
import { injectIntl, FormattedMessage } from "react-intl";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleLeft } from "@fortawesome/free-solid-svg-icons/faAngleLeft";
import { faAngleRight } from "@fortawesome/free-solid-svg-icons/faAngleRight";
import { faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons/faExternalLinkAlt";
import { faPencilAlt } from "@fortawesome/free-solid-svg-icons/faPencilAlt";
import { faInfo } from "@fortawesome/free-solid-svg-icons/faInfo";
import { faClone } from "@fortawesome/free-solid-svg-icons/faClone";
import { faPlus } from "@fortawesome/free-solid-svg-icons/faPlus";
import { faSearch } from "@fortawesome/free-solid-svg-icons/faSearch";
import { faUsers } from "@fortawesome/free-solid-svg-icons/faUsers";
import { faStar } from "@fortawesome/free-solid-svg-icons/faStar";

import IfFeature from "./if-feature";
import styles from "../assets/stylesheets/media-browser.scss";
import { proxiedUrlFor, scaledThumbnailUrlFor } from "../utils/media-url-utils";
import StateLink from "./state-link";
import { remixAvatar } from "../utils/avatar-utils";
import { fetchReticulumAuthenticated } from "../utils/phoenix-utils";
import { getReticulumFetchUrl } from "../utils/phoenix-utils";

dayjs.extend(relativeTime);

const PUBLISHER_FOR_ENTRY_TYPE = {
  sketchfab_model: "Sketchfab",
  poly_model: "Google Poly",
  twitch_stream: "Twitch"
};

// TODO: Migrate to use MediaGrid and media specific components like RoomTile
class MediaTiles extends Component {
  static propTypes = {
    intl: PropTypes.object,
    entries: PropTypes.array,
    hasNext: PropTypes.bool,
    hasPrevious: PropTypes.bool,
    isVariableWidth: PropTypes.bool,
    history: PropTypes.object,
    urlSource: PropTypes.string,
    handleEntryClicked: PropTypes.func,
    handleEntryInfoClicked: PropTypes.func,
    handlePager: PropTypes.func,
    onCopyAvatar: PropTypes.func,
    onCopyScene: PropTypes.func,
    onShowSimilar: PropTypes.func
  };

  handleCopyAvatar = async (e, entry) => {
    e.preventDefault();
    await remixAvatar(entry.id, entry.name);
    this.props.onCopyAvatar();
  };

  handleCopyScene = async (e, entry) => {
    e.preventDefault();
    await fetchReticulumAuthenticated("/api/v1/scenes", "POST", {
      parent_scene_id: entry.id
    });
    this.props.onCopyScene();
  };

  render() {
    const { urlSource, hasNext, hasPrevious, isVariableWidth } = this.props;
    const entries = this.props.entries || [];
    const [createTileWidth, createTileHeight] = this.getTileDimensions(false, urlSource === "avatars");

    return (
      <div className={styles.body}>
        <div className={classNames({ [styles.tiles]: true, [styles.tilesVariable]: isVariableWidth })}>
          {(urlSource === "avatars" || urlSource === "scenes") && (
            <div
              style={{ width: `${createTileWidth}px`, height: `${createTileHeight}px` }}
              className={classNames({
                [styles.tile]: true,
                [styles.createTile]: true,
                [styles.createAvatarTile]: urlSource === "avatars"
              })}
            >
              {urlSource === "scenes" ? (
                <IfFeature name="enable_spoke">
                  <a href="/spoke/new" rel="noopener noreferrer" target="_blank" className={styles.tileLink}>
                    <div className={styles.tileContent}>
                      <FontAwesomeIcon icon={faPlus} />
                      <FormattedMessage id="media-browser.create-scene" />
                    </div>
                  </a>
                </IfFeature>
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

        {(hasNext || hasPrevious) &&
          this.props.handlePager && (
            <div className={styles.pager}>
              <a
                className={classNames({ [styles.previousPage]: true, [styles.pagerButtonDisabled]: !hasPrevious })}
                onClick={() => this.props.handlePager(-1)}
              >
                <FontAwesomeIcon icon={faAngleLeft} />
              </a>
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
    const isHub = ["room"].includes(entry.type);
    const imageAspect = entry.images.preview.width / entry.images.preview.height;

    const [imageWidth, imageHeight] = this.getTileDimensions(isImage, isAvatar, imageAspect);

    // Inline mp4s directly since far/nearspark cannot resize them.
    const thumbnailElement =
      entry.images.preview.type === "mp4" ? (
        <video
          className={classNames(styles.tileContent, styles.avatarTile)}
          style={{ width: `${imageWidth}px`, height: `${imageHeight}px` }}
          muted
          autoPlay
          playsInline
          loop
          src={proxiedUrlFor(imageSrc)}
        />
      ) : (
        <img
          className={classNames(styles.tileContent, styles.avatarTile)}
          style={{ width: `${imageWidth}px`, height: `${imageHeight}px` }}
          src={scaledThumbnailUrlFor(imageSrc, imageWidth, imageHeight)}
        />
      );

    const publisherName =
      (entry.attributions && entry.attributions.publisher && entry.attributions.publisher.name) ||
      PUBLISHER_FOR_ENTRY_TYPE[entry.type];

    const { formatMessage } = this.props.intl;

    return (
      <div style={{ width: `${imageWidth}px` }} className={styles.tile} key={`${entry.id}_${idx}`}>
        <a
          href={entry.url}
          rel="noreferrer noopener"
          onClick={e => this.props.handleEntryClicked && this.props.handleEntryClicked(e, entry)}
          className={styles.tileLink}
          style={{ width: `${imageWidth}px`, height: `${imageHeight}px` }}
        >
          {thumbnailElement}
        </a>
        <div className={styles.tileActions}>
          {entry.type === "avatar" && (
            <StateLink
              stateKey="overlay"
              stateValue="avatar-editor"
              stateDetail={{ avatarId: entry.id }}
              history={this.props.history}
              title="Edit"
            >
              <FontAwesomeIcon icon={faPencilAlt} />
            </StateLink>
          )}
          {entry.type === "avatar_listing" && (
            <a
              onClick={e => {
                e.preventDefault();
                this.props.onShowSimilar(entry.id, entry.name);
              }}
              title="Show Similar"
            >
              <FontAwesomeIcon icon={faSearch} />
            </a>
          )}
          {entry.type === "avatar_listing" &&
            entry.allow_remixing && (
              <a onClick={e => this.handleCopyAvatar(e, entry)} title="Copy to my avatars">
                <FontAwesomeIcon icon={faClone} />
              </a>
            )}
          {entry.type === "scene_listing" &&
            entry.allow_remixing && (
              <a onClick={e => this.handleCopyScene(e, entry)} title="Copy to my scenes">
                <FontAwesomeIcon icon={faClone} />
              </a>
            )}
          {entry.type === "scene" &&
            entry.project_id && (
              <a
                target="_blank"
                rel="noopener noreferrer"
                href={getReticulumFetchUrl(`/spoke/projects/${entry.project_id}`)}
                title={formatMessage({ id: "scene.edit_button" })}
              >
                <FontAwesomeIcon icon={faPencilAlt} />
              </a>
            )}
          {entry.type === "room" &&
            this.props.handleEntryInfoClicked &&
            entry.description && (
              <a
                title="room info"
                onClick={e => {
                  e.preventDefault();
                  this.props.handleEntryInfoClicked(entry);
                }}
              >
                <FontAwesomeIcon icon={faInfo} />
              </a>
            )}
        </div>

        {entry.favorited && (
          <div className={styles.favorite}>
            <FontAwesomeIcon icon={faStar} />
          </div>
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
              <>
                <div className={styles.attribution}>
                  <div className={styles.lastJoined}>
                    <FormattedMessage id="media-browser.hub.joined-prefix" />
                    {dayjs(entry.last_activated_at).fromNow()}
                  </div>
                </div>
                <div className={styles.presence}>
                  <FontAwesomeIcon icon={faUsers} />
                  <span>{entry.member_count}</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    );
  };
}
export default injectIntl(MediaTiles);
