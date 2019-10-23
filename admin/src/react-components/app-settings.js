import React, { Component } from "react";

export class AppSettings extends Component {
  componentDidMount = async () => {
    await fetch("/app-config-schema.toml");
  };
  render() {
    return <span>hi</span>;
  }
}
