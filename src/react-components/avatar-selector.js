import React, { Component } from "react";
import PropTypes from "prop-types";
import { injectIntl } from "react-intl";

import { avatars } from "../assets/avatars/avatars";
import MediaBrowser from "./media-browser";

class AvatarSelector extends Component {
  static propTypes = {
    history: PropTypes.object,
    avatarId: PropTypes.string,
    onChange: PropTypes.func
  };

  constructor(props) {
    super(props);
    this.mediaSearchStore = window.APP.mediaSearchStore;
    this.mediaSearchStore.sourceNavigateWithNoNav("avatars");
  }

  render() {
    return (
      <div>
        <MediaBrowser {...this.props} mediaSearchStore={this.mediaSearchStore} />
        {avatars.map(avatar => <span key={avatar.id}>{avatar.id}</span>)}
      </div>
    );
  }
}

export default injectIntl(AvatarSelector);
