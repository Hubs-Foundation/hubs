import React, { Component } from "react";
import PropTypes from "prop-types";
import { injectIntl, FormattedMessage } from "react-intl";
//import { SCHEMA } from "../storage/store";
import styles from "../assets/stylesheets/media-browser.scss";
import classNames from "classnames";
import hubLogo from "../assets/images/hub-preview-light-no-shadow.png";
import { scaledThumbnailUrlFor } from "../utils/media-utils";
import { pushHistoryPath } from "../utils/history";

class MediaBrowser extends Component {
  static propTypes = {
    mediaSearchStore: PropTypes.object,
    history: PropTypes.object,
    intl: PropTypes.object
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
    if (this._sendQueryTimeout) {
      clearTimeout(this._sendQueryTimeout);
    }

    this._sendQueryTimeout = setTimeout(() => {
      // Drop filter for now, so entering text drops into "search all" mode
      this.props.mediaSearchStore.filterQueryNavigate("", query);
    }, 500);

    this.setState({ query });
  };

  render() {
    //const { formatMessage } = this.props.intl;
    const hasNext = this.state.result && this.state.result.meta.page < this.state.result.meta.total_pages;

    const hasPrevious = this.state.result && this.state.result.meta.page > 1;

    return (
      <div className={styles.mediaBrowser}>
        <div className={classNames([styles.box, styles.darkened])}>
          <div className={styles.header}>
            <div className={styles.headerLeft} />
            <div className={styles.narrowTitle}>
              <FormattedMessage id="media-browser.header-scenes" />
            </div>
            <div className={styles.logo}>
              <img src={hubLogo} />
            </div>
            <div className={styles.headerRight}>
              <button onClick={() => pushHistoryPath(this.props.history, "/")}>
                <span>×</span>
              </button>
            </div>
          </div>
          <div className={styles.title}>
            <FormattedMessage id="media-browser.header-scenes" />
          </div>

          <div className={styles.body}>
            <div className={styles.pager}>
              {hasPrevious && <a onClick={() => this.props.mediaSearchStore.pageNavigate(-1)}>Previous</a>}
              {hasNext && <a onClick={() => this.props.mediaSearchStore.pageNavigate(1)}>Next</a>}
            </div>
            <input
              type="text"
              placeholder="Search"
              value={this.state.query}
              onChange={e => this.handleQueryUpdated(e.target.value)}
              required
            />
            <div className={styles.tiles}>{this.state.result && this.state.result.entries.map(this.entryToTile)}</div>
          </div>
        </div>
      </div>
    );
  }

  entryToTile = (entry, idx) => {
    const imageSrc = entry.images.preview;

    const creator = entry.attributions && entry.attributions.creator;

    return (
      <div className={styles.tile} key={`${entry.id}_${idx}`}>
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
