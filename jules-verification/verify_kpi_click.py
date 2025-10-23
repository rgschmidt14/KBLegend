
import asyncio
import json
import re
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()

        def on_console(msg):
            print(f"BROWSER CONSOLE: [{msg.type}] {msg.text}")
        page.on('console', on_console)

        server_process = await asyncio.create_subprocess_shell(
            "python3 -m http.server 8000",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        await asyncio.sleep(2)

        try:
            await page.goto("http://localhost:8000")

            kpi_task_id = "kpi_task_1"
            kpi_task_name = "Track KPI Progress"

            tasks_data = [{
                "id": kpi_task_id, "name": kpi_task_name, "isKpi": True,
                "dueDate": "2025-10-22T10:00:00.000Z", "repetitionType": "relative",
                "repetitionAmount": 1, "repetitionUnit": "days", "status": "green"
            }]

            historical_tasks_data = [{"originalTaskId": kpi_task_id, "name": kpi_task_name,
                                      "completionDate": "2025-10-22T10:00:00.000Z", "status": "green"}]

            ui_settings_data = {"welcomeScreenShown": True, "activeView": "dashboard-view", "kpiChartMode": "stacked"}

            await page.evaluate('([key, value]) => localStorage.setItem(key, value)', ['tasks', json.dumps(tasks_data)])
            await page.evaluate('([key, value]) => localStorage.setItem(key, value)', ['historicalTasksV1', json.dumps(historical_tasks_data)])
            await page.evaluate('([key, value]) => localStorage.setItem(key, value)', ['uiSettings', json.dumps(ui_settings_data)])

            await page.reload()

            await expect(page.locator("#dashboard-view")).to_be_visible()

            kpi_chart_canvas = page.locator(f'canvas[data-task-id="{kpi_task_id}"]')
            await expect(kpi_chart_canvas).to_be_visible(timeout=10000)

            await kpi_chart_canvas.click()

            task_view_modal = page.locator("#task-view-modal")
            await expect(task_view_modal).to_be_visible()

            modal_header = task_view_modal.locator(".modal-header h2")
            await expect(modal_header).to_have_text(kpi_task_name)

            print("✅ Verification successful: Clicking KPI chart opened the correct task detail modal.")

            screenshot_path = "jules-verification/kpi_click_verification.png"
            await page.screenshot(path=screenshot_path)
            print(f"📸 Screenshot saved to {screenshot_path}")

        except Exception as e:
            print(f"❌ Verification failed: {e}")
            await page.screenshot(path="jules-verification/kpi_click_error.png")
            print("📸 Error screenshot saved.")
        finally:
            server_process.terminate()
            await server_process.wait()
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
