import React from "react";
import PropTypes from "prop-types";
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

export function ObjectsSidebar({ objects, onSelectObject, onClose }) {
  return (
    <Sidebar title={`Objects (${objects.length})`} beforeTitle={<CloseButton onClick={onClose} />}>
      <List>
        {objects.map(object => {
          const ObjectTypeIcon = getObjectIcon(object.type);

          return (
            <ButtonListItem
              className={styles.object}
              key={object.id}
              type="button"
              aria-label={getLabel(object)}
              onClick={e => onSelectObject(object, e)}
            >
              <ObjectTypeIcon />
              <p>{object.name}</p>
            </ButtonListItem>
          );
        })}
      </List>
    </Sidebar>
  );
}

ObjectsSidebar.propTypes = {
  objects: PropTypes.array,
  onSelectObject: PropTypes.func,
  onClose: PropTypes.func
};

ObjectsSidebar.defaultProps = {
  objects: [],
  onSelectObject: () => {}
};
