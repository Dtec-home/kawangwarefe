Feature: Staff see which channel each contribution came through
  Every contribution records how it arrived: Pay Bill, website, mobile app,
  USSD or the desk (W4, F6).

  Background:
    Given the church is set up with its departments and people

  Scenario: A Pay Bill gift is shown as Pay Bill
    Given the member gives 130 by Pay Bill with the account "TITHE"
    And I am signed in as the admin
    When I open the contributions list
    Then the 130 gift shows the channel "Pay Bill"
