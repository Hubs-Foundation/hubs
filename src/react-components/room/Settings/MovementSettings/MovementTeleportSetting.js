import React from "react";
import MenuScale from "../../../../assets/images/Menu-Scale-tabs.png";

export const MovementTeleportSettings = props => {
  return (
    <>
      <div id="Teleport" class="tab-pane fade">
        <div class="velume d-flex">
          <div class="movement-text">
            <h2 class="text-left">Teleport Mode: </h2>
            <p class="text-left">Explanation of what Teleport Mode does. </p>
          </div>
          <span class="velume-img">
            <div class="form-sec">
              <label class="switch-field">
                <input type="checkbox" checked="" />
                <span class="switch-slider round" />
              </label>
            </div>
          </span>
        </div>
      </div>
    </>
  );
};
