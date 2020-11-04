import React from "react";
import { RadioInputField } from "./RadioInputField";

export default {
  title: "RadioInputField"
};

export const All = args => (
  <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
    <RadioInputField {...args} />
    <RadioInputField label="With Label" {...args} />
    <RadioInputField label="Selected" {...args} value={2} />
  </div>
);

All.args = {
  options: [
    { id: "1", label: "Option 1", description: "Test description for option 1", value: 1 },
    { id: "2", label: "Option 2", description: "Test description for option 2", value: 2 },
    { id: "3", label: "Option 3", description: "Test description for option 3", value: 3 },
    { id: "4", label: "Option 4 (No Description)", value: 4 }
  ]
};
