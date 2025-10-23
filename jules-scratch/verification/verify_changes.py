
import asyncio
from playwright.async_api import async_playwright, expect
import json

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Go to the app to establish origin for localStorage
        await page.goto("http://localhost:8000")

        # --- SCENARIO 1: Test Journal ---
        journal_entry = {
            "id": "_abcdef123", "createdAt": "2025-10-20T10:00:00.000Z", "title": "My Test Journal Entry",
            "content": "This is the content of the journal entry.", "isWeeklyGoal": True, "weekStartDate": "2025-10-19"
        }
        planner_data_journal = {"journal": [journal_entry], "uiSettings": {"welcomeScreenShown": True}}

        await page.evaluate('localStorage.clear()')
        await page.evaluate(f'localStorage.setItem("pilotPlannerDataV8", {json.dumps(json.dumps(planner_data_journal))})')

        await page.reload()
        await page.wait_for_load_state('domcontentloaded')

        await page.click("#show-journal-btn")
        await expect(page.locator(".journal-week-header")).to_be_visible()

        await page.screenshot(path="jules-scratch/verification/journal_collapsed.png")
        await page.click(".journal-week-header")
        await expect(page.locator(".journal-entries-container")).not_to_have_class("hidden")
        await page.screenshot(path="jules-scratch/verification/journal_expanded.png")

        # --- SCENARIO 2: Test Calendar ---
        task = {
            "id": "_task123", "name": "Clickable Task", "dueDate": "2025-10-21T14:00:00.000Z",
            "status": "green"
        }
        planner_data_calendar = {"uiSettings": {"welcomeScreenShown": True}}

        await page.evaluate('localStorage.clear()')
        await page.evaluate(f'localStorage.setItem("tasks", {json.dumps(json.dumps([task]))})')
        await page.evaluate(f'localStorage.setItem("pilotPlannerDataV8", {json.dumps(json.dumps(planner_data_calendar))})')

        await page.reload()
        await page.wait_for_load_state('domcontentloaded')

        await page.click("#show-calendar-btn")
        await page.click('[data-view="month"]')
        await expect(page.locator('.fc-event-main')).to_be_visible()

        await page.click('.fc-event-main')
        await expect(page.locator("#task-view-modal.active")).to_be_visible()
        await page.screenshot(path="jules-scratch/verification/calendar_modal.png")
        await page.click("#task-view-modal .close-button")

        # --- SCENARIO 3: Test Timezone Modal ---
        bad_goal = {
            "id": "_badgoal", "isWeeklyGoal": True, "weekStartDate": "2025-10-18",
            "content": "This goal has a timezone issue."
        }
        planner_data_for_modal = {
            "journal": [bad_goal],
            "goalTimezoneFixApplied": False,
            "uiSettings": {"welcomeScreenShown": True}
        }

        await page.evaluate('localStorage.clear()')
        await page.evaluate(f'localStorage.setItem("pilotPlannerDataV8", {json.dumps(json.dumps(planner_data_for_modal))})')

        await page.reload()
        await expect(page.locator("#data-migration-modal.active")).to_be_visible(timeout=5000)
        await page.screenshot(path="jules-scratch/verification/timezone_fix_modal.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
