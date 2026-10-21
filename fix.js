const fs = require('fs');
const path = require('path');

function walkSync(dir, callback) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const p = path.join(dir, file);
    const stats = fs.statSync(p);
    if (stats.isDirectory()) {
      walkSync(p, callback);
    } else if (stats.isFile()) {
      callback(p);
    }
  });
}

walkSync('src/app/api', p => {
  if (p.endsWith('.ts')) {
    let content = fs.readFileSync(p, 'utf8');
    const target = 'console.error(, error instanceof Error ? error.message : " Unknown error);';
    if (content.includes(target)) {
      content = content.replace(target, 'console.error("API Error:", error instanceof Error ? error.message : "Unknown error");');
      fs.writeFileSync(p, content, 'utf8');
      console.log('Fixed', p);
    }
  }
});
