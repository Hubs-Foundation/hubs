import mute from "../../../../assets/images/mute.png";
import unMute from "../../../../assets/images/un-mute.png";
import menuScale from "../../../../assets/images/menu-scale.png";
import React from "react";

export const AudioOutputSettings = () => (
  <>
    <p>Select a device for sound input: </p>
    <div className="default-table">
      <table>
        <tbody>
          <tr>
            <th>Default Name</th>
            <th>Type</th>
          </tr>
          <tr>
            <td>gggggg</td>
            <td>lllll</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p>Settings for the selected device:</p>

    <div className="velume d-flex align-items-center">
      <h2>Incoming Voice Volume: </h2>
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

    <div className="velume-sec">
      <div className="velume d-flex align-items-center">
        <h2>Media Volume: </h2>
        <span className="velume-img">
          <img src={menuScale} />
        </span>
      </div>

      <div className="velume d-flex align-items-center">
        <h2>Disable Sound Effects: </h2>
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
