import React, { Component } from 'react';
import PropTypes from 'prop-types';

const ENTRY_STEPS = {
  start: "start",
  mic_check: "mic_check",
  finished: "finished"
}

async function grantedMicLabels() {
  const mediaDevices = await navigator.mediaDevices.enumerateDevices();
  return mediaDevices.filter(d => d.label && d.kind === "audioinput").map(d => d.label);
}

async function hasGrantedMicPermissionsFor2D() {
  const micLabels = await grantedMicLabels();
  return micLabels.length > 0;
}

class UIRoot extends Component {
  static propTypes = {
    enterScene: PropTypes.func,
    availableVREntryTypes: PropTypes.object
  };

  state = {
    entryStep: ENTRY_STEPS.start,
    shareScreen: false,
    enterInVR: false
  }

  promptForMedia = async () => {
    console.log("HI");
    const constraints = {
      audio: true,
      video: this.state.shareScreen ? { mediaSource: "screen", height: 720, frameRate: 30 } : false
    };

    const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
    const audioTracks = mediaStream.getAudioTracks();
    console.log(audioTracks);

    if (audioTracks.length > 0) {
      const selectedMic = audioTracks[0].label;
      console.log("Mic: " + selectedMic);
      // TODO if VR mode is desired here, look at the VR displays to see if we have the right mic
      // TODO: this.props.enterScene(mediaStream);
      this.setState({ entryStep: ENTRY_STEPS.finished });
    } else {
      // TODO mic not granted
    }
  }

  enter2D = async () => {
    const hasMic = await hasGrantedMicPermissionsFor2D();

    if (hasMic) {
      await this.promptForMedia();
      this.setState({ entryStep: ENTRY_STEPS.finished, enter_in_vr: false });
    } else {
      this.setState({ entryStep: ENTRY_STEPS.mic_check, enter_in_vr: false });
    }
  }

  enterVR = () => {
    this.setState({ entryStep: ENTRY_STEPS.mic_check, enter_in_vr: true });
  }

  componentDidMount = () => {
    console.log(this.props.availableVREntryTypes);
  }

  render() {
    const entryPanel = this.state.entryStep === ENTRY_STEPS.start 
    ? (
      <div>
        <button onClick={this.enter2D}>
          Enter on this Screen
        </button>
        <button onClick={this.enterVR}>
          Enter in VR
        </button>
      </div>
    ) : null;

    const micPanel = this.state.entryStep === ENTRY_STEPS.mic_check
    ? (
        <div>
          <button onClick={this.promptForMedia}>
            Choose Mic
          </button>
        </div>
      ) : null;

    return (
      <div>
        UI Here
        {entryPanel}
        {micPanel}
      </div>
    );
  }
}

export default UIRoot;
