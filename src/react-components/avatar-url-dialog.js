import React, { Component } from "react";
import PropTypes from "prop-types";
import { FormattedMessage } from "react-intl";

import styles from "../assets/stylesheets/avatar-url-dialog.scss";
import DialogContainer from "./dialog-container.js";
import { handleTextFieldFocus, handleTextFieldBlur } from "../utils/focus-utils";

export default class AvatarUrlDialog extends Component {
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

  onChangeClicked = e => {
    e.preventDefault();

    if (this.state.url) {
      this.props.onChange(this.state.url);
    }

    this.props.onClose();
  };

  render() {
    return (
      <DialogContainer title="Custom Avatar URL" className={styles.avatarUrlDialog} onClose={this.props.onClose}>
        <p>
          Paste a URL to a{" "}
          <a href="https://en.wikipedia.org/wiki/GlTF#GLB" target="_blank" rel="noopener noreferrer">
            GLB
          </a>.
        </p>
        <form className="form" onSubmit={this.onChangeClicked}>
          <input
            className="url-field"
            placeholder="Avatar GLB URL"
            onFocus={e => handleTextFieldFocus(e.target)}
            onBlur={() => handleTextFieldBlur()}
            onChange={this.onUrlChange}
            type="url"
            value={this.state.url}
          />
          <button className="submit">
            <FormattedMessage id="avatar-url-dialog.apply" />
          </button>
        </form>
      </DialogContainer>
    );
  }
}
