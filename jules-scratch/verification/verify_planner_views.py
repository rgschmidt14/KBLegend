import asyncio
from playwright.async_api import async_playwright
import os
import json
from datetime import datetime, timedelta

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        html_file_path = os.path.abspath('index.html')

        # --- Prepare Mock Data ---
        mock_tasks = [
            {"id": "_task1", "name": "Task A (9-11)", "dueDate": "2025-09-15T11:00:00.000Z", "estimatedDurationAmount": 2, "estimatedDurationUnit": "hours", "categoryId": "cat1", "repetitionType": "none", "status": "green"},
            {"id": "_task2", "name": "Task B (9:30-10:30)", "dueDate": "2025-09-15T10:30:00.000Z", "estimatedDurationAmount": 1, "estimatedDurationUnit": "hours", "categoryId": "cat2", "repetitionType": "none", "status": "yellow"},
            {"id": "_task3", "name": "Task C (10-12)", "dueDate": "2025-09-15T12:00:00.000Z", "estimatedDurationAmount": 2, "estimatedDurationUnit": "hours", "categoryId": "cat1", "repetitionType": "none", "status": "red"},
            {"id": "_task4", "name": "Task D (12-13)", "dueDate": "2025-09-15T13:00:00.000Z", "estimatedDurationAmount": 1, "estimatedDurationUnit": "hours", "categoryId": "cat3", "repetitionType": "none", "status": "green"},
            {"id": "_task5", "name": "Meeting on Tuesday", "dueDate": "2025-09-16T10:00:00.000Z", "estimatedDurationAmount": 30, "estimatedDurationUnit": "minutes", "categoryId": "cat2", "repetitionType": "none", "status": "green", "icon": "fa-solid fa-users"}
        ]
        mock_categories = [
            {"id": "cat1", "name": "Work", "color": "#3b82f6"},
            {"id": "cat2", "name": "Personal", "color": "#10b981"},
            {"id": "cat3", "name": "Study", "color": "#f97316"}
        ]
        current_week_start_date = datetime(2025, 9, 14)
        mock_weeks = []
        for i in range(6):
            offset = i - 4
            week_start_date = current_week_start_date + timedelta(weeks=offset)
            mock_weeks.append({"startDate": week_start_date.strftime('%Y-%m-%dT%H:%M:%S.000Z'), "weeklyGoals": f"Goals for week {i}", "schedule": {}, "kpiData": {}, "amendedItems": {}, "originalState": None})
        mock_planner_data = {"weeks": mock_weeks, "indicators": [], "historicalTasks": []}

        # --- Create the script to inject data ---
        injection_script = f"""
            localStorage.setItem('tasks', '{json.dumps(mock_tasks)}');
            localStorage.setItem('categories', '{json.dumps(mock_categories)}');
            localStorage.setItem('pilotPlannerDataV8', '{json.dumps(mock_planner_data)}');
        """

        # Add the script to the page *before* it loads
        await page.add_init_script(injection_script)

        # Now, go to the page. The init script will run before the page's own scripts.
        await page.goto(f'file://{html_file_path}')

        await page.wait_for_timeout(2000)

        await page.screenshot(path='jules-scratch/verification/weekly_view.png')

        await page.get_by_role("button", name="Daily").click()
        await page.wait_for_timeout(500)
        await page.locator('#nextDayBtn').click() # Go to Monday
        await page.wait_for_timeout(1000)
        await page.screenshot(path='jules-scratch/verification/daily_view.png')

        await page.get_by_role("button", name="Month").click()
        await page.wait_for_timeout(1000)
        await page.screenshot(path='jules-scratch/verification/month_view.png')

        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
