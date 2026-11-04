package io.github.mohammedteir.oryn.feasibility

import org.junit.Assert.*
import org.junit.Test
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.io.IOException
import java.io.InputStream
import java.util.concurrent.TimeUnit

class NativeProbeObserverTest {
  private open class FakeProcess(
    private val timeout: Boolean=false,
    private val survivesKill: Boolean=false,
    private val brokenOutput: Boolean=false,
    private val interruptWait: Boolean=false
  ): Process() {
    var ended=false
    var killed=false
    override fun waitFor(timeout: Long,unit: TimeUnit): Boolean {
      if(interruptWait) throw InterruptedException()
      if(!this.timeout || (killed && !survivesKill)) ended=true
      return ended
    }
    override fun waitFor(): Int { ended=true;return 7 }
    override fun exitValue(): Int { if(!ended) throw IllegalThreadStateException();return if(killed) 137 else 7 }
    override fun destroy() { killed=true;if(!survivesKill) ended=true }
    override fun destroyForcibly(): Process { destroy();return this }
    override fun getInputStream(): InputStream {
      if(brokenOutput) return object: InputStream() { override fun read(): Int { throw IOException("Stream closed") } }
      return ByteArrayInputStream("observed stdout\n".toByteArray())
    }
    override fun getErrorStream()=ByteArrayInputStream("observed stderr\n".toByteArray())
    override fun getOutputStream()=ByteArrayOutputStream()
  }
  @Test fun ordinaryExitRetainsActualOutputAndExit() {
    val r=NativeProbeObserver.observe(FakeProcess(),100)
    assertEquals(7,r.exitCode);assertFalse(r.timeoutTerminationRequested)
    assertEquals("observed stdout\n",r.stdout!!.text);assertTrue(r.stdout.complete)
    assertEquals("observed stderr\n",r.stderr!!.text)
  }
  @Test fun closedPipeAfterTimeoutCannotLoseConfirmedExit() {
    val p=FakeProcess(timeout=true,brokenOutput=true)
    val r=NativeProbeObserver.observe(p,100)
    assertTrue(p.killed);assertTrue(r.timeoutTerminationRequested);assertEquals(137,r.exitCode)
    assertNull(r.stdout!!.text);assertFalse(r.stdout.complete);assertEquals("IOException",r.stdout.errorClass)
    assertEquals("observed stderr\n",r.stderr!!.text)
  }
  @Test fun closedPipeWithoutTimeoutStillRetainsExit() {
    val r=NativeProbeObserver.observe(FakeProcess(brokenOutput=true),100)
    assertEquals(7,r.exitCode);assertFalse(r.timeoutTerminationRequested);assertNull(r.stdout!!.text)
  }
  @Test fun unconfirmedTerminationCannotReportExitOrReadOutput() {
    val r=NativeProbeObserver.observe(FakeProcess(timeout=true,survivesKill=true),100)
    assertNull(r.exitCode);assertNull(r.stdout);assertNull(r.stderr)
  }
  @Test fun interruptedWaitCannotInventTermination() {
    val r=NativeProbeObserver.observe(FakeProcess(interruptWait=true),100)
    assertNull(r.exitCode);assertEquals("InterruptedException",r.supervisionErrorClass)
  }
  @Test fun outputRetentionIsBoundedAndTruncationIsExplicit() {
    val p=object: FakeProcess() {
      override fun getInputStream()=ByteArrayInputStream(ByteArray(10_000) { 65 })
    }
    val r=NativeProbeObserver.observe(p,100)
    assertEquals(7,r.exitCode);assertEquals(8192,r.stdout!!.text!!.length)
    assertTrue(r.stdout.truncated);assertFalse(r.stdout.complete)
  }
  @Test fun failedTerminationRequestNeverReportsTermination() {
    val p=object: FakeProcess(timeout=true,survivesKill=true) {
      override fun destroyForcibly(): Process { throw SecurityException() }
    }
    val r=NativeProbeObserver.observe(p,100)
    assertTrue(r.timeoutTerminationRequested);assertNull(r.exitCode)
    assertEquals("SecurityException",r.supervisionErrorClass)
  }
  @Test fun cancellationRequestIsRecordedBeforeSynchronousExit() {
    var recorded=false
    val p=object: FakeProcess() {
      override fun destroyForcibly(): Process {
        assertTrue(recorded)
        return super.destroyForcibly()
      }
    }
    NativeProbeObserver.requestCancellation(p) { recorded=true }
    assertTrue(p.killed);assertEquals(137,p.exitValue())
  }
  @Test fun failedRequestPersistenceDoesNotInvokeCancellation() {
    val p=FakeProcess()
    try {
      NativeProbeObserver.requestCancellation(p) { throw IllegalStateException("fixture persistence failure") }
      fail("Expected persistence refusal")
    } catch (_: IllegalStateException) {}
    assertFalse(p.killed)
  }
  @Test fun recoveryCannotReconcileAnUnrelatedOrMissingExecutionId() {
    assertFalse(NativeProbeRecovery.canReconcile("apk_native_probe","native_timeout",10,11,"one","other"))
    assertFalse(NativeProbeRecovery.canReconcile("apk_native_probe","native_timeout",10,11,"",""))
  }
  @Test fun recoveryRequiresLaterKnownBootForExactLocalCatalogOnly() {
    assertTrue(NativeProbeRecovery.canReconcile("apk_native_probe","native_timeout",10,11,"run","run"))
    assertFalse(NativeProbeRecovery.canReconcile("apk_native_probe","native_timeout",10,10,"run","run"))
    assertFalse(NativeProbeRecovery.canReconcile("apk_native_probe","native_timeout",10,9,"run","run"))
    assertFalse(NativeProbeRecovery.canReconcile("apk_native_probe","native_timeout",null,11,"run","run"))
    assertFalse(NativeProbeRecovery.canReconcile("apk_native_probe","native_timeout",10,null,"run","run"))
    assertFalse(NativeProbeRecovery.canReconcile("apk_native_probe","native_timeout",-1,11,"run","run"))
    assertFalse(NativeProbeRecovery.canReconcile("external_termux","termux_delay",10,11,"run","run"))
    assertFalse(NativeProbeRecovery.canReconcile("apk_native_probe","unclassified",10,11,"run","run"))
  }
}
