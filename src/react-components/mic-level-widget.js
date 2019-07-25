import React, { Component } from "react";
import PropTypes from "prop-types";
import { FormattedMessage } from "react-intl";
import MovingAverage from "moving-average";

export default class MicLevelWidget extends Component {
  static propTypes = {
    hasAudioTrack: PropTypes.bool,
    muteOnEntry: PropTypes.bool,
    scene: PropTypes.object
  };

  state = {
    volume: 0
  };

  componentDidMount() {
    this.startAnalyser();
  }

  componentWillUnmount() {
    this.stopAnalyser();
  }

  stopAnalyser() {
    if (this.micUpdateInterval != null) {
      clearInterval(this.micUpdateInterval);
    }
  }

  startAnalyser() {
    if (this.micUpdateInterval) {
      clearInterval(this.micUpdateInterval);
    }
    const micLevelMovingAverage = MovingAverage(100);
    let max = 0;
    this.micUpdateInterval = setInterval(() => {
      const analyser = this.props.scene.systems["local-audio-analyser"];
      max = Math.max(analyser.volume, max);
      // We use a moving average to smooth out the visual animation or else it would twitch too fast for
      // the css renderer to keep up.
      micLevelMovingAverage.push(Date.now(), analyser.volume);
      const average = micLevelMovingAverage.movingAverage();
      const volume = max === 0 ? 0 : average / max;
      if (Math.abs(this.state.volume - volume) > 0.05) {
        this.setState({ volume });
      }
    }, 50);
  }

  render() {
    const maxLevelHeight = 111;
    const micClip = {
      clip: `rect(${maxLevelHeight - Math.floor(this.state.volume * maxLevelHeight)}px, 111px, 111px, 0px)`
    };

    return (
      <div className="audio-setup-panel__levels__icon">
        <img
          src="../assets/images/level_background.png"
          srcSet="../assets/images/level_background@2x.png 2x"
          className="audio-setup-panel__levels__icon-part"
        />
        {!this.props.muteOnEntry && (
          <img
            src="../assets/images/level_fill.png"
            srcSet="../assets/images/level_fill@2x.png 2x"
            className="audio-setup-panel__levels__icon-part"
            style={micClip}
          />
        )}
        {this.props.hasAudioTrack && !this.props.muteOnEntry ? (
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
        {this.props.hasAudioTrack &&
          !this.props.muteOnEntry && (
            <div className="audio-setup-panel__levels__test_label">
              <FormattedMessage id="audio.talk_to_test" />
            </div>
          )}
      </div>
    );
  }
}
