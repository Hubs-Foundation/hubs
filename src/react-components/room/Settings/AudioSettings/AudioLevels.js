import React from "react";
import menuScale from "../../../../assets/images/menu-scale.png";

export const AudioLevelSettings = () => (
  <>
    <div className="velume velume-label d-flex align-items-baseline">
      <h2>Levels : </h2>
      <span className="velume-img">
        <ul>
          <li className="active" />
          <li />
          <li />
          <li />
          <li />
          <li />
        </ul>
      </span>
    </div>

    <div className="velume-sec">
      <div className="velume d-flex align-items-baseline">
        <h2>Enable Audio Clipping: </h2>
        <span className="velume-img">
          <div className="form-group">
            <label className="switch-field">
              <input type="checkbox" checked="" />
              <span className="switch-slider round" />
            </label>
          </div>
        </span>
      </div>

      <div className="velume d-flex align-items-baseline">
        <h2>Audio Clipping Threshold: </h2>
        <span className="velume-img">
          <img src={menuScale} />
        </span>
      </div>

      <div className="velume d-flex align-items-baseline">
        <h2>Show Audio Debug Panel: </h2>
        <span className="velume-img">
          <div className="form-group">
            <label className="switch-field">
              <input type="checkbox" checked="" />
              <span className="switch-slider round" />
            </label>
          </div>
        </span>
      </div>
    </div>
  </>
);
