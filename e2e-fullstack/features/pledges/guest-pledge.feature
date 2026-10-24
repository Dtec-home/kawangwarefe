Feature: A visitor pledges on the public campaign page
  Decision 3: a pledge from the public page is confirmed with a one-time
  code texted to the visitor and is live at once. Pledging never creates a
  login: the code only confirms the pledge.

  Background:
    Given the church is set up with its departments and people
    And the "Church Roof" campaign with Pay Bill code "ROOF" is taking pledges

  Scenario: A visitor confirms a pledge with the code sent by SMS after a wrong try
    When a visitor opens the public page of the "Church Roof" pledge campaign
    And the visitor asks to pledge KES 2500 as "Grace Achieng" from phone "0711222333"
    Then the visitor's phone "254711222333" receives a pledge confirmation code
    When the visitor types a wrong pledge confirmation code
    Then the public page refuses the pledge code with "That code is not right"
    When the visitor types the pledge confirmation code from the SMS
    Then the public page confirms the pledge of "KES 2,500.00" for "Grace"
    And the public page shows "KES 2,500.00" pledged to the campaign
    And the pledge confirmation code does not sign the visitor in
    And the visitor is on the church's books as a guest without a login
    When I am signed in as the treasurer
    And I open the pledge register
    Then the pledge register lists "Grace Achieng" pledging "KES 2,500.00" to "Church Roof" from "Public page"
    And the pledge register shows "Grace Achieng"'s pledge of "KES 2,500.00" with paid "KES 0.00", balance "KES 2,500.00" and status "Open"
    And no request left the machine
