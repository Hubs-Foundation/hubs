import React, { useState } from "react";
import PropTypes from "prop-types";
import { FormattedMessage } from "react-intl";
import styles from "./AudioDebugPanel.scss";
import { CollapsiblePanel } from ".//CollapsiblePanel";
import classNames from "classnames";
import {
  CLIPPING_THRESHOLD_ENABLED,
  CLIPPING_THRESHOLD_MIN,
  CLIPPING_THRESHOLD_MAX,
  CLIPPING_THRESHOLD_STEP,
  CLIPPING_THRESHOLD_DEFAULT,
  GLOBAL_VOLUME_MIN,
  GLOBAL_VOLUME_MAX,
  GLOBAL_VOLUME_STEP,
  GLOBAL_VOLUME_DEFAULT
} from "../../react-components/preferences-screen";
import { SelectInputField } from "../input/SelectInputField";
import { DISTANCE_MODEL_OPTIONS, DistanceModelType } from "../../components/audio-params";

const ROLLOFF_MIN = 0.0;
const ROLLOFF_MAX = 20.0;
const ROLLOFF_STEP = 0.5;
const ROLLOFF_LIN_MIN = 0.0;
const ROLLOFF_LIN_MAX = 1.0;
const ROLLOFF_LIN_STEP = 0.01;
const DISTANCE_MIN = 1.0;
const DISTANCE_MAX = 100.0;
const DISTANCE_STEP = 1.0;
const ANGLE_MIN = 0.0;
const ANGLE_MAX = 360.0;
const ANGLE_STEP = 1.0;
const GAIN_MIN = 0.0;
const GAIN_MAX = 1.0;
const GAIN_STEP = 0.1;

export default {
  title: "AudioDebugger/AudioDebugPanel",
  parameters: {
    layout: "fullscreen"
  }
};

const MockAppObject = {
  store: {
    state: {
      preferences: {
        enableAudioClipping: undefined,
        audioClippingThreshold: undefined,
        globalVoiceVolume: undefined,
        globalMediaVolume: undefined
      }
    }
  }
};

function SelectProperty({ defaultValue, options, onChange, children }) {
  const [value, setValue] = useState(defaultValue);
  return (
    <div className={classNames(styles.audioDebugRow)}>
      <span style={{ flex: "none", padEnd: "10px" }}>{children}</span>
      <SelectInputField
        value={value}
        options={options}
        onChange={newValue => {
          setValue(newValue);
          onChange(newValue);
        }}
      />
    </div>
  );
}

SelectProperty.propTypes = {
  defaultValue: PropTypes.string,
  options: PropTypes.array,
  onChange: PropTypes.func,
  children: PropTypes.node
};

function SliderProperty({ defaultValue, step, min, max, onChange, children }) {
  return (
    <div className={classNames(styles.audioDebugRow)}>
      <span style={{ flex: "none", padEnd: "10px" }}>{children}</span>
      <input
        type="range"
        step={step}
        min={min}
        max={max}
        value={defaultValue}
        onChange={e => {
          const parsedValue = parseFloat(e.target.value);
          onChange(parsedValue);
        }}
      />
      <span className={classNames(styles.valueText)}>{defaultValue}</span>
    </div>
  );
}

SliderProperty.propTypes = {
  defaultValue: PropTypes.number,
  step: PropTypes.number,
  min: PropTypes.number,
  max: PropTypes.number,
  onChange: PropTypes.func,
  children: PropTypes.node
};
//we can edit this function later if we need to adjust values in storybook.
function getPrefs() {
  const prefs = {
    enableAudioClipping: MockAppObject.store.state.preferences.enableAudioClipping,
    audioClippingThreshold: MockAppObject.store.state.preferences.audioClippingThreshold,
    globalVoiceVolume: MockAppObject.store.state.preferences.globalVoiceVolume,
    globalMediaVolume: MockAppObject.store.state.preferences.globalMediaVolume
  };
  if (prefs.enableAudioClipping === undefined) prefs.enableAudioClipping = CLIPPING_THRESHOLD_ENABLED;
  if (prefs.audioClippingThreshold === undefined) prefs.audioClippingThreshol = CLIPPING_THRESHOLD_DEFAULT;
  if (prefs.globalVoiceVolume === undefined) prefs.globalVoiceVolume = GLOBAL_VOLUME_DEFAULT;
  if (prefs.globalMediaVolume === undefined) prefs.globalMediaVolume = GLOBAL_VOLUME_DEFAULT;

  return prefs;
}

export function AudioDebugPanel({ isNarrow, collapsed, onCollapsed }) {
  const [preferences, setPreferences] = useState(getPrefs());
  const [MockAvatarSettings, setMockAvatarSettings] = useState({
    audioType: "pannernode",
    distanceModel: "inverse",
    rolloffFactor: 5,
    refDistance: 5,
    maxDistance: 10000,
    coneInnerAngle: 180,
    coneOuterAngle: 360,
    coneOuterGain: 0.9,
    gain: 1
  });
  const [MockMediaSettings, setMockMediaSettings] = useState({
    audioType: "pannernode",
    distanceModel: "inverse",
    rolloffFactor: 5,
    refDistance: 5,
    maxDistance: 10000,
    coneInnerAngle: 360,
    coneOuterAngle: 0,
    coneOuterGain: 0.9,
    gain: 0.5
  });
  return (
    <div
      className={classNames(styles.audioDebugContainer)}
      style={{
        height: isNarrow && !collapsed && "80%",
        maxHeight: isNarrow && !collapsed && "80%"
      }}
    >
      <CollapsiblePanel
        title={<FormattedMessage id="audio-debug-panel.audio-debug-title" defaultMessage="Audio Debug" />}
        isRoot
        border
        collapsed={collapsed}
        onCollapse={onCollapsed}
      >
        <CollapsiblePanel
          title={<FormattedMessage id="audio-debug-panel.audio-debug-global-title" defaultMessage="Globals" />}
          border
          grow
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <input
              tabIndex="0"
              type="checkbox"
              checked={preferences.enableAudioClipping}
              onChange={() => {
                MockAppObject.store.update({
                  preferences: {
                    enableAudioClipping: !preferences.enableAudioClipping
                  }
                });
              }}
              style={{ marginLeft: "10px" }}
            />
            <SliderProperty
              defaultValue={preferences.audioClippingThreshold}
              step={CLIPPING_THRESHOLD_STEP}
              min={CLIPPING_THRESHOLD_MIN}
              max={CLIPPING_THRESHOLD_MAX}
              onChange={value => {
                MockAppObject.store.update({
                  preferences: {
                    audioClippingThreshold: value
                  }
                });
              }}
            >
              <p className={classNames(styles.propText)}>
                <FormattedMessage id="audio-debug-view.global.clippingThreshold" defaultMessage="Clipping" />
              </p>
            </SliderProperty>
          </div>
          <SliderProperty
            defaultValue={preferences.globalVoiceVolume}
            step={GLOBAL_VOLUME_STEP}
            min={GLOBAL_VOLUME_MIN}
            max={GLOBAL_VOLUME_MAX}
            onChange={value => {
              MockAppObject.store.update({
                preferences: {
                  globalVoiceVolume: value
                }
              });
            }}
          >
            <p className={classNames(styles.propText)}>
              <FormattedMessage id="audio-debug-view.global.voiceVolume" defaultMessage="Voice Volume" />
            </p>
          </SliderProperty>
          <SliderProperty
            defaultValue={preferences.globalMediaVolume}
            step={GLOBAL_VOLUME_STEP}
            min={GLOBAL_VOLUME_MIN}
            max={GLOBAL_VOLUME_MAX}
            onChange={value => {
              MockAppObject.store.update({
                preferences: {
                  globalMediaVolume: value
                }
              });
            }}
          >
            <p className={classNames(styles.propText)}>
              <FormattedMessage id="audio-debug-view.global.mediaVolume" defaultMessage="Media Volume" />
            </p>
          </SliderProperty>
        </CollapsiblePanel>
        <div style={{ display: "flex" }}>
          <CollapsiblePanel
            title={<FormattedMessage id="audio-debug-panel.audio-debug-avatar-title" defaultMessage="Avatar" />}
            border
            grow
          >
            <SelectProperty
              defaultValue={MockAvatarSettings.distanceModel}
              options={DISTANCE_MODEL_OPTIONS}
              onChange={value => {
                setMockAvatarSettings({
                  audioType: "pannernode",
                  distanceModel: value,
                  rolloffFactor: 5,
                  refDistance: 5,
                  maxDistance: 10000,
                  coneInnerAngle: 180,
                  coneOuterAngle: 360,
                  coneOuterGain: 0.9,
                  gain: 1
                });
              }}
            >
              <p className={classNames(styles.propText)}>
                <FormattedMessage id="audio-debug-view.avatar.distanceModel" defaultMessage="Distance Model" />
              </p>
            </SelectProperty>
            <SliderProperty
              defaultValue={MockAvatarSettings.rolloffFactor}
              step={MockAvatarSettings.distanceModel === DistanceModelType.Linear ? ROLLOFF_LIN_STEP : ROLLOFF_STEP}
              min={MockAvatarSettings.distanceModel === DistanceModelType.Linear ? ROLLOFF_LIN_MIN : ROLLOFF_MIN}
              max={MockAvatarSettings.distanceModel === DistanceModelType.Linear ? ROLLOFF_LIN_MAX : ROLLOFF_MAX}
              onChange={value => {
                setPreferences(getPrefs(value));
              }}
            >
              <p className={classNames(styles.propText)}>
                <FormattedMessage id="audio-debug-view.avatar.rolloffFactor" defaultMessage="Rolloff" />
              </p>
            </SliderProperty>
            <SliderProperty
              defaultValue={MockAvatarSettings.refDistance}
              step={DISTANCE_STEP}
              min={DISTANCE_MIN}
              max={DISTANCE_MAX}
              onChange={value => {
                getPrefs(value);
              }}
            >
              <p className={classNames(styles.propText)}>
                <FormattedMessage id="audio-debug-view.avatar.refDistance" defaultMessage="Ref Distance" />
              </p>
            </SliderProperty>
            {MockAvatarSettings.distanceModel === "linear" ? (
              <SliderProperty
                defaultValue={MockAvatarSettings.maxDistance}
                step={DISTANCE_STEP}
                min={DISTANCE_MIN}
                max={DISTANCE_MAX}
                onChange={value => {
                  getPrefs(value);
                }}
              >
                <p className={classNames(styles.propText)}>
                  <FormattedMessage id="audio-debug-view.avatar.maxDistance" defaultMessage="Max Distance" />
                </p>
              </SliderProperty>
            ) : null}
            <SliderProperty
              defaultValue={MockAvatarSettings.coneInnerAngle}
              step={ANGLE_STEP}
              min={ANGLE_MIN}
              max={ANGLE_MAX}
              onChange={value => {
                getPrefs(value);
              }}
            >
              <p className={classNames(styles.propText)}>
                <FormattedMessage id="audio-debug-view.avatar.innerAngle" defaultMessage="Inner Angle" />
              </p>
            </SliderProperty>
            <SliderProperty
              defaultValue={MockAvatarSettings.coneOuterAngle}
              step={ANGLE_STEP}
              min={ANGLE_MIN}
              max={ANGLE_MAX}
              onChange={value => {
                getPrefs(value);
              }}
            >
              <p className={classNames(styles.propText)}>
                <FormattedMessage id="audio-debug-view.avatar.outerAngle" defaultMessage="Outer Angle" />
              </p>
            </SliderProperty>
            <SliderProperty
              defaultValue={MockAvatarSettings.coneOuterGain}
              step={GAIN_STEP}
              min={GAIN_MIN}
              max={GAIN_MAX}
              onChange={value => {
                getPrefs(value);
              }}
            >
              <p className={classNames(styles.propText)}>
                <FormattedMessage id="audio-debug-view.avatar.outerGain" defaultMessage="Outer Gain" />
              </p>
            </SliderProperty>
          </CollapsiblePanel>
          <CollapsiblePanel
            title={<FormattedMessage id="audio-debug-panel.audio-debug-media-title" defaultMessage="Media" />}
            border
            grow
          >
            <SelectProperty
              defaultValue={MockMediaSettings.distanceModel}
              options={DISTANCE_MODEL_OPTIONS}
              onChange={value => {
                setMockMediaSettings({
                  audioType: value,
                  distanceModel: value,
                  rolloffFactor: 5,
                  refDistance: 5,
                  maxDistance: 10000,
                  coneInnerAngle: 180,
                  coneOuterAngle: 360,
                  coneOuterGain: 0.9,
                  gain: 1
                });
              }}
            >
              <p className={classNames(styles.propText)}>
                <FormattedMessage id="audio-debug-view.media.distanceModel" defaultMessage="Distance Model" />
              </p>
            </SelectProperty>
            <SliderProperty
              defaultValue={MockMediaSettings.rolloffFactor}
              step={MockMediaSettings.distanceModel === DistanceModelType.Linear ? ROLLOFF_LIN_STEP : ROLLOFF_STEP}
              min={MockMediaSettings.distanceModel === DistanceModelType.Linear ? ROLLOFF_LIN_MIN : ROLLOFF_MIN}
              max={MockMediaSettings.distanceModel === DistanceModelType.Linear ? ROLLOFF_LIN_MAX : ROLLOFF_MAX}
              onChange={value => {
                getPrefs(value);
              }}
            >
              <p className={classNames(styles.propText)}>
                <FormattedMessage id="audio-debug-view.media.rolloffFactor" defaultMessage="Rolloff" />
              </p>
            </SliderProperty>
            <SliderProperty
              defaultValue={MockMediaSettings.refDistance}
              step={DISTANCE_STEP}
              min={DISTANCE_MIN}
              max={DISTANCE_MAX}
              onChange={value => {
                getPrefs(value);
              }}
            >
              <p className={classNames(styles.propText)}>
                <FormattedMessage id="audio-debug-view.media.refDistance" defaultMessage="Ref Distance" />
              </p>
            </SliderProperty>
            {MockMediaSettings.distanceModel === "linear" ? (
              <SliderProperty
                defaultValue={MockMediaSettings.maxDistance}
                step={DISTANCE_STEP}
                min={DISTANCE_MIN}
                max={DISTANCE_MAX}
                onChange={value => {
                  getPrefs(value);
                }}
              >
                <p className={classNames(styles.propText)}>
                  <FormattedMessage id="audio-debug-view.media.maxDistance" defaultMessage="Max Distance" />
                </p>
              </SliderProperty>
            ) : null}
            <SliderProperty
              defaultValue={MockMediaSettings.coneInnerAngle}
              step={ANGLE_STEP}
              min={ANGLE_MIN}
              max={ANGLE_MAX}
              onChange={value => {
                getPrefs(value);
              }}
            >
              <p className={classNames(styles.propText)}>
                <FormattedMessage id="audio-debug-view.media.innerAngle" defaultMessage="Inner Angle" />
              </p>
            </SliderProperty>
            <SliderProperty
              defaultValue={MockMediaSettings.coneOuterAngle}
              step={ANGLE_STEP}
              min={ANGLE_MIN}
              max={ANGLE_MAX}
              onChange={value => {
                getPrefs(value);
              }}
            >
              <p className={classNames(styles.propText)}>
                <FormattedMessage id="audio-debug-view.media.outerAngle" defaultMessage="Outer Angle" />
              </p>
            </SliderProperty>
            <SliderProperty
              defaultValue={MockMediaSettings.coneOuterGain}
              step={GAIN_STEP}
              min={GAIN_MIN}
              max={GAIN_MAX}
              onChange={value => {
                getPrefs(value);
              }}
            >
              <p className={classNames(styles.propText)}>
                <FormattedMessage id="audio-debug-view.media.outerGain" defaultMessage="Outer Gain" />
              </p>
            </SliderProperty>
          </CollapsiblePanel>
        </div>
      </CollapsiblePanel>
    </div>
  );
}

AudioDebugPanel.propTypes = {
  isNarrow: PropTypes.bool,
  collapsed: PropTypes.bool,
  onCollapsed: PropTypes.func,
  children: PropTypes.node
};
