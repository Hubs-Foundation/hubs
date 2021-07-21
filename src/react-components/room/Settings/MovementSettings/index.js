import classNames from "classnames";
import React, { useState } from "react";

import { MOVEMENT_TABS } from "../utils";
import { MovementFlyModeSettings } from "./MovementFlyModeSetting";
import { MovementTeleportSettings } from "./MovementTeleportSetting";

import "./MovementSetting.scss";

export const MovementSetting = () => {
  const [movementCategory, setmovementCategory] = useState(MOVEMENT_TABS.FLY_MODE);

  <div className="seeting-audio">
    {props.children}
    <form className="theme-form">
      <div className="form-head">
        <h6>Settings</h6>
        <h5>Movement</h5>
      </div>
      <div className="form-body">
        <ul className="nav nav-tabs justify-content-center">
          <li>
            <a
              href="#"
              className={classNames({
                active: movementCategory === MOVEMENT_TABS.FLY_MODE
              })}
              onClick={e => setmovementCategory(MOVEMENT_TABS.FLY_MODE)}
            >
              Fly Mode
            </a>
          </li>
          <li>
            <a
              href="#"
              className={classNames({
                active: movementCategory === MOVEMENT_TABS.TELEPORT
              })}
              onClick={e => setmovementCategory(MOVEMENT_TABS.TELEPORT)}
            >
              Teleport
            </a>
          </li>
        </ul>
        <TabContent active={movementCategory}>
          <MovementFlyModeSettings name={MOVEMENT_TABS.FLY_MODE} />
          <MovementTeleportSettings name={MOVEMENT_TABS.TELEPORT} />
        </TabContent>
      </div>
    </form>
  </div>;
};

const TabContent = props => (
  <div className="tab-content">
    <div id={props.active}>{props.children.filter(child => child.props.name && child.props.name === props.active)}</div>
  </div>
);
