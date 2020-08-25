import React from "react";
import { ToolbarButton } from "../input/ToolbarButton";
import { ReactComponent as VideoIcon } from "../icons/Video.svg";
import { ReactComponent as DesktopIcon } from "../icons/Desktop.svg";
import { Grid } from "../layout/Grid";
import styles from "./SharePopover.scss";

export function SharePopover() {
  return (
    <Grid className={styles.sharePopover}>
      <ToolbarButton icon={<VideoIcon />} preset="purple" onClick={() => console.log("camera")} label="Camera" />
      <ToolbarButton icon={<DesktopIcon />} preset="purple" onClick={() => console.log("screen")} label="Screen" />
    </Grid>
  );
}
