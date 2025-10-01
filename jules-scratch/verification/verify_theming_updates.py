from playwright.sync_api import sync_playwright, Page, expect

def handle_console(msg):
    if msg.type in ['error', 'warning']:
        print(f"Browser Console ({msg.type}): {msg.text}")

def run_verification(page: Page):
    """
    Verifies the new 8-color text system and corrected button theming.
    """
    page.on("console", handle_console)

    # 1. Navigate to the application
    page.goto("http://localhost:8000")

    # 2. Switch to the Task Manager view to make the 'Add Task' button visible
    task_manager_view_btn = page.locator('#show-task-manager-btn')
    task_manager_view_btn.click()

    # 3. Create a new task to ensure there's an element to verify
    add_task_btn = page.locator('#add-task-btn')
    expect(add_task_btn).to_be_visible()
    add_task_btn.click()

    task_name_input = page.locator('#task-name')
    expect(task_name_input).to_be_visible()
    task_name_input.fill("Theme Verification Task")
    page.locator('button[type="submit"]').click()

    # Wait for the modal to close before looking for the task
    expect(page.locator('#task-modal')).not_to_be_visible()

    # Now, wait for the task to appear in the list
    created_task = page.locator('.task-item:has-text("Theme Verification Task")')
    expect(created_task).to_be_visible()

    # 3. Open the Advanced Options modal
    adv_options_btn = page.locator('#advancedOptionsBtnMain')
    expect(adv_options_btn).to_be_visible()
    adv_options_btn.click()

    # 4. Enable the theme and set a new color
    theme_toggle = page.locator('#theme-enabled-toggle')
    expect(theme_toggle).to_be_visible()
    theme_toggle.check()

    theme_color_input = page.locator('#theme-base-color')
    expect(theme_color_input).to_be_visible()

    # Use page.evaluate to set the color input's value directly
    page.evaluate("document.querySelector('#theme-base-color').value = '#8b5cf6'")
    theme_color_input.dispatch_event('change')

    # 5. Close the modal
    close_btn = page.locator('#advanced-options-modal .close-button')
    close_btn.click()

    # 6. Wait for the theme to apply. The previous expect acted as a wait.
    # A short static wait is sufficient here for the UI to update.
    page.wait_for_timeout(500)

    # 7. Hover over the "Task List" button to show the hover effect
    task_manager_btn = page.locator('#show-task-manager-btn')
    task_manager_btn.hover()

    # 8. Take a screenshot for visual verification
    screenshot_path = "jules-scratch/verification/theming_verification.png"
    page.screenshot(path=screenshot_path)

    print(f"Screenshot saved to {screenshot_path}")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        run_verification(page)
        browser.close()

if __name__ == "__main__":
    main()