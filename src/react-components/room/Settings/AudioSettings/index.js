import classNames from "classnames";
import React, { useState } from "react";

import { AUDIO_TABS } from "../utils";
import { AudioInputSettings } from "./AudioInput";
import { AudioLevelSettings } from "./AudioLevels";
import { AudioOutputSettings } from "./AudioOutput";
import "./AudioSetting.scss";

export function AudioSetting(props) {
  const [audioCategory, setaudioCategory] = useState(AUDIO_TABS.LEVELS);

  return (
    <div className="seeting-audio">
      {props.children}
      <form className="theme-form">
        <div className="form-head">
          <h6>Settings</h6>
          <h5>Audio</h5>
        </div>
        <div className="form-body">
          <ul className="nav nav-tabs justify-content-center">
            <li>
              <a
                href="#"
                className={classNames({
                  active: audioCategory === AUDIO_TABS.LEVELS
                })}
                onClick={e => setaudioCategory(AUDIO_TABS.LEVELS)}
              >
                Levels
              </a>
            </li>
            <li>
              <a
                href="#"
                className={classNames({
                  active: audioCategory === AUDIO_TABS.INPUT
                })}
                onClick={e => setaudioCategory(AUDIO_TABS.INPUT)}
              >
                Input
              </a>
            </li>
            <li>
              <a
                href="#"
                className={classNames({
                  active: audioCategory === AUDIO_TABS.OUTPUT
                })}
                onClick={e => setaudioCategory(AUDIO_TABS.OUTPUT)}
              >
                Output
              </a>
            </li>
          </ul>
          <TabContent active={audioCategory}>
            <AudioLevelSettings name={AUDIO_TABS.LEVELS} />
            <AudioInputSettings name={AUDIO_TABS.INPUT} />
            <AudioOutputSettings name={AUDIO_TABS.OUTPUT} />
          </TabContent>
        </div>
      </form>
    </div>
  );
}

const TabContent = props => (
  <div className="tab-content">
    <div id={props.active}>{props.children.filter(child => child.props.name && child.props.name === props.active)}</div>
  </div>
);
