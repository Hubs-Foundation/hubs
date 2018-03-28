import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { VR_DEVICE_AVAILABILITY } from "../utils/vr-caps-detect";
import queryString from "query-string";
import { SCHEMA } from "../storage/store";
import MobileDetect from 'mobile-detect';
import { IntlProvider, FormattedMessage, addLocaleData } from 'react-intl';
import en from 'react-intl/locale-data/en';
import MovingAverage from 'moving-average';

import AutoExitWarning from './auto-exit-warning';
import { TwoDEntryButton, GenericEntryButton, GearVREntryButton, DaydreamEntryButton } from './entry-buttons.js';
import { ProfileInfoHeader } from './profile-info-header.js';
import ProfileEntryPanel from './profile-entry-panel';

const mobiledetect = new MobileDetect(navigator.userAgent);

const lang = ((navigator.languages && navigator.languages[0]) ||
                   navigator.language || navigator.userLanguage).toLowerCase().split(/[_-]+/)[0];

import localeData from '../assets/translations.data.json';
addLocaleData([...en]);

const messages = localeData[lang] || localeData.en;

const ENTRY_STEPS = {
  start: "start",
  mic_grant: "mic_grant",
  mic_granted: "mic_granted",
  audio_setup: "audio_setup",
  finished: "finished"
}

const HMD_MIC_REGEXES = [/\Wvive\W/i, /\Wrift\W/i];

async function grantedMicLabels() {
  const mediaDevices = await navigator.mediaDevices.enumerateDevices();
  return mediaDevices.filter(d => d.label && d.kind === "audioinput").map(d => d.label);
}

// This is a list of regexes that match the microphone labels of HMDs.
//
// If entering VR mode, and if any of these regexes match an audio device,
// the user will be prevented from entering VR until one of those devices is
// selected as the microphone.
//
// Note that this doesn't have to be exhaustive: if no devices match any regex
// then we rely upon the user to select the proper mic.
const VR_DEVICE_MIC_LABEL_REGEXES = [];

const AUTO_EXIT_TIMER_SECONDS = 10;

class UIRoot extends Component {
  static propTypes = {
    enterScene: PropTypes.func,
    concurrentLoadDetector: PropTypes.object,
    disableAutoExitOnConcurrentLoad: PropTypes.bool,
    forcedVREntryType: PropTypes.string,
    store: PropTypes.object,
    scene: PropTypes.object
  }

  state = {
    availableVREntryTypes: null,
    entryStep: ENTRY_STEPS.start,
    enterInVR: false,

    shareScreen: false,
    requestedScreen: false,
    mediaStream: null,

    toneInterval: null,
    tonePlaying: false,

    micLevel: 0,
    micDevices: [],
    micUpdateInterval: null,

    profileNamePending: "Hello",

    autoExitTimerStartedAt: null,
    autoExitTimerInterval: null,
    secondsRemainingBeforeAutoExit: Infinity,

    sceneLoaded: false,
    exited: false,

    showProfileEntry: false
  }

  componentDidMount() {
    this.setupTestTone();
    this.props.concurrentLoadDetector.addEventListener("concurrentload", this.onConcurrentLoad);
    this.micLevelMovingAverage = MovingAverage(100);
    this.props.scene.addEventListener("loaded", this.onSceneLoaded);
  }

  componentWillUnmount() {
    this.props.scene.removeEventListener("loaded", this.onSceneLoaded);
  }

  onSceneLoaded = () => {
    this.setState({ sceneLoaded: true });
  }

  handleForcedVREntryType = () => {
    if (!this.props.forcedVREntryType) return;

    if (this.props.forcedVREntryType === "daydream") {
      this.enterDaydream();
    } else if (this.props.forcedVREntryType === "gearvr") {
      this.enterGearVR();
    }
  }

  setupTestTone = () => {
    const toneClip = document.querySelector("#test-tone");
    const toneLength = 1800;
    const toneDelay = 5000;

    const toneIndicatorLoop = () => {
      this.setState({ tonePlaying: false });

      setTimeout(() => {
        this.setState({ tonePlaying: true });
        setTimeout(() => { this.setState({ tonePlaying: false }); }, toneLength)
      }, toneDelay);
    };

    toneClip.addEventListener("seeked", toneIndicatorLoop);
    toneClip.addEventListener("playing", toneIndicatorLoop);
  }

  startTestTone = () => {
    const toneClip = document.querySelector("#test-tone");
    toneClip.loop = true;
    toneClip.play();
  }

  stopTestTone = () => {
    const toneClip = document.querySelector("#test-tone")
    toneClip.pause();
    toneClip.currentTime = 0;

    this.setState({ tonePlaying: false })
  }

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

    this.setState({ autoExitTimerStartedAt: new Date(), autoExitTimerInterval })
  }

  checkForAutoExit = () => {
    if (this.state.secondsRemainingBeforeAutoExit !== 0) return;
    this.endAutoExitTimer();
    this.exit();
  }

  exit = () => {
    this.props.exitScene();
    this.setState({ exited: true });
  }

  isWaitingForAutoExit = () => {
    return this.state.secondsRemainingBeforeAutoExit <= AUTO_EXIT_TIMER_SECONDS;
  }

  endAutoExitTimer = () => {
    clearInterval(this.state.autoExitTimerInterval);
    this.setState({ autoExitTimerStartedAt: null, autoExitTimerInterval: null, secondsRemainingBeforeAutoExit: Infinity });
  }

  hasGrantedMicPermissions = async () => {
    if (this.state.requestedScreen) {
      // If we've already requested the screen in this session, then we can already enumerateDevices, so we need to 
      // verify mic permissions by checking the mediaStream.
      return this.state.mediaStream && this.state.mediaStream.getAudioTracks().length > 0;
    }
    else {
      // If we haven't requested the screen in this session, check if we've granted permissions in a previous session.
      return (await grantedMicLabels()).length > 0;
    }
  }

  performDirectEntryFlow = async (enterInVR) => {
    this.startTestTone();

    this.setState({ enterInVR })

    const hasGrantedMic = await this.hasGrantedMicPermissions();

    if (hasGrantedMic) {
      await this.setMediaStreamToDefault();
      await this.beginAudioSetup();
    } else {
      this.stopTestTone();
      this.setState({ entryStep: ENTRY_STEPS.mic_grant });
    }
  }

  enter2D = async () => {
    await this.performDirectEntryFlow(false);
  }

  enterVR = async () => {
    await this.performDirectEntryFlow(true);
  }

  enterGearVR = async () => {
    this.exit();

    // Launch via Oculus Browser
    const qs = queryString.parse(document.location.search);
    qs.vr_entry_type = "gearvr"; // Auto-choose 'gearvr' after landing in Oculus Browser

    const ovrwebUrl = `ovrweb://${document.location.protocol || "http:"}//${document.location.host}${document.location.pathname || ""}?${queryString.stringify(qs)}#{document.location.hash || ""}`;

    document.location = ovrwebUrl;
  }

  enterDaydream = async () => {
    const loc = document.location;

    if (this.state.availableVREntryTypes.daydream == VR_DEVICE_AVAILABILITY.maybe) {
      this.exit();

      // We are not in mobile chrome, so launch into chrome via an Intent URL
      const qs = queryString.parse(document.location.search);
      qs.vr_entry_type = "daydream"; // Auto-choose 'daydream' after landing in chrome

      const intentUrl = `intent://${document.location.host}${document.location.pathname || ""}?${queryString.stringify(qs)}#Intent;scheme=${(document.location.protocol || "http:").replace(":", "")};action=android.intent.action.VIEW;package=com.android.chrome;end;`;
      document.location = intentUrl;
    } else {
      await this.performDirectEntryFlow(true);
    }
  }

  mediaVideoConstraint = () => {
    return this.state.shareScreen ? { mediaSource: "screen", height: 720, frameRate: 30 } : false;
  }

  micDeviceChanged = async (ev) => {
    const constraints = { audio: { deviceId: { exact: [ev.target.value] } }, video: this.mediaVideoConstraint() };
    await this.setupNewMediaStream(constraints);
  }

  setMediaStreamToDefault = async () => {
    await this.setupNewMediaStream({ audio: true, video: this.mediaVideoConstraint() });
  }

  setStateAndRequestScreen = (e) => {
    const checked = e.target.checked;
    this.setState({ requestedScreen: true, shareScreen: checked }, () => {
      this.setupNewMediaStream({ video: this.mediaVideoConstraint() });
    });
  }

  setupNewMediaStream = async (constraints) => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioContext = new AudioContext();

    if (this.state.mediaStream) {
      clearInterval(this.state.micUpdateInterval);

      const previousStream = this.state.mediaStream;

      for (const tracks of [previousStream.getAudioTracks(), previousStream.getVideoTracks()]) {
        for (const track of tracks) {
          track.stop();
        }
      }
    }

    const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

    const source = audioContext.createMediaStreamSource(mediaStream);
    const analyzer = audioContext.createAnalyser();
    const levels = new Uint8Array(analyzer.fftSize);

    source.connect(analyzer);

    const micUpdateInterval = setInterval(() => {
      analyzer.getByteTimeDomainData(levels);

      let v = 0;

      for (let x = 0; x < levels.length; x++) {
        v = Math.max(levels[x] - 127, v);
      }

      const level = v / 128.0 ;
      this.micLevelMovingAverage.push(Date.now(), level);
      this.setState({ micLevel: this.micLevelMovingAverage.movingAverage() })
    }, 50);

    this.setState({ mediaStream, micUpdateInterval });
  }

  onMicGrantButton = async () => {
    if (this.state.entryStep == ENTRY_STEPS.mic_grant) {
      await this.setMediaStreamToDefault();
      this.setState({ entryStep: ENTRY_STEPS.mic_granted });
    } else {
      this.startTestTone();
      await this.beginAudioSetup();
    }
  }

  onProfileFinished = () => {
    this.setState({ showProfileEntry: false })
  }

  beginAudioSetup = async () => {
    await this.fetchMicDevices();
    this.setState({ entryStep: ENTRY_STEPS.audio_setup });
  }

  fetchMicDevices = async () => {
    const mediaDevices = await navigator.mediaDevices.enumerateDevices();
    this.setState({ micDevices: mediaDevices.filter(d => d.kind === "audioinput").map(d => ({ deviceId: d.deviceId, label: d.label }))});
  }

  shouldShowHmdMicWarning = () => {
    if (mobiledetect.mobile()) return false;
    if (!this.state.enterInVR) return false;
    if (!this.hasHmdMicrophone()) return false;

    return !(HMD_MIC_REGEXES.find(r => this.selectedMicLabel().match(r)));
  }

  hasHmdMicrophone = () => {
    return !!(this.state.micDevices.find(d => HMD_MIC_REGEXES.find(r => d.label.match(r))));
  }

  selectedMicLabel = () => {
    return (this.state.mediaStream
             && this.state.mediaStream.getAudioTracks().length > 0
             && this.state.mediaStream.getAudioTracks()[0].label) || "";
  }

  selectedMicDeviceId = () => {
    return this.state.micDevices.filter(d => d.label === this.selectedMicLabel).map(d => d.deviceId)[0];
  }

  onAudioReadyButton = () => {
    this.props.enterScene(this.state.mediaStream, this.state.enterInVR);

    const mediaStream = this.state.mediaStream;

    if (mediaStream) {
      if (mediaStream.getAudioTracks().length > 0) {
        console.log(`Using microphone: ${mediaStream.getAudioTracks()[0].label}`)
      }

      if (mediaStream.getVideoTracks().length > 0) {
        console.log('Screen sharing enabled.')
      }
    }

    this.stopTestTone();
    this.setState({ entryStep: ENTRY_STEPS.finished });
  }

  render() {
    if (!this.props.scene.hasLoaded || !this.state.availableVREntryTypes) {
      return (
        <IntlProvider locale={lang} messages={messages}>
          <div className="loading-panel">
            <div className="loader-wrap">
              <div className="loader">
                <div className="loader-center"/>
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
              <FormattedMessage id="exit.subtitle"/>
            </div>
          </div>
        </IntlProvider>
      );
    }

    const daydreamMaybeSubtitle = messages["entry.daydream-via-chrome"];

    const entryPanel = this.state.entryStep === ENTRY_STEPS.start
    ? (
      <div className="entry-panel">
        <TwoDEntryButton onClick={this.enter2D}/>
        { this.state.availableVREntryTypes.generic !== VR_DEVICE_AVAILABILITY.no && <GenericEntryButton onClick={this.enterVR}/> }
        { this.state.availableVREntryTypes.gearvr !== VR_DEVICE_AVAILABILITY.no && <GearVREntryButton onClick={this.enterGearVR}/> }
        { this.state.availableVREntryTypes.daydream !== VR_DEVICE_AVAILABILITY.no && 
            <DaydreamEntryButton
              onClick={this.enterDaydream}
              subtitle={this.state.availableVREntryTypes.daydream == VR_DEVICE_AVAILABILITY.maybe ? daydreamMaybeSubtitle : "" }/> }
        { this.state.availableVREntryTypes.cardboard !== VR_DEVICE_AVAILABILITY.no &&
          (<div className="entry-panel__secondary" onClick={this.enterVR}><FormattedMessage id="entry.cardboard"/></div>) }
        { !mobiledetect.mobile() && /firefox/i.test(navigator.userAgent) && (
          <label className="entry-panel__screensharing">
            <input className="entry-panel__screensharing-checkbox" type="checkbox"
              value={this.state.shareScreen}
              onChange={this.setStateAndRequestScreen}
            />
            <FormattedMessage id="entry.enable-screensharing" />
          </label>) }
      </div>
    ) : null;

    const micPanel = this.state.entryStep === ENTRY_STEPS.mic_grant || this.state.entryStep == ENTRY_STEPS.mic_granted
    ? (
        <div className="mic-grant-panel">
          <div className="mic-grant-panel__title">
            <FormattedMessage id={ this.state.entryStep == ENTRY_STEPS.mic_grant ? "audio.grant-title" : "audio.granted-title" }/>
          </div>
          <div className="mic-grant-panel__subtitle">
            <FormattedMessage id={ this.state.entryStep == ENTRY_STEPS.mic_grant ? "audio.grant-subtitle" : "audio.granted-subtitle" }/>
          </div>
          <div className="mic-grant-panel__icon">
          { this.state.entryStep == ENTRY_STEPS.mic_grant ? 
            (<img onClick={this.onMicGrantButton} src="../assets/images/mic_denied.png" srcSet="../assets/images/mic_denied@2x.png 2x" className="mic-grant-panel__icon"/>) :
            (<img onClick={this.onMicGrantButton} src="../assets/images/mic_granted.png" srcSet="../assets/images/mic_granted@2x.png 2x" className="mic-grant-panel__icon"/>)}
          </div>
          <div className="mic-grant-panel__next" onClick={this.onMicGrantButton}>
            <FormattedMessage id={ this.state.entryStep == ENTRY_STEPS.mic_grant ? "audio.grant-next" : "audio.granted-next" }/>
          </div>
        </div>
      ) : null;

    const maxLevelHeight = 111;
    const micClip = { clip: `rect(${maxLevelHeight - Math.floor(this.state.micLevel * maxLevelHeight)}px, 111px, 111px, 0px)` };
    const speakerClip = { clip: `rect(${this.state.tonePlaying ? 0 : maxLevelHeight}px, 111px, 111px, 0px)` };

    const audioSetupPanel = this.state.entryStep === ENTRY_STEPS.audio_setup
    ? (
        <div className="audio-setup-panel">
          <div className="audio-setup-panel__title">
            <FormattedMessage id="audio.title"/>
          </div>
          <div className="audio-setup-panel__subtitle">
            { (mobiledetect.mobile() || this.state.enterInVR) && (<FormattedMessage id={ mobiledetect.mobile() ? "audio.subtitle-mobile" : "audio.subtitle-desktop" }/>) }
          </div>
          <div className="audio-setup-panel__levels">
            <div className="audio-setup-panel__levels__mic">
              <img src="../assets/images/mic_level.png" srcSet="../assets/images/mic_level@2x.png 2x" className="audio-setup-panel__levels__mic_icon"/>
              <img src="../assets/images/level_fill.png" srcSet="../assets/images/level_fill@2x.png 2x" className="audio-setup-panel__levels__level" style={ micClip }/>
            </div>
            <div className="audio-setup-panel__levels__speaker">
              <img src="../assets/images/speaker_level.png" srcSet="../assets/images/speaker_level@2x.png 2x" className="audio-setup-panel__levels__speaker_icon"/>
              <img src="../assets/images/level_fill.png" srcSet="../assets/images/level_fill@2x.png 2x" className="audio-setup-panel__levels__level" style={ speakerClip }/>
            </div>
          </div>
          <div className="audio-setup-panel__device-chooser">
            <select className="audio-setup-panel__device-chooser__dropdown" value={this.selectedMicDeviceId()} onChange={this.micDeviceChanged}>
              { this.state.micDevices.map(d => (<option key={ d.deviceId } value={ d.deviceId }>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{d.label}</option>)) }
            </select>
            <div className="audio-setup-panel__device-chooser__mic-icon">
              <img src="../assets/images/mic_small.png" srcSet="../assets/images/mic_small@2x.png 2x"/>
            </div>
          </div>
          { this.shouldShowHmdMicWarning() &&
            (<div className="audio-setup-panel__hmd-mic-warning">
              <img src="../assets/images/warning_icon.png" srcSet="../assets/images/warning_icon@2x.png 2x"
                   className="audio-setup-panel__hmd-mic-warning__icon"/>
              <span className="audio-setup-panel__hmd-mic-warning__label">
                <FormattedMessage id="audio.hmd-mic-warning"/>
              </span>
            </div>) }
          <div className="audio-setup-panel__enter-button" onClick={this.onAudioReadyButton}>
            <FormattedMessage id="audio.enter-now"/>
          </div>
        </div>
      ) : null;

    const dialogContents = this.isWaitingForAutoExit() ?
      (<AutoExitWarning secondsRemaining={this.state.secondsRemainingBeforeAutoExit} onCancel={this.endAutoExitTimer} />) :
      (
        <div className="entry-dialog">
          <ProfileInfoHeader name={this.props.store.state.profile.display_name} onClick={(() => this.setState({showProfileEntry: true })) }/>
          {entryPanel}
          {micPanel}
          {audioSetupPanel}
        </div>
      );

    const dialogClassNames = classNames({
      'ui-dialog': true,
      'ui-dialog--darkened': this.state.entryStep !== ENTRY_STEPS.finished
    });

    const dialogBoxClassNames = classNames({ 'ui-dialog-box': true });

    const dialogBoxContentsClassNames = classNames({
      'ui-dialog-box-contents': true,
      'ui-dialog-box-contents--backgrounded': this.state.showProfileEntry
    });

    return (
      <IntlProvider locale={lang} messages={messages}>
        <div className={dialogClassNames}>
          {
            (this.state.entryStep !== ENTRY_STEPS.finished || this.isWaitingForAutoExit()) &&
            (
              <div className={dialogBoxClassNames}>
                <div className={dialogBoxContentsClassNames}>
                  {dialogContents}
                </div>

                {this.state.showProfileEntry && (
                  <ProfileEntryPanel finished={this.onProfileFinished} store={this.props.store}/>)}
              </div>
            )
          }
        </div>
      </IntlProvider>
    );
  }
}

export default UIRoot;
