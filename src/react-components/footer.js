import React, { Component } from "react";
import PropTypes from "prop-types";
import FontAwesomeIcon from "@fortawesome/react-fontawesome";
import faEllipsisH from "@fortawesome/fontawesome-free-solid/faEllipsisH";
import faShareAlt from "@fortawesome/fontawesome-free-solid/faShareAlt";
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
        </div>
        <div className={styles.menu}>
          <button className={styles.menuButton}>
            <FontAwesomeIcon icon={faEllipsisH} className={styles.menuButtonIcon} />
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
