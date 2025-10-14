
import json
import re
from playwright.sync_api import sync_playwright, expect

def run_verification(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        page.goto("http://localhost:8000")

        # 1. Inject data
        task_id = "task1"
        task = {
            "id": task_id,
            "name": "Test Task for Icon Features",
            "thoughts": "Initial thought.",
            "icon": "",
            "dueDate": "2025-10-26T10:00:00.000Z",
            "repetitionType": "none",
            "completed": False,
        }
        historical_task = {
            "originalTaskId": task_id,
            "name": "Test Task for Icon Features",
            "completionDate": "2025-10-25T10:00:00.000Z",
            "actionDate": "2025-10-25T10:00:05.000Z",
            "status": "green",
            "thoughts": "This is a historical thought.",
            "icon": ""
        }

        ui_settings = {"welcomeScreenShown": True, "syncTaskIcons": True}

        page.evaluate("""(data) => {
            localStorage.setItem('tasks', JSON.stringify(data.tasks));
            localStorage.setItem('historicalTasksV1', JSON.stringify(data.historicalTasks));
            localStorage.setItem('uiSettings', JSON.stringify(data.uiSettings));
        }""", {
            "tasks": [task],
            "historicalTasks": [historical_task],
            "uiSettings": ui_settings
        })

        page.reload()
        page.locator("#show-task-manager-btn").click()
        page.wait_for_selector("#task-list")

        # 2. Screenshot of the new toggle in Advanced Options
        page.locator("#advancedOptionsBtnMain").click()
        page.wait_for_selector("#advanced-options-modal.active")
        page.locator('div.collapsible-section[data-section-key="history"] h3.collapsible-header').click()
        page.screenshot(path="jules-scratch/verification/01_sync_toggle.png")
        page.locator("#advanced-options-modal .close-button").click()

        # 3. Trigger and screenshot the prompt modal
        page.locator(f".task-item[data-task-id='{task_id}']").click()
        page.wait_for_selector("#task-view-modal.active")

        # Click the 'Stats' button to see the history
        page.locator('button[data-action="viewTaskStats"]').click()
        page.wait_for_selector("#task-stats-content")

        # Click on the specific historical record to open its view
        historical_event_id = f"hist_{task_id}_{historical_task['completionDate']}"
        page.locator(f'div[data-history-event-id="{historical_event_id}"]').click()

        # Now the historical view should be open
        page.wait_for_selector("#task-view-modal.active")
        expect(page.get_by_role("heading", name="Thoughts")).to_be_visible()

        page.locator('button[data-action="editHistoryThoughts"]').click()
        page.locator("#task-view-modal textarea").fill("A new thought is added.")
        page.locator('button[data-action="saveHistoryThoughts"]').click()

        page.wait_for_selector("#add-icon-prompt-modal.active")
        page.screenshot(path="jules-scratch/verification/02_prompt_modal.png")

        # 4. Click "Yes" and screenshot the simplified icon picker
        page.locator("#prompt-choose-icon").click()
        page.wait_for_selector("#icon-picker-modal.active")
        expect(page.locator("#icon-style-selector")).not_to_be_visible()
        page.screenshot(path="jules-scratch/verification/03_icon_picker.png")

        # Expand the "General" category to make the icon visible
        page.locator('.icon-picker-category-header:has-text("General")').click()

        # 5. Select an icon and screenshot the updated view
        page.locator('div[data-icon="fa-solid fa-star"]').click()

        # The icon picker closes, but the original task view modal is still open. We need to close it.
        page.locator("#task-view-modal .close-button").click()

        # After the icon picker closes, we need to re-open the historical task view to see the change
        page.locator(f".task-item[data-task-id='{task_id}']").click()
        page.wait_for_selector("#task-view-modal.active")
        page.locator('button[data-action="viewTaskStats"]').click()
        page.wait_for_selector("#task-stats-content")
        page.locator(f'div[data-history-event-id="{historical_event_id}"]').click()
        page.wait_for_selector("#task-view-modal.active")

        expect(page.locator("#task-view-content i.fa-star")).to_be_visible()
        page.screenshot(path="jules-scratch/verification/04_updated_icon.png")

        # 6. Screenshot the bulk update button
        page.locator('button[data-action="viewTaskStats"]').click()
        page.wait_for_selector("#task-stats-content")
        expect(page.locator('button[data-action="bulkUpdateIcon"]')).to_be_visible()
        page.screenshot(path="jules-scratch/verification/05_bulk_update_button.png")

    finally:
        browser.close()

with sync_playwright() as p:
    run_verification(p)
