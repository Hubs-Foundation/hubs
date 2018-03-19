import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { SCHEMA } from "../storage/store";

export default class NameEntryPanel extends Component {
  static propTypes = {
    store: PropTypes.object,
    finished: PropTypes.func
  }

  constructor(props) {
    super(props);
    window.store = this.props.store;
    this.state = {name: this.props.store.state.profile.display_name};
    this.props.store.subscribe(this.storeUpdated);
  }

  storeUpdated = () => {
    this.setState({name: this.props.store.state.profile.display_name});
  }

  saveName = (e) => {
    e.preventDefault();
    this.props.store.update({ profile: { display_name: this.nameInput.value } });
    this.props.finished();
  }

  componentDidMount() {
    // stop propagation so that avatar doesn't move when wasd'ing during text input.
    this.nameInput.addEventListener('keydown', e => e.stopPropagation());
    this.nameInput.addEventListener('keypress', e => e.stopPropagation());
    this.nameInput.addEventListener('keyup', e => e.stopPropagation());
  }
  
  componentWillUnmount() {
    this.props.store.unsubscribe(this.storeUpdated);
  }

  render () {
    return (
      <div className="name-entry">
        <form onSubmit={this.saveName}>
        <div className="name-entry__box name-entry__box--darkened">
          <div className="name-entry__subtitle">
            Your identity
          </div>
          <input
            className="name-entry__form-field-text"
            value={this.state.name} onChange={(e) => this.setState({name: e.target.value})}
            required pattern={SCHEMA.definitions.profile.properties.display_name.pattern}
            title="Alphanumerics and hyphens. At least 3 characters, no more than 32"
            ref={inp => this.nameInput = inp}/>
          <input className="name-entry__form-submit" type="submit" value="SAVE" />
          </div>
        </form>
      </div>
    );
  }
}
