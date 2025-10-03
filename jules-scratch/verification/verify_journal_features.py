from playwright.sync_api import sync_playwright, expect
import time

def run_verification(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        page.goto("http://localhost:8000")

        # 1. Set a weekly goal
        page.get_by_role("button", name="Dashboard").click()
        weekly_goals_input = page.locator("#weeklyGoals")
        weekly_goals_input.fill("My goal is to verify this feature.")
        # Click outside to trigger the blur event and save the goal
        page.get_by_role("heading", name="Key Performance Indicators").click()
        print("Weekly goal set.")

        # 2. Navigate to Journal and create entries
        page.get_by_role("button", name="Journal").click()

        # Entry 1
        page.get_by_role("button", name="New Entry").click()
        page.locator("#journal-modal").get_by_label("Title:").fill("First Entry")
        page.locator("#journal-modal").get_by_label("Icon:").fill("fa-solid fa-book")
        page.locator("#journal-modal").get_by_label("Content:").fill("Content for the first entry.")
        page.get_by_role("button", name="Save Entry").click()

        # Entry 2 (create it slightly later to test date sorting)
        time.sleep(1)
        page.get_by_role("button", name="New Entry").click()
        page.locator("#journal-modal").get_by_label("Title:").fill("Second Entry")
        page.locator("#journal-modal").get_by_label("Icon:").fill("fa-solid fa-star")
        page.locator("#journal-modal").get_by_label("Content:").fill("Content for the second entry.")
        page.get_by_role("button", name="Save Entry").click()
        print("Two journal entries created.")

        # 3. Verify weekly goal is displayed
        expect(page.locator("#journal-list").get_by_text("My goal is to verify this feature.")).to_be_visible()
        print("Weekly goal verified in Journal view.")

        # 4. Verify "Edited on" timestamp
        page.locator('.journal-entry[data-id] >> text=Edit').first.click()
        page.locator("#journal-modal").get_by_label("Content:").fill("This content has been edited.")
        page.get_by_role("button", name="Save Entry").click()
        expect(page.get_by_text("Edited:")).to_be_visible()
        print("'Edited on' timestamp verified.")

        # 5. Verify sorting by icon
        page.locator("#journal-sort-by").select_option("icon")
        # Check that the icon headers are now visible
        expect(page.get_by_role("heading", name="fa-solid fa-book")).to_be_visible()
        expect(page.get_by_role("heading", name="fa-solid fa-star")).to_be_visible()
        print("Sort by icon verified.")

        # 6. Take final screenshot
        page.screenshot(path="jules-scratch/verification/final_journal_verification.png")
        print("Screenshot taken.")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error.png")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run_verification(playwright)