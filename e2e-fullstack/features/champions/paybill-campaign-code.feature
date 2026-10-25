Feature: Giving to a campaign with its Pay Bill code
  Members and visitors give to a campaign from the M-Pesa menu by typing the
  campaign's code as the account. The code is matched whatever the case or
  spacing, and department accounts keep working exactly as before.

  Background:
    Given the church is set up with its departments and people
    And the approved campaign "Roof Repair 2026" takes champions under Pay Bill code "ROOF"

  Scenario: A known member pays the campaign code
    When the member sends KES 1500 from the M-Pesa menu to Pay Bill account "ROOF"
    Then the member's Pay Bill receipt SMS says "Towards: Roof Repair 2026"
    And staff see KES 1500 raised for the Pay Bill campaign
    And the Pay Bill campaign has raised KES 1500 on its public page
    And no request left the machine

  Scenario: An unknown phone pays the code in lower case with a stray space
    When a visitor on "254711222333" named "Wanjiru" sends KES 700 from the M-Pesa menu to Pay Bill account "roof "
    Then staff see KES 700 raised for the Pay Bill campaign
    And staff see "Wanjiru" on the Pay Bill campaign's contributor list
    And the treasurer sees "Wanjiru" in the Pay Bill campaign's share list
    And the Pay Bill campaign has raised KES 700 on its public page
    And no request left the machine

  Scenario: Department codes and Welfare numbers still go to their departments
    Given the member2 holds Welfare number "W123" for Pay Bill
    When a visitor on "254711222444" named "Otieno" sends KES 300 from the M-Pesa menu to Pay Bill account "WELF-W123"
    And the member sends KES 400 from the M-Pesa menu to Pay Bill account "TITHE"
    Then staff see a KES 300 WELF Pay Bill gift from "John Kamau" with Welfare number "W123"
    And staff see a KES 400 TITHE Pay Bill gift from "Mary Wanjiku"
    And staff see KES 0 raised for the Pay Bill campaign
    And no request left the machine
