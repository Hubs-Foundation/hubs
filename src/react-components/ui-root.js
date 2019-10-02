import React, { Component } from "react";
import PropTypes from "prop-types";
import cx from "classnames";
import classNames from "classnames";
import copy from "copy-to-clipboard";
import { IntlProvider, FormattedMessage, addLocaleData } from "react-intl";
import en from "react-intl/locale-data/en";
import screenfull from "screenfull";

import { VR_DEVICE_AVAILABILITY } from "../utils/vr-caps-detect";
import { canShare } from "../utils/share";
import styles from "../assets/stylesheets/ui-root.scss";
import emojiStyles from "../assets/stylesheets/ui-emoji.scss";
import entryStyles from "../assets/stylesheets/entry.scss";
import inviteStyles from "../assets/stylesheets/invite-dialog.scss";
import { ReactAudioContext, WithHoverSound } from "./wrap-with-audio";
import {
  pushHistoryState,
  clearHistoryState,
  popToBeginningOfHubHistory,
  navigateToPriorPage,
  sluglessPath
} from "../utils/history";
import StateRoute from "./state-route.js";
import { getPresenceProfileForSession, discordBridgesForPresences } from "../utils/phoenix-utils";
import { getClientInfoClientId } from "./client-info-dialog";
import { getCurrentStreamer } from "../utils/component-utils";

import { lang, messages } from "../utils/i18n";
import Loader from "./loader";
import AutoExitWarning from "./auto-exit-warning";
import { TwoDEntryButton, GenericEntryButton, DaydreamEntryButton } from "./entry-buttons.js";
import ProfileEntryPanel from "./profile-entry-panel";
import MediaBrowser from "./media-browser";

import CreateObjectDialog from "./create-object-dialog.js";
import ChangeSceneDialog from "./change-scene-dialog.js";
import AvatarUrlDialog from "./avatar-url-dialog.js";
import HelpDialog from "./help-dialog.js";
import InviteDialog from "./invite-dialog.js";
import InviteTeamDialog from "./invite-team-dialog.js";
import LinkDialog from "./link-dialog.js";
import SafariDialog from "./safari-dialog.js";
import SafariMicDialog from "./safari-mic-dialog.js";
import SignInDialog from "./sign-in-dialog.js";
import RoomSettingsDialog from "./room-settings-dialog.js";
import CloseRoomDialog from "./close-room-dialog.js";
import Tip from "./tip.js";
import WebRTCScreenshareUnsupportedDialog from "./webrtc-screenshare-unsupported-dialog.js";
import WebAssemblyUnsupportedDialog from "./webassembly-unsupported-dialog.js";
import WebVRRecommendDialog from "./webvr-recommend-dialog.js";
import FeedbackDialog from "./feedback-dialog.js";
import LeaveRoomDialog from "./leave-room-dialog.js";
import RoomInfoDialog from "./room-info-dialog.js";
import ClientInfoDialog from "./client-info-dialog.js";
import ObjectInfoDialog from "./object-info-dialog.js";
import OAuthDialog from "./oauth-dialog.js";
import TweetDialog from "./tweet-dialog.js";
import LobbyChatBox from "./lobby-chat-box.js";
import InWorldChatBox from "./in-world-chat-box.js";
import AvatarEditor from "./avatar-editor";
import MicLevelWidget from "./mic-level-widget.js";
import OutputLevelWidget from "./output-level-widget.js";
import PresenceLog from "./presence-log.js";
import PresenceList from "./presence-list.js";
import ObjectList from "./object-list.js";
import SettingsMenu from "./settings-menu.js";
import PreloadOverlay from "./preload-overlay.js";
import TwoDHUD from "./2d-hud";
import { SpectatingLabel } from "./spectating-label";
import { showFullScreenIfAvailable, showFullScreenIfWasFullScreen } from "../utils/fullscreen";
import { exit2DInterstitialAndEnterVR, isIn2DInterstitial } from "../utils/vr-interstitial";

import { faTimes } from "@fortawesome/free-solid-svg-icons/faTimes";
import { faStar } from "@fortawesome/free-solid-svg-icons/faStar";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons/faArrowLeft";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import qsTruthy from "../utils/qs_truthy";
import { CAMERA_MODE_INSPECT } from "../systems/camera-system";
const avatarEditorDebug = qsTruthy("avatarEditorDebug");

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

const LOBBY_MODAL_ROUTER_PATHS = ["/media/scenes", "/media/avatars", "/media/favorites"];
const LOBBY_MODAL_QUERY_VARS = ["media_source"];
const LOBBY_MODAL_QUERY_VALUES = ["scenes", "avatars", "favorites"];

async function grantedMicLabels() {
  const mediaDevices = await navigator.mediaDevices.enumerateDevices();
  return mediaDevices.filter(d => d.label && d.kind === "audioinput").map(d => d.label);
}

const isMobile = AFRAME.utils.device.isMobile();
const isMobileVR = AFRAME.utils.device.isMobileVR();
const isMobilePhoneOrVR = isMobile || isMobileVR;

const AUTO_EXIT_TIMER_SECONDS = 10;

class UIRoot extends Component {
  willCompileAndUploadMaterials = false;

  static propTypes = {
    enterScene: PropTypes.func,
    exitScene: PropTypes.func,
    onSendMessage: PropTypes.func,
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
    entryDisallowed: PropTypes.bool,
    roomUnavailableReason: PropTypes.string,
    platformUnsupportedReason: PropTypes.string,
    hubId: PropTypes.string,
    hubName: PropTypes.string,
    hubMemberPermissions: PropTypes.object,
    hubScene: PropTypes.object,
    hubIsBound: PropTypes.bool,
    isSupportAvailable: PropTypes.bool,
    presenceLogEntries: PropTypes.array,
    presences: PropTypes.object,
    sessionId: PropTypes.string,
    subscriptions: PropTypes.object,
    initialIsSubscribed: PropTypes.bool,
    initialIsFavorited: PropTypes.bool,
    showSignInDialog: PropTypes.bool,
    signInMessageId: PropTypes.string,
    signInCompleteMessageId: PropTypes.string,
    signInContinueTextId: PropTypes.string,
    onContinueAfterSignIn: PropTypes.func,
    showSafariDialog: PropTypes.bool,
    showSafariMicDialog: PropTypes.bool,
    showWebAssemblyDialog: PropTypes.bool,
    showOAuthDialog: PropTypes.bool,
    onCloseOAuthDialog: PropTypes.func,
    oauthInfo: PropTypes.array,
    isCursorHoldingPen: PropTypes.bool,
    hasActiveCamera: PropTypes.bool,
    onMediaSearchResultEntrySelected: PropTypes.func,
    onAvatarSaved: PropTypes.func,
    activeTips: PropTypes.object,
    location: PropTypes.object,
    history: PropTypes.object,
    showInterstitialPrompt: PropTypes.bool,
    onInterstitialPromptClicked: PropTypes.func,
    performConditionalSignIn: PropTypes.func,
    hide: PropTypes.bool,
    showPreload: PropTypes.bool,
    onPreloadLoadClicked: PropTypes.func,
    embed: PropTypes.bool,
    embedToken: PropTypes.string,
    onLoaded: PropTypes.func
  };

  state = {
    emojiState: "empty",

    enterInVR: false,
    muteOnEntry: false,
    entered: false,
    dialog: null,
    showShareDialog: false,
    broadcastTipDismissed: false,
    linkCode: null,
    linkCodeCancel: null,
    miniInviteActivated: false,

    didConnectToNetworkedScene: false,
    noMoreLoadingUpdates: false,
    hideLoader: false,
    watching: false,
    isStreaming: false,
    showStreamingTip: false,

    waitingOnAudio: false,
    mediaStream: null,
    audioTrack: null,
    audioTrackClone: null,
    micDevices: [],

    autoExitTimerStartedAt: null,
    autoExitTimerInterval: null,
    secondsRemainingBeforeAutoExit: Infinity,

    muted: false,
    frozen: false,

    exited: false,

    signedIn: false,
    videoShareMediaSource: null,
    showVideoShareFailed: false,

    objectInfo: null,
    objectDisplayString: "",
    objectSrc: "",
    isObjectListExpanded: false,
    isPresenceListExpanded: false
  };

  constructor(props) {
    super(props);

    if (props.showSafariMicDialog) {
      this.state.dialog = <SafariMicDialog closable={false} />;
    }
    if (props.showSafariDialog) {
      this.state.dialog = <SafariDialog closable={false} />;
    }
    if (props.showWebAssemblyDialog) {
      this.state.dialog = <WebAssemblyUnsupportedDialog closable={false} />;
    }

    props.mediaSearchStore.setHistory(props.history);

    // An exit handler that discards event arguments and can be cleaned up.
    this.exitEventHandler = () => this.exit();
  }

  componentDidUpdate(prevProps) {
    const { hubChannel, showSignInDialog } = this.props;
    if (hubChannel) {
      const { signedIn } = hubChannel;
      if (signedIn !== this.state.signedIn) {
        this.setState({ signedIn });
      }
    }
    if (prevProps.showSignInDialog !== showSignInDialog) {
      if (showSignInDialog) {
        this.showContextualSignInDialog();
      } else {
        this.closeDialog();
      }
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

          if (!this.state.hideLoader) {
            this.setState({ hideLoader: true });
          }
        }, 0);
      });
    }
  }

  componentDidMount() {
    window.addEventListener("concurrentload", this.onConcurrentLoad);
    document.querySelector(".a-canvas").addEventListener("mouseup", () => {
      if (this.state.showShareDialog) {
        this.setState({ showShareDialog: false });
      }
    });

    this.props.scene.addEventListener(
      "didConnectToNetworkedScene",
      () => {
        this.setState({ didConnectToNetworkedScene: true });
      },
      { once: true }
    );
    this.props.scene.addEventListener("loaded", this.onSceneLoaded);
    this.props.scene.addEventListener("stateadded", this.onAframeStateChanged);
    this.props.scene.addEventListener("stateremoved", this.onAframeStateChanged);
    this.props.scene.addEventListener("share_video_enabled", this.onShareVideoEnabled);
    this.props.scene.addEventListener("share_video_disabled", this.onShareVideoDisabled);
    this.props.scene.addEventListener("share_video_failed", this.onShareVideoFailed);
    this.props.scene.addEventListener("exit", this.exitEventHandler);
    this.props.scene.addEventListener("action_exit_watch", () => this.setState({ watching: false, hide: false }));

    const scene = this.props.scene;

    this.props.store.addEventListener("statechanged", this.onStoreChanged);

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

    this.playerRig = scene.querySelector("#avatar-rig");
    this.playerRig.addEventListener("emoji_changed", ({ detail }) => this.setState({ emojiState: detail.emojiType }));
  }

  componentWillUnmount() {
    this.props.scene.removeEventListener("loaded", this.onSceneLoaded);
    this.props.scene.removeEventListener("exit", this.exitEventHandler);
    this.props.scene.removeEventListener("share_video_enabled", this.onShareVideoEnabled);
    this.props.scene.removeEventListener("share_video_disabled", this.onShareVideoDisabled);
    this.props.scene.removeEventListener("share_video_failed", this.onShareVideoFailed);
  }

  showContextualSignInDialog = () => {
    const {
      signInMessageId,
      authChannel,
      signInCompleteMessageId,
      signInContinueTextId,
      onContinueAfterSignIn
    } = this.props;

    this.showNonHistoriedDialog(SignInDialog, {
      message: messages[signInMessageId],
      onSignIn: async email => {
        const { authComplete } = await authChannel.startAuthentication(email, this.props.hubChannel);

        this.showNonHistoriedDialog(SignInDialog, { authStarted: true, onClose: onContinueAfterSignIn });

        await authComplete;

        this.setState({ signedIn: true });
        this.showNonHistoriedDialog(SignInDialog, {
          authComplete: true,
          message: messages[signInCompleteMessageId],
          continueText: messages[signInContinueTextId],
          onClose: onContinueAfterSignIn,
          onContinue: onContinueAfterSignIn
        });
      },
      onClose: onContinueAfterSignIn
    });
  };

  updateSubscribedState = () => {
    const isSubscribed = this.props.subscriptions && this.props.subscriptions.isSubscribed();
    this.setState({ isSubscribed });
  };

  toggleFavorited = () => {
    this.props.performConditionalSignIn(
      () => this.props.hubChannel.signedIn,
      () => {
        const isFavorited = this.isFavorited();

        this.props.hubChannel[isFavorited ? "unfavorite" : "favorite"]();
        this.setState({ isFavorited: !isFavorited });
      },
      "favorite-room"
    );
  };

  isFavorited = () => {
    return this.state.isFavorited !== undefined ? this.state.isFavorited : this.props.initialIsFavorited;
  };

  onLoadingFinished = () => {
    this.setState({ noMoreLoadingUpdates: true });

    if (this.props.onLoaded) {
      this.props.onLoaded();
    }
  };

  onSceneLoaded = () => {
    this.setState({ sceneLoaded: true });
  };

  // TODO: we need to come up with a cleaner way to handle the shared state between aframe and react than emmitting events and setting state on the scene
  onAframeStateChanged = e => {
    if (!(e.detail === "muted" || e.detail === "frozen")) return;
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

  onShareVideoFailed = () => {
    this.setState({ showVideoShareFailed: true });
  };

  toggleMute = () => {
    this.props.scene.emit("action_mute");
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

  exit = reason => {
    if (this.props.exitScene) {
      this.props.exitScene(reason);
    }

    this.setState({ exited: true });
  };

  changeEmoji = type => {
    const newEmoji = this.state.emojiState === type ? "empty" : type;
    this.playerRig.setAttribute("player-info", { emojiType: newEmoji });
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

  performDirectEntryFlow = async enterInVR => {
    this.setState({ enterInVR, waitingOnAudio: true });

    const hasGrantedMic = (await grantedMicLabels()).length > 0;

    if (hasGrantedMic) {
      await this.setMediaStreamToDefault();
      this.beginOrSkipAudioSetup();
    } else {
      this.pushHistoryState("entry_step", "mic_grant");
    }

    this.setState({ waitingOnAudio: false });
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
    if (this.state.audioTrackClone) {
      this.state.audioTrackClone.stop();
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      const audioTrack = mediaStream.getAudioTracks()[0];
      this.setState({ audioTrack });

      if (/Oculus/.test(navigator.userAgent)) {
        // HACK Oculus Browser 6 seems to randomly end the microphone audio stream. This re-creates it.
        // Note the ended event will only fire if some external event ends the stream, not if we call stop().
        const recreateAudioStream = async () => {
          console.warn(
            "Oculus Browser 6 bug hit: Audio stream track ended without calling stop. Recreating audio stream."
          );

          const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
          const audioTrack = mediaStream.getAudioTracks()[0];
          const audioTrackClone = audioTrack.clone();

          await NAF.connection.adapter.setLocalMediaStream(mediaStream);

          if (this.props.scene.is("muted")) {
            console.warn("re-muting microphone");
            NAF.connection.adapter.enableMicrophone(false);
            audioTrack.enabled = false;
          }

          this.setState({ mediaStream, audioTrack, audioTrackClone });

          const mediaStreamForMicAnalysis = new MediaStream();
          mediaStreamForMicAnalysis.addTrack(audioTrackClone);
          this.props.scene.emit("local-media-stream-created", { mediaStream: mediaStreamForMicAnalysis });
          audioTrack.addEventListener("ended", recreateAudioStream, { once: true });
        };

        audioTrack.addEventListener("ended", recreateAudioStream, { once: true });
      }

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

    // we should definitely have an audioTrack at this point unless they denied mic access
    if (this.state.audioTrack) {
      mediaStream.addTrack(this.state.audioTrack);
      const micDeviceId = this.micDeviceIdForMicLabel(this.micLabelForMediaStream(mediaStream));
      if (micDeviceId) {
        this.props.store.update({ settings: { lastUsedMicDeviceId: micDeviceId } });
      }
      const mediaStreamForMicAnalysis = new MediaStream();
      const audioTrackClone = this.state.audioTrack.clone();
      this.setState({ audioTrackClone });
      mediaStreamForMicAnalysis.addTrack(audioTrackClone);
      this.props.scene.emit("local-media-stream-created", { mediaStream: mediaStreamForMicAnalysis });
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

  onAudioReadyButton = async () => {
    if (!this.state.enterInVR) {
      await showFullScreenIfAvailable();
    }

    // Push the new history state before going into VR, otherwise menu button will take us back
    clearHistoryState(this.props.history);

    await this.props.enterScene(this.state.mediaStream, this.state.enterInVR, this.state.muteOnEntry);

    this.setState({ entered: true, showShareDialog: false });

    const mediaStream = this.state.mediaStream;

    if (mediaStream) {
      if (mediaStream.getAudioTracks().length > 0) {
        console.log(`Using microphone: ${mediaStream.getAudioTracks()[0].label}`);
      }

      if (mediaStream.getVideoTracks().length > 0) {
        console.log("Screen sharing enabled.");
      }
    }
  };

  attemptLink = async () => {
    this.pushHistoryState("overlay", "link");
    const { code, cancel, onFinished } = await this.props.linkChannel.generateCode();
    this.setState({ linkCode: code, linkCodeCancel: cancel });
    onFinished.then(() => {
      this.setState({ log: false, linkCode: null, linkCodeCancel: null });
      this.exit();
    });
  };

  showShareDialog = () => {
    this.props.store.update({ activity: { hasOpenedShare: true } });
    this.setState({ showShareDialog: true });
  };

  toggleShareDialog = async () => {
    this.props.store.update({ activity: { hasOpenedShare: true } });
    this.setState({ showShareDialog: !this.state.showShareDialog });
  };

  createObject = media => {
    this.props.scene.emit("add_media", media);
  };

  changeScene = url => {
    this.props.hubChannel.updateScene(url);
  };

  setAvatarUrl = url => {
    this.props.store.update({ profile: { ...this.props.store.state.profile, ...{ avatarId: url } } });
  };

  closeDialog = () => {
    if (this.state.dialog) {
      this.setState({ dialog: null });
    } else {
      this.props.history.goBack();
    }

    if (isIn2DInterstitial()) {
      exit2DInterstitialAndEnterVR();
    } else {
      showFullScreenIfWasFullScreen();
    }
  };

  showNonHistoriedDialog = (DialogClass, props = {}) => {
    this.setState({
      dialog: <DialogClass {...{ onClose: this.closeDialog, ...props }} />
    });
  };

  toggleStreamerMode = enable => {
    const avatarRig = document.querySelector("#avatar-rig");
    avatarRig.setAttribute("character-controller", "fly", enable);

    if (enable) {
      this.props.hubChannel.beginStreaming();
      this.setState({ isStreaming: true, showStreamingTip: true });
    } else {
      this.props.hubChannel.endStreaming();
      this.setState({ isStreaming: false });
    }
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

    if (canShare()) {
      navigator.share({ title: document.title, url: link });
    } else {
      copy(link);
    }
  };

  sendMessage = msg => {
    this.props.onSendMessage(msg);
  };

  occupantCount = () => {
    return this.props.presences ? Object.entries(this.props.presences).length : 0;
  };

  onStoreChanged = () => {
    const broadcastedRoomConfirmed = this.props.store.state.confirmedBroadcastedRooms.includes(this.props.hubId);
    if (broadcastedRoomConfirmed !== this.state.broadcastTipDismissed) {
      this.setState({ broadcastTipDismissed: broadcastedRoomConfirmed });
    }
  };

  confirmBroadcastedRoom = () => {
    this.props.store.update({ confirmedBroadcastedRooms: [this.props.hubId] });
  };

  discordBridges = () => {
    if (!this.props.presences) {
      return [];
    } else {
      return discordBridgesForPresences(this.props.presences);
    }
  };

  hasEmbedPresence = () => {
    if (!this.props.presences) {
      return false;
    } else {
      for (const p of Object.values(this.props.presences)) {
        for (const m of p.metas) {
          if (m.context && m.context.embed) {
            return true;
          }
        }
      }
    }

    return false;
  };

  pushHistoryState = (k, v) => pushHistoryState(this.props.history, k, v);

  renderInterstitialPrompt = () => {
    return (
      <IntlProvider locale={lang} messages={messages}>
        <div className={styles.interstitial} onClick={() => this.props.onInterstitialPromptClicked()}>
          <div>
            <FormattedMessage id="interstitial.prompt" />
          </div>
        </div>
      </IntlProvider>
    );
  };

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
      const exitSubtitleId = `exit.subtitle.${reason || "exited"}`;
      subtitle = (
        <div>
          <FormattedMessage id={exitSubtitleId} />
          <p />
          {!["left", "disconnected"].includes(this.props.roomUnavailableReason) && (
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

  renderEntryStartPanel = () => {
    const { hasAcceptedProfile, hasChangedName } = this.props.store.state.activity;
    const promptForNameAndAvatarBeforeEntry = this.props.hubIsBound ? !hasAcceptedProfile : !hasChangedName;

    return (
      <div className={entryStyles.entryPanel}>
        <div className={entryStyles.name}>
          {this.props.hubChannel.canOrWillIfCreator("update_hub") ? (
            <button
              className={entryStyles.renameButton}
              onClick={() =>
                this.props.performConditionalSignIn(
                  () => this.props.hubChannel.can("update_hub"),
                  () => this.pushHistoryState("modal", "room_settings"),
                  "room-settings"
                )
              }
            >
              {this.props.hubName}
            </button>
          ) : (
            <span>{this.props.hubName}</span>
          )}
          <button onClick={() => this.setState({ watching: true })} className={entryStyles.collapseButton}>
            <i>
              <FontAwesomeIcon icon={faTimes} />
            </i>
          </button>

          <button
            onClick={() => this.toggleFavorited()}
            className={classNames({
              [entryStyles.entryFavoriteButton]: true,
              [entryStyles.favoriteButton]: true,
              [entryStyles.favorited]: this.isFavorited()
            })}
          >
            <i title="Favorite">
              <FontAwesomeIcon icon={faStar} />
            </i>
          </button>
        </div>

        <div className={entryStyles.roomSubtitle}>
          <FormattedMessage id="entry.lobby" />
        </div>

        <div className={entryStyles.center}>
          <LobbyChatBox
            occupantCount={this.occupantCount()}
            discordBridges={this.discordBridges()}
            onSendMessage={this.sendMessage}
          />
        </div>

        {!this.state.waitingOnAudio &&
          !this.props.entryDisallowed && (
            <div className={entryStyles.buttonContainer}>
              {!isMobileVR && (
                <a
                  onClick={e => {
                    e.preventDefault();
                    this.attemptLink();
                  }}
                  className={classNames([entryStyles.secondaryActionButton, entryStyles.wideButton])}
                >
                  <FormattedMessage id="entry.device-medium" />
                  <div className={entryStyles.buttonSubtitle}>
                    <FormattedMessage
                      id={isMobile ? "entry.device-subtitle-mobile" : "entry.device-subtitle-desktop"}
                    />
                  </div>
                </a>
              )}
              <a
                onClick={e => {
                  e.preventDefault();

                  if (promptForNameAndAvatarBeforeEntry || !this.props.forcedVREntryType) {
                    this.props.hubChannel.sendEnteringEvent();

                    const stateValue = promptForNameAndAvatarBeforeEntry ? "profile" : "device";
                    this.pushHistoryState("entry_step", stateValue);
                  } else {
                    this.handleForceEntry();
                  }
                }}
                className={classNames([entryStyles.actionButton, entryStyles.wideButton])}
              >
                <FormattedMessage id="entry.enter-room" />
              </a>
            </div>
          )}
        {this.props.entryDisallowed &&
          !this.state.waitingOnAudio && (
            <div className={entryStyles.buttonContainer}>
              <a
                onClick={e => {
                  e.preventDefault();
                  this.setState({ watching: true });
                }}
                className={classNames([entryStyles.secondaryActionButton, entryStyles.wideButton])}
              >
                <FormattedMessage id="entry.entry-disallowed" />
                <div className={entryStyles.buttonSubtitle}>
                  <FormattedMessage id="entry.entry-disallowed-subtitle" />
                </div>
              </a>
            </div>
          )}
        {this.state.waitingOnAudio && (
          <div>
            <div className="loader-wrap loader-mid">
              <div className="loader">
                <div className="loader-center" />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  renderDevicePanel = () => {
    return (
      <div className={entryStyles.entryPanel}>
        <div
          onClick={() => {
            this.props.hubChannel.sendEnteringCancelledEvent();
            this.props.history.goBack();
          }}
          className={entryStyles.back}
        >
          <i>
            <FontAwesomeIcon icon={faArrowLeft} />
          </i>
          <FormattedMessage id="entry.back" />
        </div>

        <div className={entryStyles.title}>
          <FormattedMessage id="entry.choose-device" />
        </div>

        {!this.state.waitingOnAudio ? (
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
            {this.props.availableVREntryTypes.screen === VR_DEVICE_AVAILABILITY.yes && (
              <TwoDEntryButton onClick={this.enter2D} />
            )}
          </div>
        ) : (
          <div className={entryStyles.audioLoader}>
            <div className="loader-wrap loader-mid">
              <div className="loader">
                <div className="loader-center" />
              </div>
            </div>
          </div>
        )}
      </div>
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
    const subtitleId = isMobilePhoneOrVR ? "audio.subtitle-mobile" : "audio.subtitle-desktop";
    return (
      <div className="audio-setup-panel">
        <div
          onClick={() => {
            // If we forced a VR entry type, then we skipped the device panel
            // and hence going back from the audio setup panel will bring you back to the lobby.
            if (this.props.forcedVREntryType) {
              this.props.hubChannel.sendEnteringCancelledEvent();
            }

            this.props.history.goBack();
          }}
          className={entryStyles.back}
        >
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
            {(isMobilePhoneOrVR || this.state.enterInVR) && <FormattedMessage id={subtitleId} />}
          </div>
          <div className="audio-setup-panel__levels">
            <MicLevelWidget
              scene={this.props.scene}
              hasAudioTrack={!!this.state.audioTrack}
              muteOnEntry={this.state.muteOnEntry}
            />
            <OutputLevelWidget />
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
        <div className="audio-setup-panel__mute-container">
          <input
            id="mute-on-entry"
            type="checkbox"
            onChange={() => this.setState({ muteOnEntry: !this.state.muteOnEntry })}
            checked={this.state.muteOnEntry}
          />
          <label htmlFor="mute-on-entry">
            <FormattedMessage id="entry.mute-on-entry" />
          </label>
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

    if (
      !this.state.entered &&
      (LOBBY_MODAL_ROUTER_PATHS.find(x => sluglessPath(this.props.history.location).startsWith(x)) ||
        LOBBY_MODAL_QUERY_VARS.find(
          (x, i) => new URLSearchParams(this.props.history.location.search).get(x) === LOBBY_MODAL_QUERY_VALUES[i]
        ))
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
    if (this.props.hide || this.state.hide) return <div />;

    const isExited = this.state.exited || this.props.roomUnavailableReason || this.props.platformUnsupportedReason;
    const preload = this.props.showPreload;

    const isLoading =
      !preload &&
      (!this.state.hideLoader || !this.state.didConnectToNetworkedScene) &&
      !(this.props.showSafariMicDialog || this.props.showSafariDialog || this.props.showWebAssemblyDialog);

    const rootStyles = {
      [styles.ui]: true,
      "ui-root": true,
      "in-modal-or-overlay": this.isInModalOrOverlay()
    };
    const hasPush = navigator.serviceWorker && "PushManager" in window;

    if (this.props.showOAuthDialog && !this.props.showInterstitialPrompt)
      return (
        <IntlProvider locale={lang} messages={messages}>
          <div className={classNames(rootStyles)}>
            <OAuthDialog onClose={this.props.onCloseOAuthDialog} oauthInfo={this.props.oauthInfo} />
          </div>
        </IntlProvider>
      );
    if (isExited) return this.renderExitedPane();
    if (isLoading) {
      return (
        <Loader scene={this.props.scene} finished={this.state.noMoreLoadingUpdates} onLoaded={this.onLoadingFinished} />
      );
    }
    if (this.props.showInterstitialPrompt) return this.renderInterstitialPrompt();
    if (this.props.isBotMode) return this.renderBotMode();

    const embed = this.props.embed;
    const entered = this.state.entered;
    const watching = this.state.watching;
    const enteredOrWatching = entered || watching;
    const enteredOrWatchingOrPreload = entered || watching || preload;
    const baseUrl = `${location.protocol}//${location.host}${location.pathname}`;
    const inEntryFlow = !!(
      this.props.history &&
      this.props.history.location.state &&
      this.props.history.location.state.entry_step
    );

    const entryDialog =
      this.props.availableVREntryTypes &&
      !preload &&
      (this.isWaitingForAutoExit() ? (
        <AutoExitWarning
          secondsRemaining={this.state.secondsRemainingBeforeAutoExit}
          onCancel={this.endAutoExitTimer}
        />
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
      ));

    const dialogBoxContentsClassNames = classNames({
      [styles.uiInteractive]: !this.isInModalOrOverlay(),
      [styles.uiDialogBoxContents]: true,
      [styles.backgrounded]: this.isInModalOrOverlay()
    });

    const showVREntryButton = entered && isMobileVR;

    const presenceLogEntries = this.props.presenceLogEntries || [];

    const mediaSource = this.props.mediaSearchStore.getUrlMediaSource(this.props.history.location);

    // Allow scene picker pre-entry, otherwise wait until entry
    const showMediaBrowser =
      mediaSource && (["scenes", "avatars", "favorites"].includes(mediaSource) || this.state.entered);
    const hasTopTip = (this.props.activeTips && this.props.activeTips.top) || this.state.showVideoShareFailed;

    const clientInfoClientId = getClientInfoClientId(this.props.history.location);
    const showClientInfo = !!clientInfoClientId;
    const showObjectInfo = !!(this.state.objectInfo && this.state.objectInfo.object3D);

    const discordBridges = this.discordBridges();
    const discordSnippet = discordBridges.map(ch => "#" + ch).join(", ");
    const hasEmbedPresence = this.hasEmbedPresence();
    const hasDiscordBridges = discordBridges.length > 0;
    const showBroadcastTip =
      (hasDiscordBridges || (hasEmbedPresence && !this.props.embed)) && !this.state.broadcastTipDismissed;

    const showInviteTip =
      !showVREntryButton &&
      !hasTopTip &&
      !entered &&
      !embed &&
      !preload &&
      !watching &&
      !hasTopTip &&
      !inEntryFlow &&
      !this.props.store.state.activity.hasOpenedShare &&
      this.occupantCount() <= 1;

    const showChooseSceneButton =
      !showVREntryButton &&
      !entered &&
      !embed &&
      !preload &&
      !watching &&
      !showInviteTip &&
      !this.state.showShareDialog &&
      this.props.hubChannel &&
      this.props.hubChannel.canOrWillIfCreator("update_hub");

    const displayNameOverride = this.props.hubIsBound
      ? getPresenceProfileForSession(this.props.presences, this.props.sessionId).displayName
      : null;

    const streaming = this.state.isStreaming;
    const streamingTip = streaming &&
      this.state.showStreamingTip && (
        <div className={classNames([styles.streamingTip])}>
          <div className={classNames([styles.streamingTipAttachPoint])} />
          <button
            title="Dismiss"
            className={styles.streamingTipClose}
            onClick={() => this.setState({ showStreamingTip: false })}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>

          <div className={styles.streamingTipMessage}>
            <FormattedMessage id="tips.streaming" />
          </div>
        </div>
      );

    const streamer = getCurrentStreamer();
    const streamerName = streamer && streamer.displayName;

    const EmojiButton = ({ type, state, onClick }) => (
      <div
        className={cx(emojiStyles.iconEmoji, emojiStyles[type], { [emojiStyles.active]: state === type })}
        onClick={() => onClick(type)}
      />
    );

    return (
      <ReactAudioContext.Provider value={this.state.audioContext}>
        <IntlProvider locale={lang} messages={messages}>
          <div className={classNames(rootStyles)}>
            {this.state.dialog}
            {preload && (
              <PreloadOverlay
                hubName={this.props.hubName}
                hubScene={this.props.hubScene}
                baseUrl={baseUrl}
                onLoadClicked={this.props.onPreloadLoadClicked}
              />
            )}
            <StateRoute
              stateKey="overlay"
              stateValue="profile"
              history={this.props.history}
              render={props => (
                <ProfileEntryPanel
                  {...props}
                  displayNameOverride={displayNameOverride}
                  finished={() => this.pushHistoryState()}
                  onClose={() => this.pushHistoryState()}
                  store={this.props.store}
                  mediaSearchStore={this.props.mediaSearchStore}
                  avatarId={props.location.state.detail && props.location.state.detail.avatarId}
                />
              )}
            />
            <StateRoute
              stateKey="overlay"
              stateValue="avatar-editor"
              history={this.props.history}
              render={props => (
                <AvatarEditor
                  className={styles.avatarEditor}
                  signedIn={this.state.signedIn}
                  onSignIn={this.showSignInDialog}
                  onSave={() => {
                    if (props.location.state.detail && props.location.state.detail.returnToProfile) {
                      this.props.history.goBack();
                    } else {
                      this.props.history.goBack();
                      // We are returning to the media browser. Trigger an update so that the filter switches to
                      // my-avatars, now that we've saved an avatar.
                      this.props.mediaSearchStore.sourceNavigateWithNoNav("avatars", "use");
                    }
                    this.props.onAvatarSaved();
                  }}
                  onClose={() => this.props.history.goBack()}
                  store={this.props.store}
                  debug={avatarEditorDebug}
                  avatarId={props.location.state.detail && props.location.state.detail.avatarId}
                  hideDelete={props.location.state.detail && props.location.state.detail.hideDelete}
                />
              )}
            />
            {showMediaBrowser && (
              <MediaBrowser
                history={this.props.history}
                mediaSearchStore={this.props.mediaSearchStore}
                hubChannel={this.props.hubChannel}
                onMediaSearchResultEntrySelected={(entry, selectAction) => {
                  if (entry.type === "hub") {
                    this.showNonHistoriedDialog(LeaveRoomDialog, {
                      destinationUrl: entry.url,
                      messageType: "join-room"
                    });
                  } else {
                    this.props.onMediaSearchResultEntrySelected(entry, selectAction);
                  }
                }}
                performConditionalSignIn={this.props.performConditionalSignIn}
              />
            )}
            <StateRoute
              stateKey="entry_step"
              stateValue="profile"
              history={this.props.history}
              render={props => (
                <ProfileEntryPanel
                  {...props}
                  displayNameOverride={displayNameOverride}
                  finished={() => {
                    if (this.props.forcedVREntryType) {
                      this.pushHistoryState();
                      this.handleForceEntry();
                    } else {
                      this.pushHistoryState("entry_step", "device");
                    }
                  }}
                  onClose={() => this.pushHistoryState()}
                  store={this.props.store}
                  mediaSearchStore={this.props.mediaSearchStore}
                  avatarId={props.location.state.detail && props.location.state.detail.avatarId}
                />
              )}
            />
            <StateRoute
              stateKey="modal"
              stateValue="room_settings"
              history={this.props.history}
              render={() =>
                this.renderDialog(RoomSettingsDialog, {
                  initialSettings: { name: this.props.hubName, member_permissions: this.props.hubMemberPermissions },
                  onChange: settings => this.props.hubChannel.updateHub(settings)
                })
              }
            />
            <StateRoute
              stateKey="modal"
              stateValue="close_room"
              history={this.props.history}
              render={() => this.renderDialog(CloseRoomDialog, { onConfirm: () => this.props.hubChannel.closeHub() })}
            />
            <StateRoute
              stateKey="modal"
              stateValue="help"
              history={this.props.history}
              render={() => this.renderDialog(HelpDialog)}
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
              stateValue="avatar_url"
              history={this.props.history}
              render={() => this.renderDialog(AvatarUrlDialog, { onChange: this.setAvatarUrl })}
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
              stateValue="room_info"
              history={this.props.history}
              render={() =>
                this.renderDialog(RoomInfoDialog, { scene: this.props.hubScene, hubName: this.props.hubName })
              }
            />
            <StateRoute
              stateKey="modal"
              stateValue="feedback"
              history={this.props.history}
              render={() =>
                this.renderDialog(FeedbackDialog, {
                  history: this.props.history,
                  onClose: () => this.pushHistoryState("modal", null)
                })
              }
            />
            <StateRoute
              stateKey="modal"
              stateValue="tweet"
              history={this.props.history}
              render={() => this.renderDialog(TweetDialog, { history: this.props.history, onClose: this.closeDialog })}
            />
            {showClientInfo && (
              <ClientInfoDialog
                clientId={clientInfoClientId}
                onClose={this.closeDialog}
                history={this.props.history}
                presences={this.props.presences}
                hubChannel={this.props.hubChannel}
                showNonHistoriedDialog={this.showNonHistoriedDialog}
                performConditionalSignIn={this.props.performConditionalSignIn}
              />
            )}
            {showObjectInfo && (
              <ObjectInfoDialog
                scene={this.props.scene}
                el={this.state.objectInfo}
                objectDisplayString={this.state.objectDisplayString}
                src={this.state.objectSrc}
                hubChannel={this.props.hubChannel}
                onClose={() => {
                  if (this.props.scene.systems["hubs-systems"].cameraSystem.mode === CAMERA_MODE_INSPECT) {
                    this.props.scene.systems["hubs-systems"].cameraSystem.uninspect();
                  }
                  this.setState({ isObjectListExpanded: false, objectInfo: null });
                }}
              />
            )}
            {((!enteredOrWatching && !this.state.isObjectListExpanded && !showObjectInfo) ||
              this.isWaitingForAutoExit()) && (
              <div className={styles.uiDialog}>
                <PresenceLog
                  entries={presenceLogEntries}
                  presences={this.props.presences}
                  hubId={this.props.hubId}
                  history={this.props.history}
                />
                <div className={dialogBoxContentsClassNames}>{entryDialog}</div>
              </div>
            )}
            {enteredOrWatchingOrPreload && (
              <PresenceLog
                inRoom={true}
                presences={this.props.presences}
                entries={presenceLogEntries}
                hubId={this.props.hubId}
                history={this.props.history}
              />
            )}
            {entered &&
              this.props.activeTips &&
              this.props.activeTips.bottom &&
              (!presenceLogEntries || presenceLogEntries.length === 0) &&
              !showBroadcastTip && (
                <Tip tip={this.props.activeTips.bottom} tipRegion="bottom" pushHistoryState={this.pushHistoryState} />
              )}
            {enteredOrWatchingOrPreload &&
              showBroadcastTip && (
                <Tip
                  tip={hasDiscordBridges ? "discord" : "embed"}
                  broadcastTarget={discordSnippet}
                  onClose={() => this.confirmBroadcastedRoom()}
                />
              )}
            {enteredOrWatchingOrPreload &&
              !this.state.objectInfo &&
              !this.state.frozen && (
                <InWorldChatBox
                  discordBridges={discordBridges}
                  onSendMessage={this.sendMessage}
                  onObjectCreated={this.createObject}
                  enableSpawning={entered}
                  history={this.props.history}
                />
              )}
            {this.state.frozen && (
              <button className={styles.leaveButton} onClick={() => this.exit("left")}>
                <FormattedMessage id="entry.leave-room" />
              </button>
            )}
            {this.state.frozen && (
              <div className={cx(styles.uiInteractive, emojiStyles.emojiPanel)}>
                <EmojiButton type="smile" state={this.state.emojiState} onClick={this.changeEmoji} />
                <EmojiButton type="happy" state={this.state.emojiState} onClick={this.changeEmoji} />
                <EmojiButton type="surprise" state={this.state.emojiState} onClick={this.changeEmoji} />
                <EmojiButton type="disgust" state={this.state.emojiState} onClick={this.changeEmoji} />
                <EmojiButton type="angry" state={this.state.emojiState} onClick={this.changeEmoji} />
                <EmojiButton type="sad" state={this.state.emojiState} onClick={this.changeEmoji} />
                <EmojiButton type="eww" state={this.state.emojiState} onClick={this.changeEmoji} />
                <EmojiButton type="hearts" state={this.state.emojiState} onClick={this.changeEmoji} />
              </div>
            )}
            {!this.state.frozen &&
              !watching &&
              !preload && (
                <div
                  className={classNames({
                    [inviteStyles.inviteContainer]: true,
                    [inviteStyles.inviteContainerBelowHud]: entered,
                    [inviteStyles.inviteContainerInverted]: this.state.showShareDialog
                  })}
                >
                  {!embed &&
                    !showVREntryButton &&
                    !hasTopTip &&
                    !streaming && (
                      <WithHoverSound>
                        <button
                          className={classNames({
                            [inviteStyles.inviteButton]: true,
                            [inviteStyles.hideSmallScreens]: this.occupantCount() > 1 && entered
                          })}
                          onClick={() => this.toggleShareDialog()}
                        >
                          <FormattedMessage id="entry.share-button" />
                        </button>
                      </WithHoverSound>
                    )}
                  {showChooseSceneButton && (
                    <button
                      className={classNames([styles.chooseSceneButton])}
                      onClick={() => {
                        this.props.performConditionalSignIn(
                          () => this.props.hubChannel.can("update_hub"),
                          () => {
                            showFullScreenIfAvailable();
                            this.props.mediaSearchStore.sourceNavigateWithNoNav("scenes", "use");
                          },
                          "change-scene"
                        );
                      }}
                    >
                      <FormattedMessage id="entry.change-scene" />
                    </button>
                  )}

                  {showInviteTip && (
                    <div className={styles.inviteTip}>
                      <div className={styles.inviteTipAttachPoint} />
                      <FormattedMessage id={`entry.${isMobile ? "mobile" : "desktop"}.invite-tip`} />
                    </div>
                  )}
                  {!embed &&
                    !showVREntryButton &&
                    this.occupantCount() > 1 &&
                    !hasTopTip &&
                    entered &&
                    !streaming && (
                      <WithHoverSound>
                        <button onClick={this.onMiniInviteClicked} className={inviteStyles.inviteMiniButton}>
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
                      <button className={inviteStyles.enterButton} onClick={() => exit2DInterstitialAndEnterVR(true)}>
                        <FormattedMessage id="entry.enter-in-vr" />
                      </button>
                    </WithHoverSound>
                  )}
                  {embed && (
                    <a href={baseUrl} className={inviteStyles.enterButton} target="_blank" rel="noopener noreferrer">
                      <FormattedMessage id="entry.open-in-window" />
                    </a>
                  )}
                  {this.state.showShareDialog && (
                    <InviteDialog
                      allowShare={!isMobileVR}
                      entryCode={this.props.hubEntryCode}
                      embedUrl={
                        this.props.embedToken && !isMobilePhoneOrVR
                          ? `${baseUrl}?embed_token=${this.props.embedToken}`
                          : null
                      }
                      hasPush={hasPush}
                      isSubscribed={
                        this.state.isSubscribed === undefined ? this.props.initialIsSubscribed : this.state.isSubscribed
                      }
                      onSubscribeChanged={() => this.onSubscribeChanged()}
                      hubId={this.props.hubId}
                      onClose={() => this.setState({ showShareDialog: false })}
                    />
                  )}
                </div>
              )}
            <StateRoute
              stateKey="overlay"
              stateValue="invite"
              history={this.props.history}
              render={() => (
                <InviteDialog
                  allowShare={!!navigator.share}
                  entryCode={this.props.hubEntryCode}
                  hubId={this.props.hubId}
                  isModal={true}
                  onClose={() => {
                    this.props.history.goBack();
                    exit2DInterstitialAndEnterVR();
                  }}
                />
              )}
            />
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
            {streaming && (
              <button
                title="Exit Camera Mode"
                onClick={() => this.toggleStreamerMode(false)}
                className={classNames([styles.cornerButton, styles.cameraModeExitButton])}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            )}
            {streamingTip}

            <ObjectList
              scene={this.props.scene}
              onExpand={(expand, uninspect) => {
                if (expand) {
                  this.setState({ isPresenceListExpanded: false, isObjectListExpanded: expand });
                } else {
                  this.setState({ isObjectListExpanded: expand });
                }

                if (uninspect) {
                  this.setState({ objectInfo: null });
                  if (this.props.scene.systems["hubs-systems"].cameraSystem.mode === CAMERA_MODE_INSPECT) {
                    this.props.scene.systems["hubs-systems"].cameraSystem.uninspect();
                  }
                }
              }}
              expanded={this.state.isObjectListExpanded && !this.state.isPresenceListExpanded}
              onInspectObject={(el, s) => this.setState({ objectInfo: el, objectDisplayString: s, objectSrc: s })}
            />

            <PresenceList
              history={this.props.history}
              presences={this.props.presences}
              sessionId={this.props.sessionId}
              signedIn={this.state.signedIn}
              email={this.props.store.state.credentials.email}
              onSignIn={this.showSignInDialog}
              onSignOut={this.signOut}
              expanded={!this.state.isObjectListExpanded && this.state.isPresenceListExpanded}
              onExpand={expand => {
                if (expand) {
                  this.setState({ isPresenceListExpanded: expand, isObjectListExpanded: false });
                } else {
                  this.setState({ isPresenceListExpanded: expand });
                }
              }}
            />

            {!streaming &&
              !preload && (
                <SettingsMenu
                  history={this.props.history}
                  mediaSearchStore={this.props.mediaSearchStore}
                  isStreaming={streaming}
                  toggleStreamerMode={this.toggleStreamerMode}
                  hubChannel={this.props.hubChannel}
                  hubScene={this.props.hubScene}
                  scene={this.props.scene}
                  performConditionalSignIn={this.props.performConditionalSignIn}
                  showNonHistoriedDialog={this.showNonHistoriedDialog}
                  pushHistoryState={this.pushHistoryState}
                />
              )}
            {!entered && !streaming && !isMobile && streamerName && <SpectatingLabel name={streamerName} />}
            {enteredOrWatching && (
              <div className={styles.topHud}>
                <TwoDHUD.TopHUD
                  scene={this.props.scene}
                  history={this.props.history}
                  mediaSearchStore={this.props.mediaSearchStore}
                  muted={this.state.muted}
                  frozen={this.state.frozen}
                  watching={this.state.watching}
                  onWatchEnded={() => this.setState({ watching: false })}
                  videoShareMediaSource={this.state.videoShareMediaSource}
                  showVideoShareFailed={this.state.showVideoShareFailed}
                  hideVideoShareFailedTip={() => this.setState({ showVideoShareFailed: false })}
                  activeTip={this.props.activeTips && this.props.activeTips.top}
                  isCursorHoldingPen={this.props.isCursorHoldingPen}
                  hasActiveCamera={this.props.hasActiveCamera}
                  onToggleMute={this.toggleMute}
                  onSpawnPen={this.spawnPen}
                  onSpawnCamera={() => this.props.scene.emit("action_toggle_camera")}
                  onShareVideo={this.shareVideo}
                  onEndShareVideo={this.endShareVideo}
                  onShareVideoNotCapable={() => this.showWebRTCScreenshareUnsupportedDialog()}
                  isStreaming={streaming}
                  showStreamingTip={this.state.showStreamingTip}
                  hideStreamingTip={() => {
                    this.setState({ showStreamingTip: false });
                  }}
                />
                {!watching && !streaming ? (
                  <div className={styles.nagCornerButton}>
                    <button onClick={() => this.pushHistoryState("modal", "feedback")}>
                      <FormattedMessage id="feedback.prompt" />
                    </button>
                  </div>
                ) : (
                  <div className={styles.nagCornerButton}>
                    <button onClick={() => this.setState({ hide: true })}>
                      <FormattedMessage id="hide-ui.prompt" />
                    </button>
                  </div>
                )}

                {!streaming && (
                  <button
                    onClick={() => this.toggleFavorited()}
                    className={classNames({
                      [entryStyles.favorited]: this.isFavorited(),
                      [styles.inRoomFavoriteButton]: true
                    })}
                  >
                    <i title="Favorite">
                      <FontAwesomeIcon icon={faStar} />
                    </i>
                  </button>
                )}
              </div>
            )}
          </div>
        </IntlProvider>
      </ReactAudioContext.Provider>
    );
  }
}

export default UIRoot;
