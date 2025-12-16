from playwright.sync_api import sync_playwright, expect
import time
import json

def verify_features():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()

        initial_tasks = [
            {
                "id": "task_1",
                "title": "KPI Test Task",
                "status": "blue",
                "completed": False,
                "dueDate": "2025-06-03T10:00:00.000Z",
                "duration": 60,
                "category": "work",
                "kpiEnabled": True
            }
        ]

        initial_categories = [
             {"id": "work", "name": "Work", "color": "#ff0000", "icon": "fa-briefcase"},
             {"id": "personal", "name": "Personal", "color": "#00ff00", "icon": "fa-user"}
        ]

        # Init script
        context.add_init_script(f"""
            localStorage.setItem('uiSettings', JSON.stringify({{
                "welcomeScreenShown": true,
                "activeView": "task-manager",
                "dayNightMode": "day",
                "dashboardWeekOffset": 0,
                "isSimpleMode": true
            }}));
            localStorage.setItem('tasks', JSON.stringify({json.dumps(initial_tasks)}));
            localStorage.setItem('pilotPlannerDataV8', JSON.stringify({{
                "categories": {json.dumps(initial_categories)}
            }}));
        """)

        page = context.new_page()

        print("Navigating to app...")
        page.goto("http://localhost:8000")

        try:
            expect(page.locator("#main-view-nav")).to_be_visible(timeout=10000)
            print("App loaded.")
        except:
            print("Timeout waiting for app load.")
            page.screenshot(path="verification/debug_load_fail.png")
            browser.close()
            return

        # --- Test Modal Layout (Advanced vs Simple) ---
        print("Testing Modal Layout...")
        try:
            # Force click Task Manager Nav
            page.locator("#show-task-manager-btn").click()

            # Click Add Task
            page.locator("#add-task-btn").click()
            expect(page.locator("#task-modal")).to_be_visible()

            # Toggle Advanced
            # The input is #simple-mode-toggle.
            toggle = page.locator("#simple-mode-toggle")
            toggle.click()

            # Assertion: The "Time & Scheduling" legend should be visible
            # This proves the fields are inside the advanced fieldset
            expect(page.get_by_text("Time & Scheduling")).to_be_visible()
            print("Verified 'Time & Scheduling' section is visible.")

            time.sleep(1)
            page.screenshot(path="verification/advanced_mode_final.png")
            print("Captured Advanced Mode Final.")

        except Exception as e:
            print(f"Modal Layout Test Failed: {e}")
            page.screenshot(path="verification/modal_fail.png")

        browser.close()
        print("Verification complete.")

if __name__ == "__main__":
    verify_features()
