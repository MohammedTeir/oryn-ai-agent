const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
// Read the canonical design tokens without copying or changing approved assets.
config.watchFolders = [path.resolve(__dirname, '../../docs/design')];
module.exports = config;
