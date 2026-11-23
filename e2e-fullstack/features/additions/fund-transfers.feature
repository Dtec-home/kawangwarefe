Feature: Moving money between funds
  US-16, US-17 (ADR-0018): a treasurer asks to move money from one
  department's fund to another with a reason; someone else must approve it
  before the balances change.

  Background:
    Given the church is set up with its departments and people
    And the member gives 5000 by Pay Bill with the account "BLDG"

  Scenario: The treasurer requests a transfer and the admin approves it
    Given I am signed in as the treasurer
    When I open Fund transfers
    And I request a transfer of 2000 from "Building Fund" to "Welfare" because "Welfare needs help this month"
    Then the transfer "Welfare needs help this month" is Requested and I cannot approve it
    And the API shows "Building Fund" holds 5000 and "Welfare" holds 0
    When the admin approves the transfer "Welfare needs help this month"
    Then the transfer "Welfare needs help this month" says "Approved by Alice Admin"
    And the API shows "Building Fund" holds 3000 and "Welfare" holds 2000
    And no request left the machine
