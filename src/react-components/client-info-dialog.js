import React, { Component } from "react";
import PropTypes from "prop-types";
import { PromoteClientModal } from "./room/PromoteClientModal";
import { getAvatarThumbnailUrl } from "../utils/avatar-utils";
import { UserProfileSidebar } from "./room/UserProfileSidebar.js";

export default class ClientInfoDialog extends Component {
  static propTypes = {
    user: PropTypes.object.isRequired,
    hubChannel: PropTypes.object,
    performConditionalSignIn: PropTypes.func,
    showBackButton: PropTypes.bool,
    onBack: PropTypes.func,
    onClose: PropTypes.func,
    onCloseDialog: PropTypes.func.isRequired,
    showNonHistoriedDialog: PropTypes.func
  };

  state = {
    avatarThumbnailUrl: null
  };

  kick() {
    const { user, performConditionalSignIn, hubChannel, onClose, onBack } = this.props;

    performConditionalSignIn(
      () => hubChannel.can("kick_users"),
      async () => await hubChannel.kick(user.id),
      "kick-user"
    );

    if (onClose) {
      onClose();
    } else if (onBack) {
      onBack();
    }
  }

  hide() {
    const { user, hubChannel } = this.props;
    hubChannel.hide(user.id);

    this.forceUpdate();
  }

  mute() {
    const { user, performConditionalSignIn, hubChannel } = this.props;

    performConditionalSignIn(
      () => hubChannel.can("mute_users"),
      async () => await hubChannel.mute(user.id),
      "mute-user"
    );

    this.forceUpdate();
  }

  addOwner() {
    const { user, performConditionalSignIn, hubChannel, onCloseDialog } = this.props;
    const { profile } = this.props.user;

    performConditionalSignIn(
      () => hubChannel.can("update_roles"),
      async () => {
        this.props.showNonHistoriedDialog(PromoteClientModal, {
          displayName: profile.displayName,
          onConfirm: () => {
            hubChannel.addOwner(user.id);
            onCloseDialog();
          }
        });
      },
      "add-owner"
    );

    this.forceUpdate();
  }

  removeOwner() {
    const { user, performConditionalSignIn, hubChannel } = this.props;

    performConditionalSignIn(
      () => hubChannel.can("update_roles"),
      async () => await hubChannel.removeOwner(user.id),
      "remove-owner"
    );

    this.forceUpdate();
  }

  unhide() {
    const { user, hubChannel } = this.props;
    hubChannel.unhide(user.id);
    this.forceUpdate();
  }

  componentDidMount() {
    const { profile } = this.props.user;
    if (profile.avatarId) {
      getAvatarThumbnailUrl(profile.avatarId).then(avatarThumbnailUrl => this.setState({ avatarThumbnailUrl }));
    }
  }

  render() {
    const { profile, roles } = this.props.user;

    const { displayName, identityName } = profile;
    const { hubChannel, user, showBackButton, onClose, onBack } = this.props;
    const mayKick = hubChannel.canOrWillIfCreator("kick_users");
    const mayMute = user.micPresence && !user.micPresence.muted && hubChannel.canOrWillIfCreator("mute_users");
    const targetIsOwner = !!roles.owner;
    const targetIsCreator = !!roles.creator;
    const targetIsSignedIn = !!roles.signed_in;
    const mayAddOwner = hubChannel.canOrWillIfCreator("update_roles") && !targetIsOwner && !targetIsCreator;
    const mayRemoveOwner = hubChannel.canOrWillIfCreator("update_roles") && targetIsOwner && !targetIsCreator;
    const isHidden = hubChannel.isHidden(user.id);

    return (
      <UserProfileSidebar
        displayName={displayName}
        identityName={identityName}
        avatarPreview={<img src={this.state.avatarThumbnailUrl} />}
        isSignedIn={targetIsSignedIn}
        canPromote={mayAddOwner}
        onPromote={() => this.addOwner()}
        canDemote={mayRemoveOwner}
        onDemote={() => this.removeOwner()}
        isHidden={isHidden}
        onToggleHidden={() => (isHidden ? this.unhide() : this.hide())}
        canMute={mayMute}
        onMute={() => this.mute()}
        canKick={mayKick}
        onKick={() => this.kick()}
        showBackButton={showBackButton}
        onClose={onClose}
        onBack={onBack}
      />
    );
  }
}
