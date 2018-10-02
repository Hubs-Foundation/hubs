import React, { Component } from "react";
import PropTypes from "prop-types";
import { AudioContext } from "../AudioContext";

export default class DialogContainer extends Component {
  static propTypes = {
    title: PropTypes.node,
    children: PropTypes.node.isRequired,
    onClose: PropTypes.func
  };

  constructor(props) {
    super(props);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onContainerClicked = this.onContainerClicked.bind(this);
  }

  componentDidMount() {
    window.addEventListener("keydown", this.onKeyDown);
  }

  componentWillUnmount() {
    window.removeEventListener("keydown", this.onKeyDown);
  }

  onKeyDown(e) {
    if (e.key === "Escape") {
      this.props.onClose();
    }
  }

  onContainerClicked = e => {
    if (e.currentTarget === e.target) {
      this.props.onClose();
    }
  };

  render() {
    return (
      <div className="dialog-overlay">
        <AudioContext.Consumer>
          {audio => (
            <div className="dialog" onClick={this.onContainerClicked}>
              <div className="dialog__box">
                <div className="dialog__box__contents">
                  {this.props.onClose && (
                    <button
                      className="dialog__box__contents__close"
                      onClick={this.props.onClose}
                      onMouseEnter={audio.onMouseEnter}
                      onMouseLeave={audio.onMouseLeave}
                    >
                      <span>×</span>
                    </button>
                  )}
                  <div className="dialog__box__contents__title">{this.props.title}</div>
                  <div className="dialog__box__contents__body">{this.props.children}</div>
                  <div className="dialog__box__contents__button-container" />
                </div>
              </div>
            </div>
          )}
        </AudioContext.Consumer>
      </div>
    );
  }
}
