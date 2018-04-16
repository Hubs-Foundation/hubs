import React from "react";
import PropTypes from "prop-types";

export const ProfileInfoHeader = props => (
  <div className="profile-info-header">
    <img src="../assets/images/account.svg" onClick={props.onClick} className="profile-info-header__icon" />
    <div className="profile-info-header__profile_display_name" onClick={props.onClick} title={props.name}>
      {props.name}
    </div>
    <div className="profile-info-header__app_name">
      <b>moz://a</b> duck
    </div>
  </div>
);

ProfileInfoHeader.propTypes = {
  onClick: PropTypes.func,
  name: PropTypes.string
};
