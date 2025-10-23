from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            # Add a console listener to catch JS errors
            page.on("console", lambda msg: print(f"BROWSER CONSOLE: {msg.text}"))

            page.goto("http://localhost:8000", wait_until="load")

            # Wait for the main app container to be visible
            expect(page.locator("#app")).to_be_visible(timeout=10000)

            page.screenshot(path="jules-verification/app_loads_successfully.png")
            print("SUCCESS: The application loaded correctly. Screenshot saved to jules-verification/app_loads_successfully.png")

        except Exception as e:
            print(f"ERROR: The application failed to load. {e}")
            page.screenshot(path="jules-verification/app_load_FAILURE.png")

        finally:
            browser.close()

run()
