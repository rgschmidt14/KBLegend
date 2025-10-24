
import re
import json
from playwright.sync_api import sync_playwright, expect

def run_verification(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # Step 1: Navigate to the app and bypass welcome modal
        page.goto("http://localhost:8000")

        # Inject uiSettings to bypass the welcome screen
        ui_settings = {"welcomeScreenShown": True}
        page.evaluate(f"localStorage.setItem('uiSettings', '{json.dumps(ui_settings)}')")

        # Inject some test data
        tasks = [
            {
                "id": "task1", "name": "Test Task 1", "categoryId": "cat1", "dueDate": "2025-10-24T10:00:00.000Z",
                "icon": "fa-solid fa-question", "repetitionType": "none", "completed": False, "status": "green"
            }
        ]
        categories = [
            {"id": "cat1", "name": "Category 1", "color": "#ff0000", "icon": None, "applyIconToNewTasks": False}
        ]

        page.evaluate(f"localStorage.setItem('tasks', '{json.dumps(tasks)}')")
        page.evaluate(f"localStorage.setItem('categories', '{json.dumps(categories)}')")

        # Reload the page to apply the injected data
        page.reload()

        # Step 2: Open Advanced Options and go to Category Management
        page.locator("#advancedOptionsBtnMain").click()

        # Wait for the modal to be visible
        modal = page.locator("#advanced-options-modal")
        expect(modal).to_be_visible()

        # Click the header to expand the section
        category_management_header = page.locator(".collapsible-header", has_text="Category Management")
        category_management_header.click()

        # Wait for the content to be visible
        category_content = page.locator("#category-manager-list")
        expect(category_content).to_be_visible()

        # Step 3: Set an icon for the category
        category_item = page.locator("#category-display-cat1")
        icon_button = category_item.locator("button[data-action='openIconPicker']")
        expect(icon_button).to_be_visible() # Explicitly wait for the button
        icon_button.click() # The icon picker button

        # Wait for the icon picker to be visible
        icon_picker = page.locator("#icon-picker-modal")
        expect(icon_picker).to_be_visible()

        # Choose an icon
        icon_picker.get_by_role("button", name="Productivity & Work").click()
        icon_picker.get_by_role("button", name="").first.click() # fa-briefcase

        # Step 4: Enable "Apply icon automatically" and handle the confirmation
        apply_toggle = page.locator("#category-display-cat1").get_by_role("checkbox")
        apply_toggle.check()

        # Wait for the confirmation modal
        confirm_modal = page.locator("#category-icon-confirm-modal")
        expect(confirm_modal).to_be_visible()

        # Click "Apply to All"
        confirm_modal.get_by_role("button", name="Apply to All").click()

        # Step 5: Close advanced options and verify the icon change on the task
        page.locator("#advanced-options-modal").get_by_role("button", name="Close").click()

        # Verify the icon on the task card
        task_item = page.locator(".task-item[data-task-id='task1']")
        expect(task_item.locator("i")).to_have_class(re.compile(r"fa-briefcase"))

        # Step 6: Take a screenshot
        page.screenshot(path="jules-scratch/verification/category-icon-verification.png")

    finally:
        context.close()
        browser.close()

with sync_playwright() as p:
    run_verification(p)
