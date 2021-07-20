import React from "react";
import graphics from "../../../assets/images/graphics.png";
import hemMenu from "../../../assets/images/hem-menu.png";
import movement from "../../../assets/images/movement.png";
import profile from "../../../assets/images/profile.png";
import sound from "../../../assets/images/Sound.png";
import { SETTINGS_TABS } from "./utils";

export const SettingSidebar = ({ setActiveSettings }) => (
  <div className="side-menu">
    <ul className="sidebar-menu">
      <li>
        <a href="#" onClick={e => setActiveSettings(SETTINGS_TABS.USER)}>
          <img src={profile} />
        </a>
      </li>
      <li>
        <a href="#" onClick={e => setActiveSettings(SETTINGS_TABS.AUDIO)}>
          <img src={sound} />
        </a>
      </li>
      <li>
        <a href="#">
          <img src={graphics} />
        </a>
      </li>
      <li>
        <a href="#">
          <img src={movement} onClick={e => setActiveSettings(SETTINGS_TABS.MOVEMENT)} />
        </a>
      </li>
      <li>
        <a href="#" onClick={e => setActiveSettings(SETTINGS_TABS.MISC)}>
          <img src={hemMenu} />
        </a>
      </li>
    </ul>
  </div>
);

// SettingSidebar.defaultProps = {
//     setActiveSettings
// }
