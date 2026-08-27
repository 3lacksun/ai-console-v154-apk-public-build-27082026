const { withAndroidStyles } = require('@expo/config-plugins');

/**
 * Expo generates android:windowSplashScreenBehavior for API 33+ in the base
 * values resource. Older Android versions safely ignore the attribute, but
 * Android lint requires that intent to be explicit in the generated XML.
 */
const withAndroidSplashLintTargetApi = (config) => withAndroidStyles(config, (nextConfig) => {
  const styles = nextConfig.modResults;
  const resources = styles.resources;
  resources.$ = { ...(resources.$ || {}), 'xmlns:tools': 'http://schemas.android.com/tools' };

  const splashStyle = (resources.style || []).find((style) => style.$?.name === 'Theme.App.SplashScreen');
  const behavior = splashStyle?.item?.find((item) => item.$?.name === 'android:windowSplashScreenBehavior');

  if (behavior) {
    behavior.$ = { ...behavior.$, 'tools:targetApi': '33' };
  }

  return nextConfig;
});

module.exports = withAndroidSplashLintTargetApi;
