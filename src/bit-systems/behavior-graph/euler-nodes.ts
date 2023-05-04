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
    (value: Euler | EulerJSON) => (value instanceof Euler ? value.clone() : new Euler(value.x, value.y, value.z)),
    (value: Euler) => ({ x: value.x, y: value.y, z: value.z }),
    (start: Euler, end: Euler, t: number) =>
      new Euler().setFromQuaternion(tmpQuat1.setFromEuler(start).slerp(tmpQuat2.setFromEuler(end), t))
  )
};

export const EulerNodes = definitionListToMap([
  makeInNOutFunctionDesc({
    name: "math/euler/combine",
    label: "Combine Euler",
    category: "Euler Math" as any,
    in: [{ x: "float" }, { y: "float" }, { z: "float" }, { order: "string" }],
    out: [{ v: "euler" }],
    exec: (x: number, y: number, z: number, order: string) => {
      return { v: new Euler(x, y, z, order) };
    }
  }),
  makeInNOutFunctionDesc({
    name: "math/euler/separate",
    label: "Separate Euler",
    category: "Euler Math" as any,
    in: [{ v: "euler" }],
    out: [{ x: "float" }, { y: "float" }, { z: "float" }, { order: "string" }],
    exec: (v: Euler) => {
      return { x: v.x, y: v.y, z: v.z, order: v.order };
    }
  }),
  makeInNOutFunctionDesc({
    name: "math/euler/add",
    label: "Add Euler",
    category: "Euler Math" as any,
    in: ["euler", "euler"],
    out: "euler",
    exec: (a: Euler, b: Euler) => {
      const r = a.clone();
      r.x += b.x;
      r.y += b.y;
      r.z += b.z;
      return r;
    }
  }),
  makeInNOutFunctionDesc({
    name: "math/euler/subtract",
    label: "Subtract Euler",
    category: "Euler Math" as any,
    in: ["euler", "euler"],
    out: "euler",
    exec: (a: Euler, b: Euler) => {
      const r = a.clone();
      r.x -= b.x;
      r.y -= b.y;
      r.z -= b.z;
      return r;
    }
  }),
  makeInNOutFunctionDesc({
    name: "math/euler/subtract",
    label: "Scale Euler",
    category: "Euler Math" as any,
    in: ["euler", "float"],
    out: "euler",
    exec: (a: Euler, b: number) => {
      const r = a.clone();
      r.x *= b;
      r.y *= b;
      r.z *= b;
      return r;
    }
  })
]);
