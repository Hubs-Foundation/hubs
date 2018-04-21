import React, { Component } from "react";
import PropTypes from "prop-types";
import MobileDetect from "mobile-detect";
import FontAwesomeIcon from "@fortawesome/react-fontawesome";
import faUsers from "@fortawesome/fontawesome-free-solid/faUsers";
import faEllipsisH from "@fortawesome/fontawesome-free-solid/faEllipsisH";
import faShareAlt from "@fortawesome/fontawesome-free-solid/faShareAlt";
import faExclamation from "@fortawesome/fontawesome-free-solid/faExclamation";
import faTimes from "@fortawesome/fontawesome-free-solid/faTimes";

import styles from "../assets/stylesheets/footer.scss";

const mobiledetect = new MobileDetect(navigator.userAgent);

export default class Footer extends Component {
  static propTypes = {
    hubName: PropTypes.string,
    participantCount: PropTypes.number
  };
  static defaultProps = {
    hubName: "Bobo's Super Test House",
    participantCount: 10
  };
  state = {
    menuVisible: false
  };
  render() {
    const menuVisible = this.state.menuVisible;
    return (
      <div className={styles.container}>
        {mobiledetect.mobile() ? (
          <div className={styles.floatingButton}>
            <button className={styles.menuButton} onClick={() => this.setState({ menuVisible: !menuVisible })}>
              <i className={styles.menuButtonIcon}>
                <FontAwesomeIcon icon={menuVisible ? faTimes : faEllipsisH} />
              </i>
            </button>
          </div>
        ) : (
          <div className={styles.header}>
            <div className={styles.hubInfo}>
              <span className={styles.hubName}>{this.props.hubName}</span>
            </div>
            <button className={styles.menuButton} onClick={() => this.setState({ menuVisible: !menuVisible })}>
              <i className={styles.menuButtonIcon}>
                <FontAwesomeIcon icon={menuVisible ? faTimes : faEllipsisH} />
              </i>
            </button>
            <div className={styles.hubStats}>
              <FontAwesomeIcon icon={faUsers} />
              <span className={styles.hubParticipantCount}>{this.props.participantCount}</span>
            </div>
          </div>
        )}
        {menuVisible && (
          <div className={styles.menu}>
            {mobiledetect.mobile() && (
              <div className={styles.header}>
                <div className={styles.hubInfo}>
                  <span className={styles.hubName}>{this.props.hubName}</span>
                </div>
                <div className={styles.hubStats}>
                  <FontAwesomeIcon icon={faUsers} />
                  <span className={styles.hubParticipantCount}>{this.props.participantCount}</span>
                </div>
              </div>
            )}
            <div className={styles.menuButtons}>
              <button className={styles.menuButton}>
                <i className={styles.menuButtonIcon}>
                  <FontAwesomeIcon icon={faShareAlt} />
                </i>
                <span className={styles.menuButtonText}>
                  <strong>Invite</strong> Others
                </span>
              </button>
              <button className={styles.menuButton}>
                <i className={styles.menuButtonIcon}>
                  <FontAwesomeIcon icon={faExclamation} />
                </i>
                <span className={styles.menuButtonText}>
                  <strong>Report</strong> an Issue
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
}
