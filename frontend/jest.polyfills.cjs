const { TextEncoder, TextDecoder } = require('node:util');

Object.assign(global, { TextEncoder, TextDecoder });

if (typeof File !== 'undefined' && !File.prototype.text) {
  File.prototype.text = function text() {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(this);
    });
  };
}
