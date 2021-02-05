'use strict';

const brain = require('node-persist');

class Brain {
  start(directory) {
    brain.initSync({
      dir: directory
    });
  }

  get(key) {
    return brain.getItemSync(key) || null;
  }

  set(key, value) {
    brain.setItemSync(key, value);
  }

  getValuesWithKey(key) {
    return brain.valuesWithKeyMatch(key);
  }

  remove(key) {
    brain.removeItemSync(key);
  }
}
;

module.exports = Brain;
