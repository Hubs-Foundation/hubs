const fs = require("fs");
const path = require("path");
const { SourceMapConsumer } = require("source-map");

// Cache for source maps
const sourceMapCache = new Map();

async function loadSourceMap(fileUrl) {
  const mapUrl = fileUrl + ".map";
  
  if (sourceMapCache.has(mapUrl)) {
    return sourceMapCache.get(mapUrl);
  }

  try {
    // Extract file path from URL
    const urlPath = new URL(fileUrl).pathname;
    const localPath = path.join(__dirname, "../..", "dist", urlPath);
    const mapPath = localPath + ".map";
    
    if (fs.existsSync(mapPath)) {
      const mapContent = fs.readFileSync(mapPath, "utf8");
      const consumer = await new SourceMapConsumer(JSON.parse(mapContent));
      sourceMapCache.set(mapUrl, consumer);
      return consumer;
    }
  } catch (e) {
    // Ignore errors
  }
  
  return null;
}

async function resolveStackTrace(stack) {
  if (!stack) return stack;
  
  const lines = stack.split("\n");
  const resolvedLines = [];
  
  for (const line of lines) {
    const match = line.match(/at\s+(?:(.+?)\s+\()?(.+?):(\d+):(\d+)\)?$/);
    if (match) {
      const [, functionName, fileUrl, line, column] = match;
      const sourceMap = await loadSourceMap(fileUrl);
      
      if (sourceMap) {
        try {
          const pos = sourceMap.originalPositionFor({
            line: parseInt(line),
            column: parseInt(column)
          });
          
          if (pos.source) {
            const sourcePath = pos.source.replace(/^webpack:\/\/\//, "");
            const resolvedLine = `    at ${functionName || "<anonymous>"} (${sourcePath}:${pos.line}:${pos.column})`;
            resolvedLines.push(resolvedLine);
            continue;
          }
        } catch (e) {
          // Fall back to original line
        }
      }
    }
    
    resolvedLines.push(line);
  }
  
  return resolvedLines.join("\n");
}

module.exports = { resolveStackTrace };