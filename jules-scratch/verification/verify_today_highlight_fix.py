from playwright.sync_api import Page, expect

def verify_themed_highlight(page: Page):
    """
    This script verifies that the 'current day' highlight in the calendar
    is correctly themed, including the header/body distinction and readable text.
    It also verifies the improved default light mode highlight.
    """
    # 1. Navigate to the application
    page.goto("http://localhost:8000")

    # === VERIFY THEMED MODE ===

    # 2. Open the advanced options modal
    advanced_options_btn = page.locator('#advancedOptionsBtnMain')
    expect(advanced_options_btn).to_be_visible()
    advanced_options_btn.click()

    # 3. Enable the theme
    theme_toggle = page.locator('#theme-enabled-toggle')
    expect(theme_toggle).to_be_visible()
    theme_toggle.check()

    # 4. Close the modal
    close_btn = page.locator('#advanced-options-modal .close-button')
    expect(close_btn).to_be_visible()
    close_btn.click()

    # 5. Wait for the calendar and the "today" element to be visible
    calendar = page.locator('#calendar')
    expect(calendar).to_be_visible()
    today_element = page.locator('.fc-day-today').first
    expect(today_element).to_be_visible()

    # 6. Take a screenshot for visual verification of the themed highlight
    page.screenshot(path="jules-scratch/verification/themed_highlight_fix.png")

    # === VERIFY LIGHT MODE ===

    # 7. Re-open advanced options to switch to light mode
    advanced_options_btn.click()

    # 8. Disable the theme first
    theme_toggle.uncheck()

    # 9. Switch to light mode
    light_mode_btn = page.locator('.theme-mode-btn[data-mode="light"]')
    expect(light_mode_btn).to_be_visible()
    light_mode_btn.click()

    # 10. Close the modal
    close_btn.click()

    # 11. Take a screenshot for visual verification of the light mode highlight
    expect(today_element).to_be_visible()
    page.screenshot(path="jules-scratch/verification/light_mode_highlight_fix.png")