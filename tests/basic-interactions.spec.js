import { test, expect } from '@playwright/test';

test.describe('Basic Application Interactions', () => {

  test.beforeEach(async ({ page }) => {
    // Go to the page before manipulating localStorage
    await page.goto('/');

    // Set uiSettings in localStorage to bypass the welcome screen and set advanced mode as default
    await page.evaluate(() => {
        const uiSettings = {
            welcomeScreenShown: true,
            isSimpleMode: false // Default to advanced mode for tests
        };
        localStorage.setItem('uiSettings', JSON.stringify(uiSettings));
    });

    // Reload the page for the settings to take effect.
    await page.reload();

    // Wait for the main content to be visible to ensure the app has loaded
    await expect(page.locator('#dashboard-view')).toBeVisible();
  });

  test('should load the main page and display the dashboard', async ({ page }) => {
    // Expect the main header to be visible
    await expect(page.locator('header h1')).toBeVisible();
    await expect(page.locator('header h1')).toHaveText('Task & Mission Planner');

    // Expect the dashboard view to be active by default
    await expect(page.locator('#dashboard-view')).toBeVisible();
    await expect(page.locator('#show-dashboard-btn')).toHaveClass(/active-view-btn/);
  });

  test('should allow creating a new task', async ({ page }) => {
    // 1. Navigate to the Task Manager view.
    await page.locator('#show-task-manager-btn').click();

    // 2. Wait for the main content to be visible, confirming the view has switched.
    await expect(page.locator('#task-manager-view')).toBeVisible();

    // 3. Click the "Add New Task" button.
    await page.locator('#add-task-btn').click();

    // 4. Wait for the modal to appear and check the title.
    const modalTitle = page.locator('#modal-title');
    await expect(modalTitle).toBeVisible();
    await expect(modalTitle).toHaveText('Add New Task');

    // 5. Fill in the task name.
    const taskName = 'My First Test Task';
    await page.locator('#task-name').fill(taskName);

    // 6. Click the "Save Task" button.
    await page.locator('form#task-form button[type="submit"]').click();

    // 7. Expect the modal to be hidden after creation.
    await expect(page.locator('#task-modal')).toBeHidden();

    // 8. The task should now be visible in the task list.
    await expect(page.locator('.task-card-header h3')).toContainText(taskName);
  });
});
