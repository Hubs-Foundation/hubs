import React, { useCallback } from "react";
import PropTypes from "prop-types";
import { ObjectActionModal } from "./ObjectActionModal";

const isMobile = AFRAME.utils.device.isMobile() || AFRAME.utils.device.isMobileVR();

export function ObjectActionModalContainer({ srcUrl, onClose }) {
  return (
    <ObjectActionModal
      isMobile={isMobile}
      productScriptSrc={srcUrl}
      onClose={onClose}
    />
  );
}

ObjectActionModal.propTypes = {
  srcUrl: PropTypes.string,
  onClose: PropTypes.func,
};
