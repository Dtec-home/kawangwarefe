Feature: Champion dashboard
  A champion raises money for a campaign from friends and family with their own
  link and code. On /champion/[id] they see what they have raised, who gave
  through them with names and amounts (decision 4), and a share kit. From
  /champion a member sees their champion pages and asks to become a champion
  of a campaign (ticket 5.9).

  Scenario: An active champion sees their tally and their donors
    Given "Jane Wanjiku" is an active champion of "New Church Roof" with code "JANE"
    And she has raised "15000" from 2 donors towards a personal target of "50000"
    And "Peter Otieno" gave "10000" and "Mary Akinyi" gave "5000" through her code
    When she opens her champion dashboard
    Then she sees she has raised "KES 15,000.00" of "KES 50,000.00"
    And she sees her donors ranked "Peter Otieno" then "Mary Akinyi"
    And "Peter Otieno" is shown with "KES 10,000.00"
    And she is told "Only you and church staff can see this list"

  Scenario: An active champion gets a share kit
    Given "Jane Wanjiku" is an active champion of "New Church Roof" with code "JANE"
    When she opens her champion dashboard
    Then she sees her personal link "https://church.example/campaigns/new-church-roof/c/JANE"
    And she sees the Pay Bill text "Pay Bill 4012345, Account ROOF JANE"
    And copying the Pay Bill details copies "Pay Bill 4012345, Account ROOF JANE"
    And the WhatsApp message mentions "ROOF JANE" and her link

  Scenario: A pending champion is told they are waiting for approval
    Given "Jane Wanjiku" is a pending champion of "New Church Roof" with code "JANE"
    When she opens her champion dashboard
    Then she is told her champion page is waiting for approval
    And she does not see a share kit

  Scenario: An inactive champion is told their code no longer counts
    Given "Jane Wanjiku" is an inactive champion of "New Church Roof" with code "JANE"
    When she opens her champion dashboard
    Then she is told her champion page is no longer active

  Scenario: A champion page that is not theirs is not shown
    Given the champion page does not exist
    When she opens her champion dashboard
    Then she is told the champion page was not found

  Scenario: Someone else's champion page is refused as not found
    Given the server refuses the champion page
    When she opens her champion dashboard
    Then she is told the champion page was not found, not to check her connection

  Scenario: A member sees their champion pages
    Given "Jane Wanjiku" is an active champion of "New Church Roof" with code "JANE"
    When she opens her champion pages
    Then she sees a link to her "New Church Roof" champion page

  Scenario: A member asks to become a champion
    Given the member is not a champion yet
    And the campaign "New Church Roof" takes champions
    When she opens her champion pages
    And she asks to champion "New Church Roof" with code "jane" and a personal target of "20000"
    Then she is joined to campaign "42" with code "JANE" and personal target "20000"
    And she is told she is waiting for approval

  Scenario: A champion code that is too short is refused before sending
    Given the member is not a champion yet
    And the campaign "New Church Roof" takes champions
    When she opens her champion pages
    And she asks to champion "New Church Roof" with code "J" and no personal target
    Then she sees the message "Use 2 to 9 capital letters or digits, for example JOHN or MAMA1"
    And nothing is sent
