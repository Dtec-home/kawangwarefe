@web
Feature: Managing my phone numbers
  A member keeps several numbers. Adding one needs a code sent to it; an admin
  adds one directly and is told who owns a taken number (MP-2).

  Scenario: A member adds a second number with a code
    Given I am on my profile with the number "254711000001"
    When I ask to add "0733000002"
    And I enter the code sent to "0733000002"
    Then my numbers are "0711 000 001" and "0733 000 002"

  Scenario: An admin is told who owns a number
    Given I manage the numbers of member 3 with the number "254711000001"
    When I add "0733000002" which belongs to "John Otieno" (member 7)
    Then I am offered to merge with "John Otieno"
