import React, { Component } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import copy from "copy-to-clipboard";
import { VR_DEVICE_AVAILABILITY } from "../utils/vr-caps-detect";
import { IntlProvider, FormattedMessage, addLocaleData } from "react-intl";
import en from "react-intl/locale-data/en";
import MovingAverage from "moving-average";
import screenfull from "screenfull";
import styles from "../assets/stylesheets/ui-root.scss";
import entryStyles from "../assets/stylesheets/entry.scss";

import { lang, messages } from "../utils/i18n";
import AutoExitWarning from "./auto-exit-warning";
import {
  TwoDEntryButton,
  DeviceEntryButton,
  GenericEntryButton,
  DaydreamEntryButton,
  SafariEntryButton
} from "./entry-buttons.js";
import ProfileEntryPanel from "./profile-entry-panel";
import HelpDialog from "./help-dialog.js";
import SafariDialog from "./safari-dialog.js";
import WebVRRecommendDialog from "./webvr-recommend-dialog.js";
import InviteTeamDialog from "./invite-team-dialog.js";
import InviteDialog from "./invite-dialog.js";
import LinkDialog from "./link-dialog.js";
import CreateObjectDialog from "./create-object-dialog.js";
import PresenceLog from "./presence-log.js";
import PresenceList from "./presence-list.js";
import TwoDHUD from "./2d-hud";
import { faUsers } from "@fortawesome/free-solid-svg-icons/faUsers";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQuestion } from "@fortawesome/free-solid-svg-icons/faQuestion";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons/faChevronDown";
import { faChevronUp } from "@fortawesome/free-solid-svg-icons/faChevronUp";

addLocaleData([...en]);

const ENTRY_STEPS = {
  start: "start",
  device: "device",
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
    onSendMessage: PropTypes.func,
    concurrentLoadDetector: PropTypes.object,
    disableAutoExitOnConcurrentLoad: PropTypes.bool,
    forcedVREntryType: PropTypes.string,
    enableScreenSharing: PropTypes.bool,
    isBotMode: PropTypes.bool,
    store: PropTypes.object,
    scene: PropTypes.object,
    hubChannel: PropTypes.object,
    linkChannel: PropTypes.object,
    hubEntryCode: PropTypes.number,
    availableVREntryTypes: PropTypes.object,
    environmentSceneLoaded: PropTypes.bool,
    roomUnavailableReason: PropTypes.string,
    platformUnsupportedReason: PropTypes.string,
    hubId: PropTypes.string,
    hubName: PropTypes.string,
    isSupportAvailable: PropTypes.bool,
    presenceLogEntries: PropTypes.array,
    presences: PropTypes.object,
    sessionId: PropTypes.string
  };

  state = {
    entryStep: ENTRY_STEPS.start,
    enterInVR: false,
    dialog: null,
    showInviteDialog: false,
    showLinkDialog: false,
    showPresenceList: false,
    linkCode: null,
    linkCodeCancel: null,
    miniInviteActivated: false,

    shareScreen: false,
    requestedScreen: false,
    mediaStream: null,
    videoTrack: null,
    audioTrack: null,
    entryPanelCollapsed: false,

    toneInterval: null,
    tonePlaying: false,

    micLevel: 0,
    micDevices: [],
    micUpdateInterval: null,

    profileNamePending: "Hello",

    autoExitTimerStartedAt: null,
    autoExitTimerInterval: null,
    secondsRemainingBeforeAutoExit: Infinity,

    muted: false,
    frozen: false,
    spacebubble: true,

    exited: false,

    showProfileEntry: false,
    pendingMessage: ""
  };

  componentDidMount() {
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

  onSceneLoaded = () => {
    this.setState({ sceneLoaded: true });
  };

  // TODO: we need to come up with a cleaner way to handle the shared state between aframe and react than emmitting events and setting state on the scene
  onAframeStateChanged = e => {
    if (!(e.detail === "muted" || e.detail === "frozen" || e.detail === "spacebubble")) return;
    this.setState({
      [e.detail]: this.props.scene.is(e.detail)
    });
  };

  toggleMute = () => {
    this.props.scene.emit("action_mute");
  };

  toggleFreeze = () => {
    this.props.scene.emit("action_freeze");
  };

  toggleSpaceBubble = () => {
    this.props.scene.emit("action_space_bubble");
  };

  spawnPen = () => {
    this.props.scene.emit("penButtonPressed");
  };

  handleStartEntry = () => {
    const promptForNameAndAvatarBeforeEntry = !this.props.store.state.activity.hasChangedName;

    if (promptForNameAndAvatarBeforeEntry) {
      this.setState({ showProfileEntry: true });
    }

    if (!this.props.forcedVREntryType) {
      this.goToEntryStep(ENTRY_STEPS.device);
    } else if (this.props.forcedVREntryType.startsWith("daydream")) {
      this.enterDaydream();
    } else if (this.props.forcedVREntryType.startsWith("vr")) {
      this.enterVR();
    } else if (this.props.forcedVREntryType.startsWith("2d")) {
      this.enter2D();
    }
  };

  goToEntryStep = entryStep => {
    this.setState({ entryStep: entryStep, showInviteDialog: false });
  };

  playTestTone = () => {
    const toneClip = document.querySelector("#test-tone");
    toneClip.currentTime = 0;
    toneClip.play();
    clearTimeout(this.testToneTimeout);
    this.setState({ tonePlaying: true });
    const toneLength = 1393;
    this.testToneTimeout = setTimeout(() => {
      this.setState({ tonePlaying: false });
    }, toneLength);
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
      this.beginOrSkipAudioSetup();
    } else {
      this.goToEntryStep(ENTRY_STEPS.mic_grant);
    }
  };

  enter2D = async () => {
    await this.performDirectEntryFlow(false);
  };

  enterVR = async () => {
    if (this.props.availableVREntryTypes.generic !== VR_DEVICE_AVAILABILITY.maybe) {
      await this.performDirectEntryFlow(true);
    } else {
      this.showWebVRRecommendDialog();
    }
  };

  enterDaydream = async () => {
    await this.performDirectEntryFlow(true);
  };

  micDeviceChanged = async ev => {
    const constraints = { audio: { deviceId: { exact: [ev.target.value] } } };
    await this.fetchAudioTrack(constraints);
    await this.setupNewMediaStream();
  };

  setMediaStreamToDefault = async () => {
    let hasAudio = false;
    const { lastUsedMicDeviceId } = this.props.store.state.settings;

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
          width: 720 * (screen.width / screen.height),
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
        this.setState(state => {
          if (Math.abs(average - state.micLevel) > 0.0001) {
            return { micLevel: average };
          }
        });
      }, 50);

      const micDeviceId = this.micDeviceIdForMicLabel(this.micLabelForMediaStream(mediaStream));

      if (micDeviceId) {
        this.props.store.update({ settings: { lastUsedMicDeviceId: micDeviceId } });
      }

      this.setState({ micLevelAudioContext, micUpdateInterval });
    }

    this.setState({ mediaStream });
  };

  onMicGrantButton = async () => {
    if (this.state.entryStep == ENTRY_STEPS.mic_grant) {
      const { hasAudio } = await this.setMediaStreamToDefault();

      if (hasAudio) {
        this.goToEntryStep(ENTRY_STEPS.mic_granted);
      } else {
        this.beginOrSkipAudioSetup();
      }
    } else {
      this.beginOrSkipAudioSetup();
    }
  };

  onProfileFinished = () => {
    this.setState({ showProfileEntry: false });
    this.props.hubChannel.sendProfileUpdate();
  };

  beginOrSkipAudioSetup = () => {
    if (!this.props.forcedVREntryType || !this.props.forcedVREntryType.endsWith("_now")) {
      this.goToEntryStep(ENTRY_STEPS.audio_setup);
    } else {
      setTimeout(this.onAudioReadyButton, 3000); // Need to wait otherwise input doesn't work :/
    }
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
    if (AFRAME.utils.device.isMobile()) return false;
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
    if (AFRAME.utils.device.isMobile() && !this.state.enterInVR && screenfull.enabled) {
      screenfull.request();
    }

    this.props.enterScene(this.state.mediaStream, this.state.enterInVR, this.props.hubId);

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
    clearTimeout(this.testToneTimeout);

    if (this.state.micLevelAudioContext) {
      this.state.micLevelAudioContext.close();
      clearInterval(this.state.micUpdateInterval);
    }

    this.goToEntryStep(ENTRY_STEPS.finished);
  };

  attemptLink = async () => {
    this.setState({ showLinkDialog: true });
    const { code, cancel, onFinished } = await this.props.linkChannel.generateCode();
    this.setState({ linkCode: code, linkCodeCancel: cancel });
    onFinished.then(() => this.setState({ showLinkDialog: false, linkCode: null, linkCodeCancel: null }));
  };

  showInviteDialog = () => {
    this.setState({ showInviteDialog: true });
  };

  toggleInviteDialog = async () => {
    this.setState({ showInviteDialog: !this.state.showInviteDialog });
  };

  createObject = media => {
    this.props.scene.emit("add_media", media);
  };

  closeDialog = () => {
    this.setState({ dialog: null });
  };

  showHelpDialog = () => {
    this.setState({ dialog: <HelpDialog onClose={this.closeDialog} /> });
  };

  showSafariDialog = () => {
    this.setState({ dialog: <SafariDialog onClose={this.closeDialog} /> });
  };

  showInviteTeamDialog = () => {
    this.setState({ dialog: <InviteTeamDialog hubChannel={this.props.hubChannel} onClose={this.closeDialog} /> });
  };

  showCreateObjectDialog = () => {
    this.setState({ dialog: <CreateObjectDialog onCreate={this.createObject} onClose={this.closeDialog} /> });
  };

  showWebVRRecommendDialog = () => {
    this.setState({ dialog: <WebVRRecommendDialog onClose={this.closeDialog} /> });
  };

  onMiniInviteClicked = () => {
    const link = "https://hub.link/" + this.props.hubId;

    this.setState({ miniInviteActivated: true });
    setTimeout(() => {
      this.setState({ miniInviteActivated: false });
    }, 5000);

    if (navigator.share) {
      navigator.share({ title: document.title, url: link });
    } else {
      copy(link);
    }
  };

  sendMessage = e => {
    e.preventDefault();
    this.props.onSendMessage(this.state.pendingMessage);
    this.setState({ pendingMessage: "" });
  };

  occupantCount = () => {
    return this.props.presences ? Object.entries(this.props.presences).length : 0;
  };

  renderExitedPane = () => {
    let subtitle = null;
    if (this.props.roomUnavailableReason === "closed") {
      // TODO i18n, due to links and markup
      subtitle = (
        <div>
          Sorry, this room is no longer available.
          <p />
          A room may be closed if we receive reports that it violates our{" "}
          <a target="_blank" rel="noreferrer noopener" href="https://github.com/mozilla/hubs/blob/master/TERMS.md">
            Terms of Use
          </a>.
          <br />
          If you have questions, contact us at <a href="mailto:hubs@mozilla.com">hubs@mozilla.com</a>.
          <p />
          If you&apos;d like to run your own server, hubs&apos;s source code is available on{" "}
          <a href="https://github.com/mozilla/hubs">GitHub</a>.
        </div>
      );
    } else if (this.props.platformUnsupportedReason === "no_data_channels") {
      // TODO i18n, due to links and markup
      subtitle = (
        <div>
          Your browser does not support{" "}
          <a
            href="https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/createDataChannel#Browser_compatibility"
            rel="noreferrer noopener"
          >
            WebRTC Data Channels
          </a>, which is required to use Hubs.<br />If you&quot;d like to use Hubs with Oculus or SteamVR, you can{" "}
          <a href="https://www.mozilla.org/firefox" rel="noreferrer noopener">
            Download Firefox
          </a>.
        </div>
      );
    } else {
      const reason = this.props.roomUnavailableReason || this.props.platformUnsupportedReason;
      const exitSubtitleId = `exit.subtitle.${this.state.exited ? "exited" : reason}`;
      subtitle = (
        <div>
          <FormattedMessage id={exitSubtitleId} />
          <p />
          {this.props.roomUnavailableReason && (
            <div>
              You can also <a href="/">create a new room</a>.
            </div>
          )}
        </div>
      );
    }

    return (
      <IntlProvider locale={lang} messages={messages}>
        <div className="exited-panel">
          <img className="exited-panel__logo" src="../assets/images/logo.svg" />
          <div className="exited-panel__subtitle">{subtitle}</div>
        </div>
      </IntlProvider>
    );
  };

  renderBotMode = () => {
    return (
      <div className="loading-panel">
        <img className="loading-panel__logo" src="../assets/images/logo.svg" />
        <input type="file" id="bot-audio-input" accept="audio/*" />
        <input type="file" id="bot-data-input" accept="application/json" />
      </div>
    );
  };

  renderLoader = () => {
    return (
      <IntlProvider locale={lang} messages={messages}>
        <div className="loading-panel">
          <div className="loader-wrap">
            <div className="loader">
              <div className="loader-center" />
            </div>
          </div>

          <img className="loading-panel__logo" src="../assets/images/hub-preview-light-no-shadow.png" />
        </div>
      </IntlProvider>
    );
  };

  renderEntryStartPanel = () => {
    return (
      <div className={entryStyles.entryPanel}>
        <div className={entryStyles.name}>{this.props.hubName}</div>

        <div className={entryStyles.center}>
          <div onClick={() => this.setState({ showProfileEntry: true })} className={entryStyles.profileName}>
            <img src="../assets/images/account.svg" className={entryStyles.profileIcon} />
            <div title={this.props.store.state.profile.displayName}>{this.props.store.state.profile.displayName}</div>
          </div>

          <form onSubmit={this.sendMessage}>
            <div className={styles.messageEntry}>
              <input
                className={styles.messageEntryInput}
                value={this.state.pendingMessage}
                onFocus={e => e.target.select()}
                onChange={e => this.setState({ pendingMessage: e.target.value })}
                placeholder="Send a message..."
              />
              <input className={styles.messageEntrySubmit} type="submit" value="send" />
            </div>
          </form>
        </div>

        <div className={entryStyles.buttonContainer}>
          <button
            className={classNames([entryStyles.actionButton, entryStyles.wideButton])}
            onClick={() => this.handleStartEntry()}
          >
            <FormattedMessage id="entry.enter-room" />
          </button>
        </div>
      </div>
    );
  };

  renderDevicePanel = () => {
    // Only screen sharing in desktop firefox since other browsers/platforms will ignore the "screen" media constraint and will attempt to share your webcam instead!
    const isFireFox = /firefox/i.test(navigator.userAgent);
    const isNonMobile = !AFRAME.utils.device.isMobile();

    const screenSharingCheckbox =
      this.props.enableScreenSharing && isNonMobile && isFireFox && this.renderScreensharing();

    return (
      <div className={entryStyles.entryPanel}>
        <div className={entryStyles.title}>
          <FormattedMessage id="entry.choose-device" />
        </div>

        <div className={entryStyles.buttonContainer}>
          {this.props.availableVREntryTypes.screen === VR_DEVICE_AVAILABILITY.yes && (
            <TwoDEntryButton onClick={this.enter2D} />
          )}
          {this.props.availableVREntryTypes.safari === VR_DEVICE_AVAILABILITY.maybe && (
            <SafariEntryButton onClick={this.showSafariDialog} />
          )}
          {this.props.availableVREntryTypes.generic !== VR_DEVICE_AVAILABILITY.no && (
            <GenericEntryButton onClick={this.enterVR} />
          )}
          {this.props.availableVREntryTypes.daydream === VR_DEVICE_AVAILABILITY.yes && (
            <DaydreamEntryButton onClick={this.enterDaydream} subtitle={null} />
          )}
          <DeviceEntryButton onClick={() => this.attemptLink()} isInHMD={this.props.availableVREntryTypes.isInHMD} />
          {this.props.availableVREntryTypes.cardboard !== VR_DEVICE_AVAILABILITY.no && (
            <div className={entryStyles.secondary} onClick={this.enterVR}>
              <FormattedMessage id="entry.cardboard" />
            </div>
          )}
          {screenSharingCheckbox}
        </div>
      </div>
    );
  };

  renderScreensharing = () => {
    return (
      <label className={entryStyles.screenSharing}>
        <input
          className={entryStyles.checkbox}
          type="checkbox"
          value={this.state.shareScreen}
          onChange={this.setStateAndRequestScreen}
        />
        <FormattedMessage id="entry.enable-screen-sharing" />
      </label>
    );
  };

  renderMicPanel = () => {
    return (
      <div className="mic-grant-panel">
        <div className="mic-grant-panel__grant-container">
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
        </div>
        <div className="mic-grant-panel__next-container">
          <button className={classNames("mic-grant-panel__next")} onClick={this.onMicGrantButton}>
            <FormattedMessage id="audio.granted-next" />
          </button>
        </div>
      </div>
    );
  };

  renderAudioSetupPanel = () => {
    const maxLevelHeight = 111;
    const micClip = {
      clip: `rect(${maxLevelHeight - Math.floor(this.state.micLevel * maxLevelHeight)}px, 111px, 111px, 0px)`
    };
    const speakerClip = { clip: `rect(${this.state.tonePlaying ? 0 : maxLevelHeight}px, 111px, 111px, 0px)` };
    const subtitleId = AFRAME.utils.device.isMobile() ? "audio.subtitle-mobile" : "audio.subtitle-desktop";
    return (
      <div className="audio-setup-panel">
        <div>
          <div className="audio-setup-panel__title">
            <FormattedMessage id="audio.title" />
          </div>
          <div className="audio-setup-panel__subtitle">
            {(AFRAME.utils.device.isMobile() || this.state.enterInVR) && <FormattedMessage id={subtitleId} />}
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
            <div className="audio-setup-panel__levels__icon" onClick={this.playTestTone}>
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
        </div>
        <div className="audio-setup-panel__enter-button-container">
          <button className="audio-setup-panel__enter-button" onClick={this.onAudioReadyButton}>
            <FormattedMessage id="audio.enter-now" />
          </button>
        </div>
      </div>
    );
  };

  render() {
    const isExited = this.state.exited || this.props.roomUnavailableReason || this.props.platformUnsupportedReason;
    const isLoading = !this.props.environmentSceneLoaded || !this.props.availableVREntryTypes || !this.props.hubId;

    if (isExited) return this.renderExitedPane();
    if (isLoading) return this.renderLoader();
    if (this.props.isBotMode) return this.renderBotMode();

    const startPanel = this.state.entryStep === ENTRY_STEPS.start && this.renderEntryStartPanel();
    const devicePanel = this.state.entryStep === ENTRY_STEPS.device && this.renderDevicePanel();

    const micPanel =
      (this.state.entryStep === ENTRY_STEPS.mic_grant || this.state.entryStep === ENTRY_STEPS.mic_granted) &&
      this.renderMicPanel();

    const audioSetupPanel = this.state.entryStep === ENTRY_STEPS.audio_setup && this.renderAudioSetupPanel();

    // Dialog is empty if coll
    let dialogContents = null;

    if (this.state.entryPanelCollapsed && !this.isWaitingForAutoExit()) {
      dialogContents = (
        <div className={entryStyles.entryDialog}>
          <div>&nbsp;</div>
          <button onClick={() => this.setState({ entryPanelCollapsed: false })} className={entryStyles.expand}>
            <i>
              <FontAwesomeIcon icon={faChevronUp} />
            </i>
          </button>
        </div>
      );
    } else {
      dialogContents = this.isWaitingForAutoExit() ? (
        <AutoExitWarning
          secondsRemaining={this.state.secondsRemainingBeforeAutoExit}
          onCancel={this.endAutoExitTimer}
        />
      ) : (
        <div className={entryStyles.entryDialog}>
          {!this.state.entryPanelCollapsed && (
            <button onClick={() => this.setState({ entryPanelCollapsed: true })} className={entryStyles.collapse}>
              <i>
                <FontAwesomeIcon icon={faChevronDown} />
              </i>
            </button>
          )}
          {startPanel}
          {devicePanel}
          {micPanel}
          {audioSetupPanel}
        </div>
      );
    }

    const dialogBoxContentsClassNames = classNames({
      [styles.uiInteractive]: !this.state.dialog,
      [styles.uiDialogBoxContents]: true,
      [styles.backgrounded]: this.state.showProfileEntry
    });

    const entryFinished = this.state.entryStep === ENTRY_STEPS.finished;
    const showVREntryButton = entryFinished && this.props.availableVREntryTypes.isInHMD;

    return (
      <IntlProvider locale={lang} messages={messages}>
        <div className={styles.ui}>
          {this.state.dialog}

          {this.state.showProfileEntry && (
            <ProfileEntryPanel finished={this.onProfileFinished} store={this.props.store} />
          )}

          {(!entryFinished || this.isWaitingForAutoExit()) && (
            <div className={styles.uiDialog}>
              <PresenceLog entries={this.props.presenceLogEntries || []} />
              <div className={dialogBoxContentsClassNames}>{dialogContents}</div>
            </div>
          )}

          {entryFinished && <PresenceLog inRoom={true} entries={this.props.presenceLogEntries || []} />}
          {entryFinished && (
            <form onSubmit={this.sendMessage}>
              <div className={styles.messageEntryInRoom}>
                <input
                  className={classNames([styles.messageEntryInput, styles.messageEntryInputInRoom])}
                  value={this.state.pendingMessage}
                  onFocus={e => e.target.select()}
                  onChange={e => {
                    e.stopPropagation();
                    this.setState({ pendingMessage: e.target.value });
                  }}
                  placeholder="Send a message..."
                />
                <input
                  className={classNames([styles.messageEntrySubmit, styles.messageEntrySubmitInRoom])}
                  type="submit"
                  value="send"
                />
              </div>
            </form>
          )}

          <div
            className={classNames({
              [styles.inviteContainer]: true,
              [styles.inviteContainerBelowHud]: entryFinished,
              [styles.inviteContainerInverted]: this.state.showInviteDialog
            })}
          >
            {!showVREntryButton && (
              <button
                className={classNames({ [styles.hideSmallScreens]: this.occupantCount() > 1 && entryFinished })}
                onClick={() => this.toggleInviteDialog()}
              >
                <FormattedMessage id="entry.invite-others-nag" />
              </button>
            )}
            {!showVREntryButton &&
              this.occupantCount() > 1 &&
              entryFinished && (
                <button onClick={this.onMiniInviteClicked} className={styles.inviteMiniButton}>
                  <span>
                    {this.state.miniInviteActivated
                      ? navigator.share
                        ? "sharing..."
                        : "copied!"
                      : "hub.link/" + this.props.hubId}
                  </span>
                </button>
              )}
            {showVREntryButton && (
              <button onClick={() => this.props.scene.enterVR()}>
                <FormattedMessage id="entry.return-to-vr" />
              </button>
            )}
            {this.state.showInviteDialog && (
              <InviteDialog
                allowShare={!this.props.availableVREntryTypes.isInHMD}
                entryCode={this.props.hubEntryCode}
                hubId={this.props.hubId}
                onClose={() => this.setState({ showInviteDialog: false })}
              />
            )}
          </div>

          {this.state.showLinkDialog && (
            <LinkDialog
              linkCode={this.state.linkCode}
              onClose={() => {
                this.state.linkCodeCancel();
                this.setState({ showLinkDialog: false, linkCode: null, linkCodeCancel: null });
              }}
            />
          )}

          <button onClick={() => this.showHelpDialog()} className={styles.helpIcon}>
            <i>
              <FontAwesomeIcon icon={faQuestion} />
            </i>
          </button>

          <div
            onClick={() => this.setState({ showPresenceList: !this.state.showPresenceList })}
            className={classNames({
              [styles.presenceInfo]: true,
              [styles.presenceInfoSelected]: this.state.showPresenceList
            })}
          >
            <FontAwesomeIcon icon={faUsers} />
            <span className={styles.occupantCount}>{this.occupantCount()}</span>
          </div>

          {this.state.showPresenceList && (
            <PresenceList presences={this.props.presences} sessionId={this.props.sessionId} />
          )}

          {this.state.entryStep === ENTRY_STEPS.finished ? (
            <div>
              <TwoDHUD.TopHUD
                muted={this.state.muted}
                frozen={this.state.frozen}
                spacebubble={this.state.spacebubble}
                onToggleMute={this.toggleMute}
                onToggleFreeze={this.toggleFreeze}
                onToggleSpaceBubble={this.toggleSpaceBubble}
                onSpawnPen={this.spawnPen}
                onSpawnCamera={() => this.props.scene.emit("action_spawn_camera")}
              />
              {this.props.isSupportAvailable && (
                <div className={styles.nagCornerButton}>
                  <button onClick={() => this.showInviteTeamDialog()}>
                    <FormattedMessage id="entry.invite-team-nag" />
                  </button>
                </div>
              )}
              {!this.isWaitingForAutoExit() && (
                <TwoDHUD.BottomHUD
                  onCreateObject={() => this.showCreateObjectDialog()}
                  showPhotoPicker={AFRAME.utils.device.isMobile()}
                  onMediaPicked={this.createObject}
                />
              )}
            </div>
          ) : null}
        </div>
      </IntlProvider>
    );
  }
}

export default UIRoot;
