import React, { Component } from "react";
import PropTypes from "prop-types";
import { injectIntl } from "react-intl";

import MediaBrowser from "./media-browser";
import AvatarPreview from "./avatar-preview";
import styles from "../assets/stylesheets/avatar-selector.scss";

class AvatarSelector extends Component {
  static propTypes = {
    history: PropTypes.object,
    avatarId: PropTypes.string,
    onChange: PropTypes.func
  };

  state = { avatar: null };

  constructor(props) {
    super(props);
    this.mediaSearchStore = window.APP.mediaSearchStore;
    this.mediaSearchStore.sourceNavigateWithNoNav("avatars");
  }

  avatarSelected = entry => {
    this.setState({ avatar: { base_gltf_url: entry.url } });
  };

  render() {
    return (
      <div className={styles.avatarSelectorContainer}>
        <MediaBrowser
          {...this.props}
          showHeader={false}
          closeOnSelect={false}
          mediaSearchStore={this.mediaSearchStore}
          onMediaSearchResultEntrySelected={this.avatarSelected}
        />
        <AvatarPreview avatar={this.state.avatar} />
      </div>
    );
  }
}

export default injectIntl(AvatarSelector);
