from playwright.sync_api import sync_playwright, Page, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # Navigate to the application
        page.goto("http://localhost:8000")

        # Open Advanced Options
        page.locator("#advancedOptionsBtnMain").click()

        # Wait for the modal to be visible
        advanced_options_modal = page.locator("#advanced-options-modal")
        expect(advanced_options_modal).to_be_visible()

        # --- Test Day Mode ---
        # Click the "Day" mode button
        page.locator('button[data-mode="light"]').click()

        # Take a screenshot of the day mode
        page.screenshot(path="jules-scratch/verification/day_mode_verification.png")

        # --- Test Themed Night Mode ---
        # Click the "Night" mode button
        page.locator('button[data-mode="night"]').click()

        # Enable the gradient theme
        theme_toggle = page.locator("#theme-enabled-toggle")
        theme_toggle.check()

        # Wait for theme controls to be visible
        theme_controls = page.locator("#theme-controls")
        expect(theme_controls).to_be_visible()

        # Change the base color to see the theme in action
        page.locator("#theme-base-color").fill("#e11d48") # A shade of rose

        # Take a screenshot of the themed night mode
        page.screenshot(path="jules-scratch/verification/night_mode_themed_verification.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)