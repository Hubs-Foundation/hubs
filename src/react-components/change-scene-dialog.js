import React, { Component } from "react";
import PropTypes from "prop-types";
import styles from "../assets/stylesheets/change-scene-dialog.scss";
import cx from "classnames";
import DialogContainer from "./dialog-container.js";
import { handleTextFieldFocus, handleTextFieldBlur } from "../utils/focus-utils";
import { FormattedMessage } from "react-intl";

export default class ChangeSceneDialog extends Component {
  state = {
    url: ""
  };

  static propTypes = {
    onChange: PropTypes.func,
    onClose: PropTypes.func
  };

  onUrlChange = e => {
    this.setState({
      url: e.target && e.target.value
    });
  };

  reset = e => {
    e.preventDefault();
    this.setState({ url: "" });
  };

  onChangeClicked = e => {
    e.preventDefault();

    if (this.state.url) {
      this.props.onChange(this.state.url);
    }

    this.props.onClose();
  };

  render() {
    const { onChange, onClose } = this.props; // eslint-disable-line no-unused-vars

    return (
      <DialogContainer title="Custom Scene" onClose={this.props.onClose}>
        <div>
          <div>
            <p>
              Paste a URL to a{" "}
              <a href="/spoke" target="_blank" rel="noopener noreferrer">
                Spoke
              </a>{" "}
              scene or a URL to a{" "}
              <a href="https://en.wikipedia.org/wiki/GlTF#GLB" target="_blank" rel="noopener noreferrer">
                GLB
              </a>.
            </p>
            <p>
              Want to create your own scene? Check out{" "}
              <a href="/spoke" target="_blank" rel="noopener noreferrer">
                Spoke
              </a>!
            </p>
          </div>
          <form onSubmit={this.onChangeClicked}>
            <div className={styles.changeSceneForm}>
              <div className={styles.inputBorder}>
                <input
                  className={cx(styles.leftSideOfInput)}
                  placeholder="Scene URL"
                  onFocus={e => handleTextFieldFocus(e.target)}
                  onBlur={() => handleTextFieldBlur()}
                  onChange={this.onUrlChange}
                  type="url"
                  value={this.state.url}
                />
              </div>
              <div className={styles.buttons}>
                <button className={styles.actionButton}>
                  <FormattedMessage id="change-scene-dialog.change-scene" />
                </button>
              </div>
            </div>
          </form>
        </div>
      </DialogContainer>
    );
  }
}
