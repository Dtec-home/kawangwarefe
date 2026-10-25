Feature: Share the contributor list to the church WhatsApp group
  Staff share each campaign's contributor list (every donor's name and their
  total) to the church WhatsApp group with one tap (decision 7). WhatsApp
  cannot be posted to automatically, so the button opens WhatsApp with the text
  ready and the person picks the group. Every share is recorded.

  Scenario: Staff preview the list before sharing
    Given the campaign's list names 2 contributors who gave "75000.00" in total
    When they open the share tab
    Then they see the exact text that will be shared
    And they see "2 contributors" and "KES 75,000.00"
    And they see when the list was made
    And they are warned "This list names every donor and their total. Share it only to the church group."

  Scenario: Staff share the list to WhatsApp
    Given the campaign's list names 2 contributors who gave "75000.00" in total
    When they open the share tab
    And they choose "Share list to WhatsApp"
    Then WhatsApp opens with the list ready to send
    And the share is recorded
    And they are told "Share recorded"

  Scenario: Staff copy the list instead
    Given the campaign's list names 2 contributors who gave "75000.00" in total
    When they open the share tab
    And they choose "Copy text"
    Then the list is copied
    And the share is recorded

  Scenario: Recording the share is refused
    Given the campaign's list names 2 contributors who gave "75000.00" in total
    And the server will refuse to record the share with "Only staff can share the list"
    When they open the share tab
    And they choose "Share list to WhatsApp"
    Then they are told "Only staff can share the list"

  Scenario: Nobody has given yet
    Given the campaign's list has no contributors
    When they open the share tab
    Then they are told nobody has given yet
    And they cannot share the list

  Scenario: A very long list suggests copying instead
    Given the campaign's list is very long
    When they open the share tab
    Then they are warned WhatsApp may cut the list short and to use Copy text

  Scenario: Staff refresh the list
    Given the campaign's list names 2 contributors who gave "75000.00" in total
    When they open the share tab
    And someone else gives so the list names 3 contributors who gave "80000.00" in total
    And they choose "Refresh"
    Then they see "3 contributors" and "KES 80,000.00"
