import React from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQuestion } from "@fortawesome/free-solid-svg-icons/faQuestion";
import { AudioContext } from "../AudioContext";

export const ProfileInfoHeader = props => (
  <AudioContext.Consumer>
    {audio => (
      <div className="profile-info-header">
        <div className="profile-info-header__menu-buttons">
          <button
            className="profile-info-header__menu-buttons__menu-button"
            onClick={props.onClickHelp}
            onMouseEnter={audio.onMouseEnter}
            onMouseLeave={audio.onMouseLeave}
          >
            <i className="profile-info-header__menu-buttons__menu-button__icon">
              <FontAwesomeIcon icon={faQuestion} />
            </i>
          </button>
        </div>
        <div className="profile-info-header__profile_display_name">
          <img
            src="../assets/images/account.svg"
            onClick={props.onClickName}
            className="profile-info-header__icon"
            onMouseEnter={audio.onMouseEnter}
            onMouseLeave={audio.onMouseLeave}
          />
          <div
            onClick={props.onClickName}
            title={props.name}
            onMouseEnter={audio.onMouseEnter}
            onMouseLeave={audio.onMouseLeave}
          >
            {props.name}
          </div>
        </div>
      </div>
    )}
  </AudioContext.Consumer>
);

ProfileInfoHeader.propTypes = {
  onClickName: PropTypes.func,
  onClickHelp: PropTypes.func,
  name: PropTypes.string
};
