// Thin CLI wrapper around decrypt() for use by the Python config mirror.
// Usage: node _decrypt_helper.js <encoded>
// Exits 0 and prints the plaintext; exits 1 on any failure (caller uses raw value).
const { decrypt } = require('./encrypt');
const encoded = process.argv[2];
if (!encoded) { process.exit(1); }
try {
  process.stdout.write(decrypt(encoded));
} catch (_) {
  process.exit(1);
}
