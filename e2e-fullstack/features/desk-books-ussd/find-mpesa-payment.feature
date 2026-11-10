Feature: Finding a reported payment by its M-Pesa code
  A member says "I paid, here is the code". A treasurer looks the code up:
  we say where it is if we have it, otherwise we ask Safaricom (W1, F1).

  Background:
    Given the church is set up with its departments and people

  Scenario: A payment we already have is pointed to
    Given the member gives 250 by Pay Bill and keeps the M-Pesa code
    And I am signed in as the treasurer
    When I look up that M-Pesa code on the Pay Bill page
    Then I am told the payment is already recorded

  Scenario: Safaricom cannot be reached for a code we do not have
    Given I am signed in as the treasurer
    When I look up the M-Pesa code "QZX9AB12CD" on the Pay Bill page
    Then I am told to try again shortly
    And the lookup is listed as "Could not ask Safaricom"
