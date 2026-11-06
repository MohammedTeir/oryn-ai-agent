const { withAndroidStyles } = require('expo/config-plugins');

// expo-splash-screen 58.0.13 puts an API 33-only attribute in values/styles.xml.
// Omit this optional preference so Android 10+ can use the AndroidX splash theme.
function removeUnqualifiedApi33Attribute(resources) {
  for (const style of resources.style ?? []) {
    if (style.$.name === 'Theme.App.SplashScreen') {
      style.item = (style.item ?? []).filter((item) => item.$.name !== 'android:windowSplashScreenBehavior');
    }
  }
  return resources;
}
module.exports = function withCompatibleSplash(config) {
  return withAndroidStyles(config, (mod) => {
    mod.modResults.resources = removeUnqualifiedApi33Attribute(mod.modResults.resources);
    return mod;
  });
};
module.exports.removeUnqualifiedApi33Attribute = removeUnqualifiedApi33Attribute;
