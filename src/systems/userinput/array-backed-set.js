export function ArrayBackedSet() {
  return {
    items: [],
    has(item) {
      return this.items.indexOf(item) !== -1;
    },
    add(item) {
      if (!this.has(item)) {
        this.items.push(item);
      }
      return this;
    },
    delete(item) {
      const index = this.items.indexOf(item);
      if (index !== -1) {
        this.items[index] = this.items[this.items.length - 1];
        this.items.pop();
      }
    },
    clear() {
      this.items.length = 0;
    }
  };
}

export function countIntersectionsForArrayBackedSets(a, b) {
  let count = 0;
  for (let i = 0; i < a.items.length; i++) {
    if (b.has(a.items[i])) {
      count += 1;
    }
  }
  return count;
}
