#!/usr/bin/env node

const spritesheet = require("spritesheet-js");
const path = require("path");
const fs = require("fs");

const spritesheetConfigs = {
  action: {
    src: "src/assets/images/sprites/action/*",
    dest: "src/assets/images/spritesheets",
    name: "sprite-system-action-spritesheet"
  },
  notice: {
    src: "src/assets/images/sprites/notice/*",
    dest: "src/assets/images/spritesheets",
    name: "sprite-system-notice-spritesheet"
  }
};

async function generateSpritesheet(configKey) {
  const config = spritesheetConfigs[configKey];

  if (!config) {
    console.error(`Unknown spritesheet config: ${configKey}`);
    process.exit(1);
  }

  console.log(`Generating spritesheet: ${config.name}`);

  const options = {
    // Use power-of-two dimensions for XR/mobile GPU optimization
    powerOfTwo: true,
    // Maximum size to prevent excessive memory usage
    maxSize: 2048,
    // Padding between sprites
    padding: 1,
    // Output format
    format: "json",
    // Trim transparent pixels
    trim: true,
    // Algorithm for packing
    algorithm: "growing-binpacking"
  };

  return new Promise((resolve, reject) => {
    spritesheet(
      config.src,
      {
        ...options,
        name: config.name,
        path: config.dest
      },
      err => {
        if (err) {
          console.error(`Error generating ${config.name}:`, err);
          reject(err);
          return;
        }

        // spritesheet-js writes files directly and doesn't return data in callback
        // Check if files were created
        const imagePath = path.join(config.dest, `${config.name}.png`);
        const jsonPath = path.join(config.dest, `${config.name}.json`);

        if (!fs.existsSync(imagePath) || !fs.existsSync(jsonPath)) {
          console.error(`Generated files not found: ${imagePath}, ${jsonPath}`);
          reject(new Error("Generated files not found"));
          return;
        }

        console.log(`Generated: ${imagePath}`);
        console.log(`Generated: ${jsonPath}`);
        console.log(`✓ Spritesheet '${config.name}' generated successfully`);
        resolve();
      }
    );
  });
}

async function main() {
  const configKey = process.argv[2];

  if (!configKey) {
    console.error("Usage: node generate-spritesheets.js <config>");
    console.error("Available configs:", Object.keys(spritesheetConfigs).join(", "));
    process.exit(1);
  }

  try {
    await generateSpritesheet(configKey);
    console.log("🎉 All spritesheets generated successfully!");
  } catch (error) {
    console.error("❌ Failed to generate spritesheets:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
