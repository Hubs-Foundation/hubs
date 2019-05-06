import React, { Component } from "react";
import PropTypes from "prop-types";
import DialogContainer from "./dialog-container.js";
import styles from "../assets/stylesheets/client-info-dialog.scss";
import profileAvatarPlaceholder from "../assets/images/profile-avatar-placeholder.jpg";
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
    presences: PropTypes.object
  };

  render() {
    if (!this.props.presences) return null;

    const presence = Object.entries(this.props.presences).find(([k]) => k === this.props.clientId);
    if (!presence) return null;

    const metas = presence[1].metas;
    const meta = metas[metas.length - 1];
    const title = <div className={styles.title}>{meta.profile.displayName}</div>;

    return (
      <DialogContainer title={title} wide={true} {...this.props}>
        <div className={styles.roomInfo}>
          <div className={styles.clientProfileImage}>
            <img src={profileAvatarPlaceholder} />
          </div>
        </div>
      </DialogContainer>
    );
  }
}
