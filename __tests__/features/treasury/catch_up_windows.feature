Feature: Admin catch-up windows
  Nobody can backdate an entry. When something stops the church recording on
  the day — an internet outage during the service, say — an admin opens a
  time-limited catch-up window for that past date so recorders can enter the
  gifts, and closes it once they are in. Every window needs a reason and is
  audit-logged server-side (T2.8, RR-7, D13).

  Scenario: An admin opens a catch-up window for a past date
    Given no catch-up window is open
    When the admin opens a window for "2026-08-29" for "24" hours because "Internet outage during service"
    Then the window sent to the backend is "2026-08-29" for "24" hours because "Internet outage during service"
    And the open windows list shows "Sat, 29 Aug 2026" because "Internet outage during service"
    And they are told "Catch-up window opened"

  Scenario: A window needs a past date and a real reason
    Given no catch-up window is open
    When the admin opens a window for "" for "24" hours because "oops"
    Then they are told to choose the date to open
    And they are told the reason needs at least 10 characters
    And no window is sent to the backend

  Scenario: Today cannot be opened
    Given no catch-up window is open
    When the admin opens a window for "2026-09-17" for "24" hours because "Internet outage during service"
    Then they are told today and future dates cannot be opened
    And no window is sent to the backend

  Scenario: An admin closes a catch-up window once the entries are in
    Given a catch-up window is open for "2026-08-29" because "Internet outage during service"
    When the admin closes the window for "Sat, 29 Aug 2026"
    Then the window closed at the backend is the one for "2026-08-29"
    And they are told "Catch-up window closed"
    And the open windows list shows no windows

  Scenario: A refused close leaves the window open
    Given a catch-up window is open for "2026-08-29" because "Internet outage during service"
    And the backend refuses with "Only admins can manage catch-up windows"
    When the admin closes the window for "Sat, 29 Aug 2026"
    Then they are told "Only admins can manage catch-up windows"
    And the open windows list shows "Sat, 29 Aug 2026" because "Internet outage during service"
