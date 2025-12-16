
from playwright.sync_api import sync_playwright
import time
import json
from datetime import datetime, timedelta

def verify_occurrence_editing():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # 1. Setup Data in LocalStorage
        now = datetime.now()
        task_id = "test_recurring_task"
        task_name = "Weekly Meeting"
        due_date = now + timedelta(hours=1)

        task = {
            "id": task_id,
            "name": task_name,
            "dueDate": due_date.isoformat(),
            "createdAt": now.isoformat(),
            "repetitionType": "absolute",
            "repetitionAbsoluteFrequency": "weekly",
            "repetitionAbsoluteWeeklyDays": [0, 1, 2, 3, 4, 5, 6],
            "status": "green",
            "completed": False,
            "misses": 0,
            "categoryId": "test_cat",
            "estimatedDurationAmount": 1,
            "estimatedDurationUnit": "hours",
            "occurrenceOverrides": {}
        }

        category = {
            "id": "test_cat",
            "name": "Test Category",
            "color": "#ff0000"
        }

        # Inject data - CRITICAL: Set welcomeScreenShown to true
        page.goto("http://localhost:8000")

        page.evaluate(f"""
            localStorage.setItem('tasks', JSON.stringify([{json.dumps(task)}]));
            localStorage.setItem('categories', JSON.stringify([{json.dumps(category)}]));
            localStorage.setItem('uiSettings', JSON.stringify({{activeView: 'calendar-view', welcomeScreenShown: true}}));
        """)

        # Reload to apply data
        page.reload()

        # Wait for calendar to render
        page.wait_for_selector("#calendar")

        # 2. Interact
        # Wait for events to appear
        try:
            page.wait_for_selector(".fc-event", timeout=5000)
        except:
            print("No events found!")
            page.screenshot(path="verification/no_events.png")
            return

        events = page.locator(".fc-event").all()
        print(f"Found {len(events)} events.")

        if len(events) > 0:
            # Click the first event
            events[0].click()

            # Wait for Task View Modal
            page.wait_for_selector("#task-view-modal", state="visible")
            print("Task View Modal Opened")

            # Click "Edit" button
            edit_btn = page.locator('[data-action="editTaskFromView"]')

            # Ensure it's visible before clicking
            if edit_btn.is_visible():
                edit_btn.click()
                print("Clicked Edit")

                # Wait for Simple Edit Modal
                try:
                    page.wait_for_selector("#simple-edit-modal", state="visible", timeout=3000)
                    print("Simple Edit Modal Opened - SUCCESS")

                    # Verify text "Edit Occurrence"
                    content = page.locator("#simple-edit-modal").text_content()
                    if "Edit Occurrence" in content:
                        print("Modal text verified: 'Edit Occurrence' found.")
                    else:
                        print(f"Modal text check FAILED. Content: {content[:100]}")

                    page.screenshot(path="verification/occurrence_edit_modal.png")

                    # Also verify hidden fields if possible
                    occurrence_id_input = page.locator("#simple-edit-occurrence-id")
                    if occurrence_id_input:
                        val = occurrence_id_input.input_value()
                        print(f"Occurrence ID in form: {val}")
                        if "_" in val:
                            print("Occurrence ID format looks correct (contains underscore).")
                        else:
                            print("Occurrence ID format looks WRONG (no underscore).")

                except Exception as e:
                    print(f"Simple Edit Modal did NOT open: {e}")
                    page.screenshot(path="verification/failed_to_open_simple_modal.png")
            else:
                print("Edit button not visible")
                page.screenshot(path="verification/no_edit_button.png")

        browser.close()

if __name__ == "__main__":
    verify_occurrence_editing()
