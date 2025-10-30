
import json
from datetime import datetime, timedelta
from playwright.sync_api import sync_playwright, expect

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # Listen for console messages
        page.on("console", lambda msg: print(f"Browser console: {msg.text}"))

        page.goto("http://localhost:8000")

        # 1. Bypass Welcome Modal
        ui_settings = {"welcomeScreenShown": True}
        page.evaluate(f"localStorage.setItem('uiSettings', JSON.stringify({json.dumps(ui_settings)}));")
        page.reload()
        expect(page.get_by_role("heading", name="Task & Mission Planner")).to_be_visible()

        # Task 1: Verify Journal Icon Sorting
        print("Verifying Journal Icon Sorting...")
        journal_data = {
            "journal": [
                {
                    "id": "_testgoal1",
                    "createdAt": (datetime.now() - timedelta(days=2)).isoformat(),
                    "title": "A goal from the past",
                    "content": "Some content",
                    "icon": "fa-solid fa-plane",
                    "isWeeklyGoal": False,
                },
                {
                    "id": "_testentry1",
                    "createdAt": (datetime.now() - timedelta(days=1)).isoformat(),
                    "title": "Another entry",
                    "content": "More content",
                    "icon": "fa-solid fa-star",
                }
            ]
        }
        page.evaluate('data => localStorage.setItem("pilotPlannerDataV8", JSON.stringify(data))', journal_data)

        page.reload()

        page.get_by_role("button", name="Journal").click()
        expect(page.get_by_role("heading", name="Journal", exact=True)).to_be_visible()

        page.locator("#journal-view").get_by_label("Sort by:").select_option("icon")

        # Wait for the header to be visible and correct
        plane_header = page.get_by_text("Plane", exact=True)
        expect(plane_header).to_be_visible()
        page.screenshot(path="jules-scratch/verification/01_journal_view.png")
        print("Journal verification successful.")

        browser.close()

if __name__ == "__main__":
    run_verification()
