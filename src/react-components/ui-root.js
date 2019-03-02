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
import loaderStyles from "../assets/stylesheets/loader.scss";
import entryStyles from "../assets/stylesheets/entry.scss";
import { ReactAudioContext, WithHoverSound } from "./wrap-with-audio";
import {
  pushHistoryState,
  clearHistoryState,
  popToBeginningOfHubHistory,
  navigateToPriorPage,
  sluglessPath
} from "../utils/history";
import StateLink from "./state-link.js";
import StateRoute from "./state-route.js";

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
import MediaBrowser from "./media-browser";

import CreateObjectDialog from "./create-object-dialog.js";
import ChangeSceneDialog from "./change-scene-dialog.js";
import HelpDialog from "./help-dialog.js";
import InviteDialog from "./invite-dialog.js";
import InviteTeamDialog from "./invite-team-dialog.js";
import LinkDialog from "./link-dialog.js";
import SafariDialog from "./safari-dialog.js";
import SafariMicDialog from "./safari-mic-dialog.js";
import SignInDialog from "./sign-in-dialog.js";
import RenameRoomDialog from "./rename-room-dialog.js";
import WebRTCScreenshareUnsupportedDialog from "./webrtc-screenshare-unsupported-dialog.js";
import WebVRRecommendDialog from "./webvr-recommend-dialog.js";
import RoomInfoDialog from "./room-info-dialog.js";

import PresenceLog from "./presence-log.js";
import PresenceList from "./presence-list.js";
import SettingsMenu from "./settings-menu.js";
import TwoDHUD from "./2d-hud";
import ChatCommandHelp from "./chat-command-help";
import { spawnChatMessage } from "./chat-message";
import { showFullScreenIfAvailable, showFullScreenIfWasFullScreen } from "../utils/fullscreen";
import { handleTextFieldFocus, handleTextFieldBlur } from "../utils/focus-utils";
import { markTipScopeFinished } from "../systems/tips.js";
import { faUsers } from "@fortawesome/free-solid-svg-icons/faUsers";
import { faImage } from "@fortawesome/free-solid-svg-icons/faImage";
import { faBars } from "@fortawesome/free-solid-svg-icons/faBars";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons/faPaperPlane";
import { faCamera } from "@fortawesome/free-solid-svg-icons/faCamera";
import { faPlus } from "@fortawesome/free-solid-svg-icons/faPlus";
import { faTimes } from "@fortawesome/free-solid-svg-icons/faTimes";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons/faInfoCircle";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons/faArrowLeft";
import { faPencilAlt } from "@fortawesome/free-solid-svg-icons/faPencilAlt";

addLocaleData([...en]);

// This is a list of regexes that match the microphone labels of HMDs.
//
// If entering VR mode, and if any of these regexes match an audio device,
// the user will be prevented from entering VR until one of those devices is
// selected as the microphone.
//
// Note that this doesn't have to be exhaustive: if no devices match any regex
// then we rely upon the user to select the proper mic.
const HMD_MIC_REGEXES = [/\Wvive\W/i, /\Wrift\W/i];

const IN_ROOM_MODAL_ROUTER_PATHS = ["/media"];
const IN_ROOM_MODAL_QUERY_VARS = ["media_source"];

async function grantedMicLabels() {
  const mediaDevices = await navigator.mediaDevices.enumerateDevices();
  return mediaDevices.filter(d => d.label && d.kind === "audioinput").map(d => d.label);
}

const isMobile = AFRAME.utils.device.isMobile();
const AUTO_EXIT_TIMER_SECONDS = 10;

import webmTone from "../assets/sfx/tone.webm";
import mp3Tone from "../assets/sfx/tone.mp3";
import oggTone from "../assets/sfx/tone.ogg";
import wavTone from "../assets/sfx/tone.wav";
const toneClip = document.createElement("audio");
if (toneClip.canPlayType("audio/webm")) {
  toneClip.src = webmTone;
} else if (toneClip.canPlayType("audio/mpeg")) {
  toneClip.src = mp3Tone;
} else if (toneClip.canPlayType("audio/ogg")) {
  toneClip.src = oggTone;
} else {
  toneClip.src = wavTone;
}

class UIRoot extends Component {
  doneWithInitialLoad = false;
  willCompileAndUploadMaterials = false;

  static propTypes = {
    enterScene: PropTypes.func,
    exitScene: PropTypes.func,
    onSendMessage: PropTypes.func,
    concurrentLoadDetector: PropTypes.object,
    disableAutoExitOnConcurrentLoad: PropTypes.bool,
    forcedVREntryType: PropTypes.string,
    isBotMode: PropTypes.bool,
    store: PropTypes.object,
    mediaSearchStore: PropTypes.object,
    scene: PropTypes.object,
    authChannel: PropTypes.object,
    hubChannel: PropTypes.object,
    linkChannel: PropTypes.object,
    hubEntryCode: PropTypes.number,
    availableVREntryTypes: PropTypes.object,
    environmentSceneLoaded: PropTypes.bool,
    roomUnavailableReason: PropTypes.string,
    platformUnsupportedReason: PropTypes.string,
    hubId: PropTypes.string,
    hubName: PropTypes.string,
    hubScene: PropTypes.object,
    isSupportAvailable: PropTypes.bool,
    presenceLogEntries: PropTypes.array,
    presences: PropTypes.object,
    sessionId: PropTypes.string,
    subscriptions: PropTypes.object,
    initialIsSubscribed: PropTypes.bool,
    showSignInDialog: PropTypes.bool,
    signInMessageId: PropTypes.string,
    signInCompleteMessageId: PropTypes.string,
    signInContinueTextId: PropTypes.string,
    onContinueAfterSignIn: PropTypes.func,
    showSafariMicDialog: PropTypes.bool,
    onMediaSearchResultEntrySelected: PropTypes.func,
    activeTips: PropTypes.object,
    location: PropTypes.object,
    history: PropTypes.object
  };

  state = {
    enterInVR: false,
    entered: false,
    dialog: null,
    showInviteDialog: false,
    showPresenceList: false,
    showSettingsMenu: false,
    linkCode: null,
    linkCodeCancel: null,
    miniInviteActivated: false,

    didConnectToNetworkedScene: false,
    noMoreLoadingUpdates: false,
    hideLoader: false,
    loadingNum: 0,
    loadedNum: 0,

    shareScreen: false,
    requestedScreen: false,
    mediaStream: null,
    audioTrack: null,
    numAudioTracks: 0,

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

    pendingMessage: "",
    signedIn: false,
    videoShareMediaSource: null
  };

  constructor(props) {
    super(props);
    if (props.showSafariMicDialog) {
      this.state.dialog = <SafariMicDialog closable={false} />;
    }

    props.mediaSearchStore.setHistory(props.history);
  }

  componentDidUpdate(prevProps) {
    const { hubChannel, showSignInDialog } = this.props;
    if (hubChannel) {
      const { signedIn } = hubChannel;
      if (signedIn !== this.state.signedIn) {
        this.setState({ signedIn });
      }
    }
    if (prevProps.showSignInDialog !== showSignInDialog && showSignInDialog) {
      this.showContextualSignInDialog();
    }
    if (!this.willCompileAndUploadMaterials && this.state.noMoreLoadingUpdates) {
      this.willCompileAndUploadMaterials = true;
      // We want to ensure that react and the browser have had the chance to render / update.
      // See https://stackoverflow.com/a/34999925 , although our solution flipped setTimeout and requestAnimationFrame
      window.requestAnimationFrame(() => {
        window.setTimeout(() => {
          if (!this.props.isBotMode) {
            this.props.scene.renderer.compileAndUploadMaterials(this.props.scene.object3D, this.props.scene.camera);
          }

          this.setState({ hideLoader: true });
        }, 0);
      });
    }
  }

  componentDidMount() {
    this.props.concurrentLoadDetector.addEventListener("concurrentload", this.onConcurrentLoad);
    this.micLevelMovingAverage = MovingAverage(100);
    this.props.scene.addEventListener(
      "didConnectToNetworkedScene",
      () => {
        this.setState({ didConnectToNetworkedScene: true });
      },
      { once: true }
    );
    this.props.scene.addEventListener("model-loading", this.onObjectLoading);
    this.props.scene.addEventListener("image-loading", this.onObjectLoading);
    this.props.scene.addEventListener("model-loaded", this.onObjectLoaded);
    this.props.scene.addEventListener("image-loaded", this.onObjectLoaded);
    this.props.scene.addEventListener("model-error", this.onObjectLoaded);
    this.props.scene.addEventListener("loaded", this.onSceneLoaded);
    this.props.scene.addEventListener("stateadded", this.onAframeStateChanged);
    this.props.scene.addEventListener("stateremoved", this.onAframeStateChanged);
    this.props.scene.addEventListener("share_video_enabled", this.onShareVideoEnabled);
    this.props.scene.addEventListener("share_video_disabled", this.onShareVideoDisabled);
    this.props.scene.addEventListener("exit", this.exit);
    const scene = this.props.scene;

    const unsubscribe = this.props.history.listen((location, action) => {
      const state = location.state;

      // If we just hit back into the entry flow, just go back to the page before the room landing page.
      if (action === "POP" && state && state.entry_step && this.state.entered) {
        unsubscribe();
        navigateToPriorPage(this.props.history);
        return;
      }
    });

    // If we refreshed the page with any state history (eg if we were in the entry flow
    // or had a modal/overlay open) just reset everything to the beginning of the flow by
    // erasing all history that was accumulated for this room (including across refreshes.)
    //
    // We don't do this for the media browser case, since we want to be able to share
    // links to the browser pages
    if (this.props.history.location.state && !sluglessPath(this.props.history.location).startsWith("/media")) {
      popToBeginningOfHubHistory(this.props.history);
    }

    this.setState({
      audioContext: {
        playSound: sound => {
          scene.emit(sound);
        },
        onMouseLeave: () => {
          //          scene.emit("play_sound-hud_mouse_leave");
        }
      }
    });

    if (this.props.forcedVREntryType && this.props.forcedVREntryType.endsWith("_now")) {
      setTimeout(() => this.handleForceEntry(), 2000);
    }
  }

  componentWillUnmount() {
    this.props.scene.removeEventListener("loaded", this.onSceneLoaded);
    this.props.scene.removeEventListener("exit", this.exit);
    this.props.scene.removeEventListener("share_video_enabled", this.onShareVideoEnabled);
    this.props.scene.removeEventListener("share_video_disabled", this.onShareVideoDisabled);
  }

  showContextualSignInDialog = () => {
    const {
      signInMessageId,
      authChannel,
      signInCompleteMessageId,
      signInContinueTextId,
      onContinueAfterSignIn
    } = this.props;

    const closeAndContinue = () => {
      this.closeDialog();
      showFullScreenIfWasFullScreen();
      onContinueAfterSignIn();
    };

    this.showNonHistoriedDialog(SignInDialog, {
      message: messages[signInMessageId],
      onSignIn: async email => {
        const { authComplete } = await authChannel.startAuthentication(email, this.props.hubChannel);

        this.showNonHistoriedDialog(SignInDialog, { authStarted: true, onClose: closeAndContinue });

        await authComplete;

        this.setState({ signedIn: true });
        this.showNonHistoriedDialog(SignInDialog, {
          authComplete: true,
          message: messages[signInCompleteMessageId],
          continueText: messages[signInContinueTextId],
          onClose: closeAndContinue,
          onContinue: closeAndContinue
        });
      },
      onClose: closeAndContinue
    });
  };

  updateSubscribedState = () => {
    const isSubscribed = this.props.subscriptions && this.props.subscriptions.isSubscribed();
    this.setState({ isSubscribed });
  };

  onSceneLoaded = () => {
    this.setState({ sceneLoaded: true });
  };

  onObjectLoading = () => {
    if (!this.doneWithInitialLoad && this.loadingTimeout) {
      window.clearTimeout(this.loadingTimeout);
      this.loadingTimeout = null;
    }

    this.setState(state => {
      return { loadingNum: state.loadingNum + 1 };
    });
  };

  onObjectLoaded = () => {
    this.setState(state => {
      return { loadedNum: state.loadedNum + 1 };
    });

    if (!this.doneWithInitialLoad && this.loadingTimeout) window.clearTimeout(this.loadingTimeout);

    this.loadingTimeout = window.setTimeout(() => {
      this.doneWithInitialLoad = true;
      this.setState({ noMoreLoadingUpdates: true });
    }, 1500);
  };

  // TODO: we need to come up with a cleaner way to handle the shared state between aframe and react than emmitting events and setting state on the scene
  onAframeStateChanged = e => {
    if (!(e.detail === "muted" || e.detail === "frozen" || e.detail === "spacebubble")) return;
    this.setState({
      [e.detail]: this.props.scene.is(e.detail)
    });
  };

  onShareVideoEnabled = e => {
    this.setState({ videoShareMediaSource: e.detail.source });
  };

  onShareVideoDisabled = () => {
    this.setState({ videoShareMediaSource: null });
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

  shareVideo = mediaSource => {
    this.props.scene.emit(`action_share_${mediaSource}`);
  };

  endShareVideo = () => {
    this.props.scene.emit("action_end_video_sharing");
  };

  spawnPen = () => {
    this.props.scene.emit("penButtonPressed");
  };

  onSubscribeChanged = async () => {
    if (!this.props.subscriptions) return;

    await this.props.subscriptions.toggle();
    this.updateSubscribedState();
  };

  handleForceEntry = () => {
    if (!this.props.forcedVREntryType) return;

    if (this.props.forcedVREntryType.startsWith("daydream")) {
      this.enterDaydream();
    } else if (this.props.forcedVREntryType.startsWith("vr")) {
      this.enterVR();
    } else if (this.props.forcedVREntryType.startsWith("2d")) {
      this.enter2D();
    }
  };

  playTestTone = () => {
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
      this.pushHistoryState("entry_step", "mic_grant");
    }
  };

  enter2D = async () => {
    await this.performDirectEntryFlow(false);
  };

  enterVR = async () => {
    if (this.props.forcedVREntryType || this.props.availableVREntryTypes.generic !== VR_DEVICE_AVAILABILITY.maybe) {
      await this.performDirectEntryFlow(true);
    } else {
      this.pushHistoryState("modal", "webvr");
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

  fetchAudioTrack = async constraints => {
    if (this.state.audioTrack) {
      this.state.audioTrack.stop();
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.setState({
        audioTrack: mediaStream.getAudioTracks()[0],
        numAudioTracks: mediaStream.getAudioTracks().length
      });
      return true;
    } catch (e) {
      // Error fetching audio track, most likely a permission denial.
      this.setState({ audioTrack: null, numAudioTracks: 0 });
      return false;
    }
  };

  setupNewMediaStream = async () => {
    const mediaStream = new MediaStream();

    await this.fetchMicDevices();

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
    if (this.props.location.state && this.props.location.state.entry_step === "mic_grant") {
      const { hasAudio } = await this.setMediaStreamToDefault();

      if (hasAudio) {
        this.pushHistoryState("entry_step", "mic_granted");
      } else {
        this.beginOrSkipAudioSetup();
      }
    } else {
      this.beginOrSkipAudioSetup();
    }
  };

  onProfileFinished = () => {
    this.closeDialog();
    this.props.hubChannel.sendProfileUpdate();
  };

  beginOrSkipAudioSetup = () => {
    const skipAudioSetup = this.props.forcedVREntryType && this.props.forcedVREntryType.endsWith("_now");

    if (skipAudioSetup) {
      this.onAudioReadyButton();
    } else {
      this.pushHistoryState("entry_step", "audio");
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
    if (isMobile || AFRAME.utils.device.isMobileVR()) return false;
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

  shouldShowFullScreen = () => {
    // Disable full screen on iOS, since Safari's fullscreen mode does not let you prevent native pinch-to-zoom gestures.
    return (
      (isMobile || AFRAME.utils.device.isMobileVR()) &&
      !AFRAME.utils.device.isIOS() &&
      !this.state.enterInVR &&
      screenfull.enabled
    );
  };

  onAudioReadyButton = () => {
    if (!this.state.enterVR) {
      showFullScreenIfAvailable();
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

    this.setState({ entered: true, showInviteDialog: false });
    clearHistoryState(this.props.history);
  };

  attemptLink = async () => {
    this.pushHistoryState("overlay", "link");
    const { code, cancel, onFinished } = await this.props.linkChannel.generateCode();
    this.setState({ linkCode: code, linkCodeCancel: cancel });
    onFinished.then(() => this.setState({ log: false, linkCode: null, linkCodeCancel: null }));
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

  changeScene = url => {
    this.props.hubChannel.updateScene(url);
  };

  closeDialog = () => {
    showFullScreenIfWasFullScreen();

    if (this.state.dialog) {
      this.setState({ dialog: null });
    } else {
      this.props.history.goBack();
    }
  };

  showNonHistoriedDialog = (DialogClass, props = {}) => {
    this.setState({
      dialog: <DialogClass {...{ onClose: this.closeDialog, ...props }} />
    });
  };

  renderDialog = (DialogClass, props = {}) => <DialogClass {...{ onClose: this.closeDialog, ...props }} />;

  showSignInDialog = () => {
    this.showNonHistoriedDialog(SignInDialog, {
      message: messages["sign-in.prompt"],
      onSignIn: async email => {
        const { authComplete } = await this.props.authChannel.startAuthentication(email, this.props.hubChannel);

        this.showNonHistoriedDialog(SignInDialog, { authStarted: true });

        await authComplete;

        this.setState({ signedIn: true });
        this.closeDialog();
      }
    });
  };

  signOut = async () => {
    await this.props.authChannel.signOut(this.props.hubChannel);
    this.setState({ signedIn: false });
  };

  showWebRTCScreenshareUnsupportedDialog = () => {
    this.pushHistoryState("modal", "webrtc-screenshare");
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

  pushHistoryState = (k, v) => pushHistoryState(this.props.history, k, v);

  renderExitedPane = () => {
    let subtitle = null;
    if (this.props.roomUnavailableReason === "closed") {
      // TODO i18n, due to links and markup
      subtitle = (
        <div>
          Sorry, this room is no longer available.
          <p />A room may be closed if we receive reports that it violates our{" "}
          <WithHoverSound>
            <a target="_blank" rel="noreferrer noopener" href="https://github.com/mozilla/hubs/blob/master/TERMS.md">
              Terms of Use
            </a>
          </WithHoverSound>
          .<br />
          If you have questions, contact us at{" "}
          <WithHoverSound>
            <a href="mailto:hubs@mozilla.com">hubs@mozilla.com</a>
          </WithHoverSound>
          .<p />
          If you&apos;d like to run your own server, hubs&apos;s source code is available on{" "}
          <WithHoverSound>
            <a href="https://github.com/mozilla/hubs">GitHub</a>
          </WithHoverSound>
          .
        </div>
      );
    } else if (this.props.platformUnsupportedReason === "no_data_channels") {
      // TODO i18n, due to links and markup
      subtitle = (
        <div>
          Your browser does not support{" "}
          <WithHoverSound>
            <a
              href="https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/createDataChannel#Browser_compatibility"
              rel="noreferrer noopener"
            >
              WebRTC Data Channels
            </a>
          </WithHoverSound>
          , which is required to use Hubs.
          <br />
          If you&quot;d like to use Hubs with Oculus or SteamVR, you can{" "}
          <WithHoverSound>
            <a href="https://www.mozilla.org/firefox" rel="noreferrer noopener">
              Download Firefox
            </a>
          </WithHoverSound>
          .
        </div>
      );
    } else {
      const reason = this.props.roomUnavailableReason || this.props.platformUnsupportedReason;
      const exitSubtitleId = `exit.subtitle.${this.state.exited ? "exited" : reason}`;
      subtitle = (
        <div>
          <FormattedMessage id={exitSubtitleId} />
          <p />
          {!["left", "kicked"].includes(this.props.roomUnavailableReason) && (
            <div>
              You can also{" "}
              <WithHoverSound>
                <a href="/">create a new room</a>
              </WithHoverSound>
              .
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
    const nomore = (
      <h4 className={loaderStyles.loadingText}>
        <FormattedMessage id="loader.entering_lobby" />
      </h4>
    );
    const progress = this.state.loadingNum === 0 ? " " : `${this.state.loadedNum} / ${this.state.loadingNum} `;
    const usual = (
      <h4 className={loaderStyles.loadingText}>
        <FormattedMessage id="loader.loading" />
        {progress}
        <FormattedMessage id={this.state.loadingNum !== 1 ? "loader.objects" : "loader.object"} />
        ...
      </h4>
    );
    return (
      <IntlProvider locale={lang} messages={messages}>
        <div className="loading-panel">
          <img className="loading-panel__logo" src="../assets/images/hub-preview-light-no-shadow.png" />

          {this.state.noMoreLoadingUpdates ? nomore : usual}

          <div className="loader-wrap loader-bottom">
            <div className="loader">
              <div className="loader-center" />
            </div>
          </div>
        </div>
      </IntlProvider>
    );
  };

  renderEntryStartPanel = () => {
    const textRows = this.state.pendingMessage.split("\n").length;
    const pendingMessageTextareaHeight = textRows * 28 + "px";
    const pendingMessageFieldHeight = textRows * 28 + 20 + "px";
    const hasPush = navigator.serviceWorker && "PushManager" in window;
    const promptForNameAndAvatarBeforeEntry = !this.props.store.state.activity.hasChangedName;

    return (
      <div className={entryStyles.entryPanel}>
        <div className={entryStyles.name}>
          <span>{this.props.hubName}</span>
          {this.props.hubChannel.permissions.update_hub && (
            <StateLink
              stateKey="modal"
              stateValue="rename_room"
              history={this.props.history}
              className={entryStyles.editButton}
            >
              <i>
                <FontAwesomeIcon icon={faPencilAlt} />
              </i>
            </StateLink>
          )}
          {this.props.hubScene && (
            <StateLink
              stateKey="modal"
              stateValue="info"
              history={this.props.history}
              className={entryStyles.infoButton}
            >
              <i>
                <FontAwesomeIcon icon={faInfoCircle} />
              </i>
            </StateLink>
          )}
        </div>

        <div className={entryStyles.roomSubtitle}>
          <FormattedMessage id="entry.room" />
        </div>

        <div className={entryStyles.center}>
          {this.props.hubChannel.permissions.update_hub && (
            <WithHoverSound>
              <div
                className={entryStyles.chooseScene}
                onClick={() => this.props.mediaSearchStore.sourceNavigateWithNoNav("scenes")}
              >
                <i>
                  <FontAwesomeIcon icon={faImage} />
                </i>
                <FormattedMessage id="entry.change-scene" />
              </div>
            </WithHoverSound>
          )}

          <form onSubmit={this.sendMessage}>
            <div
              className={classNames({
                [styles.messageEntry]: true,
                [styles.messageEntryDisabled]: this.occupantCount() <= 1
              })}
              style={{ height: pendingMessageFieldHeight }}
            >
              <textarea
                className={classNames([styles.messageEntryInput, "chat-focus-target"])}
                value={this.state.pendingMessage}
                rows={textRows}
                style={{ height: pendingMessageTextareaHeight }}
                onFocus={e => handleTextFieldFocus(e.target)}
                onBlur={() => handleTextFieldBlur()}
                onChange={e => this.setState({ pendingMessage: e.target.value })}
                disabled={this.occupantCount() <= 1 ? true : false}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    this.sendMessage(e);
                  } else if (e.key === "Escape") {
                    e.target.blur();
                  }
                }}
                placeholder={
                  this.occupantCount() <= 1
                    ? "Nobody is here yet..."
                    : `Send message to ${this.occupantCount() - 1} other${this.occupantCount() - 1 > 1 ? "s" : ""}...`
                }
              />
              <WithHoverSound>
                <button
                  className={classNames([styles.messageEntryButton, styles.messageEntrySubmit])}
                  disabled={this.occupantCount() <= 1 ? true : false}
                  type="submit"
                >
                  <i>
                    <FontAwesomeIcon icon={faPaperPlane} />
                  </i>
                </button>
              </WithHoverSound>
            </div>
          </form>
        </div>

        {hasPush && (
          <div className={entryStyles.subscribe}>
            <input
              id="subscribe"
              type="checkbox"
              onChange={this.onSubscribeChanged}
              checked={this.state.isSubscribed === undefined ? this.props.initialIsSubscribed : this.state.isSubscribed}
            />
            <label htmlFor="subscribe">
              <FormattedMessage id="entry.notify_me" />
            </label>
          </div>
        )}

        <div className={entryStyles.buttonContainer}>
          <WithHoverSound>
            {promptForNameAndAvatarBeforeEntry || !this.props.forcedVREntryType ? (
              <StateLink
                stateKey="entry_step"
                stateValue={promptForNameAndAvatarBeforeEntry ? "profile" : "device"}
                history={this.props.history}
                className={classNames([entryStyles.actionButton, entryStyles.wideButton])}
              >
                <FormattedMessage id="entry.enter-room" />
              </StateLink>
            ) : (
              <button
                onClick={() => this.handleForceEntry()}
                className={classNames([entryStyles.actionButton, entryStyles.wideButton])}
              >
                <FormattedMessage id="entry.enter-room" />
              </button>
            )}
          </WithHoverSound>
        </div>
      </div>
    );
  };

  renderDevicePanel = () => {
    return (
      <div className={entryStyles.entryPanel}>
        <div onClick={() => this.props.history.goBack()} className={entryStyles.back}>
          <i>
            <FontAwesomeIcon icon={faArrowLeft} />
          </i>
          <FormattedMessage id="entry.back" />
        </div>

        <div className={entryStyles.title}>
          <FormattedMessage id="entry.choose-device" />
        </div>

        <div className={entryStyles.buttonContainer}>
          {this.props.availableVREntryTypes.cardboard !== VR_DEVICE_AVAILABILITY.no && (
            <div className={entryStyles.secondary} onClick={this.enterVR}>
              <FormattedMessage id="entry.cardboard" />
            </div>
          )}
          {this.props.availableVREntryTypes.generic !== VR_DEVICE_AVAILABILITY.no && (
            <GenericEntryButton secondary={true} onClick={this.enterVR} />
          )}
          {this.props.availableVREntryTypes.daydream === VR_DEVICE_AVAILABILITY.yes && (
            <DaydreamEntryButton secondary={true} onClick={this.enterDaydream} subtitle={null} />
          )}
          <DeviceEntryButton
            secondary={true}
            onClick={() => this.attemptLink()}
            isInHMD={this.props.availableVREntryTypes.isInHMD}
          />
          {this.props.availableVREntryTypes.safari === VR_DEVICE_AVAILABILITY.maybe && (
            <StateLink stateKey="modal" stateValue="safari" history={this.props.history}>
              <SafariEntryButton onClick={this.showSafariDialog} />
            </StateLink>
          )}
          {this.props.availableVREntryTypes.screen === VR_DEVICE_AVAILABILITY.yes && (
            <TwoDEntryButton onClick={this.enter2D} />
          )}
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

  renderMicPanel = granted => {
    return (
      <div className="mic-grant-panel">
        <div onClick={() => this.props.history.goBack()} className={entryStyles.back}>
          <i>
            <FontAwesomeIcon icon={faArrowLeft} />
          </i>
          <FormattedMessage id="entry.back" />
        </div>

        <div className="mic-grant-panel__grant-container">
          <div className="mic-grant-panel__title">
            <FormattedMessage id={granted ? "audio.granted-title" : "audio.grant-title"} />
          </div>
          <div className="mic-grant-panel__subtitle">
            <FormattedMessage id={granted ? "audio.granted-subtitle" : "audio.grant-subtitle"} />
          </div>
          <div className="mic-grant-panel__button-container">
            {granted ? (
              <WithHoverSound>
                <button className="mic-grant-panel__button" onClick={this.onMicGrantButton}>
                  <img src="../assets/images/mic_granted.png" srcSet="../assets/images/mic_granted@2x.png 2x" />
                </button>
              </WithHoverSound>
            ) : (
              <WithHoverSound>
                <button className="mic-grant-panel__button" onClick={this.onMicGrantButton}>
                  <img src="../assets/images/mic_denied.png" srcSet="../assets/images/mic_denied@2x.png 2x" />
                </button>
              </WithHoverSound>
            )}
          </div>
          <div className="mic-grant-panel__next-container">
            <WithHoverSound>
              <button className={classNames("mic-grant-panel__next")} onClick={this.onMicGrantButton}>
                <FormattedMessage id="audio.granted-next" />
              </button>
            </WithHoverSound>
          </div>
        </div>
      </div>
    );
  };

  renderAudioSetupPanel = () => {
    const maxLevelHeight = 111;
    const micClip = {
      clip: `rect(${maxLevelHeight - Math.floor(this.state.micLevel * maxLevelHeight)}px, 111px, 111px, 0px)`
    };
    const isMobileOrGo = isMobile || AFRAME.utils.device.isMobileVR();
    const speakerClip = { clip: `rect(${this.state.tonePlaying ? 0 : maxLevelHeight}px, 111px, 111px, 0px)` };
    const subtitleId = isMobileOrGo ? "audio.subtitle-mobile" : "audio.subtitle-desktop";
    return (
      <div className="audio-setup-panel">
        <div onClick={() => this.props.history.goBack()} className={entryStyles.back}>
          <i>
            <FontAwesomeIcon icon={faArrowLeft} />
          </i>
          <FormattedMessage id="entry.back" />
        </div>

        <div>
          <div className="audio-setup-panel__title">
            <FormattedMessage id="audio.title" />
          </div>
          <div className="audio-setup-panel__subtitle">
            {(isMobileOrGo || this.state.enterInVR) && <FormattedMessage id={subtitleId} />}
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
              {this.state.audioTrack && (
                <div className="audio-setup-panel__levels__test_label">
                  <FormattedMessage id="audio.talk_to_test" />
                </div>
              )}
            </div>
            <WithHoverSound>
              <div className="audio-setup-panel__levels__icon_clickable" onClick={this.playTestTone}>
                <img
                  src="../assets/images/level_action_background.png"
                  srcSet="../assets/images/level_action_background@2x.png 2x"
                  className="audio-setup-panel__levels__icon-part"
                />
                <img
                  src="../assets/images/level_action_fill.png"
                  srcSet="../assets/images/level_action_fill@2x.png 2x"
                  className="audio-setup-panel__levels__icon-part"
                  style={speakerClip}
                />
                <img
                  src="../assets/images/speaker_level.png"
                  srcSet="../assets/images/speaker_level@2x.png 2x"
                  className="audio-setup-panel__levels__icon-part"
                />
                <div className="audio-setup-panel__levels__test_label">
                  <FormattedMessage id="audio.click_to_test" />
                </div>
              </div>
            </WithHoverSound>
          </div>
          {this.state.audioTrack && this.state.micDevices.length > 1 ? (
            <div className="audio-setup-panel__device-chooser">
              <WithHoverSound>
                <select
                  className="audio-setup-panel__device-chooser__dropdown"
                  value={this.selectedMicDeviceId()}
                  onChange={this.micDeviceChanged}
                >
                  {this.state.micDevices.map(d => (
                    <option key={d.deviceId} value={d.deviceId}>
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                      {d.label}
                    </option>
                  ))}
                </select>
              </WithHoverSound>
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
          ) : (
            <div />
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
          <WithHoverSound>
            <button className="audio-setup-panel__enter-button" onClick={this.onAudioReadyButton}>
              <FormattedMessage id="audio.enter-now" />
            </button>
          </WithHoverSound>
        </div>
      </div>
    );
  };

  isInModalOrOverlay = () => {
    if (
      this.state.entered &&
      (IN_ROOM_MODAL_ROUTER_PATHS.find(x => sluglessPath(this.props.history.location).startsWith(x)) ||
        IN_ROOM_MODAL_QUERY_VARS.find(x => new URLSearchParams(this.props.history.location.search).get(x)))
    ) {
      return true;
    }

    return !!(
      (this.props.history &&
        this.props.history.location.state &&
        (this.props.history.location.state.modal || this.props.history.location.state.overlay)) ||
      this.state.dialog
    );
  };

  render() {
    const isExited = this.state.exited || this.props.roomUnavailableReason || this.props.platformUnsupportedReason;

    const isLoading = !this.state.hideLoader || !this.state.didConnectToNetworkedScene;

    if (isExited) return this.renderExitedPane();
    if (isLoading) return this.renderLoader();
    if (this.props.isBotMode) return this.renderBotMode();

    const entered = this.state.entered;

    const entryDialog = this.isWaitingForAutoExit() ? (
      <AutoExitWarning secondsRemaining={this.state.secondsRemainingBeforeAutoExit} onCancel={this.endAutoExitTimer} />
    ) : (
      <div className={entryStyles.entryDialog}>
        <StateRoute stateKey="entry_step" stateValue="device" history={this.props.history}>
          {this.renderDevicePanel()}
        </StateRoute>
        <StateRoute stateKey="entry_step" stateValue="mic_grant" history={this.props.history}>
          {this.renderMicPanel(false)}
        </StateRoute>
        <StateRoute stateKey="entry_step" stateValue="mic_granted" history={this.props.history}>
          {this.renderMicPanel(true)}
        </StateRoute>
        <StateRoute stateKey="entry_step" stateValue="audio" history={this.props.history}>
          {this.renderAudioSetupPanel()}
        </StateRoute>
        <StateRoute stateKey="entry_step" stateValue="" history={this.props.history}>
          {this.renderEntryStartPanel()}
        </StateRoute>
      </div>
    );

    const dialogBoxContentsClassNames = classNames({
      [styles.uiInteractive]: !this.isInModalOrOverlay(),
      [styles.uiDialogBoxContents]: true,
      [styles.backgrounded]: this.isInModalOrOverlay()
    });

    const showVREntryButton = entered && this.props.availableVREntryTypes.isInHMD;

    const textRows = this.state.pendingMessage.split("\n").length;
    const pendingMessageTextareaHeight = textRows * 28 + "px";
    const pendingMessageFieldHeight = textRows * 28 + 20 + "px";

    const rootStyles = {
      [styles.ui]: true,
      "ui-root": true,
      "in-modal-or-overlay": this.isInModalOrOverlay(),
      [styles.messageEntryOnTop]: this.state.messageEntryOnTop
    };

    const presenceLogEntries = this.props.presenceLogEntries || [];

    const mediaSource = this.props.mediaSearchStore.getUrlMediaSource(this.props.history.location);

    // Allow scene picker pre-entry, otherwise wait until entry
    const showMediaBrowser = mediaSource && (mediaSource === "scenes" || this.state.entered);

    return (
      <ReactAudioContext.Provider value={this.state.audioContext}>
        <IntlProvider locale={lang} messages={messages}>
          <div className={classNames(rootStyles)}>
            {this.state.dialog}

            <StateRoute
              stateKey="overlay"
              stateValue="profile"
              history={this.props.history}
              render={props => (
                <ProfileEntryPanel {...props} finished={this.onProfileFinished} store={this.props.store} />
              )}
            />
            {showMediaBrowser && (
              <MediaBrowser
                history={this.props.history}
                mediaSearchStore={this.props.mediaSearchStore}
                hubChannel={this.props.hubChannel}
                onMediaSearchResultEntrySelected={this.props.onMediaSearchResultEntrySelected}
              />
            )}
            <StateRoute
              stateKey="entry_step"
              stateValue="profile"
              history={this.props.history}
              render={props => (
                <ProfileEntryPanel
                  {...props}
                  finished={() => {
                    const unsubscribe = this.props.history.listen(() => {
                      unsubscribe();

                      if (this.props.forcedVREntryType) {
                        this.handleForceEntry();
                      } else {
                        this.pushHistoryState("entry_step", "device");
                      }
                    });

                    this.onProfileFinished();
                  }}
                  store={this.props.store}
                />
              )}
            />
            <StateRoute
              stateKey="modal"
              stateValue="rename_room"
              history={this.props.history}
              render={() =>
                this.renderDialog(RenameRoomDialog, { onRename: name => this.props.hubChannel.rename(name) })
              }
            />
            <StateRoute
              stateKey="modal"
              stateValue="help"
              history={this.props.history}
              render={() => this.renderDialog(HelpDialog)}
            />
            <StateRoute
              stateKey="modal"
              stateValue="safari"
              history={this.props.history}
              render={() => this.renderDialog(SafariDialog)}
            />
            <StateRoute
              stateKey="modal"
              stateValue="support"
              history={this.props.history}
              render={() => this.renderDialog(InviteTeamDialog, { hubChannel: this.props.hubChannel })}
            />
            <StateRoute
              stateKey="modal"
              stateValue="create"
              history={this.props.history}
              render={() => this.renderDialog(CreateObjectDialog, { onCreate: this.createObject })}
            />
            <StateRoute
              stateKey="modal"
              stateValue="change_scene"
              history={this.props.history}
              render={() => this.renderDialog(ChangeSceneDialog, { onChange: this.changeScene })}
            />
            <StateRoute
              stateKey="modal"
              stateValue="webvr"
              history={this.props.history}
              render={() => this.renderDialog(WebVRRecommendDialog)}
            />
            <StateRoute
              stateKey="modal"
              stateValue="webrtc-screenshare"
              history={this.props.history}
              render={() => this.renderDialog(WebRTCScreenshareUnsupportedDialog)}
            />
            <StateRoute
              stateKey="modal"
              stateValue="info"
              history={this.props.history}
              render={() =>
                this.renderDialog(RoomInfoDialog, { scene: this.props.hubScene, hubName: this.props.hubName })
              }
            />

            {(!this.state.entered || this.isWaitingForAutoExit()) && (
              <div className={styles.uiDialog}>
                <PresenceLog entries={presenceLogEntries} hubId={this.props.hubId} />
                <div className={dialogBoxContentsClassNames}>{entryDialog}</div>
              </div>
            )}

            {entered && (
              <PresenceLog
                onTop={this.state.messageEntryOnTop}
                inRoom={true}
                entries={presenceLogEntries}
                hubId={this.props.hubId}
              />
            )}
            {entered &&
              this.props.activeTips.bottom && (
                <div className={styles.bottomTip}>
                  <button className={styles.tipCancel} onClick={() => markTipScopeFinished("bottom")}>
                    <i>
                      <FontAwesomeIcon icon={faTimes} />
                    </i>
                  </button>
                  {this.props.activeTips.bottom.endsWith(".spawn_menu") ? (
                    <div className={styles.spawnTip}>
                      <FormattedMessage id={`tips.${this.props.activeTips.bottom}-pre`} />
                      <div className={classNames(styles.spawnTipIcon)} />
                      <FormattedMessage id={`tips.${this.props.activeTips.bottom}-post`} />
                    </div>
                  ) : (
                    <div className={styles.tip}>
                      <FormattedMessage id={`tips.${this.props.activeTips.bottom}`} />
                    </div>
                  )}
                </div>
              )}
            {entered && (
              <form onSubmit={this.sendMessage}>
                <div
                  className={classNames({ [styles.messageEntryInRoom]: true, [styles.messageEntryOnMobile]: isMobile })}
                  style={{ height: pendingMessageFieldHeight }}
                >
                  {this.state.pendingMessage.startsWith("/") && (
                    <ChatCommandHelp
                      onTop={this.state.messageEntryOnTop}
                      matchingPrefix={this.state.pendingMessage.substring(1)}
                    />
                  )}
                  <input
                    id="message-entry-media-input"
                    type="file"
                    style={{ display: "none" }}
                    accept={isMobile ? "image/*" : "*"}
                    multiple
                    onChange={e => {
                      for (const file of e.target.files) {
                        this.createObject(file);
                      }
                    }}
                  />
                  <label
                    htmlFor="message-entry-media-input"
                    title={"Upload"}
                    className={classNames([
                      styles.messageEntryButton,
                      styles.messageEntryButtonInRoom,
                      styles.messageEntryUpload
                    ])}
                  >
                    <i>
                      <FontAwesomeIcon icon={isMobile ? faCamera : faPlus} />
                    </i>
                  </label>
                  <textarea
                    style={{ height: pendingMessageTextareaHeight }}
                    className={classNames([
                      styles.messageEntryInput,
                      styles.messageEntryInputInRoom,
                      "chat-focus-target"
                    ])}
                    value={this.state.pendingMessage}
                    rows={textRows}
                    onFocus={e => {
                      handleTextFieldFocus(e.target);
                      this.setState({ messageEntryOnTop: isMobile });
                    }}
                    onBlur={() => {
                      handleTextFieldBlur();
                      this.setState({ messageEntryOnTop: false });
                    }}
                    onChange={e => {
                      e.stopPropagation();
                      this.setState({ pendingMessage: e.target.value });
                    }}
                    onKeyDown={e => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        this.sendMessage(e);
                      } else if (e.key === "Enter" && e.shiftKey && e.ctrlKey) {
                        spawnChatMessage(e.target.value);
                        this.setState({ pendingMessage: "" });
                      } else if (e.key === "Escape") {
                        e.target.blur();
                      }
                    }}
                    placeholder="Send to room..."
                  />
                  <button
                    className={classNames([styles.messageEntrySpawn])}
                    onClick={() => {
                      if (this.state.pendingMessage.length > 0) {
                        spawnChatMessage(this.state.pendingMessage);
                        this.setState({ pendingMessage: "" });
                      } else {
                        this.pushHistoryState("modal", "create");
                      }
                    }}
                  />
                  <button
                    type="submit"
                    className={classNames([
                      styles.messageEntryButton,
                      styles.messageEntryButtonInRoom,
                      styles.messageEntrySubmit
                    ])}
                  >
                    <i>
                      <FontAwesomeIcon icon={faPaperPlane} />
                    </i>
                  </button>
                </div>
              </form>
            )}

            <div
              className={classNames({
                [styles.inviteContainer]: true,
                [styles.inviteContainerBelowHud]: entered,
                [styles.inviteContainerInverted]: this.state.showInviteDialog
              })}
            >
              {!showVREntryButton &&
                !this.props.activeTips.top && (
                  <WithHoverSound>
                    <button
                      className={classNames({ [styles.hideSmallScreens]: this.occupantCount() > 1 && entered })}
                      onClick={() => this.toggleInviteDialog()}
                    >
                      <FormattedMessage id="entry.invite-others-nag" />
                    </button>
                  </WithHoverSound>
                )}
              {!showVREntryButton &&
                this.occupantCount() > 1 &&
                !this.props.activeTips.top &&
                entered && (
                  <WithHoverSound>
                    <button onClick={this.onMiniInviteClicked} className={styles.inviteMiniButton}>
                      <span>
                        {this.state.miniInviteActivated
                          ? navigator.share
                            ? "sharing..."
                            : "copied!"
                          : "hub.link/" + this.props.hubId}
                      </span>
                    </button>
                  </WithHoverSound>
                )}
              {showVREntryButton && (
                <WithHoverSound>
                  <button onClick={() => this.props.scene.enterVR()}>
                    <FormattedMessage id="entry.enter-in-vr" />
                  </button>
                </WithHoverSound>
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

            <StateRoute
              stateKey="overlay"
              stateValue="link"
              history={this.props.history}
              render={() => (
                <LinkDialog
                  linkCode={this.state.linkCode}
                  onClose={() => {
                    this.state.linkCodeCancel();
                    this.setState({ linkCode: null, linkCodeCancel: null });
                    this.props.history.goBack();
                  }}
                />
              )}
            />

            <div
              onClick={() => this.setState({ showSettingsMenu: !this.state.showSettingsMenu })}
              className={classNames({
                [styles.settingsInfo]: true,
                [styles.settingsInfoSelected]: this.state.showSettingsMenu
              })}
            >
              <FontAwesomeIcon icon={faBars} />
            </div>

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

            {this.state.showPresenceList &&
              !this.state.messageEntryOnTop && (
                <PresenceList
                  history={this.props.history}
                  presences={this.props.presences}
                  sessionId={this.props.sessionId}
                  signedIn={this.state.signedIn}
                  email={this.props.store.state.credentials.email}
                  onSignIn={this.showSignInDialog}
                  onSignOut={this.signOut}
                />
              )}

            {this.state.showSettingsMenu &&
              !this.state.messageEntryOnTop && (
                <SettingsMenu
                  history={this.props.history}
                  mediaSearchStore={this.props.mediaSearchStore}
                  hideSettings={() => this.setState({ showSettingsMenu: false })}
                  hubChannel={this.props.hubChannel}
                  hubScene={this.props.hubScene}
                />
              )}

            {entered ? (
              <div className={styles.topHud}>
                <TwoDHUD.TopHUD
                  history={this.props.history}
                  mediaSearchStore={this.props.mediaSearchStore}
                  muted={this.state.muted}
                  frozen={this.state.frozen}
                  spacebubble={this.state.spacebubble}
                  videoShareMediaSource={this.state.videoShareMediaSource}
                  activeTip={this.props.activeTips && this.props.activeTips.top}
                  onToggleMute={this.toggleMute}
                  onToggleFreeze={this.toggleFreeze}
                  onToggleSpaceBubble={this.toggleSpaceBubble}
                  onSpawnPen={this.spawnPen}
                  onSpawnCamera={() => this.props.scene.emit("action_spawn_camera")}
                  onShareVideo={this.shareVideo}
                  onEndShareVideo={this.endShareVideo}
                  onShareVideoNotCapable={() => this.showWebRTCScreenshareUnsupportedDialog()}
                />
                {this.props.isSupportAvailable && (
                  <div className={styles.nagCornerButton}>
                    <WithHoverSound>
                      <StateLink stateKey="modal" stateValue="support" history={this.props.history}>
                        <button>
                          <FormattedMessage id="entry.invite-team-nag" />
                        </button>
                      </StateLink>
                    </WithHoverSound>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </IntlProvider>
      </ReactAudioContext.Provider>
    );
  }
}

export default UIRoot;
