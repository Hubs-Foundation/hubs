export const xforms = {
  copy: function(frame, src, dest) {
    frame[dest.value] = frame[src.value];
  },
  scale: function(scalar) {
    return function scale(frame, src, dest) {
      if (frame[src.value]) {
        frame[dest.value] = frame[src.value] * scalar;
      }
    };
  },
  split_vec2: function(frame, src, dest) {
    if (frame[src.value]) {
      frame[dest.x] = frame[src.value][0];
      frame[dest.y] = frame[src.value][1];
    }
  },
  compose_vec2: function(frame, src, dest) {
    if (frame[src.x] !== undefined && frame[src.y] !== undefined) {
      frame[dest.value] = [frame[src.x], frame[src.y]];
    }
  },
  copyIfFalse: function(frame, src, dest) {
    frame[dest.value] = frame[src.bool] ? 0 : frame[src.value];
  },
  copyIfTrue: function(frame, src, dest) {
    frame[dest.value] = frame[src.bool] ? frame[src.value] : 0;
  },
  true: function(frame, src, dest) {
    frame[dest.value] = true;
  },
  rising: function() {
    let prev = false;
    return function rising(frame, src, dest) {
      frame[dest.value] = frame[src.value] && !prev;
      prev = frame[src.value];
    };
  },
  falling: function() {
    let prev = false;
    return function falling(frame, src, dest) {
      frame[dest.value] = !frame[src.value] && prev;
      prev = frame[src.value];
    };
  }
};
