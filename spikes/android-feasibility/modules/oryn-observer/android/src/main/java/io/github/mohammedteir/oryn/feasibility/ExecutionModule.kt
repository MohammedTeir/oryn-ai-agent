package io.github.mohammedteir.oryn.feasibility

import android.app.Activity
import android.app.AlertDialog
import android.content.Context
import android.view.ContextThemeWrapper
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleOwner
import expo.modules.kotlin.Promise
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import org.json.JSONObject
import java.util.UUID
import java.util.concurrent.atomic.AtomicBoolean

private object NativeProbeText {
  private val en=mapOf(
    "title" to "Strict native approval — feasibility probe",
    "approve" to "Approve this exact probe", "reject" to "Reject",
    "details" to "Exact command / argument, directory, environment, binary identity, timeout and effects:",
    "risk" to "Fixed non-root probe. No Batch or Session authorization. Changed or repeated actions need new native approval. Bounded status/output is saved in this app's private preferences.",
    "termux_echo" to "Print fixed stdout/stderr and return 7 in external Termux. No requested root, network or command file writes. The provider environment is unverified. Remote cancellation is unsupported.",
    "termux_delay" to "Print messages and sleep eight seconds in external Termux. Existing work may finish in background. No requested root, network or command file writes. Remote cancellation is unsupported.",
    "termux_recovery" to "Print messages and sleep 45 seconds in external Termux so the caller can be force-stopped and reopened before result delivery. No requested root, network or command file writes. External cancellation is unsupported.",
    "native_echo" to "Run only the verified APK-packaged test binary, print stdout/stderr and return 7. No shell, children, root, network or command file writes. This is not a Termux runtime.",
    "native_timeout" to "Run the verified native binary with an eight-second wait; request termination after two seconds. No shell, children, root, network or command file writes.",
    "native_cancel" to "Run the verified native binary with an eight-second wait. A separate native approval can stop only this process. No shell, children, root, network or command file writes.",
    "cancel_native" to "Request termination of this exact ORYN probe process. This cannot cancel external Termux processes."
  )
  private val ar=mapOf(
    "title" to "موافقة أصلية صارمة — اختبار الجدوى",
    "approve" to "الموافقة على هذا الاختبار المحدد", "reject" to "رفض",
    "details" to "الأمر والمعامل والمجلد والبيئة وهوية الملف والمهلة والتأثيرات:",
    "risk" to "اختبار محدد دون صلاحيات الجذر. لا يوجد تفويض دفعة أو جلسة. كل تغيير أو إعادة يتطلب موافقة أصلية جديدة. تُحفظ حالة ونتائج محدودة في تفضيلات التطبيق الخاصة.",
    "termux_echo" to "طباعة خرج ثابت وإرجاع 7 في Termux الخارجي. لا يُطلب جذر أو شبكة أو كتابة ملفات بالأمر. بيئة المصدر غير متحقق منها. الإلغاء الخارجي غير مدعوم.",
    "termux_delay" to "طباعة رسائل والانتظار ثماني ثوانٍ في Termux الخارجي. قد ينتهي العمل في الخلفية. لا يُطلب جذر أو شبكة أو كتابة ملفات بالأمر. الإلغاء الخارجي غير مدعوم.",
    "termux_recovery" to "طباعة رسائل والانتظار 45 ثانية في Termux الخارجي لإيقاف تطبيق ORYN وإعادة فتحه قبل وصول النتيجة. لا يُطلب جذر أو شبكة أو كتابة ملفات بالأمر. الإلغاء الخارجي غير مدعوم.",
    "native_echo" to "تشغيل ملف الاختبار المتحقق منه داخل APK لطباعة الخرج وإرجاع 7. دون صدفة أو عمليات فرعية أو جذر أو شبكة أو كتابة ملفات بالأمر. ليس بيئة Termux.",
    "native_timeout" to "تشغيل الملف الأصلي المتحقق منه مع انتظار ثماني ثوانٍ وطلب إنهائه بعد ثانيتين. دون صدفة أو عمليات فرعية أو جذر أو شبكة أو كتابة ملفات بالأمر.",
    "native_cancel" to "تشغيل الملف الأصلي المتحقق منه مع انتظار ثماني ثوانٍ. موافقة أصلية منفصلة توقف هذه العملية وحدها. دون صدفة أو عمليات فرعية أو جذر أو شبكة أو كتابة ملفات بالأمر.",
    "cancel_native" to "طلب إنهاء عملية ORYN المحددة. لا يلغي هذا عمليات Termux الخارجية."
  )
  fun get(c: Context,key: String)=(if(c.resources.configuration.locales[0].language=="ar") ar else en).getValue(key)
}

/** The only execution entry point opens an Android-owned confirmation for a fixed catalog item. */
class ExecutionModule : Module() {
  private var dialog: AlertDialog?=null
  private var pendingResolution: ((String)->Unit)?=null
  private fun context()=requireNotNull(appContext.reactContext)
  private fun foreground(a: Activity?) = a is LifecycleOwner && a.lifecycle.currentState==Lifecycle.State.RESUMED
  private fun result(code: String)=JSONObject().put("requestState",code).toString()

  override fun definition()=ModuleDefinition {
    Name("OrynExecutionSpike")
    AsyncFunction("getState") { ProbeRuntime.state(context()) }
    AsyncFunction("requestProbe") { id: String,promise: Promise ->
      try {
        val c=context();val activity=appContext.currentActivity
        if(!foreground(activity) || activity==null) { promise.resolve(result("blocked_background"));return@AsyncFunction }
        if(dialog!=null || ProbeRuntime.gate(c).busy() || ProbeStore.pending(c)!=null) {
          promise.resolve(result("blocked_review_or_execution_pending"));return@AsyncFunction
        }
        val action=ProbeCatalog.action(c,id)
        if(action.backend=="external_termux") {
          try {
            TermuxPreflight.requireForReview({TermuxPlatform.installed(c)},{TermuxPlatform.permissionGranted(c)})
          } catch (_: TermuxNotInstalled) {
            promise.resolve(result("termux_not_detected"));return@AsyncFunction
          } catch (_: TermuxPermissionRequired) {
            activity.requestPermissions(arrayOf("com.termux.permission.RUN_COMMAND"),7401)
            promise.resolve(result("android_permission_requested_no_command_dispatched"));return@AsyncFunction
          }
        } else ProbeCatalog.verifyNativeFile(action)
        review(activity,action,promise) { token,executionId ->
          ProbeRuntime.gate(c).dispatch(action,token,executionId,foreground(appContext.currentActivity)) {
            ProbeRuntime.start(c,executionId,action)
          }
        }
      } catch (_: Exception) { promise.resolve(result("blocked_native_validation")) }
    }.runOnQueue(Queues.MAIN)
    AsyncFunction("requestCancel") { promise: Promise ->
      try {
        val activity=appContext.currentActivity
        if(activity==null || !foreground(activity) || dialog!=null) {
          promise.resolve(result("blocked_background_or_review"));return@AsyncFunction
        }
        val c=context();val action=ProbeRuntime.cancellation(c)
        if(action==null) { promise.resolve(result("no_cancellable_native_process_external_cancellation_unsupported"));return@AsyncFunction }
        review(activity,action,promise) { token,id ->
          ProbeRuntime.gate(c).dispatch(action,token,id,foreground(appContext.currentActivity)) { ProbeRuntime.cancelNative(c,action) }
        }
      } catch (_: Exception) { promise.resolve(result("blocked_native_validation")) }
    }.runOnQueue(Queues.MAIN)
    AsyncFunction("negativeProbe") { token: String? ->
      val c=context();var entered=false;var rejected=false
      try {
        // Pure denial sink: even a failed denial test cannot launch a process.
        ProbeRuntime.gate(c).dispatch(ProbeCatalog.action(c,"termux_echo"),token,"negative-test",foreground(appContext.currentActivity)) { entered=true }
      } catch (_: GrantDenied) { rejected=true }
      JSONObject().put("test","missing_or_forged_native_grant").put("rejected",rejected)
        .put("dispatchSinkEntered",entered).put("backendExecutionAttempted",false).toString()
    }.runOnQueue(Queues.MAIN)
    OnActivityEntersBackground {
      appContext.reactContext?.let { ProbeRuntime.gate(it).revokeUnconsumed() }
      pendingResolution?.invoke(result("review_revoked_on_background"))
      dialog?.dismiss();dialog=null
    }
    OnActivityDestroys {
      appContext.reactContext?.let { ProbeRuntime.gate(it).revokeUnconsumed() }
      pendingResolution?.invoke(result("review_revoked_on_activity_destroy"))
      dialog?.dismiss();dialog=null
    }
  }

  private fun review(a: Activity,action: ExactProbe,promise: Promise,dispatch: (String,String)->Unit) {
    val c=context();val once=AtomicBoolean(false)
    val resolve: (String)->Unit={ value -> if(once.compareAndSet(false,true)) promise.resolve(value) }
    pendingResolution=resolve
    val description=listOf(action.backend,action.executable,action.argument,action.directory,action.environment,
      action.binaryIdentity,"${action.timeoutMs} ms",action.effects).joinToString("\n") { "\u2066$it\u2069" }
    val alert=AlertDialog.Builder(ContextThemeWrapper(a,android.R.style.Theme_Material_Light_Dialog_Alert))
      .setTitle(NativeProbeText.get(c,"title"))
      .setMessage(NativeProbeText.get(c,"risk")+"\n\n"+NativeProbeText.get(c,action.id)+"\n\n"+NativeProbeText.get(c,"details")+"\n\n"+description)
      .setNegativeButton(NativeProbeText.get(c,"reject")) { _,_ -> resolve(result("rejected_no_dispatch")) }
      .setPositiveButton(NativeProbeText.get(c,"approve")) { _,_ ->
        try {
          if(!foreground(appContext.currentActivity)) throw GrantDenied()
          val token=ProbeRuntime.gate(c).issueAfterNativeConfirmation(action)
          dispatch(token,UUID.randomUUID().toString())
          resolve(ProbeRuntime.state(c))
        } catch (_: Exception) { resolve(result("blocked_native_dispatch")) }
      }.create()
    alert.setOnDismissListener {
      resolve(result("review_dismissed_no_dispatch"))
      if(dialog===alert) { dialog=null;pendingResolution=null }
    }
    dialog=alert;alert.show()
  }
}
