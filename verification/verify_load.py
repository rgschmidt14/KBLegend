
from playwright.sync_api import sync_playwright
import time

def verify_app_loads():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            # Navigate to the app
            page.goto("http://localhost:8000")

            # Check for Welcome Modal and close it if present
            try:
                # Wait a moment for the modal to potentially appear
                page.wait_for_selector("#welcome-modal", state="visible", timeout=3000)
                print("Welcome modal detected. Closing it...")
                page.click("#welcome-no-thanks")
                # Wait for modal to disappear
                page.wait_for_selector("#welcome-modal", state="hidden", timeout=3000)
            except:
                print("No welcome modal found or it didn't appear in time (which is fine if already closed).")

            # Wait for the app to initialize (look for the task list or dashboard)
            page.wait_for_selector("#dashboard-view", state="visible", timeout=10000)

            # Verify the task manager can be opened
            page.click("#show-task-manager-btn")
            page.wait_for_selector("#task-manager-view", state="visible", timeout=5000)

            # Take a screenshot of the Task Manager
            page.screenshot(path="verification/task_manager_loaded.png")
            print("Task Manager loaded successfully.")

        except Exception as e:
            print(f"Verification failed: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_app_loads()
