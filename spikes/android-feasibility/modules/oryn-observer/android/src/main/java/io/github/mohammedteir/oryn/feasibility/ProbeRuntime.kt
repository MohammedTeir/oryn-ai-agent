package io.github.mohammedteir.oryn.feasibility

import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.provider.Settings
import org.json.JSONObject
import java.io.File
import java.security.MessageDigest
import java.util.UUID
import java.util.concurrent.Executors

internal object ProbeCatalog {
  fun action(context: Context, id: String): ExactProbe {
    val environment = "Termux inherited environment (not independently observed)"
    return when (id) {
      "termux_echo" -> ExactProbe(id,"external_termux","/data/data/com.termux/files/usr/bin/sh",
        "printf 'ORYN termux stdout\\n'; printf 'ORYN termux stderr\\n' >&2; exit 7",
        "/data/data/com.termux/files/home",environment,"installed Termux provider; executable digest unknown",10_000,
        "Run the displayed fixed shell builtins. No requested network, root or file writes. External cancellation is unsupported; missing results remain Unknown.")
      "termux_delay" -> ExactProbe(id,"external_termux","/data/data/com.termux/files/usr/bin/sh",
        "printf 'ORYN termux started\\n'; sleep 8; printf 'ORYN termux finished\\n'",
        "/data/data/com.termux/files/home",environment,"installed Termux provider; executable digest unknown",12_000,
        "Run the displayed shell and eight-second sleep. No requested network, root or file writes. Existing work may finish in background; no follow-up command is scheduled. External cancellation is unsupported.")
      "native_echo", "native_timeout", "native_cancel" -> ExactProbe(id,"apk_native_probe",
        File(context.applicationInfo.nativeLibraryDir,"liboryn_feasibility_probe.so").absolutePath,
        if(id=="native_echo") "normal" else "delay",context.filesDir.absolutePath,
        "empty environment",GeneratedProbeDigest.SHA256,if(id=="native_timeout") 2_000 else 15_000,
        "Run ORYN's APK-packaged test executable only. It prints stdout/stderr and exits, or sleeps eight seconds. No shell, child processes, root, network or file writes. Timeout may terminate this exact process. This is not a Termux shell/package manager.")
      else -> throw GrantDenied()
    }
  }
  fun verifyNativeFile(action: ExactProbe) {
    if(action.backend!="apk_native_probe") return
    val file=File(action.executable)
    if(!file.isFile || !file.canExecute() || file.canWrite()) throw GrantDenied()
    val digest=file.inputStream().use { stream ->
      val sha=MessageDigest.getInstance("SHA-256");val buffer=ByteArray(8192)
      while(true) { val n=stream.read(buffer);if(n<0) break;sha.update(buffer,0,n) }
      sha.digest().joinToString("") { "%02x".format(it) }
    }
    if(digest!=GeneratedProbeDigest.SHA256 || digest!=action.binaryIdentity) throw GrantDenied()
  }
}

/** Only bounded, redacted output is retained locally. No Gemini key is read by this spike. */
internal object ProbeOutput {
  fun clean(text: String): String = text
    .replace(Regex("AIza[0-9A-Za-z_-]{20,}|sk-[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9]{20,}"),"[redacted]")
    .replace(Regex("(?i)(api[_-]?key|authorization|password|token)\\s*[:=][^\\r\\n]*"),"[redacted]")
    .take(4096)
}

internal object AndroidBootObservation {
  fun count(c: Context): Int? = try {
    Settings.Global.getInt(c.contentResolver,Settings.Global.BOOT_COUNT).takeIf { it>=0 }
  } catch (_: Exception) { null }
}

internal object ProbeStore {
  private fun prefs(c: Context)=c.getSharedPreferences("oryn-native-spike",Context.MODE_PRIVATE)
  @Synchronized fun pending(c: Context): String?=prefs(c).getString("pending",null)
  @Synchronized fun state(c: Context): JSONObject = JSONObject(prefs(c).getString("state","{\"state\":\"not_started\"}")!!)
  @Synchronized fun lastRecovery(c: Context): JSONObject? = prefs(c).getString("lastRecovery",null)?.let { JSONObject(it) }
  @Synchronized fun begin(c: Context,id: String,action: ExactProbe) {
    if(pending(c)!=null) throw GrantDenied()
    val state=JSONObject().put("state","dispatching").put("executionId",id)
      .put("probe",action.id).put("backend",action.backend).put("dispatchedAtEpochMs",System.currentTimeMillis())
      .put("externalCancellation","not_supported").put("timeoutMs",action.timeoutMs)
    if(action.backend=="apk_native_probe") AndroidBootObservation.count(c)?.let { state.put("nativeBootCount",it) }
    if(!prefs(c).edit().putString("pending",id).putString("state",state.toString()).commit()) throw GrantDenied()
  }
  @Synchronized fun recoverPending(c: Context,currentBoot: Int?): String? {
    val id=pending(c) ?: return null
    val value=state(c)
    if(value.optString("executionId")!=id) {
      value.put("state","unknown_recovery_record_mismatch").put("processTerminationVerified",false)
        .put("recoveryRequirement","record_identity_mismatch_keep_blocked")
      check(prefs(c).edit().putString("state",value.toString()).commit())
      return id
    }
    val backend=value.optString("backend")
    val probe=value.optString("probe")
    val previousBoot=value.optInt("nativeBootCount",-1).takeIf { it>=0 }
    if(!value.has("stateBeforeRecovery")) value.put("stateBeforeRecovery",value.optString("state"))
    if(NativeProbeRecovery.canReconcile(backend,probe,previousBoot,currentBoot,id,value.optString("executionId"))) {
      value.put("state","interrupted_by_device_restart").put("commandOutcome","unknown")
        .put("exitCode",JSONObject.NULL).put("processTerminationVerified",true)
        .put("reconciliationEvidence","android_boot_count_advanced").put("recoveredBootCount",currentBoot)
        .put("resultObservedAtEpochMs",System.currentTimeMillis()).put("newAuthorizationRequired",true)
      check(prefs(c).edit().remove("pending").putString("state",value.toString())
        .putString("lastRecovery",value.toString()).commit())
      return null
    }
    value.put("state","unknown_recovered_pending").put("processTerminationVerified",false)
    if(backend=="apk_native_probe" && probe in setOf("native_echo","native_timeout","native_cancel")) {
      // Legacy records have no boot stamp. Establish a baseline now, never infer
      // an earlier restart from wall-clock time, app relaunch or an APK update.
      if(previousBoot==null && currentBoot!=null) value.put("nativeBootCount",currentBoot)
      value.put("recoveryRequirement",if(currentBoot!=null) "device_restart_then_reopen" else "boot_observation_unavailable_keep_blocked")
    } else value.put("recoveryRequirement","matching_provider_result_required")
    check(prefs(c).edit().putString("state",value.toString()).commit())
    return id
  }
  @Synchronized fun update(c: Context,id: String,modify: (JSONObject)->Unit) {
    if(pending(c)!=id) return
    val value=state(c);modify(value)
    check(prefs(c).edit().putString("state",value.toString()).commit())
  }
  @Synchronized fun finish(c: Context,id: String,modify: (JSONObject)->Unit): Boolean {
    if(pending(c)!=id) return false
    val value=state(c);modify(value);value.put("resultObservedAtEpochMs",System.currentTimeMillis())
    check(prefs(c).edit().remove("pending").putString("state",value.toString()).commit())
    return true
  }
}

internal object ProbeRuntime {
  @Volatile private var instance: StrictGate?=null
  private val worker=Executors.newSingleThreadExecutor()
  @Volatile private var nativeProcess: Process?=null
  @Volatile private var nativeId: String?=null
  @Synchronized fun gate(c: Context): StrictGate = instance ?: run {
    val recovered=ProbeStore.recoverPending(c,AndroidBootObservation.count(c))
    StrictGate({ SystemClock.elapsedRealtime() },{ UUID.randomUUID().toString() },recovered).also { instance=it }
  }
  // Do not hold the runtime monitor while acquiring the gate: dispatch may finish
  // synchronously while holding the gate and then need the runtime accessor.
  fun state(c: Context): String {
    val currentGate=gate(c)
    return ProbeStore.state(c).put("executionBusy",currentGate.busy())
      .put("nativeBinaryIsTermuxRuntime",false)
      .put("lastRecovery",ProbeStore.lastRecovery(c) ?: JSONObject.NULL).toString()
  }

  // Called only inside StrictGate.dispatch's validated synchronous sink on the UI thread.
  fun start(c: Context,id: String,action: ExactProbe) {
    if(action.backend !in setOf("external_termux","apk_native_probe")) throw GrantDenied()
    ProbeStore.begin(c,id,action)
    if(action.backend=="external_termux") startTermux(c,id,action) else startNative(c,id,action)
  }
  private fun finish(c: Context,id: String,modify: (JSONObject)->Unit) {
    if(ProbeStore.finish(c,id,modify)) gate(c).complete(id)
  }
  private fun startTermux(c: Context,id: String,a: ExactProbe) {
    val intent=Intent(c,ProbeResultReceiver::class.java).setAction(c.packageName+".PROBE_RESULT."+id)
    val mutable=if(Build.VERSION.SDK_INT>=31) PendingIntent.FLAG_MUTABLE else 0
    val callback=PendingIntent.getBroadcast(c,0,intent,PendingIntent.FLAG_ONE_SHOT or mutable)
    val command=Intent("com.termux.RUN_COMMAND").setComponent(ComponentName("com.termux","com.termux.app.RunCommandService"))
      .putExtra("com.termux.RUN_COMMAND_PATH",a.executable)
      .putExtra("com.termux.RUN_COMMAND_ARGUMENTS",arrayOf("-c",a.argument))
      .putExtra("com.termux.RUN_COMMAND_WORKDIR",a.directory)
      .putExtra("com.termux.RUN_COMMAND_BACKGROUND",true)
      .putExtra("com.termux.RUN_COMMAND_PENDING_INTENT",callback)
    try {
      if(c.startService(command)==null) {
        callback.cancel();finish(c,id) { it.put("state","service_not_found") };return
      }
      ProbeStore.update(c,id) { it.put("state","awaiting_result") }
      Handler(Looper.getMainLooper()).postDelayed({
        ProbeStore.update(c,id) { it.put("state","unknown_timeout").put("processTerminationVerified",false) }
      },a.timeoutMs)
    } catch (_: SecurityException) {
      callback.cancel();finish(c,id) { it.put("state","permission_denied") }
    } catch (_: Exception) {
      // A transport exception cannot establish that the remote service did nothing.
      ProbeStore.update(c,id) { it.put("state","unknown_dispatch").put("processTerminationVerified",false) }
    }
  }
  private fun startNative(c: Context,id: String,a: ExactProbe) {
    var started: Process?=null
    try {
      ProbeCatalog.verifyNativeFile(a)
      val builder=ProcessBuilder(a.executable,a.argument).directory(File(a.directory))
      builder.environment().clear()
      val start=SystemClock.elapsedRealtime()
      val process=builder.start() // Immediate dispatch, never deferred until after backgrounding.
      started=process
      nativeProcess=process;nativeId=id
      ProbeStore.update(c,id) { it.put("state","running").put("nativeCancellation","this_process_only") }
      worker.execute {
        try {
          val observed=NativeProbeObserver.observe(process,a.timeoutMs)
          if(observed.exitCode==null) {
            ProbeStore.update(c,id) {
              it.put("state","unknown_termination").put("processTerminationVerified",false)
                .put("timeoutTerminationRequested",observed.timeoutTerminationRequested)
                .put("supervisionErrorClass",observed.supervisionErrorClass ?: JSONObject.NULL)
            }
          } else {
            finish(c,id) {
              it.put("state","exited").put("exitCode",observed.exitCode)
                .put("timeoutTerminationRequested",observed.timeoutTerminationRequested)
                .put("processTerminationVerified",true)
                .put("supervisionErrorClass",observed.supervisionErrorClass ?: JSONObject.NULL)
                .put("elapsedSinceStartMs",SystemClock.elapsedRealtime()-start)
              for((name,capture) in listOf("stdout" to observed.stdout,"stderr" to observed.stderr)) {
                val raw=capture?.text
                it.put(name,raw?.let { text -> ProbeOutput.clean(text) } ?: JSONObject.NULL)
                  .put(name+"CaptureComplete",capture?.complete==true && (raw?.length ?: 0)<=4096)
                  .put(name+"CaptureTruncated",capture?.truncated==true || (raw?.length ?: 0)>4096)
                  .put(name+"ErrorClass",capture?.errorClass ?: JSONObject.NULL)
              }
              it.put("outputRedacted",listOf(observed.stdout,observed.stderr).any { capture ->
                capture?.text?.let { text -> ProbeOutput.clean(text)!=text } == true
              }).put("expectedProbeMatched",a.id=="native_echo" && observed.exitCode==7 &&
                observed.stdout?.complete==true && observed.stderr?.complete==true &&
                observed.stdout.text=="ORYN native stdout\n" && observed.stderr.text=="ORYN native stderr\n")
            }
          }
        } catch (_: Exception) {
          ProbeStore.update(c,id) { it.put("state","unknown_native_result") }
        } finally { if(nativeId==id) { nativeProcess=null;nativeId=null } }
      }
    } catch (e: Exception) {
      if(started==null) {
        finish(c,id) { it.put("state","native_start_rejected").put("exceptionClass",e.javaClass.simpleName) }
      } else {
        ProbeStore.update(c,id) { it.put("state","unknown_native_start").put("exceptionClass",e.javaClass.simpleName) }
      }
    }
  }
  fun cancellation(c: Context): ExactProbe? {
    val id=nativeId ?: return null
    if(nativeProcess==null || ProbeStore.pending(c)!=id) return null
    return ExactProbe("cancel_native","native_control","Process.destroyForcibly",id,"current probe",
      "no environment","current native Process handle",0,"Request termination of only this ORYN probe process. Final exit status remains an observed result.",controlOf=id)
  }
  fun cancelNative(c: Context,a: ExactProbe) {
    if(nativeId!=a.controlOf || ProbeStore.pending(c)!=a.controlOf) throw GrantDenied()
    val process=nativeProcess ?: throw GrantDenied()
    process.destroyForcibly()
    ProbeStore.update(c,a.controlOf) { it.put("cancellationRequested",true) }
  }
  fun receive(c: Context,id: String,intent: Intent) {
    if(ProbeStore.pending(c)!=id) return
    val result=intent.getBundleExtra("result")
    val providerFailure=result!=null && result.containsKey("err") && result.getInt("err")!=-1
    if(result==null || (!result.containsKey("exitCode") && !providerFailure)) {
      ProbeStore.update(c,id) { it.put("state","unknown_callback_payload") };return
    }
    val stdout=result.getString("stdout");val stderr=result.getString("stderr")
    finish(c,id) {
      val elapsed=System.currentTimeMillis()-it.getLong("dispatchedAtEpochMs")
      val hasExit=result.containsKey("exitCode")
      it.put("state",if(providerFailure) "provider_rejected" else "exited")
        .put("exitCode",if(hasExit) result.getInt("exitCode") else JSONObject.NULL)
        .put("providerError",if(result.containsKey("err")) result.getInt("err") else JSONObject.NULL)
        .put("stdout",stdout?.let { value -> ProbeOutput.clean(value) } ?: JSONObject.NULL)
        .put("stderr",stderr?.let { value -> ProbeOutput.clean(value) } ?: JSONObject.NULL)
        .put("outputRedacted",stdout?.let { value -> ProbeOutput.clean(value)!=value } == true || stderr?.let { value -> ProbeOutput.clean(value)!=value } == true)
        .put("stdoutOriginalLength",result.get("stdout_original_length") ?: JSONObject.NULL)
        .put("stderrOriginalLength",result.get("stderr_original_length") ?: JSONObject.NULL)
        .put("elapsedSinceDispatchMs",elapsed).put("processStartTime","not_reported_by_provider")
        .put("resultAfterTimeout",elapsed>it.getLong("timeoutMs"))
        .put("expectedProbeMatched",!providerFailure && it.optString("probe")=="termux_echo" && hasExit && result.getInt("exitCode")==7 && stdout=="ORYN termux stdout\n" && stderr=="ORYN termux stderr\n")
    }
  }
}

class ProbeResultReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context,intent: Intent) {
    val prefix=context.packageName+".PROBE_RESULT."
    val action=intent.action ?: return
    if(!action.startsWith(prefix)) return
    try { ProbeRuntime.receive(context,action.removePrefix(prefix),intent) } catch (_: Exception) {
      // Malformed/untrusted callbacks cannot create grants, dispatch or report success.
    }
  }
}
