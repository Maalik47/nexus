'use strict';

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

function ensureEnv(name) {
  const dir = path.join(root, name);
  const env = path.join(dir, '.env');
  const example = path.join(dir, '.env.example');

  if (fs.existsSync(env)) {
    console.log(`- ${name}/.env ya existe, se conserva`);
    return;
  }
  if (!fs.existsSync(example)) return;

  fs.copyFileSync(example, env);
  console.log(`- ${name}/.env creado desde .env.example`);
}

console.log('NexusGear - configuracion inicial\n');

['backend', 'frontend'].forEach(ensureEnv);

for (const name of ['backend', 'frontend']) {
  console.log(`\n> Instalando dependencias de ${name}...`);
  const result = spawnSync('npm install', {
    cwd: path.join(root, name),
    stdio: 'inherit',
    shell: true,
    env: process.env
  });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

console.log('\nListo. Siguientes pasos:');
console.log('  1) npm run db:setup   (carga esquema y datos de demostracion)');
console.log('  2) npm run dev        (arranca backend y frontend a la vez)');
