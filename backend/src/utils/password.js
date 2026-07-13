const crypto = require('crypto');

const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(String(password), salt, 100000, 64, 'sha512').toString('hex');
  return `pbkdf2_sha512$100000$${salt}$${hash}`;
};

const verifyPassword = (password, storedHash = '') => {
  const [algorithm, iterations, salt, hash] = String(storedHash).split('$');

  if (algorithm !== 'pbkdf2_sha512' || !iterations || !salt || !hash) {
    return false;
  }

  const calculated = crypto.pbkdf2Sync(String(password), salt, Number(iterations), 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(calculated, 'hex'), Buffer.from(hash, 'hex'));
};

module.exports = {
  hashPassword,
  verifyPassword,
};
