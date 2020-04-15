import { Vector2, Vector3, Vector4, Color, Euler, Quaternion, Matrix3, Matrix4, Box2, Box3, Cylindrical } from "three";

const copyValue = value => value;
const copyClone = value => (value ? value.clone() : value);
const copyArray = value => (value ? value.slice(0) : value);
const copyJSON = value => (value ? JSON.parse(JSON.stringify(value)) : value);

export const types = new Map([
  [undefined, copyValue],
  [null, copyValue],
  [String, copyValue],
  [Number, copyValue],
  [Boolean, copyValue],
  [Symbol, copyValue],
  [Function, copyValue],
  [Object, copyValue],
  [Array, copyArray],
  [JSON, copyJSON],
  [Vector2, copyClone],
  [Vector3, copyClone],
  [Vector4, copyClone],
  [Color, copyClone],
  [Euler, copyClone],
  [Quaternion, copyClone],
  [Matrix3, copyClone],
  [Matrix4, copyClone],
  [Box2, copyClone],
  [Box3, copyClone],
  [Cylindrical, copyClone],
  [Euler, copyClone]
]);
