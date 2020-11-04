import React from "react";
import { ToggleInput } from "./ToggleInput";

export default {
  title: "ToggleInput",
  argTypes: { onChange: { action: "onChange" } }
};

export const All = args => (
  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
    <ToggleInput {...args} />
    <ToggleInput label="Toggle Input" {...args} />
    <ToggleInput label="Toggle Input" value={false} {...args} />
    <ToggleInput label="Toggle Input" value={true} {...args} />
    <ToggleInput label="Toggle Input" value={false} disabled {...args} />
    <ToggleInput label="Toggle Input" value={true} disabled {...args} />
    <ToggleInput label="Toggle Input" description="With description" {...args} />
  </div>
);
