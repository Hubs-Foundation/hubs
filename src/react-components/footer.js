import React, { Component } from "react";
import PropTypes from "prop-types";
import FontAwesomeIcon from "@fortawesome/react-fontawesome";
import faAngleLeft from "@fortawesome/fontawesome-free-solid/faAngleLeft";

import styles from "../assets/stylesheets/footer.css";

export default class Footer extends Component {
  static propTypes = {
    hubName: PropTypes.string,
    participantCount: PropTypes.number
  };
  render() {
    return (
      <div className={styles.container}>
        <span className={styles.hubName}>{this.props.hubName}</span>
        <button className="{styles.shareButton}" onClick={this.emitChangeToPrevious}>
          <FontAwesomeIcon icon={faAngleLeft} />
        </button>
        <div>
          <FontAwesomeIcon icon={faAngleLeft} />
          <span>{this.props.participantCount}</span>
        </div>
      </div>
    );
  }
}
