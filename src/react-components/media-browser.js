import React, { Component } from "react";
import PropTypes from "prop-types";
import { injectIntl, FormattedMessage } from "react-intl";
import styles from "../assets/stylesheets/media-browser.scss";
import classNames from "classnames";
import { scaledThumbnailUrlFor } from "../utils/media-utils";
import { pushHistoryPath } from "../utils/history";
import { faAngleLeft } from "@fortawesome/free-solid-svg-icons/faAngleLeft";
import { faAngleRight } from "@fortawesome/free-solid-svg-icons/faAngleRight";
import { faSearch } from "@fortawesome/free-solid-svg-icons/faSearch";
import { faPlus } from "@fortawesome/free-solid-svg-icons/faPlus";
import { faTimes } from "@fortawesome/free-solid-svg-icons/faTimes";
import { faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons/faExternalLinkAlt";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const PUBLISHER_FOR_ENTRY_TYPE = {
  sketchfab_model: "Sketchfab",
  poly_model: "Google Poly",
  twitch_stream: "Twitch"
};

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

  close = () => {
    const location = this.props.history.location;
    const searchParams = new URLSearchParams(location.search);

    // Strip browsing query params
    searchParams.delete("q");
    searchParams.delete("filter");
    searchParams.delete("page");

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
    const hasPrevious = true;

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
                    id: `media-browser.search-placeholder.${this.state.result ? this.state.result.meta.source : "base"}`
                  })}
                  value={this.state.query}
                  onChange={e => this.handleQueryUpdated(e.target.value)}
                />
              </div>
            </div>
            <div className={styles.headerRight}>
              <a onClick={() => this.showCreateObject()} className={styles.createButton}>
                <i>
                  <FontAwesomeIcon icon={faPlus} />
                </i>
              </a>
              <a onClick={() => this.showCreateObject()} className={styles.createLink}>
                <FormattedMessage
                  id={`media-browser.add_custom_${
                    this.state.result && this.state.result.meta.source === "scene_listings" ? "scene" : "object"
                  }`}
                />
              </a>
            </div>
          </div>

          <div className={styles.body}>
            {this.state.result && <div className={styles.tiles}>{this.state.result.entries.map(this.entryToTile)}</div>}

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
    const imageHeight = clientWidth < 1079 ? (clientWidth < 768 ? 75 : 150) : 200;

    // Aspect ratio can vary per image if its an image result, o/w assume 720p
    const imageAspect = isImage ? entry.images.preview.width / entry.images.preview.height : 16.0 / 9.0;
    const imageWidth = Math.floor(imageAspect * imageHeight);

    const publisherName =
      (entry.attributions.publisher && entry.attributions.publisher.url) || PUBLISHER_FOR_ENTRY_TYPE[entry.type];

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
