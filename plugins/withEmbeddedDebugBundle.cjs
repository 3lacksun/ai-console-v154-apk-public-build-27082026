const { withAppBuildGradle } = require('@expo/config-plugins');

/**
 * The React Native Gradle plugin normally treats `debug` as a Metro-served
 * variant and skips embedding the JavaScript bundle. This preview APK is
 * intended for physical-device testing without a development server, so the
 * debug variant must be bundled like a standalone app.
 */
const withEmbeddedDebugBundle = (config) => withAppBuildGradle(config, (nextConfig) => {
  if (nextConfig.modResults.language !== 'groovy') {
    throw new Error('Embedded debug bundle plugin requires a Groovy app build.gradle file.');
  }

  const marker = 'bundleCommand = "export:embed"';
  const embeddedBundleSetting = '    debuggableVariants = [] // Embed JavaScript in the physical-device debug preview.';

  if (!nextConfig.modResults.contents.includes(marker)) {
    throw new Error('React Native bundle command marker was not found in app build.gradle.');
  }

  if (!nextConfig.modResults.contents.includes(embeddedBundleSetting)) {
    nextConfig.modResults.contents = nextConfig.modResults.contents.replace(marker, `${marker}\n${embeddedBundleSetting}`);
  }

  return nextConfig;
});

module.exports = withEmbeddedDebugBundle;
