/* eslint-disable @calm/react-intl/missing-formatted-message */
import React from "react";
import { Slider } from "./Slider";
import { Column } from "../layout/Column";

export default {
  title: "Input/Slider"
};

const Template = args => (
  <Column padding>
    <Slider {...args} />
  </Column>
);

export const Controlled = Template.bind({});
Controlled.argTypes = {
  onChange: { action: "changed" },
  value: {
    control: {
      type: "number",
      min: 0,
      max: 8,
      step: 1
    }
  }
};
Controlled.args = {
  min: 0,
  max: 8,
  step: 1,
  value: 4,
  disabled: false
};

export const Uncontrolled = Template.bind({});
Uncontrolled.argTypes = {
  onChange: { action: "changed" }
};
Uncontrolled.args = {
  min: 0,
  max: 8,
  step: 1,
  disabled: false
};
