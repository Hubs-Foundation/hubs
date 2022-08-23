import { MathUtils, Vector3 } from "three";

type Value = Vector3 | number;
type AnimationProperty = [start: Value, end: Value];
type EasingFunction = (t: number) => number;
type AnimationCallback = (values: Value[]) => void;

export function* animate(
  properties: AnimationProperty[],
  duration: number,
  easing: EasingFunction,
  fn: AnimationCallback
) {
  const values = properties.map(([s]) => {
    if (typeof s === "number") {
      return s;
    } else {
      return new Vector3().copy(s);
    }
  });

  const start = performance.now();
  const end = start + duration;
  let now = start;
  while (now < end) {
    const t = easing((now - start) / (end - start));

    for (let i = 0; i < values.length; i++) {
      if (typeof values[i] === "number") {
        values[i] = MathUtils.lerp(properties[i][0] as number, properties[i][1] as number, t);
      } else {
        (values[i] as Vector3).lerpVectors(properties[i][0] as Vector3, properties[i][1] as Vector3, t);
      }
    }
    fn(values);
    yield Promise.resolve();
    now = performance.now();
  }

  for (let i = 0; i < values.length; i++) {
    if (typeof values[i] === "number") {
      values[i] = properties[i][1] as number;
    } else {
      (values[i] as Vector3).copy(properties[i][1] as Vector3);
    }
  }
  fn(values);
}
