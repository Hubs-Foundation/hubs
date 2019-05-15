import React, { Component } from "react";
import PropTypes from "prop-types";
import DialogContainer from "./dialog-container.js";
import styles from "../assets/stylesheets/client-info-dialog.scss";
import profileAvatarPlaceholder from "../assets/images/profile-avatar-placeholder.jpg";
import { FormattedMessage } from "react-intl";
import { sluglessPath } from "../utils/history";

export function getClientInfoClientId(location) {
  const { search } = location;
  const urlParams = new URLSearchParams(search);
  const pathname = sluglessPath(location);

  if (!pathname.startsWith("/client") && !urlParams.get("client_id")) return null;
  return urlParams.get("client_id") || pathname.substring(9);
}

export default class ClientInfoDialog extends Component {
  static propTypes = {
    clientId: PropTypes.string,
    history: PropTypes.object,
    hubChannel: PropTypes.object,
    presences: PropTypes.object,
    performConditionalSignIn: PropTypes.func,
    onClose: PropTypes.func
  };

  kick() {
    const { clientId, performConditionalSignIn, hubChannel, onClose } = this.props;

    performConditionalSignIn(
      () => hubChannel.can("kick_users"),
      async () => await hubChannel.kick(clientId),
      "kick-user"
    );

    onClose();
  }

  hide() {
    const { clientId, onClose, hubChannel } = this.props;
    hubChannel.hide(clientId);
    onClose();
  }

  mute() {
    const { clientId, performConditionalSignIn, hubChannel, onClose } = this.props;

    performConditionalSignIn(
      () => hubChannel.can("mute_users"),
      async () => await hubChannel.mute(clientId),
      "mute-user"
    );

    onClose();
  }

  unhide() {
    const { clientId, hubChannel, onClose } = this.props;
    hubChannel.unhide(clientId);
    onClose();
  }

  render() {
    if (!this.props.presences) return null;

    const presence = Object.entries(this.props.presences).find(([k]) => k === this.props.clientId);
    if (!presence) return null;

    const { hubChannel, clientId, onClose } = this.props;
    const metas = presence[1].metas;
    const meta = metas[metas.length - 1];
    const { displayName, communityIdentifier } = meta.profile;
    const title = (
      <div className={styles.title}>
        {displayName}
        <div className={styles.communityIdentifier}>{communityIdentifier}</div>
      </div>
    );
    const mayKick = hubChannel.canOrWillIfCreator("kick_users");
    const mayMute = hubChannel.canOrWillIfCreator("mute_users");
    const isHidden = hubChannel.isHidden(clientId);

    return (
      <DialogContainer className={styles.clientInfoDialog} title={title} wide={true} {...this.props}>
        <div className={styles.roomInfo}>
          <div className={styles.clientProfileImage}>
            <img src={profileAvatarPlaceholder} />
          </div>
          <div className={styles.clientActionButtons}>
            {!isHidden && (
              <button onClick={() => this.hide()}>
                <FormattedMessage id="client-info.hide-button" />
              </button>
            )}
            {isHidden && (
              <button onClick={() => this.unhide()}>
                <FormattedMessage id="client-info.unhide-button" />
              </button>
            )}
            {mayMute && (
              <button onClick={() => this.mute()}>
                <FormattedMessage id="client-info.mute-button" />
              </button>
            )}
            {mayKick && (
              <button onClick={() => this.kick()}>
                <FormattedMessage id="client-info.kick-button" />
              </button>
            )}
            <button className={styles.cancel} onClick={onClose}>
              <FormattedMessage id="client-info.cancel" />
            </button>
          </div>
        </div>
      </DialogContainer>
    );
  }
}
