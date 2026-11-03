const { createHash, timingSafeEqual } = require('node:crypto');
const { createReadStream } = require('node:fs');
const { Buffer } = require('node:buffer');

async function sha256(path) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest('hex');
}

async function verify(path, expected) {
  if (!/^[a-f0-9]{64}$/.test(expected)) throw new Error('Invalid SHA-256 digest');
  const actual = await sha256(path);
  if (!timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(expected, 'hex'))) {
    throw new Error('SHA-256 mismatch');
  }
  return actual;
}
module.exports = { sha256, verify };
if (require.main === module) {
  const [path, expected] = process.argv.slice(2);
  (expected ? verify(path, expected) : sha256(path)).then(console.log).catch(() => {
    console.error('Artifact checksum validation failed');
    process.exitCode = 1;
  });
}
