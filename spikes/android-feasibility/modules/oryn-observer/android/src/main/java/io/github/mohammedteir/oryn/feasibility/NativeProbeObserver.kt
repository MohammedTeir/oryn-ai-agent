package io.github.mohammedteir.oryn.feasibility

import java.io.ByteArrayOutputStream
import java.io.InputStream
import java.util.concurrent.TimeUnit

internal data class ProbeCapture(
  val text: String?, val complete: Boolean, val truncated: Boolean, val errorClass: String?
)
internal data class NativeProbeResult(
  val exitCode: Int?, val timeoutTerminationRequested: Boolean,
  val stdout: ProbeCapture?, val stderr: ProbeCapture?, val supervisionErrorClass: String?
)

/** Only the fixed, tiny-output ORYN C probes use this observer; not a general shell runner. */
internal object NativeProbeObserver {
  // Persist the authorized request before termination can wake the result worker.
  // A recorded request is not proof that termination succeeded.
  fun requestCancellation(process: Process,recordRequest: ()->Unit) {
    recordRequest()
    process.destroyForcibly()
  }

  fun observe(process: Process, timeoutMs: Long): NativeProbeResult {
    var timedOut=false
    var error: String?=null
    try {
      timedOut=!process.waitFor(timeoutMs,TimeUnit.MILLISECONDS)
      if(timedOut) {
        process.destroyForcibly()
        process.waitFor(3,TimeUnit.SECONDS)
      }
    } catch(e: Exception) { error=e.javaClass.simpleName }
    // A failed wait/kill/output read must never replace or invent an exit observation.
    val exit=try { process.exitValue() } catch(e: Exception) {
      if(error==null && e !is IllegalThreadStateException) error=e.javaClass.simpleName
      null
    }
    if(exit==null) return NativeProbeResult(null,timedOut,null,null,error)
    return NativeProbeResult(exit,timedOut,capture { process.inputStream },capture { process.errorStream },error)
  }

  private fun capture(open: ()->InputStream): ProbeCapture {
    val bytes=ByteArrayOutputStream()
    var truncated=false
    var error: String?=null
    try {
      open().use { stream ->
        val buffer=ByteArray(1024)
        while(true) {
          val n=stream.read(buffer)
          if(n<0) break
          val retained=minOf(n,8192-bytes.size())
          bytes.write(buffer,0,retained)
          if(retained<n) truncated=true
        }
      }
    } catch(e: Exception) { error=e.javaClass.simpleName }
    val text=if(error!=null && bytes.size()==0) null else bytes.toString("UTF-8")
    return ProbeCapture(text,error==null && !truncated,truncated,error)
  }
}

/** Pure recovery rule: only a proven later boot can retire a local fixed probe. */
internal object NativeProbeRecovery {
  private val probes=setOf("native_echo","native_timeout","native_cancel")
  fun canReconcile(backend: String,probe: String,previousBoot: Int?,currentBoot: Int?,pendingId: String,recordedId: String): Boolean =
    pendingId.isNotEmpty() && pendingId==recordedId &&
    backend=="apk_native_probe" && probe in probes && previousBoot!=null && previousBoot>=0 &&
      currentBoot!=null && currentBoot>previousBoot
}
