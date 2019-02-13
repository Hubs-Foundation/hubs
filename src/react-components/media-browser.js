import React, { Component } from "react";
import PropTypes from "prop-types";
import { injectIntl, FormattedMessage } from "react-intl";
import styles from "../assets/stylesheets/media-browser.scss";
import classNames from "classnames";
import { scaledThumbnailUrlFor } from "../utils/media-utils";
import { pushHistoryPath, pushHistoryState } from "../utils/history";
import { faAngleLeft } from "@fortawesome/free-solid-svg-icons/faAngleLeft";
import { faAngleRight } from "@fortawesome/free-solid-svg-icons/faAngleRight";
import { faSearch } from "@fortawesome/free-solid-svg-icons/faSearch";
import { faCloudUploadAlt } from "@fortawesome/free-solid-svg-icons/faCloudUploadAlt";
import { faTimes } from "@fortawesome/free-solid-svg-icons/faTimes";
import { faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons/faExternalLinkAlt";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const PUBLISHER_FOR_ENTRY_TYPE = {
  sketchfab_model: "Sketchfab",
  poly_model: "Google Poly",
  twitch_stream: "Twitch"
};

const PRIVACY_POLICY_LINKS = {
  videos: "https://privacy.microsoft.com/en-us/privacystatement",
  images: "https://privacy.microsoft.com/en-us/privacystatement",
  gifs: "https://tenor.com/legal-privacy",
  sketchfab: "https://sketchfab.com/privacy",
  poly: "https://sketchfab.com/privacy",
  twitch: "https://www.twitch.tv/p/legal/privacy-policy/"
};

const SOURCES = ["videos", "images", "gifs", "scenes", "sketchfab", "poly", "twitch"];

const TEST_FACETS = [];

class MediaBrowser extends Component {
  static propTypes = {
    mediaSearchStore: PropTypes.object,
    history: PropTypes.object,
    intl: PropTypes.object,
    onMediaSearchResultEntrySelected: PropTypes.func
  };

  state = { query: "" };

  constructor(props) {
    super(props);
    props.mediaSearchStore.addEventListener("statechanged", this.storeUpdated);

    const searchParams = new URLSearchParams(props.history.location.search);

    this.state = {
      result: this.props.mediaSearchStore.result,
      query: searchParams.get("q") || ""
    };
  }

  componentDidMount() {}

  componentWillUnmount() {
    this.props.mediaSearchStore.removeEventListener("statechanged", this.storeUpdated);
  }

  storeUpdated = () => {
    this.setState({ result: this.props.mediaSearchStore.result });
  };

  handleQueryUpdated = query => {
    this.setState({ result: null });

    if (this._sendQueryTimeout) {
      clearTimeout(this._sendQueryTimeout);
    }

    // Don't update search on every keystroke, but buffer for some ms.
    this._sendQueryTimeout = setTimeout(() => {
      // Drop filter for now, so entering text drops into "search all" mode
      this.props.mediaSearchStore.filterQueryNavigate("", query);
    }, 500);

    this.setState({ query });
  };

  handleEntryClicked = entry => {
    if (!this.props.onMediaSearchResultEntrySelected) return;
    this.props.onMediaSearchResultEntrySelected(entry);
    this.close();
  };

  handleSourceClicked = source => {
    const location = this.props.history.location;
    const searchParams = new URLSearchParams(location.search);
    const currentQuery = searchParams.get("q");

    const newSearchParams = this.getSearchClearedSearchParams();
    if (currentQuery) {
      newSearchParams.set("q", currentQuery);
    }

    pushHistoryPath(this.props.history, `/media/${source}`, newSearchParams.toString());
  };

  getSearchClearedSearchParams = () => {
    const location = this.props.history.location;
    const searchParams = new URLSearchParams(location.search);

    // Strip browsing query params
    searchParams.delete("q");
    searchParams.delete("filter");
    searchParams.delete("cursor");

    return searchParams;
  };

  showCreateObject = () => {
    const searchParams = this.getSearchClearedSearchParams();
    pushHistoryPath(this.props.history, "/", searchParams.toString());
    pushHistoryState(this.props.history, "modal", "create");
  };

  close = () => {
    const searchParams = this.getSearchClearedSearchParams();
    pushHistoryPath(this.props.history, "/", searchParams.toString());
  };

  handlePager = delta => {
    this.setState({ result: null });
    this.props.mediaSearchStore.pageNavigate(delta);
    this.browserDiv.scrollTop = 0;
  };

  render() {
    const { formatMessage } = this.props.intl;
    const hasNext = this.state.result && !!this.state.result.meta.next_cursor;
    const searchParams = new URLSearchParams(this.props.history.location.search);
    const hasPrevious = searchParams.get("cursor");
    const urlSource = this.props.history.location.pathname.substring(7);
    const apiSource = this.state.result && this.state.result.meta.source;
    const isVariable = this.state.result && ["bing_images", "tenor"].includes(apiSource);

    return (
      <div className={styles.mediaBrowser} ref={browserDiv => (this.browserDiv = browserDiv)}>
        <div className={classNames([styles.box, styles.darkened])}>
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <a onClick={() => this.close()}>
                <i>
                  <FontAwesomeIcon icon={faTimes} />
                </i>
              </a>
            </div>
            <div className={styles.headerCenter}>
              <div className={styles.search}>
                <i>
                  <FontAwesomeIcon icon={faSearch} />
                </i>
                <input
                  type="text"
                  placeholder={formatMessage({
                    id: `media-browser.search-placeholder.${urlSource}`
                  })}
                  value={this.state.query}
                  onChange={e => this.handleQueryUpdated(e.target.value)}
                />
              </div>
              <div className={styles.engineAttribution}>
                {urlSource !== "scenes" && (
                  <div className={styles.engineAttributionContents}>
                    <FormattedMessage id={`media-browser.powered_by.${urlSource}`} />
                    {PRIVACY_POLICY_LINKS[urlSource] && (
                      <a href={PRIVACY_POLICY_LINKS[urlSource]} target="_blank" rel="noreferrer noopener">
                        <FormattedMessage id="media-browser.privacy_policy" />
                      </a>
                    )}
                  </div>
                )}
                {urlSource === "scenes" && (
                  <div className={styles.engineAttributionContents}>
                    <FormattedMessage id={`media-browser.powered_by.${urlSource}`} />
                    <a href="/spoke" target="_blank" rel="noreferrer noopener">
                      <FormattedMessage id="media-browser.spoke" />
                    </a>
                  </div>
                )}
              </div>
            </div>
            <div className={styles.headerRight}>
              <a onClick={() => this.showCreateObject()} className={styles.createButton}>
                <i>
                  <FontAwesomeIcon icon={faCloudUploadAlt} />
                </i>
              </a>
              <a onClick={() => this.showCreateObject()} className={styles.createLink}>
                <FormattedMessage
                  id={`media-browser.add_custom_${
                    this.state.result && apiSource === "scene_listings" ? "scene" : "object"
                  }`}
                />
              </a>
            </div>
          </div>

          <div className={styles.nav}>
            {SOURCES.map(s => (
              <a
                onClick={() => this.handleSourceClicked(s)}
                key={s}
                className={classNames({ [styles.navSource]: true, [styles.navSourceSelected]: urlSource === s })}
              >
                <FormattedMessage id={`media-browser.nav_title.${s}`} />
              </a>
            ))}
            <div className={styles.navRightPad}>&nbsp;</div>
            <div className={styles.navScrollArrow}>
              <FontAwesomeIcon icon={faAngleRight} />
            </div>
          </div>

          <div className={styles.body}>
            {this.state.result && (
              <div className={classNames({ [styles.tiles]: true, [styles.tilesVariable]: isVariable })}>
                {this.state.result.entries.map(this.entryToTile)}
              </div>
            )}

            {this.state.result &&
              (hasNext || hasPrevious) && (
                <div className={styles.pager}>
                  <a
                    className={classNames({ [styles.previousPage]: true, [styles.pagerButtonDisabled]: !hasPrevious })}
                    onClick={() => this.handlePager(-1)}
                  >
                    <FontAwesomeIcon icon={faAngleLeft} />
                  </a>
                  <div className={styles.pageNumber}>{this.state.result.meta.page}</div>
                  <a
                    className={classNames({ [styles.nextPage]: true, [styles.pagerButtonDisabled]: !hasNext })}
                    onClick={() => this.handlePager(1)}
                  >
                    <FontAwesomeIcon icon={faAngleRight} />
                  </a>
                </div>
              )}
          </div>
        </div>
      </div>
    );
  }

  entryToTile = (entry, idx) => {
    const imageSrc = entry.images.preview.url;
    const creator = entry.attributions && entry.attributions.creator;
    const isImage = entry.type.endsWith("_image");

    // Doing breakpointing here, so we can have proper image placeholder based upon dynamic aspect ratio
    const clientWidth = window.innerWidth;
    const imageHeight = clientWidth < 1079 ? (clientWidth < 768 ? (clientWidth < 400 ? 85 : 100) : 150) : 200;

    // Aspect ratio can vary per image if its an image result, o/w assume 720p
    const imageAspect = isImage ? entry.images.preview.width / entry.images.preview.height : 16.0 / 9.0;
    const imageWidth = Math.floor(Math.max(imageAspect * imageHeight, imageHeight * 0.85));

    const publisherName =
      (entry.attributions.publisher && entry.attributions.publisher.name) || PUBLISHER_FOR_ENTRY_TYPE[entry.type];

    return (
      <div style={{ width: `${imageWidth}px` }} className={styles.tile} key={`${entry.id}_${idx}`}>
        <div
          onClick={() => this.handleEntryClicked(entry)}
          className={styles.image}
          style={{ width: `${imageWidth}px`, height: `${imageHeight}px` }}
        >
          <img src={scaledThumbnailUrlFor(imageSrc, imageWidth, imageHeight)} />
        </div>
        {!entry.type.endsWith("_image") && (
          <div className={styles.info}>
            <div className={styles.name} onClick={() => this.handleEntryClicked(entry)}>
              {entry.name}
            </div>
            <div className={styles.attribution}>
              <div className={styles.creator}>
                {creator && !creator.name && <span>{creator}</span>}
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
          </div>
        )}
      </div>
    );
  };
}

export default injectIntl(MediaBrowser);
