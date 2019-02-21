export function getSanitizedComponentMapping(inputComponent, inputProperty, publicComponents) {
  const publicComponent = publicComponents[inputComponent];

  if (!publicComponent) {
    throw new Error(`Component "${inputComponent}" is not public.`);
  }

  const publicProperty = publicComponent.publicProperties[inputProperty];

  if (!publicProperty) {
    throw new Error(`Component "${inputComponent}"'s property "${inputProperty}" is not public.`);
  }

  return {
    mappedComponent: publicComponent.mappedComponent,
    mappedProperty: publicProperty.mappedProperty,
    getMappedValue: publicProperty.getMappedValue
  };
}
