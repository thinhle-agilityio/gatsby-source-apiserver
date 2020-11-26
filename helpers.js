function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

exports.objectRef = (obj, str) => {
  const levels = str.split('.');
  for (var i = 0; i < levels.length; i++) {
    obj = obj[levels[i]];
  }
  return obj;
};

exports.forEachAsync = (() => {
  var _ref = _asyncToGenerator(function* (array, callback) {
    for (let i = 0; i < array.length; i++) {
      yield callback(array[i], i, array);
    }
  });

  return function (_x, _x2) {
    return _ref.apply(this, arguments);
  };
})();