import React, { Component } from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUsers } from "@fortawesome/free-solid-svg-icons/faUsers";
import { faBars } from "@fortawesome/free-solid-svg-icons/faBars";
import { faShareAlt } from "@fortawesome/free-solid-svg-icons/faShareAlt";
import { faExclamation } from "@fortawesome/free-solid-svg-icons/faExclamation";
import { faTimes } from "@fortawesome/free-solid-svg-icons/faTimes";
import { faArrowDown } from "@fortawesome/free-solid-svg-icons/faArrowDown";
import { faQuestion } from "@fortawesome/free-solid-svg-icons/faQuestion";
import { faNewspaper } from "@fortawesome/free-solid-svg-icons/faNewspaper";

import styles from "../assets/stylesheets/footer.scss";

export default class Footer extends Component {
  static propTypes = {
    hubName: PropTypes.string,
    occupantCount: PropTypes.number,
    onClickInvite: PropTypes.func,
    onClickReport: PropTypes.func,
    onClickUpdates: PropTypes.func,
    onClickHelp: PropTypes.func
  };
  state = {
    menuVisible: false
  };
  render() {
    const menuVisible = this.state.menuVisible;
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.hubInfo}>
            <span>{this.props.hubName}</span>
          </div>
          <button className={styles.menuButton} onClick={() => this.setState({ menuVisible: !menuVisible })}>
            <i className={styles.menuButtonIcon}>
              <FontAwesomeIcon className={styles.menuButtonNarrowCloseIcon} icon={menuVisible ? faArrowDown : faBars} />
              <FontAwesomeIcon className={styles.menuButtonWideCloseIcon} icon={menuVisible ? faTimes : faBars} />
            </i>
          </button>
          <div className={styles.hubStats}>
            <FontAwesomeIcon icon={faUsers} />
            <span className={styles.hubParticipantCount}>{this.props.occupantCount || "-"}</span>
          </div>
        </div>
        {menuVisible && (
          <div className={styles.menu}>
            <div className={styles.menuHeader}>
              <div className={styles.hubInfo}>
                <span>{this.props.hubName}</span>
              </div>
              <div className={styles.hubStats}>
                <FontAwesomeIcon icon={faUsers} />
                <span className={styles.hubParticipantCount}>{this.props.occupantCount || "-"}</span>
              </div>
            </div>
            <div className={styles.menuButtons}>
              <button className={styles.menuButton} onClick={this.props.onClickInvite}>
                <i className={styles.menuButtonIcon}>
                  <FontAwesomeIcon icon={faShareAlt} />
                </i>
                <span className={styles.menuButtonText}>
                  <strong>Invite</strong> Friends
                </span>
              </button>
              <button className={styles.menuButton} onClick={this.props.onClickHelp}>
                <i className={styles.menuButtonIcon}>
                  <FontAwesomeIcon icon={faQuestion} />
                </i>
                <span className={styles.menuButtonText}>
                  <strong>Learn</strong> the Basics
                </span>
              </button>
              <button className={styles.menuButton} onClick={this.props.onClickUpdates}>
                <i className={styles.menuButtonIcon}>
                  <FontAwesomeIcon icon={faNewspaper} />
                </i>
                <span className={styles.menuButtonText}>
                  <strong>Sign Up</strong> for Updates
                </span>
              </button>
              <button className={styles.menuButton} onClick={this.props.onClickReport}>
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
