import { makeInNOutFunctionDesc, ValueType } from "@oveddan-behave-graph/core";
import { Euler, Quaternion, Vector3 } from "three";
import { definitionListToMap } from "./utils";

type EulerJSON = { x: number; y: number; z: number };
const tmpQuat1 = new Quaternion();
const tmpQuat2 = new Quaternion();
export const eulerValueDefs = {
  euler: new ValueType(
    "euler",
    () => new Euler(),
    (value: Euler | EulerJSON) => (value instanceof Euler ? value : new Euler(value.x, value.y, value.z)),
    (value: Euler) => ({ x: value.x, y: value.y, z: value.z }),
    (start: Euler, end: Euler, t: number) =>
      new Euler().setFromQuaternion(tmpQuat1.setFromEuler(start).slerp(tmpQuat2.setFromEuler(end), t))
  )
};

export const EulerNodes = definitionListToMap([
  makeInNOutFunctionDesc({
    name: "math/euler/combine",
    label: "Combine Euler",
    category: "Eueler Math" as any,
    in: [{ x: "float" }, { y: "float" }, { z: "float" }],
    out: [{ v: "euler" }],
    exec: (x: number, y: number, z: number) => {
      return { v: new Euler(x, y, z) };
    }
  }),
  makeInNOutFunctionDesc({
    name: "math/euler/separate",
    label: "Separate Eueler",
    category: "Eueler Math" as any,
    in: [{ v: "euler" }],
    out: [{ x: "float" }, { y: "float" }, { z: "float" }],
    exec: (v: Euler) => {
      return { x: v.x, y: v.y, z: v.z };
    }
  }),
  makeInNOutFunctionDesc({
    name: "math/euler/toVec3",
    label: "to Vec3",
    category: "Eueler Math" as any,
    in: [{ v: "euler" }],
    out: [{ v: "vec3" }],
    exec: (v: Euler) => {
      return { v: new Vector3().setFromEuler(v) };
    }
  })
]);
