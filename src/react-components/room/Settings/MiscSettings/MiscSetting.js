import React from "react";
import "./MiscSetting.scss";

export function MiscSetting(props) {
  return (
    <div className="seeting-audio">
      {props.children}
      <form className="theme-form misc-top-page">
        <div className="form-head">
          <h6>Misc</h6>
        </div>
        <div className="form-body misc-page">
          <ul className="nav nav-tabs misc-tabs">
            <li>
              <a data-toggle="tab" href="#misc">
                Re-enter World
              </a>
            </li>
          </ul>

          <div className="tab-content">
            <div id="misc" className="tab-pane in active">
              <div className="velume">
                <div className="d-flex w-100 misc-com">
                  <div className="movement-text">
                    <h2 className="text-left">Only show nametags when frozen:</h2>
                  </div>
                  <span className="velume-img">
                    <div className="form-sec">
                      <label className="switch-field">
                        <input type="checkbox" checked="checked" />
                        <span className="switch-slider round" />
                      </label>
                    </div>
                  </span>
                </div>

                <div className="d-flex w-100 misc-com">
                  <div className="movement-text">
                    <h2 className="text-left">Disable Automatic pixel ratio adjustments:</h2>
                  </div>
                  <span className="velume-img">
                    <div className="form-sec">
                      <label className="switch-field">
                        <input type="checkbox" checked="checked" />
                        <span className="switch-slider round" />
                      </label>
                    </div>
                  </span>
                </div>

                <div className="d-flex w-100 misc-com">
                  <div className="movement-text">
                    <h2 className="text-left">Disable auto-exit when multiple hubs instances are open:</h2>
                  </div>
                  <span className="velume-img">
                    <div className="form-sec">
                      <label className="switch-field">
                        <input type="checkbox" checked="checked" />
                        <span className="switch-slider round" />
                      </label>
                    </div>
                  </span>
                </div>

                <div className="d-flex w-100 misc-com">
                  <div className="movement-text">
                    <h2 className="text-left">Disable auto-exit when idle or backgrounded:</h2>
                  </div>
                  <span className="velume-img">
                    <div className="form-sec">
                      <label className="switch-field">
                        <input type="checkbox" checked="checked" />
                        <span className="switch-slider round" />
                      </label>
                    </div>
                  </span>
                </div>

                <div className="d-flex w-100 misc-com">
                  <div className="movement-text">
                    <h2 className="text-left">Enable fast room switching:</h2>
                  </div>
                  <span className="velume-img">
                    <div className="form-sec">
                      <label className="switch-field">
                        <input type="checkbox" checked="checked" />
                        <span className="switch-slider round" />
                      </label>
                    </div>
                  </span>
                </div>

                <div className="d-flex w-100 misc-com">
                  <div className="movement-text">
                    <h2 className="text-left">Prefer Mobile Object Info panel:</h2>
                  </div>
                  <span className="velume-img">
                    <div className="form-sec">
                      <label className="switch-field">
                        <input type="checkbox" checked="checked" />
                        <span className="switch-slider round" />
                      </label>
                    </div>
                  </span>
                </div>
              </div>

              <div className="velume valume-misc d-flex align-items-center">
                <h2>Language: </h2>
                <span className="velume-img">
                  <div className="wrap-drop noble-gases">
                    <span>Default</span>
                    <ul className="drop">
                      <li>
                        <a>Default-01</a>
                      </li>
                      <li>
                        <a>Default-02</a>
                      </li>
                      <li>
                        <a>Default-03</a>
                      </li>
                    </ul>
                  </div>
                </span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
