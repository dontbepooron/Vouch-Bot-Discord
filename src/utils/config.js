
const fs = require('fs');
const path = require('path');
const cfgPath = path.join(__dirname, '..', '..', 'config.example.json');

let config = {};
try {
  const realCfgPath = path.join(process.cwd(), 'config.json');
  if (fs.existsSync(realCfgPath)) {
    config = JSON.parse(fs.readFileSync(realCfgPath,'utf8'));
  } else {
    config = JSON.parse(fs.readFileSync(cfgPath,'utf8'));
  }
} catch (e) {
  console.error('Impossible de lire config.json. Utilise config.example.json comme fallback.');
  config = {};
}

module.exports = {
  prefix: config.prefix || '.',
  config
};
