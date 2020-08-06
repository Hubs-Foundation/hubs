import React, { Component } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { faTimes } from "@fortawesome/free-solid-svg-icons/faTimes";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import configs from "../utils/configs";
import modalButton from "../assets/images/modal-button.png";
import modalBg from "../assets/images/modal-bg.png";

import logoImage from "../assets/images/logo.png";
import logoImageWebp from "../assets/images/logo.webp";

export default class DialogContainer extends Component {
  static propTypes = {
    title: PropTypes.node,
    children: PropTypes.node.isRequired,
    onClose: PropTypes.func,
    closable: PropTypes.bool,
    wide: PropTypes.bool,
    noOverlay: PropTypes.bool,
    className: PropTypes.string,
    allowOverflow: PropTypes.bool,
    additionalClass: PropTypes.string
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
      <div
        className={classNames(
          "dialog-overlay",
          this.props.noOverlay ? "dialog-overlay__no-pointer-events" : "",
          this.props.className
        )}
      >
        <div
          className={classNames(
            "dialog",
            this.props.noOverlay ? "dialog__no-pointer-events" : "dialog__dark-background",
            this.props.noOverlay ? "dialog__align-end" : ""
          )}

          onClick={this.onContainerClicked}
        >
          <div className={`dialog__box ${this.props.wide ? "dialog__wide" : ""} `}>
            <div
              className={classNames(
                "dialog__box__contents",
                this.props.allowOverflow ? "dialog__box__contents-overflow" : null,
                this.props.additionalClass
              )}

        style={{
          background: `url(${modalBg})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: "auto"
        
        }}
            >
              {this.props.closable &&
                this.props.onClose &&
                !this.props.noOverlay && (
                  <button
                    className="dialog__box__contents__close"
                    onClick={() => this.props.onClose()}
                    style={{
                      padding: "0"
                    }}
                  >
                    <img
                      src={modalButton}
                      style={{
                        width: "24px",
                        height: "24px"
                      }}
                    />
                  </button>
                )}
              <div
                style={{
                  textAlign: "center",
                  width: "100%"
                }}
              >
          <picture>
          <source srcSet={logoImageWebp} type="image/webp"/>

          <img
            src={logoImage}
            style={{
              maxWidth: "200px",
              animation: "logo-rotate 12s linear infinite"
            }}
          />
          </picture>
              </div>
              <div className="dialog__box__contents__body">{this.props.children}</div>
              <div className="dialog__box__contents__button-container" />
            </div>
          </div>
        </div>
      </div>
    );
  }
}
