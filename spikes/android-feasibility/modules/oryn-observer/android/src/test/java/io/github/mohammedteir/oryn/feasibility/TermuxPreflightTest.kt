package io.github.mohammedteir.oryn.feasibility

import org.junit.Assert.*
import org.junit.Test

class TermuxPreflightTest {
  @Test fun absentPackageDoesNotReachPermissionOrReview() {
    var review=false
    try {
      TermuxPreflight.requireForReview({false},{fail("permission queried for absent provider");true})
      review=true;fail("review allowed")
    } catch (_: TermuxNotInstalled) {}
    assertFalse(review)
  }
  @Test fun deniedPermissionDoesNotReachReview() {
    var review=false
    try {
      TermuxPreflight.requireForReview({true},{false})
      review=true;fail("review allowed")
    } catch (_: TermuxPermissionRequired) {}
    assertFalse(review)
  }
  @Test fun prerequisitesAreCheckedInOrderWithoutGrantIssuance() {
    val calls=mutableListOf<String>()
    TermuxPreflight.requireForReview({calls.add("package");true},{calls.add("permission");true})
    calls.add("eligible_for_native_review_only")
    assertEquals(listOf("package","permission","eligible_for_native_review_only"),calls)
  }
  @Test fun packageQueryFailureIsNotSuccess() {
    var permission=false
    try {
      TermuxPreflight.requireForReview({throw SecurityException()},{permission=true;true})
      fail("query failure accepted")
    } catch (_: SecurityException) {}
    assertFalse(permission)
  }
  @Test fun permissionQueryFailureIsNotSuccess() {
    try {
      TermuxPreflight.requireForReview({true},{throw SecurityException()})
      fail("permission query failure accepted")
    } catch (_: SecurityException) {}
  }
  @Test fun permissionIsRecheckedForEveryNewReview() {
    var granted=true
    TermuxPreflight.requireForReview({true},{granted})
    granted=false
    try { TermuxPreflight.requireForReview({true},{granted});fail("stale permission accepted") }
    catch (_: TermuxPermissionRequired) {}
  }
}
