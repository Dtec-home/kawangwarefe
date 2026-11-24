Feature: Moving a gift put in the wrong department
  US-19 (ADR-0018): from the contributions list a treasurer moves a payment
  to the right department, sees the change before applying it, and says why.

  Background:
    Given the church is set up with its departments and people
    And the member gives 1500 by Pay Bill with the account "OFFER"

  Scenario: The treasurer moves an Offering gift to Tithe
    Given I am signed in as the treasurer
    When I open the contributions list
    And I move the 1500 gift from "Offering" to "Tithe" because "The giver meant it as tithe"
    Then the API shows that payment is all in "Tithe" for 1500
    And no request left the machine
