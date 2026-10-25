Feature: The end-to-end harness itself
  The full-stack journeys rely on signing in with the code texted to a phone
  and on no SMS or M-Pesa request ever reaching a real provider.

  Background:
    Given the church is set up with its departments and people

  Scenario: A treasurer signs in with the code sent by SMS
    Given I am signed in as the treasurer
    Then the treasurer receives an SMS containing "verification code"
    And no request left the machine
