// Simple TOML parser for browser compatibility
// This is a minimal implementation that handles the basic TOML features we need

function parseValue(value) {
  value = value.trim();
  
  // Boolean
  if (value === 'true') return true;
  if (value === 'false') return false;
  
  // Number
  if (/^-?\d+(\.\d+)?$/.test(value)) {
    return parseFloat(value);
  }
  
  // String (quoted)
  if ((value.startsWith('"') && value.endsWith('"')) || 
      (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1).replace(/\\"/g, '"').replace(/\\'/g, "'");
  }
  
  // Array
  if (value.startsWith('[') && value.endsWith(']')) {
    const items = value.slice(1, -1).split(',');
    return items.map(item => parseValue(item));
  }
  
  // Unquoted string
  return value;
}

export function parse(tomlString) {
  const lines = tomlString.split('\n');
  const result = {};
  let currentSection = result;
  let currentSectionPath = [];
  
  for (let line of lines) {
    line = line.trim();
    
    // Skip empty lines and comments
    if (!line || line.startsWith('#')) continue;
    
    // Section header
    if (line.startsWith('[') && line.endsWith(']')) {
      const sectionName = line.slice(1, -1).trim();
      currentSectionPath = sectionName.split('.');
      currentSection = result;
      
      for (const part of currentSectionPath) {
        if (!currentSection[part]) {
          currentSection[part] = {};
        }
        currentSection = currentSection[part];
      }
      continue;
    }
    
    // Key-value pair
    const equalIndex = line.indexOf('=');
    if (equalIndex > 0) {
      const key = line.slice(0, equalIndex).trim();
      const value = line.slice(equalIndex + 1).trim();
      currentSection[key] = parseValue(value);
    }
  }
  
  return result;
}

export default { parse };