package io.github.mohammedteir.oryn.feasibility

import android.content.pm.PackageManager
import android.os.Build
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

// Observation only: no executable backend, grant issuer, shell or intent dispatcher.
class ObserverModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("OrynObserver")
    AsyncFunction("observe") {
      val context = requireNotNull(appContext.reactContext)
      val termux = try {
        @Suppress("DEPRECATION")
        val info = context.packageManager.getPackageInfo("com.termux", 0)
        mapOf("state" to "detected", "version" to info.versionName)
      } catch (_: PackageManager.NameNotFoundException) {
        mapOf("state" to "not_detected", "version" to null)
      }
      mapOf(
        "observedAtEpochMs" to System.currentTimeMillis(),
        "androidRelease" to Build.VERSION.RELEASE,
        "apiLevel" to Build.VERSION.SDK_INT,
        "supportedAbis" to Build.SUPPORTED_ABIS.toList(),
        "manufacturer" to Build.MANUFACTURER,
        "model" to Build.MODEL,
        "applicationId" to context.packageName,
        "termux" to termux,
        "executionCapability" to "not_implemented"
      )
    }
  }
}
