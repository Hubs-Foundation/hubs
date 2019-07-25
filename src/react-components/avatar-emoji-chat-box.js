import React, { Component } from "react";
import PropTypes from "prop-types";
import { FormattedMessage } from "react-intl";
import classNames from "classnames";
import StateLink from "./state-link.js";
import { resetTips } from "../systems/tips";
import TwoDHUD from "./2d-hud";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSmileBeam } from "@fortawesome/free-solid-svg-icons/faSmileBeam";

import styles from "../assets/stylesheets/ui-root.scss";

class AvatarEmojiChatBox extends Component {
  static propTypes = {};

  state = {};

  changeChestImg() {
    //TODO: call A-frame to change image
    document
      .querySelector("a-scene")
      .querySelector("#player-rig")
      .querySelector(".image")
      .setAttribute("media-loader", { src: faSmileBeam });
    console.log("change chest image");
  }

  render() {
    return (
      <div>
        <button className={classNames(styles.myTestButton)} onClick={() => this.changeChestImg()}>
          <i>
            <FontAwesomeIcon icon={faSmileBeam} />
          </i>
        </button>
      </div>
    );
  }
}

export default AvatarEmojiChatBox;
