import re
import json
from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)

    # --- Test 1: Light Mode UI ---
    context_light = browser.new_context(color_scheme='light')
    page_light = context_light.new_page()
    page_light.goto("http://localhost:8000/")

    # Screenshot 1: Advanced Options Layout & Toggles (Light Mode)
    page_light.get_by_role("button", name="Advanced Options").click()
    expect(page_light.get_by_role("heading", name="Advanced Options")).to_be_visible()
    # Expand the theme section first by clicking the header text
    page_light.get_by_text("Theme and Color").click()
    theme_section = page_light.locator("div[data-section-key='appearance']")
    expect(theme_section.locator(".collapsible-content")).to_be_visible()
    theme_section.screenshot(path="jules-scratch/verification/verification_1_adv_options_light.png")

    # Screenshot 2: Calendar Gradient (Light Mode)
    page_light.get_by_label("Enable Custom Theme Engine").check()
    page_light.wait_for_timeout(200)
    page_light.get_by_role("button", name="Status Spectrum").click()
    page_light.locator("#advanced-options-modal .close-button").click()
    page_light.wait_for_timeout(500) # Wait for modal to close
    page_light.locator("#show-calendar-btn").click()
    page_light.locator("#mainPlannerSection").screenshot(path="jules-scratch/verification/verification_2_gradient_light.png")

    page_light.close()
    context_light.close()

    # --- Test 2: Dark Mode UI ---
    context_dark = browser.new_context(color_scheme='dark')
    page_dark = context_dark.new_page()
    page_dark.goto("http://localhost:8000/")

    # Screenshot 3: Advanced Options Layout & Toggles (Dark Mode)
    page_dark.get_by_role("button", name="Advanced Options").click()
    expect(page_dark.get_by_role("heading", name="Advanced Options")).to_be_visible()
    # Expand the theme section first
    page_dark.get_by_text("Theme and Color").click()
    page_dark.get_by_label("Enable Custom Theme Engine").check()
    page_dark.get_by_role("button", name="Night").click()
    theme_section_dark = page_dark.locator("div[data-section-key='appearance']")
    expect(theme_section_dark.locator(".collapsible-content")).to_be_visible()
    theme_section_dark.screenshot(path="jules-scratch/verification/verification_3_adv_options_dark.png")

    # Screenshot 4: Calendar Gradient (Dark Mode)
    page_dark.get_by_role("button", name="Status Spectrum").click()
    page_dark.locator("#advanced-options-modal .close-button").click()
    page_dark.wait_for_timeout(500) # Wait for modal to close
    page_dark.locator("#show-calendar-btn").click()
    page_dark.locator("#mainPlannerSection").screenshot(path="jules-scratch/verification/verification_4_gradient_dark.png")

    page_dark.close()
    context_dark.close()

    # --- Test 3: Historical and Hint Management UI ---
    context_features = browser.new_context(color_scheme='dark')
    page_features = context_features.new_page()
    page_features.goto("http://localhost:8000/")

    # Inject data for historical task
    # Use a recent date to avoid being filtered out by the 4-week cleanup process.
    recent_date = "2025-10-06T17:00:00.000Z"
    archived_task = {
        "id": "_mytask123", "name": "Review Quarterly Report", "isKpi": False,
        "repetitionType": "none", "completed": True, "status": "blue",
        "dueDate": recent_date, "cycleEndDate": recent_date,
        "requiresFullAttention": True, "isAppointment": False
    }
    historical_record = {
        "originalTaskId": "_mytask123", "name": "Review Quarterly Report",
        "completionDate": recent_date, "actionDate": recent_date,
        "status": "green", "progress": 1, "originalDueDate": recent_date
    }
    page_features.evaluate(
        """(data) => {
            localStorage.setItem('tasks', '[]');
            localStorage.setItem('archivedTasks', data.archived);
            localStorage.setItem('historicalTasksV1', data.historical);
        }""",
        {
            "archived": json.dumps([archived_task]),
            "historical": json.dumps([historical_record]),
        },
    )
    page_features.reload()

    # Screenshot 5: Historical Overview Modal
    page_features.locator("#show-task-manager-btn").click()
    page_features.get_by_role("button", name="View All History").click()
    expect(page_features.get_by_role("heading", name="Historical Task Overview")).to_be_visible()
    page_features.locator("#historical-overview-modal .modal-content").screenshot(path="jules-scratch/verification/verification_5_historical_overview.png")
    page_features.locator("#historical-overview-modal .close-button").click()

    # Screenshot 6: Hint Management Section
    page_features.get_by_role("button", name="Advanced Options").click()
    expect(page_features.get_by_role("heading", name="Advanced Options")).to_be_visible()
    # Click the header to expand the section, using exact=True to avoid ambiguity
    page_features.get_by_text("Data & Notifications", exact=True).click()
    hint_section = page_features.locator("div[data-section-key='data']").locator(".collapsible-content")
    expect(hint_section).to_be_visible()
    # We screenshot the whole section content for context
    hint_section.screenshot(path="jules-scratch/verification/verification_6_hint_manager.png")

    # Close the modal before finishing the test
    page_features.locator("#advanced-options-modal .close-button").click()

    page_features.close()
    context_features.close()

    # --- Test 4: KPI Toggles ---
    context_kpi = browser.new_context(color_scheme='dark')
    page_kpi = context_kpi.new_page()
    page_kpi.goto("http://localhost:8000/")

    # Inject KPI task
    kpi_task = {
        "id": "_kpitask", "name": "Weekly Review", "isKpi": True,
        "repetitionType": "relative", "repetitionAmount": "1", "repetitionUnit": "weeks",
        "dueDate": "2024-08-05T17:00:00.000Z",
        "requiresFullAttention": True, "isAppointment": False
    }
    page_kpi.evaluate(
        """(data) => {
            localStorage.setItem('tasks', data.kpi);
            localStorage.setItem('historicalTasksV1', '[]');
        }""",
        {"kpi": json.dumps([kpi_task])},
    )
    page_kpi.reload()

    # Screenshot 7: KPI Controls
    page_kpi.locator("#show-dashboard-btn").click()
    kpi_controls = page_kpi.locator("#kpi-controls")
    expect(kpi_controls.get_by_role("button", name="Combined")).to_be_visible()
    kpi_controls.screenshot(path="jules-scratch/verification/verification_7_kpi_controls.png")

    page_kpi.close()
    context_kpi.close()

    browser.close()

with sync_playwright() as p:
    run(p)