import asyncio
from playwright.async_api import async_playwright, expect
import os
from datetime import datetime, timedelta

# Helper to format a datetime object for the input field
def format_datetime_for_input(dt):
    return dt.strftime('%Y-%m-%dT%H:%M')

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Get the absolute path to the index.html file
        html_file_path = os.path.abspath('index.html')

        # Navigate to the local HTML file
        await page.goto(f'file://{html_file_path}')

        # Wait for the main app container to be visible
        await expect(page.locator("#app")).to_be_visible()

        # Add a small delay to ensure all JS event listeners are attached
        await asyncio.sleep(1)

        # First, ensure the main task manager panel is visible
        await page.locator("#toggleTaskManagerBtn").click()
        await expect(page.locator("#taskManagerModal")).not_to_be_hidden()

        # --- Create Tasks ---
        today = datetime.now()
        # Find dates for the upcoming Tuesday and Wednesday to ensure they are in the current week view
        tuesday = today + timedelta(days=(1 - today.weekday() + 7) % 7 + 1)
        wednesday = tuesday + timedelta(days=1)

        # Task 1: A standard task for Tuesday at 10:00 AM
        await page.get_by_role("button", name="Add New Task").click()
        await expect(page.get_by_role("heading", name="Add New Task")).to_be_visible()
        await page.get_by_label("Task Name").fill("Weekly View Task")
        await page.get_by_label("Due Date").fill(format_datetime_for_input(tuesday.replace(hour=10, minute=0)))
        await page.get_by_role("button", name="Save Task").click()
        await expect(page.get_by_text("Weekly View Task")).to_be_visible()

        # Task 2: A task for Wednesday at 9:00 AM
        await page.get_by_role("button", name="Add New Task").click()
        await expect(page.get_by_role("heading", name="Add New Task")).to_be_visible()
        await page.get_by_label("Task Name").fill("Daily Task 1")
        await page.get_by_label("Due Date").fill(format_datetime_for_input(wednesday.replace(hour=9, minute=0)))
        await page.get_by_role("button", name="Save Task").click()
        await expect(page.get_by_text("Daily Task 1")).to_be_visible()

        # Task 3: An overlapping task for Wednesday at 9:30 AM
        await page.get_by_role("button", name="Add New Task").click()
        await expect(page.get_by_role("heading", name="Add New Task")).to_be_visible()
        await page.get_by_label("Task Name").fill("Daily Task 2 (Overlap)")
        await page.get_by_label("Due Date").fill(format_datetime_for_input(wednesday.replace(hour=9, minute=30)))
        await page.get_by_label("Estimated Duration").locator('input[type="number"]').fill("60")
        await page.get_by_role("button", name="Save Task").click()
        await expect(page.get_by_text("Daily Task 2 (Overlap)")).to_be_visible()

        await asyncio.sleep(1)

        # --- Screenshot 1: Weekly View ---
        await page.get_by_role("button", name="Weekly").click()
        await expect(page.locator(".planner-grid")).to_be_visible()
        await page.screenshot(path="jules-scratch/verification/weekly_view.png")
        print("Weekly view screenshot taken.")

        # --- Navigate to Daily View for Wednesday ---
        await page.get_by_role("button", name="Daily").click()

        # Loop to find Wednesday's view
        for _ in range(7):
            header_text = await page.locator("#dailyViewContainer h3").text_content()
            if "Wednesday" in header_text:
                break
            await page.locator("#dailyViewContainer #nextDayBtn").click()
            await asyncio.sleep(0.2)

        await expect(page.locator("#daily-planner-grid.daily-view-grid")).to_be_visible()
        await asyncio.sleep(1)

        # --- Screenshot 2: Daily View ---
        await page.screenshot(path="jules-scratch/verification/daily_view.png")
        print("Daily view screenshot taken.")

        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
