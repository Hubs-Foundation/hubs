import React from "react";
export const AudioContext = React.createContext({
  onMouseEnter: () => {
    console.log("enter sound not configured");
  },
  onMouseLeave: () => {}
});
