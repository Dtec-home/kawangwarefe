Feature: Admin pledge register
  Staff and department admins keep the pledge register: who promised what to a
  campaign or a department, how much has been paid and what is still owed.
  They record pledges written on paper cards, cancel a pledge with a reason and
  export the register. The backend limits department admins to their own
  departments and re-checks every action.

  Scenario: Staff see the totals and every pledge
    Given "Jane Wanjiku" pledged "50000.00" to campaign "Church Building", paid "20000.00", due "2026-12-31"
    And the totals are "50000.00" pledged, "20000.00" paid, "30000.00" outstanding over 1 pledge
    When they open the pledge register
    Then the totals show "KES 50,000.00" pledged, "KES 20,000.00" paid and "KES 30,000.00" outstanding
    And the register shows "Jane Wanjiku" for "Church Building" with "KES 30,000.00" still owed
    And "Jane Wanjiku" is marked "Open" from a "Pledge card"

  Scenario: Staff filter the register by status and search
    Given "Jane Wanjiku" pledged "50000.00" to campaign "Church Building", paid "20000.00", due "2026-12-31"
    And "Peter Otieno" pledged "10000.00" to department "Youth", paid "10000.00", due none
    When they open the pledge register
    And they show only "Fulfilled" pledges
    And they search pledges for "peter"
    Then the register shows "Peter Otieno" for "Youth" with "KES 0.00" still owed
    And the register does not show "Jane Wanjiku"

  Scenario: Choosing a campaign limits the totals and the register to it
    Given "Jane Wanjiku" pledged "50000.00" to campaign "Church Building", paid "20000.00", due "2026-12-31"
    And "Peter Otieno" pledged "10000.00" to department "Youth", paid "10000.00", due none
    When they open the pledge register
    And they show only pledges to campaign "Church Building"
    Then the register shows "Jane Wanjiku" for "Church Building" with "KES 30,000.00" still owed
    And the register does not show "Peter Otieno"
    And the totals were asked for campaign "Church Building"

  Scenario: A department admin only chooses from their own departments and campaigns
    Given a department admin for "Youth"
    When they open the pledge register
    Then the department filter offers only "Youth"
    And the campaign filter offers only "Youth Camp"

  Scenario: An empty register says so
    Given there are no pledges
    When they open the pledge register
    Then they are told there are no pledges yet

  Scenario: The register explains when it cannot load
    Given the register cannot be loaded
    When they open the pledge register
    Then they see "Could not load pledges"

  Scenario: Staff export the register to Excel
    Given "Jane Wanjiku" pledged "50000.00" to campaign "Church Building", paid "20000.00", due "2026-12-31"
    When they open the pledge register
    And they choose "Export Excel"
    Then the file "pledges.xlsx" is downloaded
    And they are told "Pledges exported"

  Scenario: Staff record a pledge card for a new giver
    Given there are no pledges
    When they open the pledge register
    And they choose "Record a pledge card"
    And they enter phone "0712345678", name "Mary Akinyi", amount "15000" and due date "2027-01-31" for campaign "Church Building"
    And they choose "Save pledge"
    Then a pledge of "15000" to campaign "Church Building" is recorded for "254712345678" named "Mary Akinyi"
    And they are told "Pledge recorded"

  Scenario: A pledge card needs a valid phone number
    Given there are no pledges
    When they open the pledge register
    And they choose "Record a pledge card"
    And they enter phone "12345", name "", amount "15000" and due date "" for campaign "Church Building"
    And they choose "Save pledge"
    Then they are told "Enter a valid Safaricom or Airtel number"
    And no pledge is recorded

  Scenario: Staff cancel a pledge with a reason
    Given "Jane Wanjiku" pledged "50000.00" to campaign "Church Building", paid "20000.00", due "2026-12-31"
    When they open the pledge register
    And they cancel the pledge of "Jane Wanjiku" because "Recorded twice by mistake"
    Then the pledge is cancelled with reason "Recorded twice by mistake"
    And they are told "Pledge cancelled"

  Scenario: A fulfilled pledge cannot be cancelled
    Given "Peter Otieno" pledged "10000.00" to department "Youth", paid "10000.00", due none
    When they open the pledge register
    Then "Peter Otieno" cannot be cancelled

  Scenario: A campaign's Pledges tab shows only that campaign's pledges
    Given "Jane Wanjiku" pledged "50000.00" to campaign "Church Building", paid "20000.00", due "2026-12-31"
    And "Peter Otieno" pledged "10000.00" to department "Youth", paid "10000.00", due none
    When they open the Pledges tab of campaign "Church Building"
    Then the tab lists "Jane Wanjiku" with "KES 30,000.00" still owed
    And the register does not show "Peter Otieno"
    And the totals were asked for campaign "Church Building"
    And there is no campaign or department filter

  Scenario: A pledge card recorded on the Pledges tab is for that campaign
    Given there are no pledges
    When they open the Pledges tab of campaign "Church Building"
    And they choose "Record a pledge card"
    And they enter phone "0712345678", name "", amount "5000" and due date ""
    And they choose "Save pledge"
    Then a pledge of "5000" to campaign "Church Building" is recorded for "254712345678"

  Scenario: The Pledges tab exports only that campaign
    Given "Jane Wanjiku" pledged "50000.00" to campaign "Church Building", paid "20000.00", due "2026-12-31"
    When they open the Pledges tab of campaign "Church Building"
    And they choose "Export PDF"
    Then the export is for campaign "Church Building" as "pdf"
