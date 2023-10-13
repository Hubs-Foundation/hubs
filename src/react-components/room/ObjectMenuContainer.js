import React from "react";
import PropTypes from "prop-types";
import { ObjectMenu, ObjectMenuButton } from "./ObjectMenu";
import { useObjectList } from "./hooks/useObjectList";
import {
  usePinObject,
  useRemoveObject,
  useGoToSelectedObject,
  getObjectUrl,
  isPlayer,
  isMe,
  useHideAvatar
} from "./object-hooks";
import { ReactComponent as PinIcon } from "../icons/Pin.svg";
import { ReactComponent as LinkIcon } from "../icons/Link.svg";
import { ReactComponent as GoToIcon } from "../icons/GoTo.svg";
import { ReactComponent as DeleteIcon } from "../icons/Delete.svg";
import { ReactComponent as AvatarIcon } from "../icons/Avatar.svg";
import { ReactComponent as HideIcon } from "../icons/Hide.svg";
import { FormattedMessage } from "react-intl";

function MyMenuItems({ onOpenProfile }) {
  return (
    <ObjectMenuButton onClick={onOpenProfile}>
      <AvatarIcon />
      <span>
        <FormattedMessage id="object-menu.edit-avatar-button" defaultMessage="Edit Avatar" />
      </span>
    </ObjectMenuButton>
  );
}

MyMenuItems.propTypes = {
  onOpenProfile: PropTypes.func.isRequired
};

function PlayerMenuItems({ hubChannel, activeObject, deselectObject }) {
  const hideAvatar = useHideAvatar(hubChannel, activeObject);

  return (
    <ObjectMenuButton
      onClick={() => {
        deselectObject();
        hideAvatar();
      }}
    >
      <HideIcon />
      <span>
        <FormattedMessage id="object-menu.hide-avatar-button" defaultMessage="Hide" />
      </span>
    </ObjectMenuButton>
  );
}

PlayerMenuItems.propTypes = {
  hubChannel: PropTypes.object.isRequired,
  activeObject: PropTypes.object.isRequired,
  deselectObject: PropTypes.func.isRequired
};

function ObjectMenuItems({ hubChannel, scene, activeObject, deselectObject, onGoToObject }) {
  const { canPin, isPinned, togglePinned } = usePinObject(hubChannel, scene, activeObject);
  const { canRemoveObject, removeObject } = useRemoveObject(hubChannel, scene, activeObject);
  const { canGoTo, goToSelectedObject } = useGoToSelectedObject(scene, activeObject);
  const url = getObjectUrl(activeObject);

  return (
    <>
      <ObjectMenuButton disabled={!canPin} onClick={togglePinned}>
        <PinIcon />
        <span>
          {isPinned ? (
            <FormattedMessage id="object-menu.unpin-object-button" defaultMessage="Unpin" />
          ) : (
            <FormattedMessage id="object-menu.pin-object-button" defaultMessage="Pin" />
          )}
        </span>
      </ObjectMenuButton>
      {url && (
        <ObjectMenuButton as="a" href={url} target="_blank" rel="noopener noreferrer">
          <LinkIcon />
          <span>
            <FormattedMessage id="object-menu.object-link-button" defaultMessage="Link" />
          </span>
        </ObjectMenuButton>
      )}
      <ObjectMenuButton
        disabled={!canGoTo}
        onClick={() => {
          goToSelectedObject();
          deselectObject();
          onGoToObject();
        }}
      >
        <GoToIcon />
        <span>
          <FormattedMessage id="object-menu.view-object-button" defaultMessage="View" />
        </span>
      </ObjectMenuButton>
      <ObjectMenuButton
        disabled={!canRemoveObject}
        onClick={() => {
          removeObject();
          deselectObject();
        }}
      >
        <DeleteIcon />
        <span>
          <FormattedMessage id="object-menu.delete-object-button" defaultMessage="Delete" />
        </span>
      </ObjectMenuButton>
    </>
  );
}

ObjectMenuItems.propTypes = {
  hubChannel: PropTypes.object.isRequired,
  scene: PropTypes.object.isRequired,
  activeObject: PropTypes.object.isRequired,
  deselectObject: PropTypes.func.isRequired,
  onGoToObject: PropTypes.func.isRequired
};

export function ObjectMenuContainer({ hubChannel, scene, onOpenProfile, onGoToObject }) {
  const { objects, activeObject, deselectObject, selectNextObject, selectPrevObject, toggleLights, lightsEnabled } =
    useObjectList();

  let menuItems;
  let isAvatar = false;
  if (isMe(activeObject)) {
    isAvatar = true;
    menuItems = <MyMenuItems onOpenProfile={onOpenProfile} />;
  } else if (isPlayer(activeObject)) {
    isAvatar = true;
    menuItems = <PlayerMenuItems hubChannel={hubChannel} activeObject={activeObject} deselectObject={deselectObject} />;
  } else {
    menuItems = (
      <ObjectMenuItems
        hubChannel={hubChannel}
        scene={scene}
        activeObject={activeObject}
        deselectObject={deselectObject}
        onGoToObject={onGoToObject}
      />
    );
  }

  return (
    <ObjectMenu
      title={<FormattedMessage id="object-menu.title" defaultMessage="Object" />}
      currentObjectIndex={objects.indexOf(activeObject)}
      objectCount={objects.length}
      onClose={deselectObject}
      onBack={deselectObject}
      onNextObject={selectNextObject}
      onPrevObject={selectPrevObject}
      onToggleLights={toggleLights}
      lightsEnabled={lightsEnabled}
      isAvatar={isAvatar}
    >
      {menuItems}
    </ObjectMenu>
  );
}

ObjectMenuContainer.propTypes = {
  hubChannel: PropTypes.object.isRequired,
  scene: PropTypes.object.isRequired,
  onOpenProfile: PropTypes.func.isRequired,
  onGoToObject: PropTypes.func.isRequired
};
