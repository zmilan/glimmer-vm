const helpers = require('@glimmer/build/lib/generate-helpers');
const writeFile = require('broccoli-file-creator');

module.exports = function(helperPath, format) {
  return writeFile(helperPath, helpers(format || 'es'));
}
