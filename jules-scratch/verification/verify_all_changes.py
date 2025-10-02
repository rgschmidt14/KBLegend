import json
from playwright.sync_api import sync_playwright, Page, expect
from datetime import datetime, timedelta

def create_task_via_ui(page: Page, name: str, due_date: datetime, duration: int, is_repeating: bool = False):
    """Uses the UI to create a task with robust ID selectors."""
    page.get_by_role("button", name="Add New Task").click()

    modal = page.locator("#task-modal")
    expect(modal).to_be_visible()

    # Toggle to advanced mode to access all fields
    simple_mode_toggle = modal.locator("#simple-mode-toggle")
    if not simple_mode_toggle.is_checked():
        simple_mode_toggle.check()

    # Wait for the advanced section to become visible
    advanced_fields = modal.locator("#advanced-task-fields")
    expect(advanced_fields).to_be_visible()

    # Use ID selectors for robustness
    modal.locator("#task-name").fill(name)

    advanced_fields.locator("#due-date-type").select_option("absolute")
    advanced_fields.locator("#time-input-type").select_option("due")
    advanced_fields.locator("#task-due-date").fill(due_date.strftime("%Y-%m-%dT%H:%M:%S"))
    advanced_fields.locator("#estimated-duration-amount").fill(str(duration))

    if is_repeating:
        advanced_fields.locator("#task-repetition").select_option("relative")
        advanced_fields.locator("#repetition-amount").fill("1")
        advanced_fields.locator("#repetition-unit").select_option("days")

    modal.get_by_role("button", name="Save Task").click()
    expect(modal).not_to_be_visible()

def mark_task_as_completed(page: Page, name: str):
    """Finds a task in the list and marks it as complete."""
    task_list = page.locator("#task-list")
    task_item = task_list.locator(".task-item", has_text=name).first

    # Click complete and confirm
    task_item.get_by_role("button", name="Complete").click()
    task_item.get_by_role("button", name="Yes").click()

def run_verification(page: Page):
    """Runs the verification steps by creating data via the UI."""
    page.goto("http://localhost:8000")

    # 1. Create the necessary tasks using the UI
    now = datetime.now()
    create_task_via_ui(page, "Short Task", now.replace(hour=10, minute=15), 15)
    create_task_via_ui(page, "Overdue Repeating Task", now - timedelta(days=1), 60, is_repeating=True)
    create_task_via_ui(page, "Recent History Task", now - timedelta(days=3), 30)

    # 2. Switch to task manager to complete one task for history
    page.get_by_role("button", name="Task Manager").click()
    mark_task_as_completed(page, "Recent History Task")

    # 3. Go back to calendar and verify
    page.get_by_role("button", name="Calendar").click()
    page.get_by_role("button", name="Week", exact=True).click()

    # Add a delay to ensure all events render after the UI interactions
    page.wait_for_timeout(2000)

    calendar_container = page.locator("#calendar")
    expect(calendar_container.get_by_text("Short Task")).to_be_visible()
    expect(calendar_container.get_by_text("Overdue Repeating Task").first).to_be_visible()
    expect(calendar_container.get_by_text("Recent History Task")).to_be_visible()

    page.screenshot(path="jules-scratch/verification/calendar_verification.png")

    # 4. Verify advanced options
    page.get_by_role("button", name="Advanced Options").click()
    adv_modal = page.locator("#advanced-options-modal")
    expect(adv_modal).to_be_visible()

    adv_modal.get_by_role("button", name="Migration Tool").click()
    migration_modal = page.locator("#data-migration-modal")
    expect(migration_modal).to_be_visible()

    expect(migration_modal.get_by_role("heading", name="Danger Zone")).to_be_visible()
    expect(migration_modal.get_by_role("button", name="Delete All Task History")).to_be_visible()

    page.screenshot(path="jules-scratch/verification/advanced_options_verification.png")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            run_verification(page)
            print("Verification script ran successfully.")
        except Exception as e:
            print(f"An error occurred: {e}")
            page.screenshot(path="jules-scratch/verification/error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    main()