import React, { useState } from "react";
import { ToolbarButton } from "../../input/ToolbarButton";
import { AudioSetting } from "./AudioSettings";
import { SettingSidebar } from "./SettingSidebar";
import { SETTINGS_TABS } from "./utils";
import "./Setting.scss";
import arrowIcon from "../../../assets/images/arrow-icon.png";
import closeIcon from "../../../assets/images/close-icon.png";
//import MiscSetting from "..;
import { MiscSetting } from "./MiscSettings/MiscSetting";
import { MovementSetting } from "./MovementSettings";

export const SettingContainer = ({ icon, onClick }) => {
  return (
    <ToolbarButton
      icon={icon}
      preset="setting"
      //onClick={onClick}
    />
  );
};

export function Setting(props) {
  const [activeSettings, setActiveSettings] = useState(SETTINGS_TABS.AUDIO);

  return (
    <main className="setting-inUp-wrap d-flex flex-wrap align-items-center justify-content-center">
      <div className="container">
        <div className="signinUp-box d-flex flex-wrap justify-content-center">
          <SettingSidebar setActiveSettings={setActiveSettings} />
          {activeSettings === SETTINGS_TABS.AUDIO && (
            <AudioSetting>
              <ActionButtons history={props.history} />
            </AudioSetting>
          )}
          {activeSettings === SETTINGS_TABS.MISC && (
            <MiscSetting>
              <ActionButtons history={props.history} />
            </MiscSetting>
          )}
          {activeSettings === SETTINGS_TABS.MOVEMENT && (
            <MovementSetting>
              <ActionButtons history={props.history} />
            </MovementSetting>
          )}
        </div>
      </div>
    </main>
  );
}

const ActionButtons = ({ history }) => (
  <>
    <span className="btn-next circle-btn" onClick={e => history.goBack()}>
      <img src={arrowIcon} />
    </span>
    <span className="btn-close circle-btn" onClick={e => history.goBack()}>
      <img src={closeIcon} />
    </span>
  </>
);
