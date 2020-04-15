export const SystemSymbol = Symbol("System");

export class System {
  constructor(world) {
    this.world = world;
  }

  update(/* dt */) {}
}

System[SystemSymbol] = true;
