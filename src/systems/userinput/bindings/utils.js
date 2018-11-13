export const addSetsToBindings = mapping => {
  for (const setName in mapping) {
    for (const binding of mapping[setName]) {
      if (!binding.sets) {
        binding.sets = [];
      }
      binding.sets.push(setName);
    }
  }
  return mapping;
};
