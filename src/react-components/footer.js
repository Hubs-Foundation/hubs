import React from "react";
import PropTypes from "prop-types";
import FontAwesomeIcon from "@fortawesome/react-fontawesome";
import faAngleLeft from "@fortawesome/fontawesome-free-solid/faAngleLeft";

import styles from "../assets/stylesheets/footer.css";

const Footer = ({ hubName, participantCount }) => (
  <div className={styles.container}>
    <span className={styles.hubName}>{hubName}</span>
    <button className="{style.shareButton}" onClick={this.emitChangeToPrevious}>
      <FontAwesomeIcon icon={faAngleLeft} />
    </button>
    <div>
      <FontAwesomeIcon icon={faAngleLeft} />
      <span>{participantCount}</span>
    </div>
  </div>
);

Footer.propTypes = {
  hubName: PropTypes.string,
  participantCount: PropTypes.number
};

export default Footer;
