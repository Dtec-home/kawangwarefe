@parity
Feature: OTP login
  A member authenticates by phone: they request a one-time code, then submit it.
  The correct code authenticates them; a wrong code is rejected.

  This is a CANONICAL, platform-neutral parity feature. The SAME file is copied
  into each repo (backend, web, mobile) and bound to that platform's own stack.
  Keep the copies byte-identical — a cross-repo drift-check enforces this.

  Scenario: A member logs in with the correct OTP
    Given a member with phone "254712345678" who requested a login code
    When they submit the correct OTP
    Then they are authenticated

  Scenario: A wrong OTP is rejected
    Given a member with phone "254712345678" who requested a login code
    When they submit an incorrect OTP
    Then authentication is rejected
