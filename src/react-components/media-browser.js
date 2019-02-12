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
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

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
    const hasNext = !!this.state.result.meta.next_cursor;
    const hasPrevious = true;
    const flowResult = this.state.result && ["bing_images", "tenor"].includes(this.state.result.meta.source);

    return (
      <div className={styles.mediaBrowser} ref={browserDiv => (this.browserDiv = browserDiv)}>
        <div className={classNames([styles.box, styles.darkened])}>
          <div className={styles.header}>
            <div className={styles.headerLeft} />
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
              <a onClick={() => this.close()}>
                <span>×</span>
              </a>
            </div>
          </div>

          <div className={styles.body}>
            {this.state.result && (
              <div className={classNames({ [styles.tiles]: !flowResult, [styles.flowTiles]: flowResult })}>
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
    const isFlowImage = ["bing_image", "tenor_image"].includes(entry.type);

    // Doing breakpointing here, so we can have proper image placeholder based upon dynamic aspect ratio
    const clientWidth = window.innerWidth;
    const imageHeight = clientWidth < 1079 ? (clientWidth < 321 ? 100 : 125) : 285;
    const imageAspect = entry.images.preview.width / entry.images.preview.height;
    const imageWidth = Math.floor(isFlowImage ? imageAspect * imageHeight : 244);

    return (
      <div onClick={() => this.handleEntryClicked(entry)} className={styles.tile} key={`${entry.id}_${idx}`}>
        <div className={styles.image} style={{ width: `${imageWidth}px`, height: `${imageHeight}px` }}>
          <img src={scaledThumbnailUrlFor(imageSrc, imageWidth, imageHeight)} />
        </div>
        {!entry.type.endsWith("_image") && (
          <div className={styles.info}>
            <div className={styles.name}>{entry.name}</div>
            {creator &&
              !creator.name && (
                <div className={styles.creator}>
                  <FormattedMessage id="media-browser.creator-prefix" />
                  &nbsp;{creator}
                </div>
              )}
            {creator &&
              creator.name && (
                <div className={styles.creator}>
                  <FormattedMessage id="media-browser.creator-prefix" />
                  &nbsp;<a href={creator.url} target="_blank" rel="noopener noreferrer">
                    {creator.name}
                  </a>
                </div>
              )}
          </div>
        )}
      </div>
    );
  };
}

export default injectIntl(MediaBrowser);
