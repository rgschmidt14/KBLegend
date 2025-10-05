from playwright.sync_api import sync_playwright, Page, expect

def run_verification(page: Page):
    """
    This function contains the actual test logic. It has been updated to
    more robustly wait for the task view modal before checking its content.
    """
    page.goto("http://localhost:8000")
    task_name = "History Deletion Test Task"

    try:
        # 1. Create a new repeating task to generate history
        page.get_by_role("button", name="Add New Task").click()
        page.get_by_label("Task Name").fill(task_name)

        page.locator("#simple-mode-toggle").check()
        page.locator("#task-repetition").select_option("relative")
        page.locator("#repetition-amount").fill("1")
        page.locator("#repetition-unit").select_option("days")
        page.get_by_role("button", name="Save Task").click()

        # 2. Switch to Task Manager view and complete the task
        page.get_by_role("button", name="Task Manager").click()

        task_list_item = page.locator(f".task-item:has-text('{task_name}')")
        expect(task_list_item).to_be_visible(timeout=5000)
        task_list_item.get_by_role("button", name="Complete").click()
        page.get_by_role("button", name="Yes").click()

        # 3. Navigate to the calendar and find the historical event
        page.get_by_role("button", name="Calendar").click()

        historical_event = page.locator(f".fc-event:has-text('{task_name}')").first
        expect(historical_event).to_be_visible(timeout=10000)
        historical_event.click()

        # 4. Trigger the inline deletion confirmation
        # First, wait for the modal container itself to be visible.
        task_view_modal = page.locator("#task-view-modal")
        expect(task_view_modal).to_be_visible()

        # Now, look for the title within the visible modal.
        modal_title = task_view_modal.get_by_role("heading", name=task_name)
        expect(modal_title).to_be_visible()

        page.get_by_role("button", name="Delete This Record").click()

        # 5. Verify the confirmation UI is visible and take screenshot
        expect(page.get_by_text("Delete this specific history record?")).to_be_visible()
        page.screenshot(path="jules-scratch/verification/verification.png")

        # 6. Confirm the deletion
        page.get_by_role("button", name="Yes, Delete Record").click()

        # 7. Verify the modal is closed and the event is gone
        expect(task_view_modal).not_to_be_visible()
        expect(historical_event).not_to_be_visible()

    finally:
        # 8. Clean up the active task if it still exists
        page.get_by_role("button", name="Task Manager").click(force=True)

        task_list_item_cleanup = page.locator(f".task-item:has-text('{task_name}')")

        if task_list_item_cleanup.count() > 0:
            task_list_item_cleanup.get_by_role("button", name="Delete").click(force=True)
            task_list_item_cleanup.get_by_role("button", name="Yes").click()
            expect(task_list_item_cleanup).not_to_be_visible()

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        run_verification(page)
        browser.close()

if __name__ == "__main__":
    main()