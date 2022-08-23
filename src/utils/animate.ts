import { Vector3 } from "three";

type Value = Vector3;
type AnimationProperty = [start: Value, end: Value];
type EasingFunction = (t: number) => number;
type AnimationCallback = (values: Value[]) => void;

export function* animate(
  properties: AnimationProperty[],
  duration: number,
  easing: EasingFunction,
  fn: AnimationCallback
) {
  const values = properties.map(([s]) => new Vector3().copy(s));
  const start = performance.now();
  const end = start + duration;
  let now = start;
  while (now < end) {
    const t = easing((now - start) / (end - start));
    for (let i = 0; i < values.length; i++) {
      values[i].lerpVectors(properties[i][0], properties[i][1], t);
    }
    fn(values);
    yield Promise.resolve();
    now = performance.now();
  }

  for (let i = 0; i < values.length; i++) {
    values[i].copy(properties[i][1]);
  }
  fn(values);
}
