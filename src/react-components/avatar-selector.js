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

  state = { avatar: null, showPreview: true };

  constructor(props) {
    super(props);
    this.mediaSearchStore = window.APP.mediaSearchStore;
    this.mediaSearchStore.sourceNavigateWithNoNav("avatars");
    this.widthQuery = window.matchMedia("(min-width: 1200px)");
  }

  componentDidMount = () => {
    this.widthQuery.addListener(this.togglePreview);
  };

  componentWillUnmount = () => {
    this.widthQuery.removeListener(this.togglePreview);
  };

  togglePreview = query => {
    this.setState({ showPreview: query.matches });
  };

  avatarSelected = entry => {
    this.setState({ avatar: { base_gltf_url: entry.gltfs.avatar } });
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
        {this.state.showPreview && <AvatarPreview avatar={this.state.avatar} />}
      </div>
    );
  }
}

export default injectIntl(AvatarSelector);
