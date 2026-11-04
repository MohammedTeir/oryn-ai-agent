package io.github.mohammedteir.oryn.feasibility

// All decision-relevant fields are immutable Strings/primitives; no mutable argv aliases.
internal data class ExactProbe(
  val id: String,
  val backend: String,
  val executable: String,
  val argument: String,
  val directory: String,
  val environment: String,
  val binaryIdentity: String,
  val timeoutMs: Long,
  val effects: String,
  val root: Boolean = false,
  val controlOf: String = ""
)

internal class GrantDenied : IllegalStateException("Native grant rejected")

/** Strict-only research gateway. No JS grant issuer, Batch, Session or arbitrary shell API. */
internal class StrictGate(
  private val clock: () -> Long,
  private val newToken: () -> String,
  initialExecutionId: String? = null
) {
  private data class Grant(val action: ExactProbe, val expires: Long)
  private val grants = mutableMapOf<String, Grant>()
  private val issued = mutableSetOf<String>()
  private var active: String? = initialExecutionId

  @Synchronized fun issueAfterNativeConfirmation(action: ExactProbe): String {
    if (action.root || (active != null && action.controlOf != active)) throw GrantDenied()
    if (action.controlOf.isNotEmpty() && action.controlOf != active) throw GrantDenied()
    val token = newToken()
    if (!issued.add(token)) throw GrantDenied()
    grants[token] = Grant(action, clock() + 15_000)
    return token
  }

  /** Sink is entered synchronously under the same lock, after final native validation. */
  @Synchronized fun dispatch(
    action: ExactProbe, token: String?, executionId: String, foreground: Boolean,
    sink: () -> Unit
  ) {
    val grant = token?.let { grants.remove(it) } ?: throw GrantDenied()
    if (!foreground || action.root || grant.action != action || clock() >= grant.expires) throw GrantDenied()
    if (action.controlOf.isEmpty()) {
      if (active != null) throw GrantDenied()
      active = executionId
    } else if (active != action.controlOf) throw GrantDenied()
    // A sink failure does not silently release an uncertain in-flight operation.
    sink()
  }

  @Synchronized fun revokeUnconsumed() { grants.clear() }
  @Synchronized fun complete(executionId: String) {
    if (active == executionId) active = null
  }
  @Synchronized fun busy(): Boolean = active != null
}
