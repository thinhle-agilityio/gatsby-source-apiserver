const crypto = require(`crypto`)

exports.objectRef = (obj, str) => {
  const levels = str.split('.');
  for (var i = 0; i < levels.length; i++) {
    obj = obj[levels[i]];
  }
  return obj;
}

exports.forEachAsync = async (array, callback) => {
  for (let i = 0; i < array.length; i++) {
    await callback(array[i], i, array);
  }
}

/**
 * Encrypts a String using md5 hash of hexadecimal digest.
 *
 * @param {any} str
 */
exports.digest = str => {
  return crypto.createHash(`md5`).update(str).digest(`hex`);
}