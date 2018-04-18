import React, { Component } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { VR_DEVICE_AVAILABILITY } from "../utils/vr-caps-detect";
import queryString from "query-string";
import MobileDetect from "mobile-detect";
import { IntlProvider, FormattedMessage, addLocaleData } from "react-intl";
import en from "react-intl/locale-data/en";
import MovingAverage from "moving-average";

import AutoExitWarning from "./auto-exit-warning";
import { TwoDEntryButton, GenericEntryButton, GearVREntryButton, DaydreamEntryButton } from "./entry-buttons.js";
import { ProfileInfoHeader } from "./profile-info-header.js";
import ProfileEntryPanel from "./profile-entry-panel";
import TwoDHUD from "./2d-hud";
import Footer from "./footer";

const mobiledetect = new MobileDetect(navigator.userAgent);

const lang = ((navigator.languages && navigator.languages[0]) || navigator.language || navigator.userLanguage)
  .toLowerCase()
  .split(/[_-]+/)[0];

import localeData from "../assets/translations.data.json";
addLocaleData([...en]);

const messages = localeData[lang] || localeData.en;

const ENTRY_STEPS = {
  start: "start",
  mic_grant: "mic_grant",
  mic_granted: "mic_granted",
  audio_setup: "audio_setup",
  finished: "finished"
};

// This is a list of regexes that match the microphone labels of HMDs.
//
// If entering VR mode, and if any of these regexes match an audio device,
// the user will be prevented from entering VR until one of those devices is
// selected as the microphone.
//
// Note that this doesn't have to be exhaustive: if no devices match any regex
// then we rely upon the user to select the proper mic.
const HMD_MIC_REGEXES = [/\Wvive\W/i, /\Wrift\W/i];

async function grantedMicLabels() {
  const mediaDevices = await navigator.mediaDevices.enumerateDevices();
  return mediaDevices.filter(d => d.label && d.kind === "audioinput").map(d => d.label);
}

const AUTO_EXIT_TIMER_SECONDS = 10;

class UIRoot extends Component {
  static propTypes = {
    enterScene: PropTypes.func,
    exitScene: PropTypes.func,
    concurrentLoadDetector: PropTypes.object,
    disableAutoExitOnConcurrentLoad: PropTypes.bool,
    forcedVREntryType: PropTypes.string,
    enableScreenSharing: PropTypes.bool,
    store: PropTypes.object,
    scene: PropTypes.object,
    htmlPrefix: PropTypes.string,
    showProfileEntry: PropTypes.bool,
    availableVREntryTypes: PropTypes.object,
    initialEnvironmentLoaded: PropTypes.bool,
    janusRoomId: PropTypes.number
  };

  state = {
    entryStep: ENTRY_STEPS.start,
    enterInVR: false,

    shareScreen: false,
    requestedScreen: false,
    mediaStream: null,
    videoTrack: null,
    audioTrack: null,

    toneInterval: null,
    tonePlaying: false,

    micLevel: 0,
    micDevices: [],
    micUpdateInterval: null,

    profileNamePending: "Hello",

    autoExitTimerStartedAt: null,
    autoExitTimerInterval: null,
    secondsRemainingBeforeAutoExit: Infinity,

    exited: false,

    showProfileEntry: false
  };

  constructor(props) {
    super(props);
    this.state.showProfileEntry = this.props.showProfileEntry;
  }

  componentDidMount() {
    this.setupTestTone();
    this.props.concurrentLoadDetector.addEventListener("concurrentload", this.onConcurrentLoad);
    this.micLevelMovingAverage = MovingAverage(100);
    this.props.scene.addEventListener("loaded", this.onSceneLoaded);
    this.props.scene.addEventListener("stateadded", this.onAframeStateChanged);
    this.props.scene.addEventListener("stateremoved", this.onAframeStateChanged);
    this.props.scene.addEventListener("exit", this.exit);
  }

  componentWillUnmount() {
    this.props.scene.removeEventListener("loaded", this.onSceneLoaded);
    this.props.scene.removeEventListener("exit", this.exit);
  }

  componentDidUpdate(prevProps) {
    if (this.props.availableVREntryTypes && prevProps.availableVREntryTypes !== this.props.availableVREntryTypes) {
      this.handleForcedVREntryType();
    }
  }

  onSceneLoaded = () => {
    this.setState({ sceneLoaded: true });
  };

  // TODO: mute state should probably actually just live in react land
  onAframeStateChanged = e => {
    if (e.detail !== "muted") return;
    this.setState({
      muted: this.props.scene.is("muted")
    });
  };

  toggleMute = () => {
    this.props.scene.emit("action_mute");
  };

  handleForcedVREntryType = () => {
    if (!this.props.forcedVREntryType) return;

    if (this.props.forcedVREntryType === "daydream") {
      this.enterDaydream();
    } else if (this.props.forcedVREntryType === "gearvr") {
      this.enterGearVR();
    } else if (this.props.forcedVREntryType === "vr") {
      this.enterVR();
    } else if (this.props.forcedVREntryType === "2d") {
      this.enter2D();
    }
  };

  setupTestTone = () => {
    const toneClip = document.querySelector("#test-tone");
    const toneLength = 1800;
    const toneDelay = 5000;

    const toneIndicatorLoop = () => {
      this.setState({ tonePlaying: false });

      setTimeout(() => {
        this.setState({ tonePlaying: true });
        setTimeout(() => {
          this.setState({ tonePlaying: false });
        }, toneLength);
      }, toneDelay);
    };

    toneClip.addEventListener("seeked", toneIndicatorLoop);
    toneClip.addEventListener("playing", toneIndicatorLoop);
  };

  startTestTone = () => {
    const toneClip = document.querySelector("#test-tone");
    toneClip.loop = true;
    toneClip.play();
  };

  stopTestTone = () => {
    const toneClip = document.querySelector("#test-tone");
    toneClip.pause();
    toneClip.currentTime = 0;

    this.setState({ tonePlaying: false });
  };

  onConcurrentLoad = () => {
    if (this.props.disableAutoExitOnConcurrentLoad) return;

    const autoExitTimerInterval = setInterval(() => {
      let secondsRemainingBeforeAutoExit = Infinity;

      if (this.state.autoExitTimerStartedAt) {
        const secondsSinceStart = (new Date() - this.state.autoExitTimerStartedAt) / 1000;
        secondsRemainingBeforeAutoExit = Math.max(0, Math.floor(AUTO_EXIT_TIMER_SECONDS - secondsSinceStart));
      }

      this.setState({ secondsRemainingBeforeAutoExit });
      this.checkForAutoExit();
    }, 500);

    this.setState({ autoExitTimerStartedAt: new Date(), autoExitTimerInterval });
  };

  checkForAutoExit = () => {
    if (this.state.secondsRemainingBeforeAutoExit !== 0) return;
    this.endAutoExitTimer();
    this.exit();
  };

  exit = () => {
    this.props.exitScene();
    this.setState({ exited: true });
  };

  isWaitingForAutoExit = () => {
    return this.state.secondsRemainingBeforeAutoExit <= AUTO_EXIT_TIMER_SECONDS;
  };

  endAutoExitTimer = () => {
    clearInterval(this.state.autoExitTimerInterval);
    this.setState({
      autoExitTimerStartedAt: null,
      autoExitTimerInterval: null,
      secondsRemainingBeforeAutoExit: Infinity
    });
  };

  hasGrantedMicPermissions = async () => {
    if (this.state.requestedScreen) {
      // There is no way to tell if you've granted mic permissions in a previous session if we've
      // already prompted for screen sharing permissions, so we have to assume that we've never granted permissions.
      // Fortunately, if you *have* granted permissions permanently, there won't be a second browser prompt, but we
      // can't determine that before hand.
      // See https://bugzilla.mozilla.org/show_bug.cgi?id=1449783 for a potential solution in the future.
      return false;
    } else {
      // If we haven't requested the screen in this session, check if we've granted permissions in a previous session.
      return (await grantedMicLabels()).length > 0;
    }
  };

  performDirectEntryFlow = async enterInVR => {
    this.setState({ enterInVR });

    const hasGrantedMic = await this.hasGrantedMicPermissions();

    if (hasGrantedMic) {
      await this.setMediaStreamToDefault();
      await this.beginAudioSetup();
    } else {
      this.setState({ entryStep: ENTRY_STEPS.mic_grant });
    }
  };

  enter2D = async () => {
    await this.performDirectEntryFlow(false);
  };

  enterVR = async () => {
    await this.performDirectEntryFlow(true);
  };

  enterGearVR = async () => {
    if (this.props.availableVREntryTypes.gearvr === VR_DEVICE_AVAILABILITY.yes) {
      await this.performDirectEntryFlow(true);
    } else {
      this.exit();

      // Launch via Oculus Browser
      const location = window.location;
      const qs = queryString.parse(location.search);
      qs.vr_entry_type = "gearvr"; // Auto-choose 'gearvr' after landing in Oculus Browser

      const ovrwebUrl =
        `ovrweb://${location.protocol || "http:"}//${location.host}` +
        `${location.pathname || ""}?${queryString.stringify(qs)}#${location.hash || ""}`;

      window.location = ovrwebUrl;
    }
  };

  enterDaydream = async () => {
    if (this.props.availableVREntryTypes.daydream == VR_DEVICE_AVAILABILITY.maybe) {
      this.exit();

      // We are not in mobile chrome, so launch into chrome via an Intent URL
      const location = window.location;
      const qs = queryString.parse(location.search);
      qs.vr_entry_type = "daydream"; // Auto-choose 'daydream' after landing in chrome

      const intentUrl =
        `intent://${location.host}${location.pathname || ""}?` +
        `${queryString.stringify(qs)}#Intent;scheme=${(location.protocol || "http:").replace(":", "")};` +
        `action=android.intent.action.VIEW;package=com.android.chrome;end;`;

      window.location = intentUrl;
    } else {
      await this.performDirectEntryFlow(true);
    }
  };

  micDeviceChanged = async ev => {
    const constraints = { audio: { deviceId: { exact: [ev.target.value] } } };
    await this.fetchAudioTrack(constraints);
    await this.setupNewMediaStream();
  };

  setMediaStreamToDefault = async () => {
    let hasAudio = false;
    const { lastUsedMicDeviceId } = this.props.store.state;

    // Try to fetch last used mic, if there was one.
    if (lastUsedMicDeviceId) {
      hasAudio = await this.fetchAudioTrack({ audio: { deviceId: { ideal: lastUsedMicDeviceId } } });
    } else {
      hasAudio = await this.fetchAudioTrack({ audio: true });
    }

    await this.setupNewMediaStream();

    return { hasAudio };
  };

  setStateAndRequestScreen = async e => {
    const checked = e.target.checked;
    await this.setState({ requestedScreen: true, shareScreen: checked });
    if (checked) {
      this.fetchVideoTrack({
        video: {
          mediaSource: "screen",
          // Work around BMO 1449832 by calculating the width. This will break for multi monitors if you share anything
          // other than your current monitor that has a different aspect ratio.
          width: screen.width / screen.height * 720,
          height: 720,
          frameRate: 30
        }
      });
    } else {
      this.setState({ videoTrack: null });
    }
  };

  fetchVideoTrack = async constraints => {
    const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
    this.setState({ videoTrack: mediaStream.getVideoTracks()[0] });
  };

  fetchAudioTrack = async constraints => {
    if (this.state.audioTrack) {
      this.state.audioTrack.stop();
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.setState({ audioTrack: mediaStream.getAudioTracks()[0] });
      return true;
    } catch (e) {
      // Error fetching audio track, most likely a permission denial.
      this.setState({ audioTrack: null });
      return false;
    }
  };

  setupNewMediaStream = async () => {
    const mediaStream = new MediaStream();

    await this.fetchMicDevices();

    if (this.state.videoTrack) {
      mediaStream.addTrack(this.state.videoTrack);
    }

    // we should definitely have an audioTrack at this point unless they denied mic access
    if (this.state.audioTrack) {
      mediaStream.addTrack(this.state.audioTrack);

      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const micLevelAudioContext = new AudioContext();
      const micSource = micLevelAudioContext.createMediaStreamSource(mediaStream);
      const analyser = micLevelAudioContext.createAnalyser();
      analyser.fftSize = 32;
      const levels = new Uint8Array(analyser.frequencyBinCount);

      micSource.connect(analyser);

      const micUpdateInterval = setInterval(() => {
        analyser.getByteTimeDomainData(levels);
        let v = 0;
        for (let x = 0; x < levels.length; x++) {
          v = Math.max(levels[x] - 128, v);
        }
        const level = v / 128.0;
        // Multiplier to increase visual indicator.
        const multiplier = 6;
        // We use a moving average to smooth out the visual animation or else it would twitch too fast for
        // the css renderer to keep up.
        this.micLevelMovingAverage.push(Date.now(), level * multiplier);
        const average = this.micLevelMovingAverage.movingAverage();
        this.setState({ micLevel: average });
      }, 50);

      const micDeviceId = this.micDeviceIdForMicLabel(this.micLabelForMediaStream(mediaStream));

      if (micDeviceId) {
        this.props.store.update({ lastUsedMicDeviceId: micDeviceId });
      }

      this.setState({ micLevelAudioContext, micUpdateInterval });
    }

    this.setState({ mediaStream });
  };

  onMicGrantButton = async () => {
    if (this.state.entryStep == ENTRY_STEPS.mic_grant) {
      const { hasAudio } = await this.setMediaStreamToDefault();

      if (hasAudio) {
        this.setState({ entryStep: ENTRY_STEPS.mic_granted });
      } else {
        await this.beginAudioSetup();
      }
    } else {
      await this.beginAudioSetup();
    }
  };

  onProfileFinished = () => {
    this.setState({ showProfileEntry: false });
  };

  beginAudioSetup = async () => {
    this.startTestTone();
    this.setState({ entryStep: ENTRY_STEPS.audio_setup });
  };

  fetchMicDevices = () => {
    return new Promise(resolve => {
      navigator.mediaDevices.enumerateDevices().then(mediaDevices => {
        this.setState(
          {
            micDevices: mediaDevices
              .filter(d => d.kind === "audioinput")
              .map(d => ({ deviceId: d.deviceId, label: d.label }))
          },
          resolve
        );
      });
    });
  };

  shouldShowHmdMicWarning = () => {
    if (mobiledetect.mobile()) return false;
    if (!this.state.enterInVR) return false;
    if (!this.hasHmdMicrophone()) return false;

    return !HMD_MIC_REGEXES.find(r => this.selectedMicLabel().match(r));
  };

  hasHmdMicrophone = () => {
    return !!this.state.micDevices.find(d => HMD_MIC_REGEXES.find(r => d.label.match(r)));
  };

  micLabelForMediaStream = mediaStream => {
    return (mediaStream && mediaStream.getAudioTracks().length > 0 && mediaStream.getAudioTracks()[0].label) || "";
  };

  selectedMicLabel = () => {
    return this.micLabelForMediaStream(this.state.mediaStream);
  };

  micDeviceIdForMicLabel = label => {
    return this.state.micDevices.filter(d => d.label === label).map(d => d.deviceId)[0];
  };

  selectedMicDeviceId = () => {
    return this.micDeviceIdForMicLabel(this.selectedMicLabel());
  };

  onAudioReadyButton = () => {
    this.props.enterScene(this.state.mediaStream, this.state.enterInVR, this.props.janusRoomId);

    const mediaStream = this.state.mediaStream;

    if (mediaStream) {
      if (mediaStream.getAudioTracks().length > 0) {
        console.log(`Using microphone: ${mediaStream.getAudioTracks()[0].label}`);
      }

      if (mediaStream.getVideoTracks().length > 0) {
        console.log("Screen sharing enabled.");
      }
    }

    this.stopTestTone();

    if (this.state.micLevelAudioContext) {
      this.state.micLevelAudioContext.close();
      clearInterval(this.state.micUpdateInterval);
    }

    this.setState({ entryStep: ENTRY_STEPS.finished });
  };

  render() {
    if (!this.props.initialEnvironmentLoaded || !this.props.availableVREntryTypes || !this.props.janusRoomId) {
      return (
        <IntlProvider locale={lang} messages={messages}>
          <div className="loading-panel">
            <div className="loader-wrap">
              <div className="loader">
                <div className="loader-center" />
              </div>
            </div>
            <div className="loading-panel__title">
              <b>moz://a</b> duck
            </div>
          </div>
        </IntlProvider>
      );
    }

    if (this.state.exited) {
      return (
        <IntlProvider locale={lang} messages={messages}>
          <div className="exited-panel">
            <div className="loading-panel__title">
              <b>moz://a</b> duck
            </div>
            <div className="loading-panel__subtitle">
              <FormattedMessage id="exit.subtitle" />
            </div>
          </div>
        </IntlProvider>
      );
    }

    const daydreamMaybeSubtitle = messages["entry.daydream-via-chrome"];

    // Only show this in desktop firefox since other browsers/platforms will ignore the "screen" media constraint and
    // will attempt to share your webcam instead!
    const screenSharingCheckbox = this.props.enableScreenSharing &&
      !mobiledetect.mobile() &&
      /firefox/i.test(navigator.userAgent) && (
        <label className="entry-panel__screen-sharing">
          <input
            className="entry-panel__screen-sharing__checkbox"
            type="checkbox"
            value={this.state.shareScreen}
            onChange={this.setStateAndRequestScreen}
          />
          <FormattedMessage id="entry.enable-screen-sharing" />
        </label>
      );

    const entryPanel =
      this.state.entryStep === ENTRY_STEPS.start ? (
        <div className="entry-panel">
          <TwoDEntryButton onClick={this.enter2D} />
          {this.props.availableVREntryTypes.generic !== VR_DEVICE_AVAILABILITY.no && (
            <GenericEntryButton onClick={this.enterVR} />
          )}
          {this.props.availableVREntryTypes.gearvr !== VR_DEVICE_AVAILABILITY.no && (
            <GearVREntryButton onClick={this.enterGearVR} />
          )}
          {this.props.availableVREntryTypes.daydream !== VR_DEVICE_AVAILABILITY.no && (
            <DaydreamEntryButton
              onClick={this.enterDaydream}
              subtitle={
                this.props.availableVREntryTypes.daydream == VR_DEVICE_AVAILABILITY.maybe ? daydreamMaybeSubtitle : ""
              }
            />
          )}
          {this.props.availableVREntryTypes.cardboard !== VR_DEVICE_AVAILABILITY.no && (
            <div className="entry-panel__secondary" onClick={this.enterVR}>
              <FormattedMessage id="entry.cardboard" />
            </div>
          )}
          {screenSharingCheckbox}
        </div>
      ) : null;

    const micPanel =
      this.state.entryStep === ENTRY_STEPS.mic_grant || this.state.entryStep == ENTRY_STEPS.mic_granted ? (
        <div className="mic-grant-panel">
          <div className="mic-grant-panel__title">
            <FormattedMessage
              id={this.state.entryStep == ENTRY_STEPS.mic_grant ? "audio.grant-title" : "audio.granted-title"}
            />
          </div>
          <div className="mic-grant-panel__subtitle">
            <FormattedMessage
              id={this.state.entryStep == ENTRY_STEPS.mic_grant ? "audio.grant-subtitle" : "audio.granted-subtitle"}
            />
          </div>
          <div className="mic-grant-panel__button-container">
            {this.state.entryStep == ENTRY_STEPS.mic_grant ? (
              <button className="mic-grant-panel__button" onClick={this.onMicGrantButton}>
                <img src="../assets/images/mic_denied.png" srcSet="../assets/images/mic_denied@2x.png 2x" />
              </button>
            ) : (
              <button className="mic-grant-panel__button" onClick={this.onMicGrantButton}>
                <img src="../assets/images/mic_granted.png" srcSet="../assets/images/mic_granted@2x.png 2x" />
              </button>
            )}
          </div>
          {this.state.entryStep == ENTRY_STEPS.mic_granted && (
            <button className="mic-grant-panel__next" onClick={this.onMicGrantButton}>
              <FormattedMessage id="audio.granted-next" />
            </button>
          )}
        </div>
      ) : null;

    const maxLevelHeight = 111;
    const micClip = {
      clip: `rect(${maxLevelHeight - Math.floor(this.state.micLevel * maxLevelHeight)}px, 111px, 111px, 0px)`
    };
    const speakerClip = { clip: `rect(${this.state.tonePlaying ? 0 : maxLevelHeight}px, 111px, 111px, 0px)` };

    const audioSetupPanel =
      this.state.entryStep === ENTRY_STEPS.audio_setup ? (
        <div className="audio-setup-panel">
          <div className="audio-setup-panel__title">
            <FormattedMessage id="audio.title" />
          </div>
          <div className="audio-setup-panel__subtitle">
            {(mobiledetect.mobile() || this.state.enterInVR) && (
              <FormattedMessage id={mobiledetect.mobile() ? "audio.subtitle-mobile" : "audio.subtitle-desktop"} />
            )}
          </div>
          <div className="audio-setup-panel__levels">
            <div className="audio-setup-panel__levels__icon">
              <img
                src="../assets/images/level_background.png"
                srcSet="../assets/images/level_background@2x.png 2x"
                className="audio-setup-panel__levels__icon-part"
              />
              <img
                src="../assets/images/level_fill.png"
                srcSet="../assets/images/level_fill@2x.png 2x"
                className="audio-setup-panel__levels__icon-part"
                style={micClip}
              />
              {this.state.audioTrack ? (
                <img
                  src="../assets/images/mic_level.png"
                  srcSet="../assets/images/mic_level@2x.png 2x"
                  className="audio-setup-panel__levels__icon-part"
                />
              ) : (
                <img
                  src="../assets/images/mic_denied.png"
                  srcSet="../assets/images/mic_denied@2x.png 2x"
                  className="audio-setup-panel__levels__icon-part"
                />
              )}
            </div>
            <div className="audio-setup-panel__levels__icon">
              <img
                src="../assets/images/level_background.png"
                srcSet="../assets/images/level_background@2x.png 2x"
                className="audio-setup-panel__levels__icon-part"
              />
              <img
                src="../assets/images/level_fill.png"
                srcSet="../assets/images/level_fill@2x.png 2x"
                className="audio-setup-panel__levels__icon-part"
                style={speakerClip}
              />
              <img
                src="../assets/images/speaker_level.png"
                srcSet="../assets/images/speaker_level@2x.png 2x"
                className="audio-setup-panel__levels__icon-part"
              />
            </div>
          </div>
          {this.state.audioTrack && (
            <div className="audio-setup-panel__device-chooser">
              <select
                className="audio-setup-panel__device-chooser__dropdown"
                value={this.selectedMicDeviceId()}
                onChange={this.micDeviceChanged}
              >
                {this.state.micDevices.map(d => (
                  <option key={d.deviceId} value={d.deviceId}>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{d.label}
                  </option>
                ))}
              </select>
              <img
                className="audio-setup-panel__device-chooser__mic-icon"
                src="../assets/images/mic_small.png"
                srcSet="../assets/images/mic_small@2x.png 2x"
              />
              <img
                className="audio-setup-panel__device-chooser__dropdown-arrow"
                src="../assets/images/dropdown_arrow.png"
                srcSet="../assets/images/dropdown_arrow@2x.png 2x"
              />
            </div>
          )}
          {this.shouldShowHmdMicWarning() && (
            <div className="audio-setup-panel__hmd-mic-warning">
              <img
                src="../assets/images/warning_icon.png"
                srcSet="../assets/images/warning_icon@2x.png 2x"
                className="audio-setup-panel__hmd-mic-warning__icon"
              />
              <span className="audio-setup-panel__hmd-mic-warning__label">
                <FormattedMessage id="audio.hmd-mic-warning" />
              </span>
            </div>
          )}
          <button className="audio-setup-panel__enter-button" onClick={this.onAudioReadyButton}>
            <FormattedMessage id="audio.enter-now" />
          </button>
        </div>
      ) : null;

    const dialogContents = this.isWaitingForAutoExit() ? (
      <AutoExitWarning secondsRemaining={this.state.secondsRemainingBeforeAutoExit} onCancel={this.endAutoExitTimer} />
    ) : (
      <div className="entry-dialog">
        <ProfileInfoHeader
          name={this.props.store.state.profile.display_name}
          onClick={() => this.setState({ showProfileEntry: true })}
        />
        {entryPanel}
        {micPanel}
        {audioSetupPanel}
      </div>
    );

    const dialogClassNames = classNames("ui-dialog", {
      "ui-dialog--darkened": this.state.entryStep !== ENTRY_STEPS.finished
    });

    const dialogBoxClassNames = classNames("ui-interactive", "ui-dialog-box");

    const dialogBoxContentsClassNames = classNames({
      "ui-dialog-box-contents": true,
      "ui-dialog-box-contents--backgrounded": this.state.showProfileEntry
    });

    return (
      <IntlProvider locale={lang} messages={messages}>
        <div className="ui">
          <div className={dialogClassNames}>
            {(this.state.entryStep !== ENTRY_STEPS.finished || this.isWaitingForAutoExit()) && (
              <div className={dialogBoxClassNames}>
                <div className={dialogBoxContentsClassNames}>{dialogContents}</div>

                {this.state.showProfileEntry && (
                  <ProfileEntryPanel
                    finished={this.onProfileFinished}
                    store={this.props.store}
                    htmlPrefix={this.props.htmlPrefix}
                  />
                )}
              </div>
            )}
          </div>
          {this.state.entryStep === ENTRY_STEPS.finished ? (
            <div>
              <TwoDHUD muted={this.state.muted} onToggleMute={this.toggleMute} />
              <Footer />
            </div>
          ) : null}
        </div>
      </IntlProvider>
    );
  }
}

export default UIRoot;
