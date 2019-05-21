import React, { Component } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { WithHoverSound } from "./wrap-with-audio";
import { faTimes } from "@fortawesome/free-solid-svg-icons/faTimes";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default class DialogContainer extends Component {
  static propTypes = {
    title: PropTypes.node,
    children: PropTypes.node.isRequired,
    onClose: PropTypes.func,
    closable: PropTypes.bool,
    wide: PropTypes.bool,
    className: PropTypes.string
  };

  static defaultProps = {
    closable: true
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
    if (this.props.closable && e.key === "Escape") {
      this.props.onClose();
    }
  }

  onContainerClicked = e => {
    if (this.props.closable && e.currentTarget === e.target) {
      this.props.onClose();
    }
  };

  render() {
    return (
      <div className={classNames("dialog-overlay", this.props.className)}>
        <div className="dialog" onClick={this.onContainerClicked}>
          <div className={`dialog__box ${this.props.wide ? "dialog__wide" : ""} `}>
            <div className="dialog__box__contents">
              {this.props.closable &&
                this.props.onClose && (
                  <WithHoverSound>
                    <button className="dialog__box__contents__close" onClick={() => this.props.onClose()}>
                      <i>
                        <FontAwesomeIcon icon={faTimes} />
                      </i>
                    </button>
                  </WithHoverSound>
                )}
              <div className="dialog__box__contents__title">{this.props.title}</div>
              <div className="dialog__box__contents__body">{this.props.children}</div>
              <div className="dialog__box__contents__button-container" />
            </div>
          </div>
        </div>
      </div>
    );
  }
}
