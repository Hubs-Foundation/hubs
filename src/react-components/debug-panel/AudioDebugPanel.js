import React, { useCallback, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { FormattedMessage } from "react-intl";
import styles from "./AudioDebugPanel.scss";
import { CollapsiblePanel } from ".//CollapsiblePanel";
import classNames from "classnames";
import {
  CLIPPING_THRESHOLD_MIN,
  CLIPPING_THRESHOLD_MAX,
  CLIPPING_THRESHOLD_STEP,
  GLOBAL_VOLUME_MIN,
  GLOBAL_VOLUME_MAX,
  GLOBAL_VOLUME_STEP
} from "../../react-components/preferences-screen";
import { SelectInputField } from "../input/SelectInputField";
import { DISTANCE_MODEL_OPTIONS, DistanceModelType, SourceType } from "../../components/audio-params";
import { getCurrentAudioSettingsForSourceType, updateAudioSettings } from "../../update-audio-settings";

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

function getPrefs() {
  return {
    enableAudioClipping: APP.store.state.preferences.enableAudioClipping,
    audioClippingThreshold: APP.store.state.preferences.audioClippingThreshold,
    globalVoiceVolume: APP.store.state.preferences.globalVoiceVolume,
    globalMediaVolume: APP.store.state.preferences.globalMediaVolume,
    globalSFXVolume: APP.store.state.preferences.globalSFXVolume
  };
}

export function AudioDebugPanel({ isNarrow, collapsed, onCollapsed }) {
  const [mediaSettings, setMediaSettings] = useState(getCurrentAudioSettingsForSourceType(SourceType.MEDIA_VIDEO));
  const [avatarSettings, setAvatarSettings] = useState(
    getCurrentAudioSettingsForSourceType(SourceType.AVATAR_AUDIO_SOURCE)
  );

  const onSettingChange = (sourceType, newSetting) => {
    const settings = Object.assign({}, APP.audioDebugPanelOverrides.get(sourceType), newSetting);
    APP.audioDebugPanelOverrides.set(sourceType, settings);
    if (sourceType === SourceType.MEDIA_VIDEO) {
      setMediaSettings(getCurrentAudioSettingsForSourceType(SourceType.MEDIA_VIDEO));
    } else {
      setAvatarSettings(getCurrentAudioSettingsForSourceType(SourceType.AVATAR_AUDIO_SOURCE));
    }
    for (const [el, audio] of APP.audios.entries()) {
      updateAudioSettings(el, audio);
    }
  };

  const [preferences, setPreferences] = useState(getPrefs());
  const onPreferencesUpdated = useCallback(() => {
    setPreferences(getPrefs());
  }, [setPreferences]);
  useEffect(() => {
    onPreferencesUpdated();
    APP.store.addEventListener("statechanged", onPreferencesUpdated);
    return () => {
      APP.store.removeEventListener("statechanged", onPreferencesUpdated);
      APP.audioDebugPanelOverrides.delete(SourceType.MEDIA_VIDEO);
      APP.audioDebugPanelOverrides.delete(SourceType.AVATAR_AUDIO_SOURCE);
      for (const [el, audio] of APP.audios.entries()) {
        updateAudioSettings(el, audio);
      }
    };
  }, [onPreferencesUpdated]);

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
                APP.store.update({
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
                APP.store.update({
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
              APP.store.update({
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
              APP.store.update({
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
          <SliderProperty
            defaultValue={preferences.globalSFXVolume}
            step={GLOBAL_VOLUME_STEP}
            min={GLOBAL_VOLUME_MIN}
            max={GLOBAL_VOLUME_MAX}
            onChange={value => {
              APP.store.update({
                preferences: {
                  globalSFXVolume: value
                }
              });
            }}
          >
            <p className={classNames(styles.propText)}>
              <FormattedMessage id="audio-debug-view.global.sfxVolume" defaultMessage="SFX Volume" />
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
              defaultValue={avatarSettings.distanceModel}
              options={DISTANCE_MODEL_OPTIONS}
              onChange={value => {
                const newSetting = { distanceModel: value };
                if (value === DistanceModelType.Linear && avatarSettings.rolloffFactor > 1.0) {
                  newSetting.rolloffFactor = 1.0;
                }
                onSettingChange(SourceType.AVATAR_AUDIO_SOURCE, newSetting);
              }}
            >
              <p className={classNames(styles.propText)}>
                <FormattedMessage id="audio-debug-view.avatar.distanceModel" defaultMessage="Distance Model" />
              </p>
            </SelectProperty>
            <SliderProperty
              defaultValue={avatarSettings.rolloffFactor}
              step={avatarSettings.distanceModel === DistanceModelType.Linear ? ROLLOFF_LIN_STEP : ROLLOFF_STEP}
              min={avatarSettings.distanceModel === DistanceModelType.Linear ? ROLLOFF_LIN_MIN : ROLLOFF_MIN}
              max={avatarSettings.distanceModel === DistanceModelType.Linear ? ROLLOFF_LIN_MAX : ROLLOFF_MAX}
              onChange={value => {
                onSettingChange(SourceType.AVATAR_AUDIO_SOURCE, { rolloffFactor: value });
              }}
            >
              <p className={classNames(styles.propText)}>
                <FormattedMessage id="audio-debug-view.avatar.rolloffFactor" defaultMessage="Rolloff" />
              </p>
            </SliderProperty>
            <SliderProperty
              defaultValue={avatarSettings.refDistance}
              step={DISTANCE_STEP}
              min={DISTANCE_MIN}
              max={DISTANCE_MAX}
              onChange={value => {
                onSettingChange(SourceType.AVATAR_AUDIO_SOURCE, { refDistance: value });
              }}
            >
              <p className={classNames(styles.propText)}>
                <FormattedMessage id="audio-debug-view.avatar.refDistance" defaultMessage="Ref Distance" />
              </p>
            </SliderProperty>
            <SliderProperty
              defaultValue={avatarSettings.maxDistance}
              step={DISTANCE_STEP}
              min={DISTANCE_MIN}
              max={DISTANCE_MAX}
              onChange={value => {
                onSettingChange(SourceType.AVATAR_AUDIO_SOURCE, { maxDistance: value });
              }}
            >
              <p className={classNames(styles.propText)}>
                <FormattedMessage id="audio-debug-view.avatar.maxDistance" defaultMessage="Max Distance" />
              </p>
            </SliderProperty>
            <SliderProperty
              defaultValue={avatarSettings.coneInnerAngle}
              step={ANGLE_STEP}
              min={ANGLE_MIN}
              max={ANGLE_MAX}
              onChange={value => {
                onSettingChange(SourceType.AVATAR_AUDIO_SOURCE, { coneInnerAngle: value });
              }}
            >
              <p className={classNames(styles.propText)}>
                <FormattedMessage id="audio-debug-view.avatar.innerAngle" defaultMessage="Inner Angle" />
              </p>
            </SliderProperty>
            <SliderProperty
              defaultValue={avatarSettings.coneOuterAngle}
              step={ANGLE_STEP}
              min={ANGLE_MIN}
              max={ANGLE_MAX}
              onChange={value => {
                onSettingChange(SourceType.AVATAR_AUDIO_SOURCE, { coneOuterAngle: value });
              }}
            >
              <p className={classNames(styles.propText)}>
                <FormattedMessage id="audio-debug-view.avatar.outerAngle" defaultMessage="Outer Angle" />
              </p>
            </SliderProperty>
            <SliderProperty
              defaultValue={avatarSettings.coneOuterGain}
              step={GAIN_STEP}
              min={GAIN_MIN}
              max={GAIN_MAX}
              onChange={value => {
                onSettingChange(SourceType.AVATAR_AUDIO_SOURCE, { coneOuterGain: value });
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
              defaultValue={mediaSettings.distanceModel}
              options={DISTANCE_MODEL_OPTIONS}
              onChange={value => {
                const newSetting = { distanceModel: value };
                if (value === DistanceModelType.Linear && mediaSettings.rolloffFactor > 1.0) {
                  newSetting.rolloffFactor = 1.0;
                }
                onSettingChange(SourceType.MEDIA_VIDEO, newSetting);
              }}
            >
              <p className={classNames(styles.propText)}>
                <FormattedMessage id="audio-debug-view.media.distanceModel" defaultMessage="Distance Model" />
              </p>
            </SelectProperty>
            <SliderProperty
              defaultValue={mediaSettings.rolloffFactor}
              step={mediaSettings.distanceModel === DistanceModelType.Linear ? ROLLOFF_LIN_STEP : ROLLOFF_STEP}
              min={mediaSettings.distanceModel === DistanceModelType.Linear ? ROLLOFF_LIN_MIN : ROLLOFF_MIN}
              max={mediaSettings.distanceModel === DistanceModelType.Linear ? ROLLOFF_LIN_MAX : ROLLOFF_MAX}
              onChange={value => {
                onSettingChange(SourceType.MEDIA_VIDEO, { rolloffFactor: value });
              }}
            >
              <p className={classNames(styles.propText)}>
                <FormattedMessage id="audio-debug-view.media.rolloffFactor" defaultMessage="Rolloff" />
              </p>
            </SliderProperty>
            <SliderProperty
              defaultValue={mediaSettings.refDistance}
              step={DISTANCE_STEP}
              min={DISTANCE_MIN}
              max={DISTANCE_MAX}
              onChange={value => {
                onSettingChange(SourceType.MEDIA_VIDEO, { refDistance: value });
              }}
            >
              <p className={classNames(styles.propText)}>
                <FormattedMessage id="audio-debug-view.media.refDistance" defaultMessage="Ref Distance" />
              </p>
            </SliderProperty>
            <SliderProperty
              defaultValue={mediaSettings.maxDistance}
              step={DISTANCE_STEP}
              min={DISTANCE_MIN}
              max={DISTANCE_MAX}
              onChange={value => {
                onSettingChange(SourceType.MEDIA_VIDEO, { maxDistance: value });
              }}
            >
              <p className={classNames(styles.propText)}>
                <FormattedMessage id="audio-debug-view.media.maxDistance" defaultMessage="Max Distance" />
              </p>
            </SliderProperty>
            <SliderProperty
              defaultValue={mediaSettings.coneInnerAngle}
              step={ANGLE_STEP}
              min={ANGLE_MIN}
              max={ANGLE_MAX}
              onChange={value => {
                onSettingChange(SourceType.MEDIA_VIDEO, { coneInnerAngle: value });
              }}
            >
              <p className={classNames(styles.propText)}>
                <FormattedMessage id="audio-debug-view.media.innerAngle" defaultMessage="Inner Angle" />
              </p>
            </SliderProperty>
            <SliderProperty
              defaultValue={mediaSettings.coneOuterAngle}
              step={ANGLE_STEP}
              min={ANGLE_MIN}
              max={ANGLE_MAX}
              onChange={value => {
                onSettingChange(SourceType.MEDIA_VIDEO, { coneOuterAngle: value });
              }}
            >
              <p className={classNames(styles.propText)}>
                <FormattedMessage id="audio-debug-view.media.outerAngle" defaultMessage="Outer Angle" />
              </p>
            </SliderProperty>
            <SliderProperty
              defaultValue={mediaSettings.coneOuterGain}
              step={GAIN_STEP}
              min={GAIN_MIN}
              max={GAIN_MAX}
              onChange={value => {
                onSettingChange(SourceType.MEDIA_VIDEO, { coneOuterGain: value });
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
