package io.github.mohammedteir.oryn.feasibility

import android.content.Context
import android.content.pm.PackageManager

internal class TermuxNotInstalled : IllegalStateException()
internal class TermuxPermissionRequired : IllegalStateException()

/** Read-only prerequisites. Passing this check never creates execution authority. */
internal object TermuxPreflight {
  fun requireForReview(installed: ()->Boolean,permissionGranted: ()->Boolean) {
    if(!installed()) throw TermuxNotInstalled()
    if(!permissionGranted()) throw TermuxPermissionRequired()
  }
}

internal object TermuxPlatform {
  @Suppress("DEPRECATION")
  fun installed(c: Context): Boolean = try {
    c.packageManager.getPackageInfo("com.termux",0);true
  } catch (_: PackageManager.NameNotFoundException) { false }
  fun permissionGranted(c: Context)=c.checkSelfPermission("com.termux.permission.RUN_COMMAND")==PackageManager.PERMISSION_GRANTED
  fun snapshot(c: Context): Map<String,String> = try {
    val found=installed(c)
    mapOf(
      "packageState" to if(found) "detected" else "not_detected",
      "runCommandPermission" to if(!found) "not_checked_package_missing" else if(permissionGranted(c)) "granted" else "denied",
      "providerConfiguration" to "not_observed"
    )
  } catch(e: Exception) {
    mapOf("packageState" to "unknown","runCommandPermission" to "unknown",
      "providerConfiguration" to "not_observed","observationErrorClass" to e.javaClass.simpleName)
  }
}
