console.log(`Hubs version: ${process.env.BUILD_VERSION || "?"}`);

// We should technically be able to just include three here, but our dependancies are tangled such that not having aframe is a bit difficult
import "aframe";
import "./utils/logging";

import ReactDOM from "react-dom";
import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";

import { IntlProvider, FormattedMessage, addLocaleData } from "react-intl";
import en from "react-intl/locale-data/en";
import { lang, messages } from "./utils/i18n";
addLocaleData([...en]);

import { disableiOSZoom } from "./utils/disable-ios-zoom";
disableiOSZoom();

import { App } from "./App";

import AvatarPreview from "./react-components/avatar-preview";

import { fetchAvatar } from "./utils/avatar-utils";

import styles from "./assets/stylesheets/avatar.scss";
import hubLogo from "./assets/images/hub-preview-white.png";

const qs = new URLSearchParams(location.search);
window.APP = new App();

class AvatarUI extends React.Component {
  static propTypes = {
    avatarId: PropTypes.string,
    store: PropTypes.object,
    intl: PropTypes.object
  };

  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    this.props.store.addEventListener("statechanged", this.storeUpdated);
    this.refetchAvatar();
  }

  componentWillUnmount() {
    this.props.store.removeEventListener("statechanged", this.storeUpdated);
  }

  storeUpdated = () => this.forceUpdate();

  refetchAvatar = async () => {
    const avatar = await fetchAvatar(this.props.avatarId);
    this.setState({ avatar });
  };

  setAvatar = e => {
    e && e.preventDefault();
    this.props.store.update({
      profile: { avatarId: this.state.avatar.avatar_id }
    });
  };

  render() {
    const { avatar } = this.state;
    if (!avatar) {
      return (
        <div className={styles.avatarLanding}>
          <div className={classNames([styles.box, styles.darkened])}>Loading</div>
        </div>
      );
    }

    const selectedAvatarId = this.props.store.state.profile.avatarId;
    const isSelected = avatar.avatar_id === selectedAvatarId;

    return (
      <form onSubmit={this.setAvatar} className={styles.avatarLanding}>
        <div className={classNames([styles.box, styles.darkened])}>
          <label className={styles.title}>
            <span>{avatar.name}</span>
          </label>
          <div className={styles.attributions}>
            {avatar.attributions && avatar.attributions.creator && <span>{`by ${avatar.attributions.creator}`}</span>}
          </div>
          <div className={styles.preview}>{avatar && <AvatarPreview avatarGltfUrl={avatar.gltf_url} />}</div>
          {isSelected ? (
            <span className={styles.selectedMessage}>
              <FormattedMessage id="avatar-landing.selected" />
            </span>
          ) : (
            <button disabled={isSelected} className={styles.formSubmit} type="submit">
              <FormattedMessage id="avatar-landing.select" />
            </button>
          )}
        </div>
        <img className={styles.logo} src={hubLogo} />
      </form>
    );
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const avatarId = qs.get("avatar_id") || document.location.pathname.substring(1).split("/")[1];
  console.log(`Avatar ID: ${avatarId}`);
  ReactDOM.render(
    <IntlProvider locale={lang} messages={messages}>
      <AvatarUI avatarId={avatarId} store={window.APP.store} />
    </IntlProvider>,
    document.getElementById("ui-root")
  );
});
