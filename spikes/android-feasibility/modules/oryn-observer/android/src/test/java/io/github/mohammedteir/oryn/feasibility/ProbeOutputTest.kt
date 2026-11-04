package io.github.mohammedteir.oryn.feasibility

import org.junit.Assert.*
import org.junit.Test

class ProbeOutputTest {
  @Test fun ordinaryProbeOutputIsUnchanged() { assertEquals("stdout\nstderr",ProbeOutput.clean("stdout\nstderr")) }
  @Test fun outputIsBounded() { assertEquals(4096,ProbeOutput.clean("x".repeat(9000)).length) }
  @Test fun credentialLikeOutputIsRedacted() {
    for(value in listOf("AIza"+"x".repeat(30),"sk-"+"x".repeat(30),"token=fixture-value","Authorization: fixture-value")) {
      assertEquals("[redacted]",ProbeOutput.clean(value))
    }
  }
  @Test fun bearerValueIsEntirelyRedacted() {
    assertEquals("[redacted]\npublic",ProbeOutput.clean("Authorization: Bearer fixture-value\npublic"))
  }
  @Test fun truncationDoesNotExposeAPartialCredential() {
    val prefix="x".repeat(4080)
    assertEquals(prefix+"[redacted]",ProbeOutput.clean(prefix+"token="+"fixture".repeat(100)))
  }
}
