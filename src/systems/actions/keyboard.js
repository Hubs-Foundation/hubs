import { key4_to_vec2 } from "./filters";

export function framify(queue, frame) {
  for (let i = 0; i < queue.length; i++) {
    const event = queue[i];
    switch (event.type) {
      case "keydown":
        frame[event.key.toLowerCase()] = true;
        break;
      case "keyup":
        frame[event.key.toLowerCase()] = false;
        break;
      case "blur":
        for (const key in frame) {
          frame[key] = false;
        }
        break;
    }
  }
  return frame;
}

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
      action = frame[binding.key];
      break;
    case "nokey":
      action = !frame[binding.key];
      break;
    case "key4_to_vec2":
      if (!binding.filterFn) {
        binding.filterFn = key4_to_vec2();
      }
      action = binding.filterFn.filter(binding.filter_params, frame, prevFrame);
      break;
  }
  return action;
}
