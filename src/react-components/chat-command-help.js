import React, { Component } from "react";
import PropTypes from "prop-types";
import styles from "../assets/stylesheets/chat-command-help.scss";
import { FormattedMessage } from "react-intl";

export default class ChatCommandHelp extends Component {
  static propTypes = {
    matchingPrefix: PropTypes.string
  };

  render() {
    const commands = [
      "help",
      "leave",
      "fly",
      "grow",
      "shrink",
      "duck",
      "debug",
      "scene <scene url>",
      "rename <new name>"
    ];

    return (
      <div className={styles.commandHelp}>
        {commands.map(
          c =>
            (this.props.matchingPrefix === "" ||
              c.split(" ")[0].startsWith(this.props.matchingPrefix.split(" ")[0])) && (
              <div className={styles.entry} key={c}>
                <div className={styles.command}>/{c}</div>
                <div>
                  <FormattedMessage id={`commands.${c.split(" ")[0]}`} />
                </div>
              </div>
            )
        )}
      </div>
    );
  }
}
