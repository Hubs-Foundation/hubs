import React, { useRef } from "react";
import PropTypes from "prop-types";
import { RoomLayout } from "../layout/RoomLayout";
import { useResizeViewport } from "./useResizeViewport";

export function RoomLayoutContainer({ store, scene, ...rest }) {
  const viewportRef = useRef();

  useResizeViewport(viewportRef, store, scene);

  return <RoomLayout viewportRef={viewportRef} {...rest} />;
}

RoomLayoutContainer.propTypes = {
  store: PropTypes.object.isRequired,
  scene: PropTypes.object.isRequired
};
