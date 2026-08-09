/**
 * Credential encryption for ~/.evyasys/credentials.
 *
 * Uses AES-256-GCM (authenticated encryption) — tampered ciphertext is
 * detected during decryption. Key is derived from the machine identity
 * (hostname + username) so credentials are machine-bound and unreadable
 * if the file is copied to another machine.
 *
 * Formats:
 *   v2 (current):  "v2:<12-byte IV hex>:<16-byte auth tag hex>:<ciphertext hex>"
 *   v1 (legacy):   "<16-byte IV hex>:<ciphertext hex>"                  — AES-256-CBC
 *   plaintext:     any value without colon separators                    — legacy pre-encryption
 *
 * Decryption transparently handles all three formats so existing credentials
 * files continue to work after the plugin is upgraded.
 */
const crypto = require('crypto');
const os     = require('os');

const ALGO_V2 = 'aes-256-gcm';
const ALGO_V1 = 'aes-256-cbc';

function machineKey() {
  const seed = `evyasys:${os.hostname()}:${os.userInfo().username}`;
  return crypto.createHash('sha256').update(seed, 'utf8').digest();
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * @param {string} plaintext
 * @returns {string}  "v2:<ivHex>:<authTagHex>:<ciphertextHex>"
 */
function encrypt(plaintext) {
  const iv     = crypto.randomBytes(12); // GCM standard IV size
  const cipher = crypto.createCipheriv(ALGO_V2, machineKey(), iv);
  const enc    = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag    = cipher.getAuthTag();
  return `v2:${iv.toString('hex')}:${tag.toString('hex')}:${enc.toString('hex')}`;
}

/**
 * Decrypt a value previously produced by encrypt().
 * Supports v2 (GCM), v1 (CBC — legacy), and pre-encryption plaintext.
 * @param {string} encoded
 * @returns {string}
 */
function decrypt(encoded) {
  if (!encoded || typeof encoded !== 'string') return encoded;

  // v2 — AES-256-GCM (authenticated)
  if (encoded.startsWith('v2:')) {
    try {
      const [, ivHex, tagHex, encHex] = encoded.split(':');
      if (!ivHex || !tagHex || !encHex) return encoded;
      const iv       = Buffer.from(ivHex, 'hex');
      const tag      = Buffer.from(tagHex, 'hex');
      const enc      = Buffer.from(encHex, 'hex');
      const decipher = crypto.createDecipheriv(ALGO_V2, machineKey(), iv);
      decipher.setAuthTag(tag);
      return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
    } catch (_) {
      // Auth tag mismatch or corruption — return empty rather than expose ciphertext
      return '';
    }
  }

  // v1 — AES-256-CBC (legacy — from plugin versions before v1.3.1)
  if (encoded.includes(':')) {
    try {
      const colonIdx = encoded.indexOf(':');
      const ivHex    = encoded.slice(0, colonIdx);
      const encHex   = encoded.slice(colonIdx + 1);
      if (ivHex.length !== 32) return encoded; // not our v1 format
      const iv       = Buffer.from(ivHex, 'hex');
      const enc      = Buffer.from(encHex, 'hex');
      const decipher = crypto.createDecipheriv(ALGO_V1, machineKey(), iv);
      return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
    } catch (_) {
      return encoded;
    }
  }

  // Pre-encryption plaintext value — return as-is
  return encoded;
}

module.exports = { encrypt, decrypt };
