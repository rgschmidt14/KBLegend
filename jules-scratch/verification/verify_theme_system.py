import re
from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        page.goto("http://localhost:8000")

        # Give the page a moment to load and apply initial theme
        page.wait_for_timeout(1000)

        # 1. Screenshot of the default (dark) theme
        page.screenshot(path="jules-scratch/verification/01_dark_theme.png")

        # 2. Open modal and expand the correct section
        advanced_options_btn = page.locator("#advancedOptionsBtnMain")
        advanced_options_btn.click()

        modal = page.locator("#advanced-options-modal")
        expect(modal).to_be_visible()

        # **FIX:** Click the collapsible header to reveal the theme controls
        theme_header = modal.locator(".collapsible-header", has_text="Theme and Color")
        theme_header.click()

        # 3. Switch to light theme and take a screenshot
        day_mode_btn = modal.locator("button[data-mode='light']")
        expect(day_mode_btn).to_be_visible() # Wait for it to be visible after collapse opens
        day_mode_btn.click()

        # Give theme time to apply
        page.wait_for_timeout(500)

        page.screenshot(path="jules-scratch/verification/02_light_theme.png")

        # 4. Enable gradient theme and take a screenshot
        theme_toggle = modal.locator("#theme-enabled-toggle")
        expect(theme_toggle).to_be_visible()
        theme_toggle.click()

        # Give theme time to apply
        page.wait_for_timeout(500)

        page.screenshot(path="jules-scratch/verification/03_gradient_theme.png")

    finally:
        browser.close()

with sync_playwright() as p:
    run(p)