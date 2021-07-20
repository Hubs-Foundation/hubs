import React from "react";
import "./MovementSetting.scss";
import MenuScale from "../../../../assets/images/Menu-Scale-tabs.png";

export const MovementFlyModeSettings = props => {
  return (
    <>
      <div class="velume d-flex">
        <div class="movement-text">
          <h2 class="text-left">Fly Mode:</h2>
          <p class="text-left">Explanation of what Fly Mode does. </p>
        </div>
        <span class="velume-img">
          <div class="form-sec">
            <label class="switch-field">
              <input type="checkbox" checked="checked" />
              <span class="switch-slider round" />
            </label>
          </div>
        </span>
      </div>
      <div class="velume">
        <div class="d-flex w-100 movement-com">
          <div class="movement-text">
            <h2 class="text-right">Rotation Per Snap:</h2>
            <p class="text-right">(in degrees)</p>
          </div>
          <span class="velume-img">
            <img src={MenuScale} />
          </span>
        </div>

        <div class="d-flex w-100 movement-com">
          <div class="movement-text">
            <h2 class="text-right">Disable Movement:</h2>
          </div>
          <span class="velume-img">
            <div class="form-sec">
              <label class="switch-field">
                <input type="checkbox" checked="checked" />
                <span class="switch-slider round" />
              </label>
            </div>
          </span>
        </div>

        <div class="d-flex w-100 movement-com">
          <div class="movement-text">
            <h2 class="text-right">Disable Strafing:</h2>
          </div>
          <span class="velume-img">
            <div class="form-sec">
              <label class="switch-field">
                <input type="checkbox" checked="checked" />
                <span class="switch-slider round" />
              </label>
            </div>
          </span>
        </div>

        <div class="d-flex w-100 movement-com">
          <div class="movement-text">
            <h2 class="text-right">Disable Teleporter:</h2>
          </div>
          <span class="velume-img">
            <div class="form-sec">
              <label class="switch-field">
                <input type="checkbox" checked="checked" />
                <span class="switch-slider round" />
              </label>
            </div>
          </span>
        </div>

        <div class="d-flex w-100 movement-com">
          <div class="movement-text">
            <h2 class="text-right">Rotation Per Snap:</h2>
          </div>
          <span class="velume-img">
            <img src={MenuScale} />
          </span>
        </div>
      </div>
    </>
  );
};
