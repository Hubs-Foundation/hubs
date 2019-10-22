import React, { Component } from "react";
import PropTypes from "prop-types";
import styles from "../assets/stylesheets/preferences-screen.scss";
import classNames from "classnames";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckSquare } from "@fortawesome/free-solid-svg-icons/faCheckSquare";
import { faSquare } from "@fortawesome/free-solid-svg-icons/faSquare";
import { faTimes } from "@fortawesome/free-solid-svg-icons/faTimes";
import { faAngleLeft } from "@fortawesome/free-solid-svg-icons/faAngleLeft";
import { faAngleRight } from "@fortawesome/free-solid-svg-icons/faAngleRight";
import { SOUND_PREFERENCE_MENU_HOVER, SOUND_PREFERENCE_MENU_SELECT } from "../systems/sound-effects-system";
import { IntlProvider, FormattedMessage, addLocaleData } from "react-intl";
import en from "react-intl/locale-data/en";
import { lang, messages } from "../utils/i18n";
import { waitForDOMContentLoaded } from "../utils/async-utils";
addLocaleData([...en]);

const messageIdForOption = {
  snap: "preferences.turningModeSnap",
  smooth: "preferences.turningModeSmooth",
  joysticks: "preferences.touchscreenJoysticks",
  pinch: "preferences.touchscreenPinch",
  pushToTalk: "preferences.pushToTalk",
  openMic: "preferences.openMic"
};

class NumberRangeSelector extends Component {
  static propTypes = {
    min: PropTypes.number,
    max: PropTypes.number,
    curr: PropTypes.number,
    onSelect: PropTypes.func,
    playHoverSound: PropTypes.func
  };
  state = {
    isDragging: false
  };
  constructor(props) {
    super(props);
    this.myRoot = React.createRef();
    this.stopDragging = this.stopDragging.bind(this);
    this.drag = this.drag.bind(this);
    window.addEventListener("mouseup", this.stopDragging);
    window.addEventListener("mousemove", this.drag);
  }
  componentWillUnmount() {
    window.removeEventListener("mouseup", this.stopDragging);
    window.removeEventListener("mousemove", this.drag);
  }

  stopDragging() {
    this.setState({ isDragging: false });
  }

  drag(e) {
    if (!this.state.isDragging) return;
    const t = Math.max(0, Math.min((e.clientX - this.myRoot.current.offsetLeft) / this.myRoot.current.clientWidth, 1));
    this.props.onSelect(this.props.min + t * (this.props.max - this.props.min));
  }

  render() {
    return (
      <div className={classNames(styles.numberWithRange)}>
        <div className={classNames(styles.numberInNumberWithRange)}>
          <input
            type="text"
            value={this.props.curr}
            onClick={e => {
              e.target.focus();
              e.target.select();
            }}
            onChange={e => {
              const num = parseInt(e.target.value);
              this.props.onSelect(num ? num : 0, true);
            }}
            onMouseEnter={() => {
              this.props.playHoverSound && this.props.playHoverSound();
            }}
          />
        </div>
        <div
          ref={this.myRoot}
          className={classNames(styles.rangeSlider)}
          onMouseDown={e => {
            e.preventDefault();
            this.setState({ isDragging: true });
            const t = Math.max(
              0,
              Math.min((e.clientX - this.myRoot.current.offsetLeft) / this.myRoot.current.clientWidth, 1)
            );
            this.props.onSelect(this.props.min + t * (this.props.max - this.props.min));
          }}
        >
          <input
            type="range"
            min={this.props.min}
            max={this.props.max}
            value={this.props.curr}
            onChange={e => {
              this.props.onSelect(e.target.value);
            }}
            onMouseEnter={() => {
              this.props.playHoverSound && this.props.playHoverSound();
            }}
            //onMouseUp={() => {
            //  this.props.onSelect(this.props.curr, true);
            //}}
            //onMouseDown={() => {
            //  this.props.onSelect(this.props.curr, true);
            //}}
          />
        </div>
      </div>
    );
  }
}

class FlipSelector extends Component {
  static propTypes = {
    options: PropTypes.array,
    onSelect: PropTypes.func,
    currOption: PropTypes.number,
    playHoverSound: PropTypes.func
  };
  state = {
    nextOptionHovered: false,
    prevOptionHovered: false
  };
  onMouseOverNextOption = () => {
    this.setState({ nextOptionHovered: true });
    this.props.playHoverSound && this.props.playHoverSound();
  };
  onMouseOutNextOption = () => {
    this.setState({ nextOptionHovered: false });
  };
  onMouseOverPrevOption = () => {
    this.setState({ prevOptionHovered: true });
    this.props.playHoverSound && this.props.playHoverSound();
  };
  onMouseOutPrevOption = () => {
    this.setState({ prevOptionHovered: false });
  };
  render() {
    return (
      <div className={classNames(styles.rowSelectionArea)}>
        <div className={classNames(styles.flipSelector)}>
          <FontAwesomeIcon
            fixedWidth
            size="lg"
            onMouseEnter={this.onMouseOverPrevOption}
            onMouseLeave={this.onMouseOutPrevOption}
            onClick={() => {
              const currOption = (this.props.currOption + this.props.options.length - 1) % this.props.options.length;
              this.props.onSelect(this.props.options[currOption], currOption);
              this.sfx && this.sfx.playSoundOneShot(SOUND_PREFERENCE_MENU_SELECT);
            }}
            className={classNames(
              this.state.prevOptionHovered ? styles.prevOptionHoveredScale : styles.prevOptionScale
            )}
            icon={faAngleLeft}
          />
          <FormattedMessage id={messageIdForOption[this.props.options[this.props.currOption]]} />
          <FontAwesomeIcon
            fixedWidth
            size="lg"
            onMouseEnter={this.onMouseOverNextOption}
            onMouseLeave={this.onMouseOutNextOption}
            onClick={() => {
              const currOption = (this.props.currOption + 1) % this.props.options.length;
              this.props.onSelect(this.props.options[currOption], currOption);
            }}
            className={classNames(
              this.state.nextOptionHovered ? styles.nextOptionHoveredScale : styles.nextOptionScale
            )}
            icon={faAngleRight}
          />
        </div>
      </div>
    );
  }
}

class CheckBox extends Component {
  static propTypes = {
    checked: PropTypes.bool,
    onCheck: PropTypes.func,
    playHoverSound: PropTypes.func
  };
  state = {
    checkBoxHovered: false
  };
  onMouseOverCheckBox = () => {
    this.setState({ checkBoxHovered: true });
    this.props.playHoverSound && this.props.playHoverSound();
  };
  onMouseOutCheckBox = () => {
    this.setState({ checkBoxHovered: false });
  };
  render() {
    return (
      <div className={classNames(styles.rowSelectionArea)} onClick={() => this.props.onCheck()}>
        <i className={classNames(styles.checkBoxArea)}>
          <FontAwesomeIcon
            onMouseEnter={this.onMouseOverCheckBox}
            onMouseLeave={this.onMouseOutCheckBox}
            className={classNames(this.state.checkBoxHovered ? styles.checkBoxScaleHover : styles.checkBoxScale)}
            icon={this.props.checked ? faCheckSquare : faSquare}
          />
        </i>
      </div>
    );
  }
}

class PreferenceRowName extends Component {
  static propTypes = {
    id: PropTypes.string
  };

  state = {
    nameHovered: false
  };
  onMouseOverName = () => {
    this.setState({ nameHovered: true });
  };

  onMouseOutName = () => {
    this.setState({ nameHovered: false });
  };

  render() {
    return (
      <span className={classNames(styles.rowName, this.state.nameHovered ? styles.rowNameHover : "")}>
        <FormattedMessage id={this.props.id} />
      </span>
    );
  }
}

class PreferenceRow extends Component {
  static propTypes = {
    children: PropTypes.node.isRequired
  };
  state = {
    hovered: false
  };

  onMouseOver = () => {
    this.setState({ hovered: true });
  };
  onMouseOut = () => {
    this.setState({ hovered: false });
  };

  render() {
    return (
      <div
        className={classNames(styles.row, this.state.hovered ? styles.rowScaleHover : styles.rowScale)}
        onMouseEnter={this.onMouseOver}
        onMouseLeave={this.onMouseOut}
      >
        {this.props.children}
      </div>
    );
  }
}

const TURNING_MODE_OPTIONS = ["snap", "smooth"];
const TOUCHSCREEN_MOVEMENT_SCHEME_OPTIONS = ["joysticks", "pinch"];
const MIC_ACTIVATION_SCHEME_OPTIONS = ["pushToTalk", "openMic"];
const MATERIAL_OPTIONS = ["auto", "hi-res", "low-res"];

export default class PreferencesScreen extends Component {
  static propTypes = {
    onClose: PropTypes.func,
    store: PropTypes.object
  };
  state = {
    muteMicOnEntry: false,
    turningModeCurrOption: 0,
    micActivationSchemeCurrOption: 0,
    turnSnapDegree: 45
  };
  componentDidMount() {
    const prefs = this.props.store.state.preferences;
    this.setState({
      muteMicOnEntry: !!prefs.muteMicOnEntry,
      turningModeCurrOption: prefs.turningMode ? TURNING_MODE_OPTIONS.indexOf(prefs.turningMode) : 0,
      micActivationSchemeCurrOption: prefs.micActivationScheme
        ? MIC_ACTIVATION_SCHEME_OPTIONS.indexOf(prefs.micActivationScheme)
        : 0,
      turnSnapDegree: prefs.turnSnapDegree ? prefs.turnSnapDegree : 45
    });
    waitForDOMContentLoaded().then(() => {
      this.sfx = AFRAME.scenes[0].systems["hubs-systems"].soundEffectsSystem;
    });
  }

  render() {
    const snapTurnRow = (
      <PreferenceRow key="preferences.turningMode">
        <PreferenceRowName id="preferences.turningMode" />
        <FlipSelector
          onSelect={(selection, currOption) => {
            this.props.store.update({ preferences: { turningMode: selection } });
            this.setState({ turningModeCurrOption: currOption });
            this.sfx && this.sfx.playSoundOneShot(SOUND_PREFERENCE_MENU_SELECT);
          }}
          playHoverSound={() => {
            this.sfx && this.sfx.playSoundOneShot(SOUND_PREFERENCE_MENU_HOVER);
          }}
          currOption={this.state.turningModeCurrOption}
          options={TURNING_MODE_OPTIONS}
        />
      </PreferenceRow>
    );
    const micActivationScheme = (
      <PreferenceRow key="preferences.micActivationScheme">
        <PreferenceRowName id="preferences.micActivationScheme" />
        <FlipSelector
          onSelect={(selection, currOption) => {
            this.props.store.update({ preferences: { micActivationScheme: selection } });
            this.setState({ micActivationSchemeCurrOption: currOption });
            this.sfx && this.sfx.playSoundOneShot(SOUND_PREFERENCE_MENU_SELECT);
          }}
          playHoverSound={() => {
            this.sfx && this.sfx.playSoundOneShot(SOUND_PREFERENCE_MENU_HOVER);
          }}
          currOption={this.state.micActivationSchemeCurrOption}
          options={MIC_ACTIVATION_SCHEME_OPTIONS}
        />
      </PreferenceRow>
    );
    const userPrefRow = (
      <PreferenceRow key="preferences.muteMicOnEntry">
        <PreferenceRowName id="preferences.muteMicOnEntry" />
        <CheckBox
          onCheck={() => {
            const muteMicOnEntry = !this.props.store.state.preferences.muteMicOnEntry;
            this.props.store.update({
              preferences: { muteMicOnEntry }
            });
            this.setState({ muteMicOnEntry });
            this.sfx && this.sfx.playSoundOneShot(SOUND_PREFERENCE_MENU_SELECT);
          }}
          checked={this.state.muteMicOnEntry}
          playHoverSound={() => {
            this.sfx && this.sfx.playSoundOneShot(SOUND_PREFERENCE_MENU_HOVER);
          }}
        />
      </PreferenceRow>
    );
    const turnSnapDegree = (
      <PreferenceRow key="preferences.turnSnapDegree">
        <PreferenceRowName id="preferences.turnSnapDegree" />
        <NumberRangeSelector
          min={1}
          max={90}
          curr={this.state.turnSnapDegree}
          onSelect={(value, playSound) => {
            const turnSnapDegree = parseInt(value);
            this.props.store.update({
              preferences: { turnSnapDegree }
            });
            this.setState({ turnSnapDegree });
            playSound && this.sfx && this.sfx.playSoundOneShot(SOUND_PREFERENCE_MENU_SELECT);
          }}
          playHoverSound={() => {
            this.sfx && this.sfx.playSoundOneShot(SOUND_PREFERENCE_MENU_HOVER);
          }}
        />
      </PreferenceRow>
    );
    // TODO: Sort rows by fuzzy search
    const rows = [snapTurnRow, turnSnapDegree, userPrefRow, micActivationScheme];
    return (
      <IntlProvider locale={lang} messages={messages}>
        <div className={classNames(styles.root)}>
          <i className={classNames(styles.floatRight)} onClick={e => this.props.onClose(e)}>
            <FontAwesomeIcon icon={faTimes} />
          </i>
          {rows}
        </div>
      </IntlProvider>
    );
  }
}
