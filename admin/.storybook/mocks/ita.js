// Mock ita utils for Storybook
const mockSchemaCategories = [
  "api_keys",
  "content", 
  "email",
  "advanced",
  "translations",
  "features",
  "rooms",
  "images",
  "theme",
  "links",
  "auth"
];

const mockServiceNames = ["reticulum", "spoke", "hubs"];

export const schemaByCategories = (schemas = {}) => schemas;
export const schemaCategories = mockSchemaCategories;
export const setAuthToken = (token) => {};
export const getAdminInfo = () => Promise.resolve({ permissions: [] });
export const getSchemas = () => Promise.resolve({});
export const getServiceDisplayName = (service) => {
  const displayNames = {
    reticulum: "Reticulum",
    spoke: "Spoke", 
    hubs: "Hubs"
  };
  return displayNames[service] || service;
};