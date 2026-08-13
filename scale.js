const fs = require('fs');
const path = require('path');

const walk = function(dir, done) {
  let results = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    let pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(function(file) {
      file = path.resolve(dir, file);
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function(err, res) {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.css')) {
             results.push(file);
          }
          if (!--pending) done(null, results);
        }
      });
    });
  });
};

walk('/Users/pradnyan.wadekar/Page Crank/web', (err, files) => {
  files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // Replace [10px] -> [15px]
    const newContent = content.replace(/\[(\d+)px\]/g, (match, p1) => {
      changed = true;
      const num = parseInt(p1);
      const scaled = Math.round(num * 1.5);
      return `[${scaled}px]`;
    });

    if (changed) {
      fs.writeFileSync(file, newContent, 'utf8');
      console.log('Updated ' + file);
    }
  });
});
