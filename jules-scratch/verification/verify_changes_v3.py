
import asyncio
from playwright.async_api import async_playwright, expect
import json

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Go to the app
        await page.goto("http://localhost:8000")

        # --- Gracefully handle welcome modal ---
        try:
            # Wait for the modal to potentially appear, but with a short timeout
            await page.wait_for_selector("#welcome-modal.active", timeout=2000)
            # If it appears, click the "No, thanks" button
            await page.click("#welcome-no-thanks")
            # Wait for the modal to disappear
            await expect(page.locator("#welcome-modal")).not_to_be_visible()
        except Exception:
            # If the modal doesn't appear within the timeout, just continue
            pass

        # --- SCENARIO 1: Test Journal ---
        journal_entry = {
            "id": "_abcdef123", "createdAt": "2025-10-20T10:00:00.000Z", "title": "My Test Journal Entry",
            "content": "This is the content of the journal entry.", "isWeeklyGoal": True, "weekStartDate": "2025-10-19"
        }
        planner_data_journal = {"journal": [journal_entry]}

        await page.evaluate('localStorage.clear()')
        await page.evaluate(f'localStorage.setItem("pilotPlannerDataV8", {json.dumps(json.dumps(planner_data_journal))})')

        await page.reload()

        # --- Gracefully handle welcome modal again after reload ---
        try:
            await page.wait_for_selector("#welcome-modal.active", timeout=2000)
            await page.click("#welcome-no-thanks")
            await expect(page.locator("#welcome-modal")).not_to_be_visible()
        except Exception:
            pass

        await page.click("#show-journal-btn")
        await expect(page.locator(".journal-week-header")).to_be_visible()

        # Screenshot with corrected date display
        await page.screenshot(path="jules-scratch/verification/journal_corrected_date.png")

        # --- SCENARIO 2: Test Timezone Modal ---
        bad_goal = {
            "id": "_badgoal", "isWeeklyGoal": True, "weekStartDate": "2025-10-18",
            "content": "This goal has a timezone issue."
        }
        planner_data_for_modal = {
            "journal": [bad_goal],
            "goalTimezoneFixV2Applied": False
        }

        await page.evaluate('localStorage.clear()')
        await page.evaluate(f'localStorage.setItem("pilotPlannerDataV8", {json.dumps(json.dumps(planner_data_for_modal))})')

        await page.reload()

        # --- Gracefully handle welcome modal a final time ---
        try:
            await page.wait_for_selector("#welcome-modal.active", timeout=2000)
            await page.click("#welcome-no-thanks")
            await expect(page.locator("#welcome-modal")).not_to_be_visible()
        except Exception:
            pass

        await expect(page.locator("#data-migration-modal.active")).to_be_visible(timeout=5000)
        await page.screenshot(path="jules-scratch/verification/timezone_fix_modal_v2.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
