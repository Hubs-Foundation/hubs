export function ringbuffer() {
  return {
    ring: [],
    writeHead: 0,
    length: 20,
    write(frame) {
      const { sets, actions, priorities } = frame;
      const { ring, writeHead, length } = this;
      const record = { actions: {}, sets: [], priorities };
      for (const name in actions) {
        // TODO: is this how i should be performing the copy?
        record.actions[name] = actions[name];
      }
      for (const idx in sets) {
        record.sets.push(sets[idx]);
      }
      ring[writeHead] = record; // garbage
      this.writeHead = (writeHead + 1) % length;
      return record;
    },

    // retrieve frame data from the ringbuffer
    // read(0) == most recently written frame
    // read(n) == nth most recently written frame
    read(index) {
      const { ring, writeHead, length } = this;
      return ring[(length + writeHead - (index + 1)) % length];
    }
  };
}

export function applySetChanges(changes, sets) {
}

export function defaultValue(filter) {
  let action;
  switch (filter) {
    case "number":
      action = 0;
      break;
    case "vec2_deltas":
    case "vec2":
      action = [0, 0];
      break;
    case "key":
    case "keydown":
    case "keyup":
      action = false;
      break;
    case "nokey":
      action = false; // I guess?
      break;
  }
  return action;
}

export function fillActionFrame(actionFrame) {
  const { sets, actions, priorities } = actionFrame;
  let { framify, bindDefn, prevFrame, frame, eventQueue, actionForBinding } = this;
  prevFrame = {}; // garbage
  prevFrame = Object.assign(prevFrame, frame);
  frame = framify(eventQueue, frame);
  eventQueue.length = 0; // garbage
  bindDefn.forEach(binding => {
    const { set, priorityKey } = binding;
    const priority = sets.indexOf(set);
    if (priority === -1) return;
    if (!priorities[priorityKey]) {
      priorities[priorityKey] = { value: priority, actions: [] }; // garbage
    }
    if (priorities[priorityKey].value < priority) {
      priorities[priorityKey].actions.forEach(actionName => {
        actions[actionName] = undefined;
      }); // garbage
    }
    if (priorities[priorityKey].value === priority) {
      const action = actionForBinding(binding, frame, prevFrame);
      priorities[priorityKey].actions.push(binding.action); // garbage
      actions[binding.action] = action;
    }
  });
}

export function capture(e) {
  this.push(e);
}
