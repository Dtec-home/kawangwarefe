@web
Feature: Finding a reported payment by its M-Pesa code
  Staff enter the code a member reports; the answer says what happens next (W1, F1).

  Scenario: A code is looked up and the answer shown
    Given the treasurer opens "Find payment by M-Pesa code"
    When they enter "uk35c0rvdd" and press Find
    Then Safaricom is asked about "UK35C0RVDD"
    And the answer "Asked Safaricom about UK35C0RVDD." is shown
