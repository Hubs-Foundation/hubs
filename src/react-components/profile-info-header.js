import React from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQuestion } from "@fortawesome/free-solid-svg-icons/faQuestion";

export const ProfileInfoHeader = props => (
  <div className="profile-info-header">
    <div className="profile-info-header__menu-buttons">
      <button className="profile-info-header__menu-buttons__menu-button" onClick={props.onClickHelp}>
        <i className="profile-info-header__menu-buttons__menu-button__icon">
          <FontAwesomeIcon icon={faQuestion} />
        </i>
      </button>
    </div>
    <div className="profile-info-header__profile_display_name">
      <img src="../assets/images/account.svg" onClick={props.onClickName} className="profile-info-header__icon" />
      <div onClick={props.onClickName} title={props.name}>
        {props.name}
      </div>
    </div>
  </div>
);

ProfileInfoHeader.propTypes = {
  onClickName: PropTypes.func,
  onClickHelp: PropTypes.func,
  name: PropTypes.string
};
