import React, { Component } from "react";
import PropTypes from "prop-types";
import { injectIntl, FormattedMessage } from "react-intl";
//import { SCHEMA } from "../storage/store";
import styles from "../assets/stylesheets/media-browser.scss";
import classNames from "classnames";
import hubLogo from "../assets/images/hub-preview-light-no-shadow.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons/faArrowLeft";
import { scaledThumbnailUrlFor } from "../utils/media-utils";

class MediaBrowser extends Component {
  static propTypes = {
    mediaSearchStore: PropTypes.object,
    history: PropTypes.object,
    intl: PropTypes.object
  };

  state = { result: { entries: [] } };

  constructor(props) {
    super(props);
    props.mediaSearchStore.addEventListener("statechanged", this.storeUpdated);
  }

  componentDidMount() {}

  componentWillUnmount() {
    this.props.mediaSearchStore.removeEventListener("statechanged", this.storeUpdated);
  }

  storeUpdated = () => {
    console.log("updated");
    console.log(this.props.mediaSearchStore.result);
    this.setState({ result: this.props.mediaSearchStore.result });
  };

  render() {
    //const { formatMessage } = this.props.intl;

    return (
      <div className={styles.mediaBrowser}>
        <div className={classNames([styles.box, styles.darkened])}>
          <div className={styles.header}>
            <div onClick={() => this.props.history.goBack()} className={styles.back}>
              <i>
                <FontAwesomeIcon icon={faArrowLeft} />
              </i>
              <label>
                <FormattedMessage id="media-browser.back" />
              </label>
            </div>
            <div className={styles.narrowTitle}>
              <FormattedMessage id="media-browser.header-scenes" />
            </div>
            <div className={styles.logo}>
              <img src={hubLogo} />
            </div>
            <div className={styles.help} />
          </div>
          <div className={styles.title}>
            <FormattedMessage id="media-browser.header-scenes" />
          </div>

          <div className={styles.body}>
            <div className={styles.tiles}>{this.state.result.entries.map(this.entryToTile)}</div>
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
