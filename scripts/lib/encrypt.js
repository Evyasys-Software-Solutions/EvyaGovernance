/**
 * Lightweight credential encryption for ~/.evyasys/credentials.
 *
 * Derives an AES-256-CBC key from the machine identity (hostname + username)
 * so credentials are machine-bound and unreadable if the file is copied to
 * another machine. Not designed for adversarial attacks with physical access —
 * it prevents casual credential exposure and casual misuse of copied files.
 *
 * Format: "<16-byte IV hex>:<ciphertext hex>"
 */
const crypto = require('crypto');
const os     = require('os');

const ALGO = 'aes-256-cbc';

function machineKey() {
  const seed = `evyasys:${os.hostname()}:${os.userInfo().username}`;
  return crypto.createHash('sha256').update(seed, 'utf8').digest();
}

/**
 * Encrypt a plaintext string.
 * @param {string} plaintext
 * @returns {string}  "<ivHex>:<ciphertextHex>"
 */
function encrypt(plaintext) {
  const iv     = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGO, machineKey(), iv);
  const enc    = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return `${iv.toString('hex')}:${enc.toString('hex')}`;
}

/**
 * Decrypt a value previously produced by encrypt().
 * Falls back to returning the value as-is if it is not in the expected format
 * (e.g. a legacy plaintext credential from before encryption was added).
 * @param {string} encoded
 * @returns {string}
 */
function decrypt(encoded) {
  if (!encoded || !encoded.includes(':')) return encoded;
  try {
    const colonIdx = encoded.indexOf(':');
    const ivHex    = encoded.slice(0, colonIdx);
    const encHex   = encoded.slice(colonIdx + 1);
    if (ivHex.length !== 32) return encoded; // not our format — return as-is
    const iv       = Buffer.from(ivHex, 'hex');
    const enc      = Buffer.from(encHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGO, machineKey(), iv);
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
  } catch (_) {
    return encoded; // decryption failed — value may be plaintext legacy
  }
}

module.exports = { encrypt, decrypt };
