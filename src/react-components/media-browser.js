import React, { Component } from "react";
import PropTypes from "prop-types";
import { injectIntl, FormattedMessage } from "react-intl";
//import { SCHEMA } from "../storage/store";
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
    const hasNext = this.state.result && this.state.result.meta.page < this.state.result.meta.total_pages;

    const hasPrevious = this.state.result && this.state.result.meta.page > 1;

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
    const imageSrc = entry.images.preview;

    const creator = entry.attributions && entry.attributions.creator;

    return (
      <div onClick={() => this.handleEntryClicked(entry)} className={styles.tile} key={`${entry.id}_${idx}`}>
        <div className={styles.image}>
          <img src={scaledThumbnailUrlFor(imageSrc, 244, 350)} />
        </div>
        <div className={styles.info}>
          <div className={styles.name}>{entry.name}</div>
          {creator && (
            <div className={styles.creator}>
              <FormattedMessage id="media-browser.creator-prefix" />
              &nbsp;{creator}
            </div>
          )}
        </div>
      </div>
    );
  };
}

export default injectIntl(MediaBrowser);
