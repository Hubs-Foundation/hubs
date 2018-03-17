import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import NameEntryPanel from './name-entry-panel';
import { VR_DEVICE_AVAILABILITY } from "../utils/vr-caps-detect";
import queryString from "query-string";
import { SCHEMA } from "../storage/store";
const { detect } = require("detect-browser");

const browser = detect();

const ENTRY_STEPS = {
  start: "start",
  mic_grant: "mic_grant",
  mic_granted: "mic_granted",
  audio_setup: "audio_setup",
  finished: "finished"
}

async function grantedMicLabels() {
  const mediaDevices = await navigator.mediaDevices.enumerateDevices();
  return mediaDevices.filter(d => d.label && d.kind === "audioinput").map(d => d.label);
}

async function hasGrantedMicPermissions() {
  const micLabels = await grantedMicLabels();
  return micLabels.length > 0;
}

const TwoDEntryButton = (props) => (
  <button {...props}>
    Enter on this Screen
  </button>
);

const GenericEntryButton = (props) => (
  <button {...props}>
    Enter in VR
  </button>
);

const GearVREntryButton = (props) => (
  <button {...props}>
    Enter on GearVR
  </button>
);

const DaydreamEntryButton = (props) => (
  <button {...props}>
    Enter on Daydream
  </button>
);

const AutoExitWarning = (props) => (
  <div>
    <p>
    Exit in <span>{props.secondsRemaining}</span>
    </p>

    <button onClick={props.onCancel}>
    Cancel
    </button>
  </div>
);

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
    availableVREntryTypes: PropTypes.object,
    concurrentLoadDetector: PropTypes.object,
    disableAutoExitOnConcurrentLoad: PropTypes.bool,
    forcedVREntryType: PropTypes.string,
    store: PropTypes.object,
    scene: PropTypes.object
  }

  state = {
    entryStep: ENTRY_STEPS.start,
    enterInVR: false,

    shareScreen: false,
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
    exited: false
  }

  componentDidMount() {
    this.setupTestTone();
    this.props.concurrentLoadDetector.addEventListener("concurrentload", this.onConcurrentLoad);
    this.handleForcedVREntryType();
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

  performDirectEntryFlow = async (enterInVR) => {
    this.startTestTone();

    this.setState({ enterInVR })

    const hasGrantedMic = await hasGrantedMicPermissions();

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

    if (this.props.availableVREntryTypes.daydream == VR_DEVICE_AVAILABILITY.maybe) {
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
    this.setupNewMediaStream(await navigator.mediaDevices.getUserMedia(constraints));
  }

  setMediaStreamToDefault = async () => {
    const constraints = { audio: true, video: false };
    this.setupNewMediaStream(await navigator.mediaDevices.getUserMedia(constraints));
  }

  setupNewMediaStream = (mediaStream) => {
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

      this.setState({ micLevel: v / 128.0 })
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

  beginAudioSetup = async () => {
    await this.fetchMicDevices();
    this.setState({ entryStep: ENTRY_STEPS.audio_setup });
  }

  fetchMicDevices = async () => {
    const mediaDevices = await navigator.mediaDevices.enumerateDevices();
    this.setState({ micDevices: mediaDevices.filter(d => d.kind === "audioinput").map(d => ({ deviceId: d.deviceId, label: d.label }))});
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
    if (!this.props.scene.hasLoaded) {
      return (
        <div className="loading-panel">Loading scene</div>
      );
    }

    const entryPanel = this.state.entryStep === ENTRY_STEPS.start
    ? (
      <div className="entry-panel">
        <TwoDEntryButton onClick={this.enter2D}/>
        { this.props.availableVREntryTypes.generic !== VR_DEVICE_AVAILABILITY.no && <GenericEntryButton onClick={this.enterVR}/> }
        { this.props.availableVREntryTypes.gearvr !== VR_DEVICE_AVAILABILITY.no && <GearVREntryButton onClick={this.enterGearVR}/> }
        { this.props.availableVREntryTypes.daydream !== VR_DEVICE_AVAILABILITY.no && <DaydreamEntryButton onClick={this.enterDaydream}/> }
      </div>
    ) : null;

    const micPanel = this.state.entryStep === ENTRY_STEPS.mic_grant || this.state.entryStep == ENTRY_STEPS.mic_granted
    ? (
        <div>
          <button onClick={this.onMicGrantButton}>
            { this.state.entryStep == ENTRY_STEPS.mic_grant ? "Grant Mic" : "Next" }
          </button>
        </div>
      ) : null;

    const selectedMicLabel = (this.state.mediaStream
                                 && this.state.mediaStream.getAudioTracks().length > 0
                                 && this.state.mediaStream.getAudioTracks()[0].label) || "";

    const selectedMicDeviceId = this.state.micDevices.filter(d => d.label === selectedMicLabel).map(d => d.deviceId)[0];

    const audioSetupPanel = this.state.entryStep === ENTRY_STEPS.audio_setup
    ? (
        <div>
          Audio setup
          <select value={selectedMicDeviceId} onChange={this.micDeviceChanged}>
            { this.state.micDevices.map(d => (<option key={ d.deviceId } value={ d.deviceId }>{d.label}</option>)) }
          </select>
          <br/>
          { this.state.tonePlaying && (<div>Tone</div>) }
          <br/>
          { this.state.micLevel }
          <br/>
          <button onClick={this.onAudioReadyButton}>
            Audio Ready
          </button>
        </div>
      ) : null;

    const dialogContents = this.isWaitingForAutoExit() ?
      (<AutoExitWarning secondsRemaining={this.state.secondsRemainingBeforeAutoExit} onCancel={this.endAutoExitTimer} />) :
      (
        <div>
          {entryPanel}
          {micPanel}
          {audioSetupPanel}

          <NameEntryPanel store={this.props.store}></NameEntryPanel>
        </div>
      );

    const dialogClassNames = classNames({
      'ui-dialog': true,
      'ui-dialog--darkened': this.state.entryStep !== ENTRY_STEPS.finished
    });

    return !this.state.exited ?
      (
        <div className={dialogClassNames}>
          Base UI Here
          {
            this.state.entryStep !== ENTRY_STEPS.finished &&
            (
              <div className='ui-dialog-box'>
                {dialogContents}
              </div>
            )
          }
        </div>
      ) :
      (
        <div>Exited</div>
      )
  }
}

export default UIRoot;
