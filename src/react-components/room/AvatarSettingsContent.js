import React from "react";
import PropTypes from "prop-types";
import { Button, AcceptButton } from "../input/Button";
import styles from "./AvatarSettingsContent.scss";
import { TextInputField } from "../input/TextInputField";
import { Column } from "../layout/Column";
import { FormattedMessage } from "react-intl";
import mediaStyles from "../room/MediaTiles.scss";
import { CreateTile, MediaTile } from "./MediaTiles";

const Medias = [
  {
    allow_remixing: false,
    attributions: { creator: "" },
    description: null,
    gltfs: {
      avatar: "https://dev.reticulum.io/api/v1/avatars/yUXsaby/avatar.gltf?v=63734422084",
      base: "https://dev.reticulum.io/api/v1/avatars/yUXsaby/base.gltf?v=63734422084"
    },
    id: "123",
    images: {
      preview: {
        // height: ,
        url: "https://hubs-upload-cdn.com/files/6d05c5f8-36e2-4bbe-9321-9a4bfb662933.png",
        width: 150
      }
    },
    name: "===========",
    type: "avatar_listing",
    url: "#"
  }
];

export function AvatarSettingsContent({
  displayName,
  displayNameInputRef,
  disableDisplayNameInput,
  onChangeDisplayName,
  avatarPreview,
  displayNamePattern,
  onChangeAvatar,
  ...rest
}) {
  return (
    <Column as="form" className={styles.content} {...rest}>
      <div className="form-head">
        {/* <h6>Settings</h6> */}
        <h5>Avatar</h5>
        {/* <p>Choose an Avatar</p> */}
      </div>
      <TextInputField
        disabled={disableDisplayNameInput}
        label={<FormattedMessage id="avatar-settings-content.display-name-label" defaultMessage="Avatar" />}
        value={displayName}
        pattern={displayNamePattern}
        spellCheck="false"
        required
        onChange={onChangeDisplayName}
        description={
          <FormattedMessage
            id="avatar-settings-content.display-name-description"
            defaultMessage="Alphanumerics, hyphens, underscores, and tildes. At least 3 characters, no more than 32"
          />
        }
        ref={displayNameInputRef}
      />
      <div className={styles.avatarPreviewContainer}>
        {avatarPreview || <div />}
        <Button type="button" preset="basic" onClick={onChangeAvatar}>
          <FormattedMessage id="avatar-settings-content.change-avatar-button" defaultMessage="Change Avatar" />
        </Button>
      </div>

      {/*{rest.mediaBrowser} */}

      {/* <CreateTile
        type="avatar"
        onClick={console.log}
        label={<FormattedMessage id="media-browser.create-avatar" defaultMessage="Create Avatar" />}
      /> */}
      <AcceptButton preset="custom1" lg={true} type="submit" />
    </Column>
  );
}

AvatarSettingsContent.propTypes = {
  className: PropTypes.string,
  displayName: PropTypes.string,
  displayNameInputRef: PropTypes.func,
  disableDisplayNameInput: PropTypes.bool,
  displayNamePattern: PropTypes.string,
  onChangeDisplayName: PropTypes.func,
  avatarPreview: PropTypes.node,
  onChangeAvatar: PropTypes.func
};
