import json
import re
from playwright.sync_api import sync_playwright, Page, expect

def run_verification(page: Page):
    """
    Verifies the journal sorting and inline thoughts editing.
    """
    page.goto("http://localhost:8000")

    # Inject test data into the correct localStorage keys
    journal_entries = [
        {"id": "_j1", "createdAt": "2025-10-13T10:00:00.000Z", "title": "Regular Entry 1", "content": "Content 1", "icon": "fa-solid fa-star"},
        {"id": "_j2", "createdAt": "2025-10-14T12:00:00.000Z", "title": "Regular Entry 2", "content": "Content 2", "icon": "fa-solid fa-heart"},
        {"id": "_j3", "isWeeklyGoal": True, "weekStartDate": "2025-10-12T00:00:00.000Z", "title": "Weekly Goal", "content": "My goal for the week.", "icon": "fa-solid fa-bullseye"},
    ]

    tasks = [
        {"id": "_t1", "name": "Task with Thoughts", "thoughts": "Initial thought."}
    ]

    # appState contains journal, but not tasks
    app_state = {
        "journal": journal_entries,
    }

    # uiSettings is needed to bypass the welcome modal
    ui_settings = {
        "welcomeScreenShown": True
    }

    # Set the localStorage items separately, as the app expects
    page.evaluate(f"localStorage.setItem('tasks', '{json.dumps(tasks)}')")
    page.evaluate(f"localStorage.setItem('pilotPlannerDataV8', '{json.dumps(app_state)}')")
    page.evaluate(f"localStorage.setItem('uiSettings', '{json.dumps(ui_settings)}')")

    page.reload()

    # Navigate to journal and take screenshots
    page.get_by_role("button", name="Journal").click()
    page.screenshot(path="jules-scratch/verification/journal_date_desc.png")

    page.locator("#journal-sort-direction").select_option("asc")
    page.screenshot(path="jules-scratch/verification/journal_date_asc.png")

    page.locator("#journal-sort-by").select_option("icon")
    page.screenshot(path="jules-scratch/verification/journal_icon_sort.png")

    # Verify inline editing
    page.get_by_role("button", name="Task Manager").click()
    page.get_by_text("Task with Thoughts").click()

    thoughts_editor = page.locator("#task-thoughts-content-_t1")
    thoughts_editor.click()
    thoughts_editor.fill("Updated thoughts.")

    # Click the heading *inside* the modal to trigger the blur event
    page.locator("#task-view-content").get_by_role("heading", name="Task with Thoughts").click()

    page.screenshot(path="jules-scratch/verification/inline_thoughts_edit.png")


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        run_verification(page)
        browser.close()

if __name__ == "__main__":
    main()
