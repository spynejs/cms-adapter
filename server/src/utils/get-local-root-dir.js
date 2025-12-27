const fs = require('fs');
const path = require('path');

function getLocalSpyneRootDir() {
  try {
    let dir = __dirname;
    while (dir !== path.parse(dir).root) {
      const pkgFile = path.join(dir, 'package.json');
      if (fs.existsSync(pkgFile)) {
        const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf-8'));
        if (pkg.name === '@franciscobatista/spyne-cms-server-webpack-tmp') {
          return dir;
        }
      }
      dir = path.dirname(dir);
    }
    console.warn('⚠️ Spyne root directory not found — returning current directory.');
    return __dirname;
  } catch (err) {
    console.warn('⚠️ Error resolving Spyne root directory:', err);
    return process.cwd();
  }
}

module.exports = { getLocalSpyneRootDir };
