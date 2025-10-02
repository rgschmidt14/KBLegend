from playwright.sync_api import sync_playwright
from verify_today_highlight_fix import verify_themed_highlight

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    verify_themed_highlight(page)
    browser.close()