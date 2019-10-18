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

import { IntlProvider, FormattedMessage, addLocaleData } from "react-intl";
import en from "react-intl/locale-data/en";
import { lang, messages } from "../utils/i18n";
addLocaleData([...en]);

const messageIdForOption = {
  snap: "preferences.turningModeSnap",
  smooth: "preferences.turningModeSmooth"
};

class FlipSelector extends Component {
  static propTypes = {
    options: PropTypes.array,
    onSelect: PropTypes.func,
    currOption: PropTypes.number
  };
  state = {
    nextOptionHovered: false,
    prevOptionHovered: false
  };
  onMouseOverNextOption = () => {
    this.setState({ nextOptionHovered: true });
  };
  onMouseOutNextOption = () => {
    this.setState({ nextOptionHovered: false });
  };
  onMouseOverPrevOption = () => {
    this.setState({ prevOptionHovered: true });
  };
  onMouseOutPrevOption = () => {
    this.setState({ prevOptionHovered: false });
  };
  render() {
    return (
      <div className={classNames(styles.rowSelectionArea)}>
        <div className={classNames(styles.flipSelector)}>
          <FontAwesomeIcon
            onMouseOver={this.onMouseOverPrevOption}
            onMouseOut={this.onMouseOutPrevOption}
            onClick={() => {
              const currOption = (this.props.currOption + this.props.options.length - 1) % this.props.options.length;
              this.props.onSelect(this.props.options[currOption], currOption);
            }}
            className={classNames(
              this.state.prevOptionHovered ? styles.prevOptionHoveredScale : styles.prevOptionScale
            )}
            icon={faAngleLeft}
          />
          <FormattedMessage id={messageIdForOption[this.props.options[this.props.currOption]]} />
          <FontAwesomeIcon
            onMouseOver={this.onMouseOverNextOption}
            onMouseOut={this.onMouseOutNextOption}
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
    onCheck: PropTypes.func
  };
  state = {
    checkBoxHovered: false
  };
  onMouseOverCheckBox = () => {
    this.setState({ checkBoxHovered: true });
  };
  onMouseOutCheckBox = () => {
    this.setState({ checkBoxHovered: false });
  };
  render() {
    return (
      <i className={classNames(styles.rowSelectionArea)} onClick={() => this.props.onCheck()}>
        <FontAwesomeIcon
          onMouseOver={this.onMouseOverCheckBox}
          onMouseOut={this.onMouseOutCheckBox}
          className={classNames(this.state.checkBoxHovered ? styles.checkBoxScaleHover : styles.checkBoxScale)}
          icon={this.props.checked ? faCheckSquare : faSquare}
        />
      </i>
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
      <p className={classNames(styles.rowName, this.state.nameHovered ? styles.rowNameHover : "")}>
        <FormattedMessage id={this.props.id} />
      </p>
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
        onMouseOver={this.onMouseOver}
        onMouseOut={this.onMouseOut}
      >
        {this.props.children}
      </div>
    );
  }
}

const TURNING_MODE_OPTIONS = ["snap", "smooth"];

export default class PreferencesScreen extends Component {
  static propTypes = {
    onClose: PropTypes.func,
    store: PropTypes.object
  };
  state = {
    muteMicOnEntry: false,
    turningModeCurrOption: 0
  };
  componentDidMount() {
    const prefs = this.props.store.state.preferences;
    this.setState({
      muteMicOnEntry: !!prefs.muteMicOnEntry,
      turningModeCurrOption: prefs.turningMode ? TURNING_MODE_OPTIONS.indexOf(prefs.turningMode) : 0
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
          }}
          currOption={this.state.turningModeCurrOption}
          options={TURNING_MODE_OPTIONS}
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
          }}
          checked={this.state.muteMicOnEntry}
        />
      </PreferenceRow>
    );
    // TODO: Sort rows by fuzzy search
    const rows = [snapTurnRow, userPrefRow];
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
