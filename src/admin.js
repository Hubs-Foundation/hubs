import "./utils/debug-log";
import "./assets/stylesheets/admin.scss";

import "./utils/logging";

import ReactDOM from "react-dom";
import React, { Component } from "react";
import PropTypes from "prop-types";
//import classNames from "classnames";
import { connectToReticulum } from "./utils/phoenix-utils";
import { App } from "./App";
import { Admin, Resource, ListGuesser } from "react-admin";
import { postgrestClient, postgrestAuthenticatior } from "./utils/postgrest-data-provider";

window.APP = new App();
const store = window.APP.store;

import registerTelemetry from "./telemetry";
registerTelemetry("/admin", "Hubs Admin");
store.init();

class AdminUI extends Component {
  static propTypes = {
    dataProvider: PropTypes.func
  };

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Admin dataProvider={this.props.dataProvider}>
        <Resource name="scenes" list={ListGuesser} />
      </Admin>
    );
  }
}

const mountUI = () => {
  const dataProvider = postgrestClient("//" + process.env.POSTGREST_SERVER);
  ReactDOM.render(<AdminUI dataProvider={dataProvider} />, document.getElementById("ui-root"));
};

document.addEventListener("DOMContentLoaded", async () => {
  const socket = connectToReticulum();

  // Reticulum global channel
  const retPhxChannel = socket.channel(`ret`, { hub_id: "admin" });
  retPhxChannel
    .join()
    .receive("ok", async () => {
      mountUI();
    })
    .receive("error", res => {
      console.error(res);
    });

  /*hubPhxChannel.on("naf", data => {
    if (!NAF.connection.adapter) return;
    NAF.connection.adapter.onData(data);
  });*/
});
