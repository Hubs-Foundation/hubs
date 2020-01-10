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
    const iconClass = `audio-setup-panel__levels__icon_clickable__${this.state.tonePlaying ? "playing" : "pending"}`;

    return (
      <WithHoverSound>
        <div className="audio-setup-panel__levels__icon_clickable" onClick={this.playTestTone}>
          <img
            src="../assets/images/speaker_level.png"
            srcSet="../assets/images/speaker_level@2x.png 2x"
            className="audio-setup-panel__levels__icon-part"
          />
          <div className={iconClass}>
            <svg width="111" height="111" viewBox="0 0 111 111" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="55.5" cy="55.5" r="55.5" fill="currentColor" fillOpacity="0.8" />
            </svg>
          </div>
          <div className="audio-setup-panel__levels__test_label">
            <FormattedMessage id="audio.click_to_test" />
          </div>
        </div>
      </WithHoverSound>
    );
  }
}
