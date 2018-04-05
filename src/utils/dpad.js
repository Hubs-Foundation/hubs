export function angleTo4Direction(angle) {
  angle = (angle * THREE.Math.RAD2DEG + 180 + 45) % 360;
  if (angle > 0 && angle < 90) {
    return "north";
  } else if (angle >= 90 && angle < 180) {
    return "west";
  } else if (angle >= 180 && angle < 270) {
    return "south";
  } else {
    return "east";
  }
}

export function angleTo8Direction(angle) {
  angle = (angle * THREE.Math.RAD2DEG + 180 + 45) % 360;
  let direction = "";
  if ((angle >= 0 && angle < 120) || angle >= 330) {
    direction += "north";
  }
  if (angle >= 150 && angle < 300) {
    direction += "south";
  }
  if (angle >= 60 && angle < 210) {
    direction += "west";
  }
  if ((angle >= 240 && angle < 360) || angle < 30) {
    direction += "east";
  }
  return direction;
}
