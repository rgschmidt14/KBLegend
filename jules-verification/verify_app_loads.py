import re
from playwright.sync_api import Page, expect

def test_app_loads(page: Page):
    page.goto("http://localhost:8000")
    # Wait for the main app container to be visible
    expect(page.locator("#app")).to_be_visible(timeout=10000)
    page.screenshot(path="jules-verification/app_load_test.png")
