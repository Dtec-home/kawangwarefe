Feature: Treasurer void-request inbox
  A recorder cannot void a receipt; they ask for it. The treasurer or admin
  reviews each request on the "Void requests" tab of /admin/receipts:
  approving voids the receipt, rejecting leaves it issued, and either
  decision may carry a note for the requester. A decided request is read
  only and shows who decided it (T2.6, RC-6, D6). The backend re-checks
  `can_void_receipts`.

  Scenario: The treasurer approves a void request with a note
    Given a pending request to void receipt "20260917-0007", from "Tom Recorder", because "Typed 5000 instead of 500"
    When the treasurer opens the void-request inbox
    Then the inbox shows the request for "20260917-0007" from "Tom Recorder" because "Typed 5000 instead of 500"
    When they approve the request for "20260917-0007" with the note "Checked against the counting sheet"
    Then the decision sent for "20260917-0007" is "approve" with the note "Checked against the counting sheet"
    And they are told receipt "20260917-0007" is now VOID

  Scenario: The treasurer rejects a void request with a note
    Given a pending request to void receipt "20260917-0008", from "Tom Recorder", because "I think it was the wrong member"
    When the treasurer opens the void-request inbox
    And they reject the request for "20260917-0008" with the note "The member confirmed the gift, leave it"
    Then the decision sent for "20260917-0008" is "reject" with the note "The member confirmed the gift, leave it"
    And they are told the request for "20260917-0008" was rejected

  Scenario: A decision that the backend refuses leaves the request pending
    Given a pending request to void receipt "20260917-0007", from "Tom Recorder", because "Typed 5000 instead of 500"
    And the backend refuses the decision with "Only treasurers and admins can void receipts"
    When the treasurer opens the void-request inbox
    And they approve the request for "20260917-0007" with the note "Please void"
    Then they are told "Only treasurers and admins can void receipts"
    And the request for "20260917-0007" is still awaiting a decision once they close the dialog

  Scenario: A decided request is read only and says who decided it
    Given receipt "20260917-0009" has an approved void request decided by "Ann Treasurer" noting "Duplicate of 0008"
    When the treasurer opens the void-request inbox
    And they list the "Approved" requests
    Then the request for "20260917-0009" shows it was decided by "Ann Treasurer" noting "Duplicate of 0008"
    And the request for "20260917-0009" offers no approve or reject action

  Scenario: An empty inbox says so
    Given there are no void requests
    When the treasurer opens the void-request inbox
    Then the inbox shows "No pending void requests"
