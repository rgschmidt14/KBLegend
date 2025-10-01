from playwright.sync_api import sync_playwright, Page, expect

def run_verification(page: Page):
    """
    This script verifies the UI changes for time/scheduling and KPI week navigation.
    """
    # Navigate to the application
    page.goto("http://localhost:8000")

    # --- Part 1: Verify Time and Scheduling UI Changes ---

    # Switch to the Task Manager view
    page.click("#show-task-manager-btn")

    # Open the task modal
    page.click("#add-task-btn")

    # Switch to advanced mode
    simple_mode_toggle = page.locator("#simple-mode-toggle")
    simple_mode_toggle.check()
    expect(page.locator("#advanced-task-fields")).to_be_visible()

    # Scroll to the "Time and Scheduling" section and take a screenshot
    time_and_scheduling_legend = page.get_by_text("Time and Scheduling")
    time_and_scheduling_legend.scroll_into_view_if_needed()
    page.screenshot(path="jules-scratch/verification/01_initial_time_fields.png")

    # Select "Relative Time" for "Due Date Type"
    due_date_type_select = page.locator("#due-date-type")
    due_date_type_select.select_option("relative")

    # Verify that the "Start Date & Time" field is hidden
    start_date_group = page.locator("#start-date-group")
    expect(start_date_group).to_be_hidden()
    page.screenshot(path="jules-scratch/verification/02_relative_time_hides_start_date.png")

    # Select "Start Time" for "Time Input Type"
    time_input_type_select = page.locator("#time-input-type")
    time_input_type_select.select_option("start")

    # Verify that the relative time label has changed to "Start In:"
    relative_due_date_label = page.locator("#relative-due-date-label")
    expect(relative_due_date_label).to_have_text("Start In:")
    page.screenshot(path="jules-scratch/verification/03_start_in_label.png")

    # Close the modal
    page.click(".close-button")

    # --- Part 2: Verify KPI View Week Navigation ---

    # Navigate to the Dashboard view
    page.click("#show-dashboard-btn")

    # Verify that the KPI navigation buttons are present
    kpi_prev_week_btn = page.locator("#kpi-prev-week-btn")
    kpi_today_btn = page.locator("#kpi-today-btn")
    kpi_next_week_btn = page.locator("#kpi-next-week-btn")

    expect(kpi_prev_week_btn).to_be_visible()
    expect(kpi_today_btn).to_be_visible()
    expect(kpi_next_week_btn).to_be_visible()

    page.screenshot(path="jules-scratch/verification/04_kpi_nav_buttons_visible.png")

    # Click the "Prev" button to test functionality
    kpi_prev_week_btn.click()

    # Take a screenshot to show the view has (presumably) updated
    page.screenshot(path="jules-scratch/verification/05_kpi_prev_week_clicked.png")


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    run_verification(page)
    browser.close()