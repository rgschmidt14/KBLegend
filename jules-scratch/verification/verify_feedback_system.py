from playwright.sync_api import sync_playwright, expect
from datetime import datetime, timedelta

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(color_scheme="dark")
    page = context.new_page()

    page.goto("http://localhost:8000", timeout=60000)

    # --- SETUP: Navigate to the correct view and set advanced mode ---
    expect(page.get_by_role("button", name="Task Manager")).to_be_visible(timeout=10000)
    page.get_by_role("button", name="Task Manager").click()

    add_task_button = page.get_by_role("button", name="Add New Task")
    expect(add_task_button).to_be_visible(timeout=5000)

    # Enter Advanced Mode ONCE. The setting will persist for the session.
    add_task_button.click()
    expect(page.get_by_role("heading", name="Add New Task")).to_be_visible()
    page.locator("#simple-mode-toggle").click()
    expect(page.locator("#task-repetition")).to_be_visible()
    page.get_by_role("button", name="Cancel").click()
    expect(page.get_by_role("heading", name="Add New Task")).not_to_be_visible()

    # --- Date Helpers ---
    now = datetime.now()
    tomorrow = now + timedelta(days=1)
    three_days_ago = now - timedelta(days=3)
    three_days_ago_str = three_days_ago.strftime('%Y-%m-%dT%H:%M')
    tomorrow_str = tomorrow.strftime('%Y-%m-%dT%H:%M')

    # --- Task 1: Early Completion (makes a 'blue' record) ---
    add_task_button.click()
    expect(page.get_by_role("heading", name="Add New Task")).to_be_visible()
    page.get_by_label("Task Name").fill("Early Task")
    page.get_by_label("Due Date & Time:").fill(tomorrow_str)
    page.get_by_role("button", name="Save Task").click()

    early_task_locator = page.locator(".task-item", has_text="Early Task")
    expect(early_task_locator).to_be_visible()
    early_task_locator.get_by_role("button", name="Complete").click()
    early_task_locator.get_by_role("button", name="Yes", exact=True).click()
    expect(early_task_locator.get_by_role("button", name="Yes", exact=True)).not_to_be_visible()

    # --- Task 2: Late Completion (makes a 'green' record) ---
    add_task_button.click()
    expect(page.get_by_role("heading", name="Add New Task")).to_be_visible()
    page.get_by_label("Task Name").fill("Late Task")
    page.get_by_label("Due Date & Time:").fill(three_days_ago_str)
    page.get_by_role("button", name="Save Task").click()

    late_task_locator = page.locator(".task-item", has_text="Late Task")
    expect(late_task_locator).to_be_visible()
    late_task_locator.get_by_role("button", name="Done", exact=True).click()
    late_task_locator.get_by_role("button", name="Yes", exact=True).click()
    expect(page.locator(".task-item", has_text="Late Task")).not_to_be_visible(timeout=5000)

    # --- Task 3: Repeating Misses (makes 'red' and 'black' records) ---
    add_task_button.click()
    expect(page.get_by_role("heading", name="Add New Task")).to_be_visible()
    page.get_by_label("Task Name").fill("Repeating Miss Task")
    page.locator("#task-repetition").select_option("relative")

    repetition_group = page.locator("#repetition-relative-group")
    expect(repetition_group).to_be_visible()

    repetition_group.locator("#repetition-amount").fill("1")
    repetition_group.locator("#repetition-unit").select_option("days")
    page.get_by_label("Due Date & Time:").fill(three_days_ago_str)
    page.get_by_role("button", name="Save Task").click()

    miss_task_locator = page.locator(".task-item", has_text="Repeating Miss Task")
    expect(miss_task_locator).to_be_visible()
    miss_task_locator.get_by_role("button", name="Missed", exact=True).click()
    miss_task_locator.get_by_role("button", name="Yes", exact=True).click()
    expect(miss_task_locator.get_by_role("button", name="Yes", exact=True)).not_to_be_visible()

    # --- Verification ---
    miss_task_locator.click()
    task_view_modal = page.locator("#task-view-modal")
    expect(task_view_modal).to_be_visible()
    expect(task_view_modal.get_by_role("heading", name="Repeating Miss Task")).to_be_visible()

    page.get_by_role("button", name="View Statistics").click()

    stats_modal_content = page.locator("#task-stats-content")
    expect(stats_modal_content).to_be_visible()
    expect(stats_modal_content.get_by_role("heading", name="Performance Over Time")).to_be_visible()

    # Use .first to avoid strict mode violation, as multiple "Black" statuses are expected
    expect(stats_modal_content.locator("span > span", has_text="Red").first).to_be_visible()
    expect(stats_modal_content.locator("span > span", has_text="Black").first).to_be_visible()

    stats_modal_content.screenshot(path="jules-scratch/verification/verification.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
