import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./ObjectsSidebar.scss";
import { Sidebar, CloseButton } from "../sidebar/Sidebar";
import { List, ButtonListItem } from "../layout/List";
import { ReactComponent as ObjectIcon } from "../icons/Object.svg";
import { ReactComponent as ImageIcon } from "../icons/Image.svg";
import { ReactComponent as VideoIcon } from "../icons/Video.svg";
import { ReactComponent as AudioIcon } from "../icons/Audio.svg";
import { ReactComponent as TextDocumentIcon } from "../icons/TextDocument.svg";

function getObjectIcon(type) {
  switch (type) {
    case "video":
      return VideoIcon;
    case "audio":
      return AudioIcon;
    case "image":
      return ImageIcon;
    case "pdf":
      return TextDocumentIcon;
    case "model":
    default:
      return ObjectIcon;
  }
}

const objectTypeNames = {
  video: "Video",
  audio: "Audio",
  image: "Image",
  pdf: "PDF",
  model: "Model",
  default: "Object"
};

function getLabel(object) {
  return `${objectTypeNames[object.type] || objectTypeNames.default}: ${object.name}`;
}

export function ObjectsSidebarItem({ object, ...rest }) {
  const ObjectTypeIcon = getObjectIcon(object.type);

  return (
    <ButtonListItem {...rest} className={styles.object} type="button" aria-label={getLabel(object)}>
      <ObjectTypeIcon />
      <p>{object.name}</p>
    </ButtonListItem>
  );
}

ObjectsSidebarItem.propTypes = {
  object: PropTypes.shape({
    id: PropTypes.any.isRequired,
    name: PropTypes.string.isRequired,
    type: PropTypes.string
  })
};

export function ObjectsSidebar({ children, objectCount, objectSelected, onClose }) {
  return (
    <Sidebar
      title={`Objects (${objectCount})`}
      beforeTitle={<CloseButton onClick={onClose} />}
      className={classNames({ [styles.objectSelected]: objectSelected })}
    >
      <List>{children}</List>
    </Sidebar>
  );
}

ObjectsSidebar.propTypes = {
  objectSelected: PropTypes.bool,
  objectCount: PropTypes.number.isRequired,
  children: PropTypes.node,
  onClose: PropTypes.func
};

ObjectsSidebar.defaultProps = {
  objectCount: 0
};
