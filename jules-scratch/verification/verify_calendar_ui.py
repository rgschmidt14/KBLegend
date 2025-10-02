from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    # Test in both light and dark mode
    for color_scheme in ['dark', 'light']:
        context = browser.new_context(color_scheme=color_scheme)
        page = context.new_page()

        # Listen for all console events and print them
        page.on("console", lambda msg: print(f"Browser Console ({color_scheme}): {msg.text}"))

        try:
            page.goto("http://localhost:8000")

            # Wait for the calendar to load by looking for a known element
            expect(page.locator(".fc-view-harness")).to_be_visible()

            # Switch to Day view
            page.get_by_role("button", name="Day", exact=True).click()
            expect(page.locator(".fc-timeGridDay-view")).to_be_visible()

            # Click the "Add New Task" button
            page.get_by_role("button", name="Add New Task").click()

            # Switch to Advanced Mode to reveal the duration fields
            page.locator("#simple-mode-toggle").click()

            # Fill out the form for a short task with a very long name
            task_name = "This is a very long task name designed specifically to test the new ellipsis text overflow functionality."
            page.locator("#task-name").fill(task_name)

            # Set a due date that is guaranteed to be within the current view by setting it to 2 PM on the current day.
            due_date = page.evaluate("new Date(new Date().setHours(14, 0, 0, 0)).toISOString().slice(0, 16)")
            page.locator("#task-due-date").fill(due_date)

            page.locator("#estimated-duration-amount").fill("15")
            page.locator("#estimated-duration-unit").select_option("minutes")

            # Submit the form
            page.get_by_role("button", name="Save Task").click()

            # Wait for the event to appear *inside the calendar*.
            calendar_event_locator = page.locator("#calendar .fc-event", has_text=task_name)
            expect(calendar_event_locator).to_be_visible()

            # Take a screenshot to verify the changes
            screenshot_path = f"jules-scratch/verification/verification-{color_scheme}.png"
            page.screenshot(path=screenshot_path)
            print(f"Screenshot saved to {screenshot_path}")

        except Exception as e:
            print(f"An error occurred during {color_scheme} mode verification: {e}")
        finally:
            page.close()
            context.close()

    browser.close()

with sync_playwright() as playwright:
    run(playwright)