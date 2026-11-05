package io.github.mohammedteir.oryn.feasibility

import android.app.Activity
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.os.Handler
import android.os.Looper
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleOwner
import expo.modules.kotlin.Promise
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import org.json.JSONObject

/** User-initiated evidence export only. No execution, grant or arbitrary-path API. */
class EvidenceExportModule : Module() {
  private data class SaveRequest(val bytes: ByteArray,val promise: Promise)
  private var pending: SaveRequest?=null
  private var writing=false
  private val requestCode=7402
  private fun foreground(a: Activity?)=a is LifecycleOwner && a.lifecycle.currentState==Lifecycle.State.RESUMED
  private fun result(status: String)=mapOf("status" to status)
  private fun payload(text: String): ByteArray {
    val bytes=text.toByteArray(Charsets.UTF_8)
    require(bytes.size<=1024*1024)
    val json=JSONObject(text)
    require(json.optString("schema")=="oryn-milestone-0-device-evidence/v1" && json.optJSONArray("entries")!=null)
    return bytes
  }
  override fun definition()=ModuleDefinition {
    Name("OrynEvidenceExport")
    AsyncFunction("copyEvidence") { text: String ->
      try {
        require(foreground(appContext.currentActivity))
        payload(text)
        val c=requireNotNull(appContext.reactContext)
        val clipboard=c.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
        val label=if(c.resources.configuration.locales[0].language=="ar") "أدلة ORYN بصيغة JSON" else "ORYN evidence JSON"
        clipboard.setPrimaryClip(ClipData.newPlainText(label,text))
        result("copied")
      } catch (_: Exception) { result("error") }
    }.runOnQueue(Queues.MAIN)
    AsyncFunction("saveEvidence") { text: String,promise: Promise ->
      try {
        val activity=appContext.currentActivity
        require(activity!=null && foreground(activity))
        if(pending!=null || writing) { promise.resolve(result("busy"));return@AsyncFunction }
        val bytes=payload(text)
        pending=SaveRequest(bytes,promise)
        val intent=Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE)
          .setType("application/json").putExtra(Intent.EXTRA_TITLE,"oryn-evidence-${System.currentTimeMillis()}.json")
          .addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION)
        @Suppress("DEPRECATION")
        activity.startActivityForResult(intent,requestCode)
      } catch (_: Exception) {
        if(pending?.promise===promise) pending=null
        promise.resolve(result("error"))
      }
    }.runOnQueue(Queues.MAIN)
    OnActivityResult { _,response ->
      if(response.requestCode==requestCode) {
        val request=pending
        if(request!=null) {
          pending=null
          val uri=response.data?.data
          if(response.resultCode==Activity.RESULT_CANCELED) request.promise.resolve(result("cancelled"))
          else if(response.resultCode!=Activity.RESULT_OK) request.promise.resolve(result("error"))
          else if(uri==null || uri.scheme!="content") request.promise.resolve(result("error"))
          else {
            val resolver=appContext.reactContext?.contentResolver
            if(resolver==null) request.promise.resolve(result("error"))
            else {
              writing=true
              try {
                Thread({
                  val status=try {
                    val stream=requireNotNull(resolver.openOutputStream(uri,"wt"))
                    stream.use { it.write(request.bytes);it.flush() }
                    "saved"
                  } catch (_: Exception) { "error" }
                  Handler(Looper.getMainLooper()).post {
                    writing=false
                    request.promise.resolve(result(status))
                  }
                },"oryn-evidence-save").apply { isDaemon=true;start() }
              } catch (_: Exception) {
                writing=false
                request.promise.resolve(result("error"))
              }
            }
          }
        }
      }
    }
    OnActivityDestroys {
      // A picker interrupted by activity destruction must not save silently later.
      pending?.promise?.resolve(result("cancelled"))
      pending=null
    }
  }
}
