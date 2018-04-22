import React from "react";
import PropTypes from "prop-types";
import FontAwesomeIcon from "@fortawesome/react-fontawesome";
import faQuestion from "@fortawesome/fontawesome-free-solid/faQuestion";

export const ProfileInfoHeader = props => (
  <div className="profile-info-header">
    <div className="profile-info-header__profile_display_name">
      <img src="../assets/images/account.svg" onClick={props.onNameClick} className="profile-info-header__icon" />
      <div onClick={props.onNameClick} title={props.name}>
        {props.name}
      </div>
    </div>
    <button className="profile-info-header__menu-button" onClick={props.onHelpClick}>
      <i className="profile-info-header__menu-button__icon">
        <FontAwesomeIcon icon={faQuestion} />
      </i>
    </button>
  </div>
);

ProfileInfoHeader.propTypes = {
  onNameClick: PropTypes.func,
  onHelpClick: PropTypes.func,
  name: PropTypes.string
};
