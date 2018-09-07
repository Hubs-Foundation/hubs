import { vec2_deltas } from "./filters";

export function actionForBinding(binding, frame, prevFrame) {
  let action;
  switch (binding.filter) {
    case "keydown":
      action = !prevFrame[binding.key] && frame[binding.key];
      break;
    case "keyup":
      action = prevFrame[binding.key] && !frame[binding.key];
      break;
    case "key":
    case "vec2":
    case "number":
      action = frame[binding.key];
      break;
    case "nokey":
      action = !frame[binding.key];
      break;
    case "vec2_deltas":
      if (!binding.filterFn) {
        binding.filterFn = vec2_deltas();
      }
      action = binding.filterFn.filter(binding.filterParams, frame, prevFrame);
      break;
  }
  return action;
}

export function framify(queue, frame) {
  frame["wheel"] = 0;
  frame["dY"] = 0;
  frame["dX"] = 0;
  for (let i = 0; i < queue.length; i++) {
    const event = queue[i];
    switch (event.type) {
      case "mousedown":
        switch (event.button) {
          case 0:
            frame["left"] = true;
            break;
          case 2:
            frame["right"] = true;
            break;
        }
        break;
      case "mouseup":
        switch (event.button) {
          case 0:
            frame["left"] = false;
            break;
          case 2:
            frame["right"] = false;
            break;
        }
        break;
      case "mousemove":
        frame["normalizedCoords"] = [
          (event.clientX / window.innerWidth) * 2 - 1,
          -(event.clientY / window.innerHeight) * 2 + 1
        ];
        frame["dY"] += event.movementY;
        frame["dX"] += event.movementX;
        break;
      case "wheel":
        switch (event.deltaMode) {
          case event.DOM_DELTA_PIXEL:
            frame["wheel"] += event.deltaY / 500;
            break;
          case event.DOM_DELTA_LINE:
            frame["wheel"] += event.deltaY / 10;
            break;
          case event.DOM_DELTA_PAGE:
            frame["wheel"] += event.deltaY / 2;
            break;
        }
        break;
    }
  }
  return frame;
}
