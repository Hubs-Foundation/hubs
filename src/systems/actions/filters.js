export function key4_to_vec2() {
  return {
    key4: [false, false, false, false],
    vec2: [0, 0],
    filter: function filter({ keys, filters }, frame, prevFrame) {
      for (let i = 0; i < this.key4.length; i++) {
        const key = keys[i];
        const filter = filters[i];
        switch (filter) {
          case "keydown":
            this.key4[i] = !prevFrame[key] && frame[key];
            break;
          case "keyup":
            this.key4[i] = prevFrame[key] && !frame[key];
            break;
          case "key":
            this.key4[i] = frame[key];
            break;
          case "nokey":
            this.key4[i] = !frame[key];
            break;
        }
      }
      this.vec2[0] = (this.key4[0] ? 1 : 0) + (this.key4[1] ? -1 : 0);
      this.vec2[1] = (this.key4[2] ? 1 : 0) + (this.key4[3] ? -1 : 0);
      return this.vec2;
    }
  };
}

export function vec2_deltas() {
  return {
    vec2: [0, 0],
    // TODO: filters here is unused, because instead of calling `actionForBinding`
    //       for each of the inputs to the filter here, we instead do this weird thing.
    //       In the future, I think the correct thing to do for filters will involve
    //       calling `actionForBinding` recursively to resolve all of the inputs to
    //       a given filter.
    //       Until we do that, we won't be able to (for example) build a filter out
    //       of filtered input, which definitely adds value (especially when user
    //       configuration is a thing, see steam controller configurations).
    filter: function filter({ horizontalLookSpeed, verticalLookSpeed, keys, filters }, frame, prevFrame) {
      const sign = this.invertMouseLook ? 1 : -1;
      this.vec2[0] = frame[keys[0]] * verticalLookSpeed * sign;
      this.vec2[1] = frame[keys[1]] * horizontalLookSpeed * sign;
      return this.vec2;
    }
  };
}
