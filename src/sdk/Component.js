import { types } from "./types";

export const ComponentSymbol = Symbol("Component");

export class Component {
  static schema = {};

  constructor() {
    this.isComponent = true;
    this.reset();
  }

  clone() {
    return new this.constructor().copy(this);
  }

  copy(source) {
    const schema = this.constructor.schema;

    for (const propName in schema) {
      const prop = schema[propName];
      this[propName] = types.get(prop.type)(source[propName]);
    }
  }

  reset() {
    const schema = this.constructor.schema;

    for (const propName in schema) {
      const prop = schema[propName];
      this[propName] = types.get(prop.type)(prop.default);
    }
  }

  dispose() {}
}

Component[ComponentSymbol] = true;
