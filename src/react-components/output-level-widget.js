import React, { Component } from "react";
import { FormattedMessage } from "react-intl";
import { WithHoverSound } from "./wrap-with-audio";

import webmTone from "../assets/sfx/tone.webm";
import mp3Tone from "../assets/sfx/tone.mp3";
import oggTone from "../assets/sfx/tone.ogg";
import wavTone from "../assets/sfx/tone.wav";

export default class OutputLevelWidget extends Component {
  state = {
    tonePlaying: false
  };

  constructor(props) {
    super(props);
    this.playTestTone = this.playTestTone.bind(this);
    this.toneClip = document.createElement("audio");
    if (this.toneClip.canPlayType("audio/webm")) {
      this.toneClip.src = webmTone;
    } else if (this.toneClip.canPlayType("audio/mpeg")) {
      this.toneClip.src = mp3Tone;
    } else if (this.toneClip.canPlayType("audio/ogg")) {
      this.toneClip.src = oggTone;
    } else {
      this.toneClip.src = wavTone;
    }
  }

  componentWillUnmount() {
    this.toneClip.pause();
    this.toneClip.currentTime = 0;
    if (this.testToneTimeout != null) {
      clearTimeout(this.testToneTimeout);
    }
  }

  playTestTone() {
    if (this.testToneTimeout != null) {
      clearTimeout(this.testToneTimeout);
    }
    this.toneClip.currentTime = 0;
    this.toneClip.play();
    this.setState({ tonePlaying: true });
    this.testToneTimeout = setTimeout(() => {
      this.setState({ tonePlaying: false });
    }, 1393);
  }

  render() {
    const maxLevelHeight = 111;
    const speakerClip = { clip: `rect(${this.state.tonePlaying ? 0 : maxLevelHeight}px, 111px, 111px, 0px)` };
    return (
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
    );
  }
}
