Feature: A campaign's own books, from first gift to close-out
  Money given to a campaign and bills charged to it make up the campaign's
  statement. Closing the campaign takes it off the campaigns list, and its page
  shows it as closed with the final total; any money left over stays in the
  department, late Pay Bill payments to its code are still
  credited to it, and late bills can still be charged to it. A paused
  campaign's code takes nothing: payments to it wait for staff.

  Background:
    Given the church is set up with its departments and people
    And the Building Fund runs the desk campaign "New Church Roof" with Pay Bill code "ROOF"
    And the member pays 5000 by Pay Bill to the desk campaign's code

  Scenario: An expense charged to the campaign shows on its statement, which exports
    Given I am signed in as the treasurer
    When the treasurer records a paid expense of 1200 to "Mwangi Hardware" charged to the desk campaign
    Then the expenses list shows the bill to "Mwangi Hardware"
    When the treasurer opens the desk campaign's "Statement" tab
    Then the campaign statement shows money in "KES 5,000.00", money out "KES 1,200.00" and balance "KES 3,800.00"
    And the campaign statement lists the bill to "Mwangi Hardware"
    And the campaign statement downloads as an Excel file
    And the campaign statement downloads as a PDF file
    And no request left the machine

  Scenario: Closing the campaign; its page shows it closed; a later Pay Bill and a late bill still count
    Given I am signed in as the treasurer
    When the treasurer opens the desk campaign's "Close out" tab
    And the treasurer asks to close the desk campaign
    Then the close-out warning says leftover money stays in "Building Fund"
    And the close-out warning says later Pay Bill payments to "ROOF" are still credited to it
    When the treasurer confirms closing the desk campaign
    Then the close-out tab shows the campaign as closed
    And the desk campaign's public page shows it has closed, with "KES 5,000.00" raised and no way to give
    And the desk campaign is not on the public campaigns list
    When the member pays 700 by Pay Bill to the desk campaign's code
    Then the admin Pay Bill list shows both payments to "ROOF" as credited
    When the treasurer records a paid expense of 300 to "Late Roofing Invoice" charged to the desk campaign
    And the treasurer opens the desk campaign's "Statement" tab
    Then the campaign statement shows money in "KES 5,700.00", money out "KES 300.00" and balance "KES 5,400.00"
    And no request left the machine

  Scenario: A Pay Bill payment to a paused campaign's code waits as unmatched
    Given I am signed in as the treasurer
    And the treasurer has paused the desk campaign
    When the member pays 700 by Pay Bill to the desk campaign's code
    Then the admin Pay Bill list shows the 700 to "ROOF" as unmatched
    When the treasurer opens the desk campaign's "Statement" tab
    Then the campaign statement shows money in "KES 5,000.00", money out "KES 0.00" and balance "KES 5,000.00"
    And no request left the machine

  Scenario: The nightly finance check finds the campaign books consistent
    Given the treasurer has charged a paid bill of 800 to the desk campaign
    When the finance integrity job runs
    Then the finance integrity job reports no campaign problems
    And no request left the machine

  # Was @fixme (E2E-D REQUEST 1): the dialog base dropped its height cap on
  # desktop; fixed in components/ui/dialog.tsx.
  Scenario: The expense form fits a laptop screen
    Given I am signed in as the treasurer
    When the treasurer opens the expense form on a 1280 by 720 desktop screen
    Then the expense form's save button can be reached
