# Launch screen

The Expo SDK 58 splash plugin (`expo-splash-screen` 58.0.13) generates Android launch resources using the approved primary color PNG on the light background from the design tokens. Its `contain` mode preserves the artwork's aspect ratio. Logo sizing uses the plugin default because no exact splash dimension is specified.

The generated theme and signed test APK can be checked in the cloud. Actual appearance, legibility, cropping and startup transitions on Android versions and devices still require device verification; this checklist item is not yet complete. Android's system splash presentation may vary by OS version.
