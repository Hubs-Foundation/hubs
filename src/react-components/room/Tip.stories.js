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
        {"Welcome to Mozilla Hubs! Let's take a quick tour. 👋 Click and drag to look around."}
      </Tip>
    }
  />
);

Tips.propTypes = {
  step: PropTypes.string
};

const TOOLTIP_STEPS = {
  "tips.desktop.welcome": "Welcome Message",
  "tips.desktop.locomotion": "Locomotion",
  "tips.desktop.turning": "Turning",
  "tips.desktop.invite": "Invite",
  "tips.desktop.end": "End",
  "tips.desktop.menu": "Menu"
};
const steps = Object.keys(TOOLTIP_STEPS);

export const Tooltips = ({ step }) => <RoomLayout viewport={<Tooltip step={step} />} />;

Tooltips.argTypes = {
  step: {
    name: "Onboarding tips step",
    options: steps,
    control: {
      type: "select",
      labels: TOOLTIP_STEPS
    }
  }
};

Tooltips.args = {
  step: steps[0]
};

Tooltips.propTypes = {
  step: PropTypes.string
};
