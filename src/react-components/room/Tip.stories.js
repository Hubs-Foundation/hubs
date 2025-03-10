import React from "react";
import { RoomLayout } from "../layout/RoomLayout";
import { Tip } from "./Tip";
import { Tooltip } from "./Tooltip";
import PropTypes from "prop-types";

export default {
  title: "Room/Tip",
  parameters: {
    layout: "fullscreen"
  }
};

export const Tips = ({ step }) => (
  <RoomLayout
    viewport={
      <Tip onDismiss={() => {}} dismissLabel="Skip" step={step}>
        {"Welcome to Hubs! Let's take a quick tour. 👋 Click and drag to look around."}
      </Tip>
    }
  />
);

Tips.propTypes = {
  step: PropTypes.string
};

const TOOLTIP_STEPS = {
  "tips.desktop.welcome": "Desktop Welcome Message",
  "tips.desktop.locomotion": "Desktop Locomotion",
  "tips.desktop.turning": "Desktop Turning",
  "tips.desktop.invite": "Desktop Invite",
  "tips.desktop.end": "Desktop End",
  "tips.desktop.menu": "Desktop Menu",
  "tips.mobile.welcome": "Mobile Welcome Message",
  "tips.mobile.locomotion": "Mobile Locomotion",
  "tips.mobile.turning": "Mobile Turning",
  "tips.mobile.end": "Mobile End",
  "tips.mobile.menu": "Mobile Menu"
};

export const Tooltips = ({ step }) => <RoomLayout viewport={<Tooltip step={step} />} />;

Tooltips.argTypes = {
  step: {
    name: "Onboarding tips step",
    options: Object.keys(TOOLTIP_STEPS),
    control: {
      type: "select",
      labels: TOOLTIP_STEPS
    },
    defaultValue: Object.keys(TOOLTIP_STEPS)[0]
  }
};

Tooltips.propTypes = {
  step: PropTypes.string
};
