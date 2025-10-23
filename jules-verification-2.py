
import asyncio
import json
import re
from playwright.async_api import async_playwright, expect
import os
import subprocess

async def main():
    # Define a handler for console messages
    def on_console(msg):
        print(f"Browser Console ({msg.type}): {msg.text}")

    async with async_playwright() as p:
        # Start a web server
        server_process = subprocess.Popen(["python3", "-m", "http.server", "8000"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        await asyncio.sleep(2) # Give the server a moment to start

        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Attach the console listener
        page.on('console', on_console)

        try:
            # --- Test Data ---
            kpi_task_id = "kpi_task_1"
            kpi_task_name = "Track Daily Progress"
            test_tasks = [{
                "id": kpi_task_id,
                "name": kpi_task_name,
                "isKpi": True,
                "dueDate": "2025-10-24T10:00:00.000Z",
                "createdAt": "2025-10-20T10:00:00.000Z",
                "repetitionType": "none",
                "completed": False,
                "status": "green",
                "estimatedDurationAmount": 60,
                "estimatedDurationUnit": "minutes",
                "categoryId": "work"
            }]
            test_ui_settings = {"welcomeScreenShown": True, "activeView": "dashboard-view"}
            test_historical_tasks = [{
                 "originalTaskId": kpi_task_id,
                 "name": kpi_task_name,
                 "completionDate": "2025-10-22T10:00:00.000Z",
                 "status": "green"
            }]


            # --- Test Execution ---
            await page.goto("http://localhost:8000")

            # Inject data into localStorage
            # Use page.evaluate to pass the python object directly, playwright handles serialization
            await page.evaluate('''(data) => {
                localStorage.setItem('tasks', JSON.stringify(data.tasks));
                localStorage.setItem('uiSettings', JSON.stringify(data.uiSettings));
                localStorage.setItem('historicalTasksV1', JSON.stringify(data.historicalTasks));
            }''', {
                "tasks": test_tasks,
                "uiSettings": test_ui_settings,
                "historicalTasks": test_historical_tasks
            })


            await page.reload()
            await page.wait_for_timeout(1500) # Wait for UI to render after reload

            # Click on the KPI chart (the canvas itself)
            kpi_chart_canvas = page.locator("#kpi-chart-container canvas")
            await expect(kpi_chart_canvas).to_be_visible(timeout=10000)
            await kpi_chart_canvas.click()

            # Verify that the task view modal opens with the correct task name
            task_view_modal = page.locator("#task-view-modal")
            await expect(task_view_modal).to_be_visible()
            modal_title = task_view_modal.locator("h2.modal-title") # More specific locator
            await expect(modal_title).to_have_text(kpi_task_name)
            print("✅ Verification successful: Clicking KPI chart opens the correct task view.")

        except Exception as e:
            print(f"❌ Verification failed: {e}")
            await page.screenshot(path="jules-verification-failure.png")
            print("📷 Screenshot saved to jules-verification-failure.png")
            raise # Re-raise the exception to fail the script

        finally:
            # Stop the web server
            await browser.close()
            server_process.terminate()

if __name__ == "__main__":
    asyncio.run(main())
