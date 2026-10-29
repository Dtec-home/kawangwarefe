Feature: A shared campaign link's preview tells the same story as the WhatsApp post
  WhatsApp keeps the preview it fetched the first time it sees a link, so the
  link and its image carry a version that changes with the figures, and the
  figures are read fresh every time (DEPARTMENT_CAMPAIGNS D14).

  Background:
    Given the church is set up with its departments and people

  Scenario: After a gift, the link, its preview text and its image are new
    Given the campaign "Church Roof" with code "ROOF" and a target of 100000 has been approved
    When WhatsApp fetches the link preview of "Church Roof"
    Then the preview says "Raised: KES 0 (0.0%) · Target: KES 100,000 · 0 givers"
    And the preview image is served fresh
    Given the member has given KES 2500 to "Church Roof" by M-Pesa prompt
    When WhatsApp fetches the link preview of "Church Roof" again
    Then the preview says "Raised: KES 2,500 (2.5%) · Target: KES 100,000 · 1 giver"
    And the shared link and the preview image both carry a new version
    And no request left the machine
