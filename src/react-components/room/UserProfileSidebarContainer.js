import React, { useCallback, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { PromoteClientModal } from "./PromoteClientModal";
import { getAvatarThumbnailUrl } from "../../utils/avatar-utils";
import { UserProfileSidebar } from "./UserProfileSidebar.js";

export function UserProfileSidebarContainer({
  user,
  hubChannel,
  performConditionalSignIn,
  showBackButton,
  onBack,
  onClose,
  onCloseDialog,
  showNonHistoriedDialog
}) {
  const [avatarThumbnailUrl, setAvatarThumbnailUrl] = useState();

  const {
    id: userId,
    profile: { displayName, identityName, avatarId },
    roles
  } = user;
  const mayKick = hubChannel.canOrWillIfCreator("kick_users");
  const mayMute = user.micPresence && !user.micPresence.muted && hubChannel.canOrWillIfCreator("mute_users");
  const [isOwner, setIsOwner] = useState(!!roles.owner);
  const isCreator = !!roles.creator;
  const isSignedIn = !!roles.signed_in;
  const mayAddOwner = hubChannel.canOrWillIfCreator("update_roles") && !isOwner && !isCreator;
  const mayRemoveOwner = hubChannel.canOrWillIfCreator("update_roles") && isOwner && !isCreator;
  const [isHidden, setIsHidden] = useState(hubChannel.isHidden(user.id));

  useEffect(
    () => {
      if (avatarId) {
        getAvatarThumbnailUrl(avatarId).then(avatarThumbnailUrl => setAvatarThumbnailUrl(avatarThumbnailUrl));
      }
    },
    [avatarId, setAvatarThumbnailUrl]
  );

  const addOwner = useCallback(
    () => {
      performConditionalSignIn(
        () => hubChannel.can("update_roles"),
        async () => {
          showNonHistoriedDialog(PromoteClientModal, {
            displayName,
            onConfirm: async () => {
              setIsOwner(true);
              await hubChannel.addOwner(userId);
              onCloseDialog();
            }
          });
        },
        "add-owner"
      );
    },
    [performConditionalSignIn, hubChannel, showNonHistoriedDialog, userId, onCloseDialog, displayName]
  );

  const removeOwner = useCallback(
    () => {
      performConditionalSignIn(
        () => hubChannel.can("update_roles"),
        async () => {
          setIsOwner(false);
          await hubChannel.removeOwner(userId);
        },
        "remove-owner"
      );
    },
    [performConditionalSignIn, hubChannel, userId]
  );

  const toggleHidden = useCallback(
    () => {
      if (isHidden) {
        hubChannel.hide(userId);
      } else {
        hubChannel.unhide(userId);
      }

      setIsHidden(!isHidden);
    },
    [isHidden, userId, hubChannel]
  );

  const mute = useCallback(
    () => {
      performConditionalSignIn(
        () => hubChannel.can("mute_users"),
        async () => await hubChannel.mute(userId),
        "mute-user"
      );
    },
    [performConditionalSignIn, hubChannel, userId]
  );

  const kick = useCallback(
    () => {
      performConditionalSignIn(
        () => hubChannel.can("kick_users"),
        async () => await hubChannel.kick(userId),
        "kick-user"
      );

      if (onClose) {
        onClose();
      } else if (onBack) {
        onBack();
      }
    },
    [performConditionalSignIn, hubChannel, userId, onClose, onBack]
  );

  return (
    <UserProfileSidebar
      displayName={displayName}
      identityName={identityName}
      avatarPreview={<img src={avatarThumbnailUrl} />}
      isSignedIn={isSignedIn}
      canPromote={mayAddOwner}
      onPromote={addOwner}
      canDemote={mayRemoveOwner}
      onDemote={removeOwner}
      isHidden={isHidden}
      onToggleHidden={toggleHidden}
      canMute={mayMute}
      onMute={mute}
      canKick={mayKick}
      onKick={kick}
      showBackButton={showBackButton}
      onClose={onClose}
      onBack={onBack}
    />
  );
}

UserProfileSidebarContainer.propTypes = {
  user: PropTypes.object.isRequired,
  hubChannel: PropTypes.object,
  performConditionalSignIn: PropTypes.func,
  showBackButton: PropTypes.bool,
  onBack: PropTypes.func,
  onClose: PropTypes.func,
  onCloseDialog: PropTypes.func.isRequired,
  showNonHistoriedDialog: PropTypes.func
};
