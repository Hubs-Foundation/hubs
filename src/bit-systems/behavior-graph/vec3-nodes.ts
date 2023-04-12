import { makeInNOutFunctionDesc, ValueType } from "@oveddan-behave-graph/core";
import { Euler, Vector3 } from "three";
import { definitionListToMap } from "./utils";

type Vec3JSON = { x: number; y: number; z: number };
export const Vector3Value = {
  vec3: new ValueType(
    "vec3",
    () => new Vector3(),
    (value: Vector3 | Vec3JSON) => (value instanceof Vector3 ? value : new Vector3(value.x, value.y, value.z)),
    (value: Vector3) => ({ x: value.x, y: value.y, z: value.z }),
    (start: Vector3, end: Vector3, t: number) => start.lerp(end, t)
  )
};

export const Vector3Nodes = definitionListToMap([
  makeInNOutFunctionDesc({
    name: "math/vec3/combine",
    label: "Combine Vec3",
    category: "Vec3 Math" as any,
    in: [{ x: "float" }, { y: "float" }, { z: "float" }],
    out: [{ v: "vec3" }],
    exec: (x: number, y: number, z: number) => {
      return { v: new Vector3(x, y, z) };
    }
  }),
  makeInNOutFunctionDesc({
    name: "math/vec3/separate",
    label: "Separate Vec3",
    category: "Vec3 Math" as any,
    in: [{ v: "vec3" }],
    out: [{ x: "float" }, { y: "float" }, { z: "float" }],
    exec: (v: Vector3) => {
      return { x: v.x, y: v.y, z: v.z };
    }
  }),
  makeInNOutFunctionDesc({
    name: "math/vec3/toEuler",
    label: "To Euler",
    category: "Vec3 Math" as any,
    in: [{ v: "vec3" }],
    out: [{ v: "euler" }],
    exec: (v: Vector3) => {
      return { v: new Euler().setFromVector3(v) };
    }
  }),
  makeInNOutFunctionDesc({
    name: "math/vec3",
    label: "Vec3",
    category: "Vec3 Math" as any,
    in: ["vec3"],
    out: "vec3",
    exec: (a: Vector3) => a
  }),
  makeInNOutFunctionDesc({
    name: "math/toVec3/float",
    label: "to Vec3",
    category: "Float Math" as any,
    in: [{ x: "float" }, { y: "float" }, { z: "float" }],
    out: "vec3",
    exec: (x: number, y: number, z: number) => new Vector3(x, y, z)
  }),
  makeInNOutFunctionDesc({
    name: "math/toFloat/vec3",
    label: "To Float",
    category: "Vec3 Math" as any,
    in: ["vec3"],
    out: [{ x: "float" }, { y: "float" }, { z: "float" }],
    exec: (v: Vector3) => ({ x: v.x, y: v.y, z: v.z })
  }),
  makeInNOutFunctionDesc({
    name: "math/toString/vec3",
    label: "To String",
    category: "Vec3 Math" as any,
    in: ["vec3"],
    out: "string",
    exec: (v: Vector3) => `${v.x.toFixed(4)}, ${v.y.toFixed(4)}, ${v.z.toFixed(4)}`
  }),
  makeInNOutFunctionDesc({
    name: "math/add/vec3",
    label: "+",
    category: "Vec3 Math" as any,
    in: ["vec3", "vec3"],
    out: "vec3",
    exec: (a: Vector3, b: Vector3) => new Vector3().addVectors(a, b)
  }),
  makeInNOutFunctionDesc({
    name: "math/subtract/vec3",
    label: "-",
    category: "Vec3 Math" as any,
    in: ["vec3", "vec3"],
    out: "vec3",
    exec: (a: Vector3, b: Vector3) => new Vector3().subVectors(a, b)
  }),
  makeInNOutFunctionDesc({
    name: "math/negate/vec3",
    label: "-",
    category: "Vec3 Math" as any,
    in: ["vec3"],
    out: "vec3",
    exec: (a: Vector3) => new Vector3().copy(a).negate()
  }),
  makeInNOutFunctionDesc({
    name: "math/scale/vec3",
    label: "×",
    category: "Vec3 Math" as any,
    in: ["vec3", "float"],
    out: "vec3",
    exec: (a: Vector3, b: number) => new Vector3().copy(a).multiplyScalar(b)
  }),
  makeInNOutFunctionDesc({
    name: "math/length/vec3",
    label: "Length",
    category: "Vec3 Math" as any,
    in: ["vec3"],
    out: "float",
    exec: (a: Vector3) => new Vector3().copy(a).length()
  }),
  makeInNOutFunctionDesc({
    name: "math/normalize/vec3",
    label: "Normalize",
    category: "Vec3 Math" as any,
    in: ["vec3"],
    out: "vec3",
    exec: (a: Vector3) => new Vector3().copy(a).normalize()
  }),
  makeInNOutFunctionDesc({
    name: "math/cross/vec3",
    label: "Cross",
    category: "Vec3 Math" as any,
    in: ["vec3", "vec3"],
    out: "vec3",
    exec: (a: Vector3, b: Vector3) => new Vector3().crossVectors(a, b)
  }),
  makeInNOutFunctionDesc({
    name: "math/dot/vec3",
    label: "Dot",
    category: "Vec3 Math" as any,
    in: ["vec3", "vec3"],
    out: "float",
    exec: (a: Vector3, b: Vector3) => new Vector3().copy(a).dot(b)
  }),
  makeInNOutFunctionDesc({
    name: "math/mix/vec3",
    label: "÷",
    category: "Vec3 Math" as any,
    in: [{ a: "vec3" }, { b: "vec3" }, { t: "float" }],
    out: "vec3",
    exec: (a: Vector3, b: Vector3, t: number) => new Vector3().lerpVectors(a, b, t)
  }),
  makeInNOutFunctionDesc({
    name: "math/equal/vec3",
    label: "=",
    category: "Vec3 Math" as any,
    in: [{ a: "vec3" }, { b: "vec3" }, { tolerance: "float" }],
    out: "boolean",
    exec: (a: Vector3, b: Vector3) => a.equals(b)
  })
]);
