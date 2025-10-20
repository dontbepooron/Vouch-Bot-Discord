
/**
 * storage.js - helpers pour lecture/écriture JSON atomique + checks
 */
const fs = require('fs').promises;
const path = require('path');

const dataDir = path.join(process.cwd(), 'data');
const logsDir = path.join(process.cwd(), 'logs');
const lockMap = new Map();

async function _ensure(file) {
  const p = path.join(dataDir, file);
  try {
    await fs.access(p);
  } catch {
    await fs.writeFile(p, '[]', 'utf8');
  }
}

async function readJson(file) {
  const p = path.join(dataDir, file);
  await _ensure(file);
  const raw = await fs.readFile(p, 'utf8');
  try {
    return JSON.parse(raw || '[]');
  } catch (e) {
    return [];
  }
}

async function safeWriteJson(file, data) {
  const p = path.join(dataDir, file);
  await _ensure(file);
  // simple in-memory lock to avoid concurrent writes
  while (lockMap.get(p)) {
    await new Promise(r => setTimeout(r, 10));
  }
  lockMap.set(p, true);
  try {
    await fs.writeFile(p + '.tmp', JSON.stringify(data, null, 2), 'utf8');
    await fs.rename(p + '.tmp', p);
  } finally {
    lockMap.delete(p);
  }
  return true;
}

async function appendLog(line) {
  const p = path.join(logsDir, 'app.log');
  const full = `[${new Date().toISOString()}] ${line}\n`;
  try {
    await fs.appendFile(p, full, 'utf8');
  } catch (e) {
    console.error('Erreur écriture log', e);
  }
}

// helpers requested
async function isBuyer(id) {
  const cfgPath = path.join(process.cwd(), 'config.json');
  try {
    const cfg = JSON.parse(await fs.readFile(cfgPath,'utf8'));
    return String(cfg.buyerId) === String(id);
  } catch {
    return false;
  }
}
async function isAdmin(id) {
  const admins = await readJson('admins.json');
  return admins.includes(String(id));
}
async function isBlacklisted(id) {
  const bl = await readJson('blacklist.json');
  return bl.includes(String(id));
}
async function addAdmin(id) {
  const admins = await readJson('admins.json');
  id = String(id);
  if (!admins.includes(id)) {
    admins.push(id);
    await safeWriteJson('admins.json', admins);
    return true;
  }
  return false;
}
async function removeAdmin(id) {
  const admins = await readJson('admins.json');
  const n = admins.filter(x => x !== String(id));
  await safeWriteJson('admins.json', n);
  return admins.length !== n.length;
}
async function addBl(id) {
  const bl = await readJson('blacklist.json');
  id = String(id);
  if (!bl.includes(id)) {
    bl.push(id);
    await safeWriteJson('blacklist.json', bl);
    return true;
  }
  return false;
}
async function removeBl(id) {
  const bl = await readJson('blacklist.json');
  const n = bl.filter(x => x !== String(id));
  await safeWriteJson('blacklist.json', n);
  return bl.length !== n.length;
}

module.exports = {
  readJson, safeWriteJson, appendLog,
  isBuyer, isAdmin, isBlacklisted,
  addAdmin, removeAdmin, addBl, removeBl
};
