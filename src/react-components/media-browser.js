import React, { Component } from "react";
import PropTypes from "prop-types";
import { injectIntl, FormattedMessage } from "react-intl";
//import { SCHEMA } from "../storage/store";
import styles from "../assets/stylesheets/media-browser.scss";
import classNames from "classnames";
import hubLogo from "../assets/images/hub-preview-light-no-shadow.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons/faArrowLeft";

class MediaBrowser extends Component {
  static propTypes = {
    result: PropTypes.object,
    history: PropTypes.object,
    intl: PropTypes.object
  };

  constructor(props) {
    super(props);
  }

  componentDidMount() {}

  componentWillUnmount() {}

  render() {
    const { formatMessage } = this.props.intl;

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
        </div>
      </div>
    );
  }
}

export default injectIntl(MediaBrowser);
