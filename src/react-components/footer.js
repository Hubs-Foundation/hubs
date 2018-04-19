import React, { Component } from "react";
import PropTypes from "prop-types";
import FontAwesomeIcon from "@fortawesome/react-fontawesome";
import faShare from "@fortawesome/fontawesome-free-solid/faShare";
import faUsers from "@fortawesome/fontawesome-free-solid/faUsers";

import styles from "../assets/stylesheets/footer.scss";

export default class Footer extends Component {
  static propTypes = {
    hubName: PropTypes.string,
    participantCount: PropTypes.number
  };
  render() {
    return (
      <div className={styles.container}>
        <div className={styles.hubInfo}>
          <span className={styles.hubName}>{this.props.hubName}</span>
          <button className={styles.shareButton} onClick={this.emitChangeToPrevious}>
            <FontAwesomeIcon icon={faShare} className={styles.shareButtonIcon} />
          </button>
        </div>
        <div className={styles.hubStats}>
          <FontAwesomeIcon icon={faUsers} />
          <span className={styles.hubParticipantCount}>{this.props.participantCount}</span>
        </div>
      </div>
    );
  }
}
