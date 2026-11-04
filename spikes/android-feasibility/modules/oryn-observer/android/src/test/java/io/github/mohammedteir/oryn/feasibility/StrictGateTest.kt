package io.github.mohammedteir.oryn.feasibility

import org.junit.Assert.*
import org.junit.Test

class StrictGateTest {
  private var now = 100L
  private var sequence = 0
  private fun gate(uncertain: Boolean = false) = StrictGate({ now }, { "token-${++sequence}" }, if(uncertain) "recovered-id" else null)
  private val action = ExactProbe("echo", "external", "/verified/sh", "printf test", "/home", "default", "provider", 1000, "stdout only")
  private fun denied(block: () -> Unit) { try { block(); fail("Expected rejection") } catch (_: GrantDenied) {} }

  @Test fun missingTokenNeverEntersBackend() {
    var entered = false
    denied { gate().dispatch(action, null, "run", true) { entered = true } }
    assertFalse(entered)
  }
  @Test fun forgedTokenNeverEntersBackend() {
    var entered = false
    denied { gate().dispatch(action, "forged", "run", true) { entered = true } }
    assertFalse(entered)
  }
  @Test fun exactNativeApprovalDispatchesOnce() {
    val g = gate(); val token = g.issueAfterNativeConfirmation(action); var count = 0
    g.dispatch(action, token, "run", true) { count++ }
    g.complete("run")
    denied { g.dispatch(action, token, "replay", true) { count++ } }
    assertEquals(1, count)
  }
  @Test fun everyDescriptorMutationRejectsBeforeSideEffect() {
    val variants = listOf(
      action.copy(id="changed"), action.copy(backend="other"), action.copy(executable="other"),
      action.copy(argument="changed"), action.copy(directory="/other"), action.copy(environment="other"),
      action.copy(binaryIdentity="other"), action.copy(timeoutMs=2000), action.copy(effects="write"),
      action.copy(root=true), action.copy(controlOf="other")
    )
    for (changed in variants) {
      val g = gate(); val t = g.issueAfterNativeConfirmation(action); var entered = false
      denied { g.dispatch(changed, t, "run", true) { entered = true } }
      assertFalse(entered)
      denied { g.dispatch(action, t, "retry", true) { entered = true } }
    }
  }
  @Test fun expiryAtBoundaryRejects() {
    val g=gate();val t=g.issueAfterNativeConfirmation(action);now+=15_000
    denied { g.dispatch(action,t,"run",true) { fail("expired dispatch") } }
  }
  @Test fun backgroundRejectsAndBurnsGrant() {
    val g=gate();val t=g.issueAfterNativeConfirmation(action)
    denied { g.dispatch(action,t,"run",false) { fail("background dispatch") } }
    denied { g.dispatch(action,t,"run",true) { fail("replayed grant") } }
  }
  @Test fun revocationRejects() {
    val g=gate();val t=g.issueAfterNativeConfirmation(action);g.revokeUnconsumed()
    denied { g.dispatch(action,t,"run",true) { fail("revoked dispatch") } }
  }
  @Test fun restartCannotRestoreGrant() {
    val t=gate().issueAfterNativeConfirmation(action)
    denied { gate().dispatch(action,t,"run",true) { fail("restored grant") } }
  }
  @Test fun inFlightOperationBlocksAnotherApproval() {
    val g=gate();val t=g.issueAfterNativeConfirmation(action);g.dispatch(action,t,"one",true) {}
    denied { g.issueAfterNativeConfirmation(action) }
    g.complete("unrelated");assertTrue(g.busy())
    g.complete("one");assertFalse(g.busy())
  }
  @Test fun pendingRecoveryBlocksNewExecution() { denied { gate(true).issueAfterNativeConfirmation(action) } }
  @Test fun unrelatedCompletionCannotClearRecoveredOperation() {
    val g=gate(true);g.complete("unrelated");assertTrue(g.busy())
    g.complete("recovered-id");assertFalse(g.busy())
  }
  @Test fun controlIsBoundToCurrentExecution() {
    val g=gate();val t=g.issueAfterNativeConfirmation(action);g.dispatch(action,t,"one",true) {}
    val stop=action.copy(id="stop",controlOf="one")
    val s=g.issueAfterNativeConfirmation(stop);var stopped=false
    g.dispatch(stop,s,"control",true) { stopped=true }
    assertTrue(stopped);assertTrue(g.busy())
    denied { g.issueAfterNativeConfirmation(stop.copy(controlOf="another")) }
  }
  @Test fun rootCannotReceiveAnImplicitApproval() { denied { gate().issueAfterNativeConfirmation(action.copy(root=true)) } }
  @Test fun dispatchFailureRemainsUncertain() {
    val g=gate();val t=g.issueAfterNativeConfirmation(action)
    try { g.dispatch(action,t,"one",true) { throw IllegalStateException("transport") } } catch (_: IllegalStateException) {}
    assertTrue(g.busy())
    denied { g.issueAfterNativeConfirmation(action) }
  }
  @Test fun concurrentReplayHasOnlyOneSideEffect() {
    val g=gate();val t=g.issueAfterNativeConfirmation(action)
    val count=java.util.concurrent.atomic.AtomicInteger()
    val threads=(1..8).map { Thread { try { g.dispatch(action,t,"one",true) { count.incrementAndGet() } } catch (_: GrantDenied) {} } }
    threads.forEach { it.start() };threads.forEach { it.join() }
    assertEquals(1,count.get())
  }
  @Test fun tokenGeneratorCollisionCannotReviveUsedGrant() {
    val g=StrictGate({now},{"same-token"});val t=g.issueAfterNativeConfirmation(action)
    g.dispatch(action,t,"one",true) {};g.complete("one")
    denied { g.issueAfterNativeConfirmation(action) }
  }
}
