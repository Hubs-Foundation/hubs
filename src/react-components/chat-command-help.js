import React, { Component } from "react";
import styles from "../assets/stylesheets/chat-command-help.scss";
//import classNames from "classnames";

export default class ChatCommandHelp extends Component {
  render() {
    return (
      <div className={styles.commandHelp}>
        <div className={styles.entry}>
          <div className={styles.command}>/foo</div>
          <div>This is a test.</div>
        </div>
        <div className={styles.entry}>
          <div className={styles.command}>/bar-baz</div>
          <div>This is a test. ZLkjf lsf sadfa sdf adsfads fads fadflj</div>
        </div>
        <div className={styles.entry}>
          <div className={styles.command}>/foo</div>
          <div>This is a test.</div>
        </div>
        <div className={styles.entry}>
          <div className={styles.command}>/bar-baz</div>
          <div>This is a test. ZLkjf lsf sadfa sdf adsfads fads fadflj</div>
        </div>
        <div className={styles.entry}>
          <div className={styles.command}>/foo</div>
          <div>This is a test.</div>
        </div>
        <div className={styles.entry}>
          <div className={styles.command}>/bar-baz</div>
          <div>This is a test. ZLkjf lsf sadfa sdf adsfads fads fadflj</div>
        </div>
        <div className={styles.entry}>
          <div className={styles.command}>/foo</div>
          <div>This is a test.</div>
        </div>
        <div className={styles.entry}>
          <div className={styles.command}>/bar-baz</div>
          <div>This is a test. ZLkjf lsf sadfa sdf adsfads fads fadflj</div>
        </div>
        <div className={styles.entry}>
          <div className={styles.command}>/foo</div>
          <div>This is a test.</div>
        </div>
        <div className={styles.entry}>
          <div className={styles.command}>/bar-baz</div>
          <div>This is a test. ZLkjf lsf sadfa sdf adsfads fads fadflj</div>
        </div>
      </div>
    );
  }
}
