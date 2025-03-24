import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');

// Function to recursively process all .js files in a directory
function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  
  for (const file of files) {
    const filePath = path.join(directory, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (file.endsWith('.js')) {
      fixImports(filePath);
    }
  }
}

// Function to fix imports in a file
function fixImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Add .js extension to relative imports
  content = content.replace(/from\s+['"](\.[^'"]*)['"]/g, (match, importPath) => {
    // Skip if already has an extension
    if (importPath.endsWith('.js')) return match;
    return `from '${importPath}.js'`;
  });
  
  fs.writeFileSync(filePath, content);
  console.log(`Fixed imports in ${filePath}`);
}

// Start processing
console.log('Fixing imports in dist directory...');
processDirectory(distDir);
console.log('Done fixing imports.'); 