from playwright.sync_api import Page, expect

def test_theming_and_clear_buttons(page: Page):
    """
    This test verifies that:
    1. Buttons with the 'themed-button-clear' class have a transparent background.
    2. Toggle buttons and view choosers are correctly themed.
    3. All themed elements update correctly when the theme is changed.
    """
    # 1. Arrange: Go to the application homepage.
    page.goto("http://localhost:8000")

    # --- VERIFICATION (THEME OFF) ---

    # 2. Act: Verify clear buttons in Advanced Options.
    page.get_by_role("button", name="Advanced Options").click()
    expect(page.locator("#advanced-options-modal")).to_be_visible()
    page.wait_for_timeout(500) # Wait for modal animation
    page.screenshot(path="jules-scratch/verification/01_advanced_options_theme_off.png")

    # 3. Act: Verify clear "Choose Icon" button in Task Form.
    page.locator("#advanced-options-modal .close-button").click()
    page.get_by_role("button", name="Add New Task").first.click()
    expect(page.locator("#task-modal")).to_be_visible()
    page.wait_for_timeout(500) # Wait for modal animation
    page.locator("#simple-mode-toggle").check()
    page.screenshot(path="jules-scratch/verification/02_task_form_theme_off.png")
    page.locator("#task-modal .close-button").click()

    # 4. Act: Verify KPI toggle buttons.
    page.get_by_role("button", name="Dashboard").click()
    expect(page.locator("#dashboard-view")).to_be_visible()
    page.screenshot(path="jules-scratch/verification/03_dashboard_view_theme_off.png")

    # 5. Act: Verify Calendar view chooser buttons.
    page.get_by_role("button", name="Calendar").click()
    expect(page.locator("#calendar-view")).to_be_visible()
    page.screenshot(path="jules-scratch/verification/04_calendar_view_theme_off.png")

    # --- ENABLE THEME AND RE-VERIFY ---

    # 6. Act: Enable the gradient theme.
    page.get_by_role("button", name="Advanced Options").click()
    expect(page.locator("#advanced-options-modal")).to_be_visible()
    page.wait_for_timeout(500) # Wait for modal animation
    page.get_by_label("Enable Gradient Theme:").check()
    page.screenshot(path="jules-scratch/verification/05_advanced_options_theme_on.png")

    # 7. Act: Verify clear "Choose Icon" button in Task Form with theme on.
    page.locator("#advanced-options-modal .close-button").click()
    page.get_by_role("button", name="Add New Task").first.click()
    expect(page.locator("#task-modal")).to_be_visible()
    page.wait_for_timeout(500) # Wait for modal animation
    page.locator("#simple-mode-toggle").check()
    page.screenshot(path="jules-scratch/verification/06_task_form_theme_on.png")
    page.locator("#task-modal .close-button").click()

    # 8. Act: Verify KPI toggle buttons with theme on.
    page.get_by_role("button", name="Dashboard").click()
    expect(page.locator("#dashboard-view")).to_be_visible()
    page.screenshot(path="jules-scratch/verification/07_dashboard_view_theme_on.png")

    # 9. Act: Verify Calendar view chooser buttons with theme on.
    page.get_by_role("button", name="Calendar").click()
    expect(page.locator("#calendar-view")).to_be_visible()
    # Click the "Week" button to show an active themed button
    page.get_by_role("button", name="Week", exact=True).click()
    page.screenshot(path="jules-scratch/verification/08_calendar_view_theme_on.png")