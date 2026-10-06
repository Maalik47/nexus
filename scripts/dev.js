'use strict';

const { spawn } = require('node:child_process');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const isWindows = process.platform === 'win32';

const targets = [
  { name: 'backend', cwd: path.join(root, 'backend') },
  { name: 'frontend', cwd: path.join(root, 'frontend') }
];

const children = [];
let shuttingDown = false;

function relay(name, stream) {
  stream.setEncoding('utf8');
  let buffer = '';
  stream.on('data', (chunk) => {
    buffer += chunk;
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      process.stdout.write(`[${name}] ${line}\n`);
    }
  });
}

function kill(child) {
  if (child.exitCode !== null || child.signalCode) return;
  if (isWindows) {
    spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], {
      stdio: 'ignore',
      windowsHide: true
    });
  } else {
    child.kill('SIGTERM');
  }
}

function shutdown(code) {
  if (shuttingDown) return;
  shuttingDown = true;
  children.forEach(kill);
  process.exit(code);
}

for (const target of targets) {
  const child = spawn('npm run dev', {
    cwd: target.cwd,
    shell: true,
    env: process.env
  });

  relay(target.name, child.stdout);
  relay(target.name, child.stderr);

  child.on('error', (err) => {
    console.error(`[${target.name}] ${err.message}`);
    shutdown(1);
  });

  child.on('exit', (code) => {
    if (shuttingDown) return;
    console.error(`[${target.name}] finalizo inesperadamente (codigo ${code}).`);
    shutdown(code === 0 ? 0 : 1);
  });

  children.push(child);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

console.log('NexusGear en marcha:');
console.log('  - Frontend  http://localhost:5173');
console.log('  - Backend   http://localhost:4000  (docs: /api/docs)');
console.log('  - Ctrl+C para detener ambos');
