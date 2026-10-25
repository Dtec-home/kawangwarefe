Feature: Recording campaign gifts at the desk
  Gifts brought to the church office are recorded by a recorder or by staff.
  A line given to a fundraising campaign can name the champion who brought
  the giver in, and a giver whose phone is new to the church is named, so
  receipts and contributor lists never say "Guest Member".

  Background:
    Given the church is set up with its departments and people
    And the Building Fund runs the desk campaign "New Church Roof" with Pay Bill code "ROOF"
    And John Kamau champions the desk campaign with the code "JOHN"

  Scenario: A recorder records an envelope for a new giver, credited to a champion
    Given I am signed in as the recorder
    When the recorder opens the desk at "/record" for a phone new to the church
    Then the desk asks for the new giver's full name
    When the desk line gives 1500 to the Building Fund for the desk campaign through champion "PETER"
    And the recorder marks the gift as an envelope and asks to review it
    Then the desk refuses with "This phone number is new. Enter the giver's name."
    When the recorder enters the new giver's name "Grace Njeri"
    And the recorder asks to review and confirms the gift
    Then the desk refuses with "PETER is not an active champion of this campaign"
    When the recorder goes back and corrects the champion code to "JOHN"
    And the recorder asks to review and confirms the gift
    Then the desk shows a receipt for "KES 1,500.00" from "Grace Njeri"
    And the new giver receives a receipt SMS addressed to "Grace"
    When the treasurer reviews the desk campaign's contributor list
    Then the contributor list shows "Grace Njeri" with "KES 1,500.00" and no "Guest Member"
    And the desk campaign's champion "JOHN" is credited with "KES 1,500.00" from 1 donor
    And no request left the machine

  Scenario: An admin enters a known member's campaign gift by hand
    Given I am signed in as the admin
    When the admin opens manual entry for the member's phone
    Then manual entry recognises the giver "Mary Wanjiku"
    When the desk line gives 2000 to the Building Fund for the desk campaign
    And the admin saves the manual entry
    Then manual entry issues a receipt
    And the member receives an SMS containing "2,000"
    When the treasurer reviews the desk campaign's contributor list
    Then the contributor list shows "Mary Wanjiku" with "KES 2,000.00" and no "Guest Member"
    And no request left the machine
