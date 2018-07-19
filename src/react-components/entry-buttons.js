import React from "react";
import { FormattedMessage } from "react-intl";
import PropTypes from "prop-types";

import MobileScreenEntryImg from "../assets/images/mobile_screen_entry.svg";
import DesktopScreenEntryImg from "../assets/images/desktop_screen_entry.svg";
import GenericVREntryImg from "../assets/images/generic_vr_entry.svg";
import GearVREntryImg from "../assets/images/gearvr_entry.svg";
import DaydreamEntryImg from "../assets/images/daydream_entry.svg";
import DeviceEntryImg from "../assets/images/device_entry.svg";

const EntryButton = props => (
  <button className="entry-button" onClick={props.onClick}>
    <img src={props.iconSrc} className="entry-button__icon" />
    <div className="entry-button__label">
      <div className="entry-button__label__contents">
        <span>
          <FormattedMessage id={props.prefixMessageId} />
        </span>
        <span className="entry-button--bolded">
          <FormattedMessage id={props.mediumMessageId} />
        </span>
        {props.subtitle && (
          <div className="entry-button__subtitle">
            <FormattedMessage id={props.subtitle} />
          </div>
        )}
      </div>
    </div>
  </button>
);

EntryButton.propTypes = {
  onClick: PropTypes.func,
  iconSrc: PropTypes.string,
  prefixMessageId: PropTypes.string,
  mediumMessageId: PropTypes.string,
  subtitle: PropTypes.string,
  isInHMD: PropTypes.bool
};

export const TwoDEntryButton = props => {
  const entryButtonProps = {
    ...props,
    iconSrc: AFRAME.utils.device.isMobile() ? MobileScreenEntryImg : DesktopScreenEntryImg,
    prefixMessageId: "entry.screen-prefix",
    mediumMessageId: AFRAME.utils.device.isMobile() ? "entry.mobile-screen" : "entry.desktop-screen"
  };

  return <EntryButton {...entryButtonProps} />;
};

export const GenericEntryButton = props => {
  const entryButtonProps = {
    ...props,
    iconSrc: GenericVREntryImg,
    prefixMessageId: "entry.generic-prefix",
    mediumMessageId: "entry.generic-medium",
    subtitle: AFRAME.utils.device.isMobile() ? null : "entry.generic-subtitle-desktop"
  };

  return <EntryButton {...entryButtonProps} />;
};

export const GearVREntryButton = props => {
  const entryButtonProps = {
    ...props,
    iconSrc: GearVREntryImg,
    prefixMessageId: "entry.gearvr-prefix",
    mediumMessageId: "entry.gearvr-medium"
  };

  return <EntryButton {...entryButtonProps} />;
};

export const DaydreamEntryButton = props => {
  const entryButtonProps = {
    ...props,
    iconSrc: DaydreamEntryImg,
    prefixMessageId: "entry.daydream-prefix",
    mediumMessageId: "entry.daydream-medium"
  };

  return <EntryButton {...entryButtonProps} />;
};

export const SafariEntryButton = props => {
  const entryButtonProps = {
    ...props,
    iconSrc: MobileScreenEntryImg,
    prefixMessageId: "entry.screen-prefix",
    mediumMessageId: "entry.mobile-safari"
  };

  return <EntryButton {...entryButtonProps} />;
};

export const DeviceEntryButton = props => {
  const entryButtonProps = {
    ...props,
    iconSrc: DeviceEntryImg,
    prefixMessageId: AFRAME.utils.device.isMobile() ? "entry.device-prefix-mobile" : "entry.device-prefix-desktop",
    mediumMessageId: "entry.device-medium"
  };

  entryButtonProps.subtitle = entryButtonProps.isInHMD
    ? "entry.device-subtitle-vr"
    : AFRAME.utils.device.isMobile() ? "entry.device-subtitle-mobile" : "entry.device-subtitle-desktop";

  return <EntryButton {...entryButtonProps} />;
};
