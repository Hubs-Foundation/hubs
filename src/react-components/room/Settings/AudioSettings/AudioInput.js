import React from "react";

import mute from "../../../../assets/images/mute.png";
import unMute from "../../../../assets/images/un-mute.png";
import menuScale from "../../../../assets/images/menu-scale.png";

export const AudioInputSettings = () => (
  <>
    <p>Select a device for sound input: </p>
    <div className="default-table">
      <table>
        <tbody>
          <tr>
            <th>Default</th>
            <th>Type</th>
          </tr>
          <tr>
            <td>fghfghfg</td>
            <td>cbcvbc</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p>Settings for the selected device:</p>

    <div className="velume d-flex align-items-center">
      <h2>Input Volume: </h2>
      <span className="velume-img">
        <img src={menuScale} />
      </span>
    </div>

    <div className="velume d-flex align-items-center">
      <h2>Mute: </h2>
      <span className="velume-img">
        <a href="#" className="speaker">
          <span className="mute-img">
            <img src={mute} />
          </span>
          <span className="unmute-img">
            <img src={unMute} />
          </span>
        </a>
      </span>
    </div>

    <div className="velume-sec row">
      <div className="velume value-50 d-flex align-items-center">
        <h2>Mute Mic on Entry: </h2>
        <span className="velume-img">
          <div className="form-group">
            <label className="switch-field">
              <input type="checkbox" checked="" />
              <span className="switch-slider round" />
            </label>
          </div>
        </span>
      </div>

      <div className="velume value-50 d-flex align-items-center">
        <h2>Disable Mic Echo cancellation:</h2>
        <span className="velume-img">
          <div className="form-group">
            <label className="switch-field">
              <input type="checkbox" checked="" />
              <span className="switch-slider round" />
            </label>
          </div>
        </span>
      </div>

      <div className="velume value-50 d-flex align-items-center">
        <h2>Disable Mic Auto Gain Control:</h2>
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
