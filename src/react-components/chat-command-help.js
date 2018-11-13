import React, { Component } from "react";
import PropTypes from "prop-types";
import styles from "../assets/stylesheets/chat-command-help.scss";
import { FormattedMessage } from "react-intl";

export default class ChatCommandHelp extends Component {
  static propTypes = {
    matchingPrefix: PropTypes.string
  };

  render() {
    const commands = ["help", "leave", "fly", "bigger", "smaller", "duck"];

    return (
      <div className={styles.commandHelp}>
        {commands.map(
          c =>
            (this.props.matchingPrefix === "" || c.startsWith(this.props.matchingPrefix)) && (
              <div className={styles.entry} key={c}>
                <div className={styles.command}>/{c}</div>
                <div>
                  <FormattedMessage id={`commands.${c}`} />
                </div>
              </div>
            )
        )}
      </div>
    );
  }
}
