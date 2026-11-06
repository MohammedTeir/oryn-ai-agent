const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
// Read the canonical design tokens without copying or changing approved assets.
config.watchFolders = [path.resolve(__dirname, '../../docs/design'), path.resolve(__dirname, '../../assets/ORYN_Brand_Assets')];
config.resolver.nodeModulesPaths = [path.resolve(__dirname, 'node_modules')];
module.exports = config;
