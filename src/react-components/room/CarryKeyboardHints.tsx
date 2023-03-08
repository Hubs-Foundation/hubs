import React from "react";
import { CarryState, CarryStateData, SnapFace } from "../../bit-systems/carry-system";
import styles from "./CarryKeyboardHints.scss";
/* import classNames from "classnames"; */

const NAME_FOR_FACE = {
  [SnapFace.AUTO]: "Auto",
  [SnapFace.BOTTOM]: "Bottom",
  [SnapFace.TOP]: "Top",
  [SnapFace.BACK]: "Back",
  [SnapFace.FRONT]: "Front",
  [SnapFace.LEFT]: "Left",
  [SnapFace.RIGHT]: "Right"
} as const;

console.log(styles);
export function CarryKeyboardHints({
  carryState,
  carryStateData
}: {
  carryState: CarryState;
  carryStateData: CarryStateData;
}) {
  if (carryState === CarryState.CARRYING) {
    return (
      <ul className={styles.keyboardHintPanel}>
        <li>
          <div className="key">LMB</div>
          <span>Drop</span>
        </li>
        {/*  TODO */}
        {/* <li>
          <div className="key">RMB</div>
          <span>Throw</span>
        </li> */}
        <li>
          <div className="key">Space</div>
          <span>
            Snapping mode is <b>OFF</b>
          </span>
        </li>
        <li>
          <div className="key">T</div>
          <span>
            Gravity: <b>{carryStateData.applyGravity ? "ON" : "OFF"}</b>
          </span>
        </li>
      </ul>
    );
  } else if (carryState === CarryState.SNAPPING) {
    return (
      <ul className={styles.keyboardHintPanel}>
        <li>
          <div className="key">LMB</div>
          <span>Attach</span>
        </li>
        <li>
          <div className="key">Space</div>
          <span>
            Snapping mode is <b>ON</b>
          </span>
        </li>
        <li>
          <div className="key">Q</div>
          <div className="modifier">/</div>
          <div className="key">E</div>
          <span>Rotate object</span>
        </li>
        <li>
          <div className="key">Scroll</div>
          <span>Nudge object</span>
        </li>
        <li>
          <div className="key">Shift</div>
          <div className="modifier">+</div>
          <div className="key">Scroll</div>
          <span>Scale object</span>
        </li>
        <li>
          <div className="key">T</div>
          <span>
            Swapping face: <b>{NAME_FOR_FACE[carryStateData.snapFaceOverride]}</b>
          </span>
        </li>
      </ul>
    );
  } else {
    return <></>;
  }
}
