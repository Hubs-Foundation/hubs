/* eslint-disable @calm/react-intl/missing-formatted-message */
import React from "react";
import { Column } from "../layout/Column";
import { ToggleInput } from "./ToggleInput";

export default {
  title: "Input/ToggleInput",
  argTypes: { onChange: { action: "onChange" } }
};

export const All = args => (
  <Column padding>
    <ToggleInput {...args} />
    <ToggleInput label="Toggle Input" {...args} />
    <ToggleInput label="Toggle Input" checked={false} {...args} />
    <ToggleInput label="Toggle Input" checked={true} {...args} />
    <ToggleInput label="Toggle Input" checked={false} disabled {...args} />
    <ToggleInput label="Toggle Input" checked={true} disabled {...args} />
    <ToggleInput label="Toggle Input" description="With description" {...args} />
  </Column>
);
