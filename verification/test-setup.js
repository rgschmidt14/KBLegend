// verification/test-setup.js

/**
 * This script provides a set of reusable functions to prepare the application for verification.
 * It handles common UI hurdles and setup tasks, acting as a "pre-flight checklist"
 * to ensure the app is in a known, testable state before any specific test logic is run.
 */

/**
 * Bypasses the initial welcome modal by setting the appropriate flag in localStorage.
 * This prevents the test from getting stuck on the first screen.
 * @param {object} page - The browser page object from the verification tool.
 */
export async function bypassWelcomeModal(page) {
  await page.evaluate(() => {
    const uiSettings = {
      welcomeScreenShown: true,
      // Add other default settings here as needed to create a stable test environment
    };
    localStorage.setItem('uiSettings', JSON.stringify(uiSettings));
  });
  // Reload the page to apply the new localStorage settings
  await page.reload();
}

/**
 * A comprehensive setup function to be called at the beginning of a verification script.
 * @param {object} page - The browser page object from the verification tool.
 */
export async function standardSetup(page) {
  // Navigate to the app's URL
  await page.goto('http://localhost:8000');

  // Bypasses the welcome modal
  await bypassWelcomeModal(page);

  // Add other common setup steps here in the future.
}

/**
 * Sets the initial view of the application by modifying localStorage.
 * This is more reliable than simulating clicks, especially on initial load.
 * @param {object} page - The browser page object from the verification tool.
 * @param {string} viewId - The ID of the view to activate (e.g., 'task-manager-view').
 */
export async function setInitialView(page, viewId) {
  await page.evaluate((id) => {
    // Retrieve existing settings to avoid overwriting them
    let uiSettings = JSON.parse(localStorage.getItem('uiSettings')) || {};
    uiSettings.activeView = id;
    localStorage.setItem('uiSettings', JSON.stringify(uiSettings));
  }, viewId);

  // Reload for the setting to take effect
  await page.reload();

  // Wait for the DOM to be fully interactive after the reload
  await page.waitForLoadState('domcontentloaded');
}
