import React, { Component } from "react";
import PropTypes from "prop-types";
import { mediaSort, getMediaType } from "../utils/media-sorting.js";
import { ObjectsSidebar, ObjectsSidebarItem } from "./room/ObjectsSidebar";

function getDisplayString(el) {
  // Having a listed-media component does not guarantee the existence of a media-loader component,
  // so don't crash if there isn't one.
  const url = (el.components["media-loader"] && el.components["media-loader"].data.src) || "";
  const split = url.split("/");
  const resourceName = split[split.length - 1].split("?")[0];
  let httpIndex = -1;
  for (let i = 0; i < split.length; i++) {
    if (split[i].indexOf("http") !== -1) {
      httpIndex = i;
    }
  }

  let host = "";
  let lessHost = "";
  if (httpIndex !== -1 && split.length > httpIndex + 3) {
    host = split[httpIndex + 2];
    const hostSplit = host.split(".");
    if (hostSplit.length > 1) {
      lessHost = `${hostSplit[hostSplit.length - 2]}.${hostSplit[hostSplit.length - 1]}`;
    }
  }

  const firstPart =
    url.indexOf("poly.google") !== -1
      ? "Google Poly"
      : url.indexOf("sketchfab.com") !== -1
        ? "Sketchfab"
        : url.indexOf("youtube.com") !== -1
          ? "YouTube"
          : lessHost;

  return `${firstPart} ... ${resourceName.substr(0, 4)}`;
}

export default class ObjectList extends Component {
  static propTypes = {
    selectedObject: PropTypes.object,
    onInspectObject: PropTypes.func,
    onUninspectObject: PropTypes.func,
    scene: PropTypes.object,
    onClose: PropTypes.func
  };

  state = {
    inspecting: false,
    mediaEntities: []
  };

  componentDidMount() {
    document.querySelector(".a-canvas").addEventListener("mousedown", this.onUninspectObject);
    this.updateMediaEntities = this.updateMediaEntities.bind(this);
    this.updateMediaEntities();
    this.props.scene.addEventListener("listed_media_changed", () => setTimeout(() => this.updateMediaEntities(), 0));
    // HACK: The listed-media component exists before the media-loader component does, in cases where an entity is created from a network template because of an incoming message, so don't updateMediaEntities right away.
    // Sorry in advance for the day this comment is out of date.
  }

  componentWillUnmount() {
    const canvas = document.querySelector(".a-canvas");
    if (canvas) {
      canvas.removeEventListener("mousedown", this.onUninspectObject);
    }

    this.props.onUninspectObject();
  }

  onUninspectObject = () => {
    this.props.onUninspectObject();
  };

  onFocusObject = object => {
    AFRAME.scenes[0].systems["hubs-systems"].cameraSystem.uninspect();
    AFRAME.scenes[0].systems["hubs-systems"].cameraSystem.inspect(object.el.object3D, object.el.object3D, 1.5, true);
  };

  updateMediaEntities() {
    const mediaEntities = [...this.props.scene.systems["listed-media"].els];
    mediaEntities.sort(mediaSort);
    this.setState({ mediaEntities });
  }

  componentDidUpdate() {}

  render() {
    const objects = (this.state.mediaEntities || []).map((el, i) => ({
      id: i,
      name: getDisplayString(el),
      type: getMediaType(el),
      el
    }));

    return (
      <ObjectsSidebar
        objectCount={objects.length}
        onClose={this.props.onClose}
        objectSelected={!!this.props.selectedObject}
      >
        {objects.map(object => (
          <ObjectsSidebarItem
            object={object}
            key={object.id}
            onMouseDown={() => {
              this.props.onInspectObject(object.el);
            }}
            onMouseOut={() => {
              if (!AFRAME.utils.device.isMobileVR()) {
                AFRAME.scenes[0].systems["hubs-systems"].cameraSystem.uninspect();
              }
            }}
            onMouseOver={() => this.onFocusObject(object)}
            onFocus={() => this.onFocusObject(object)}
          />
        ))}
      </ObjectsSidebar>
    );
  }
}
