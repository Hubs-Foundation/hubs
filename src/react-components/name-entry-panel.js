import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { SCHEMA } from "../storage/store";

export default class NameEntryPanel extends Component {
  static propTypes = {
    store: PropTypes.object
  }

  constructor(props) {
    super(props);
    window.store = this.props.store;
    this.state = {name: this.props.store.state.profile.display_name};
    this.props.store.subscribe(() => {
      this.setState({name: this.props.store.state.profile.display_name});
    });
  }

  saveName = (e) => {
    e.preventDefault();
    this.props.store.update({ profile: { display_name: this.nameInput.value } });
  }

  componentDidMount() {
    // stop propagation so that avatar doesn't move when wasd'ing during text input.
    this.nameInput.addEventListener('keydown', e => e.stopPropagation());
    this.nameInput.addEventListener('keypress', e => e.stopPropagation());
    this.nameInput.addEventListener('keyup', e => e.stopPropagation());
  }

  render () {
    return (
      <div>
        Name Entry
        <form onSubmit={this.saveName}>
          <label>Name:
            <input
              value={this.state.name} onChange={(e) => this.setState({name: e.target.value})}
              required pattern={SCHEMA.definitions.profile.properties.display_name.pattern}
              title="Alphanumerics and hyphens. At least 3 characters, no more than 32"
              ref={inp => this.nameInput = inp}/>
          </label>
          <input type="submit" value="Save" />
        </form>
      </div>
    );
  }
}
