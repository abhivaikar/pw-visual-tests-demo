import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';

/**
 * To-do list — business-intent tests.
 *
 * These read as user-facing requirements ("a captured task appears in the
 * list", "the count reflects work left to do") rather than UI mechanics. Each
 * test arranges state through real user actions, then verifies the outcome with
 * a visual snapshot of the relevant part of the app — the same way a product
 * team would pin down "what the user should see" for each requirement.
 *
 * Locators are accessibility-first (roles, labels, placeholder text) so the
 * tests describe intent, not markup.
 */

// The app widget under test (a labelled <section> exposes the "region" role).
const todoApp = (page: Page) => page.getByRole('region', { name: 'To-do app' });

// All task rows, scoped to the to-do list (so the filter <li>s don't count).
const tasks = (page: Page) =>
  page.getByRole('list', { name: 'To-dos' }).getByRole('listitem');

// A single to-do row, found by the text the user typed.
const taskNamed = (page: Page, text: string) =>
  tasks(page).filter({ hasText: text });

async function capture(page: Page, ...titles: string[]) {
  const field = page.getByPlaceholder('What needs to be done?');
  for (const title of titles) {
    await field.fill(title);
    await field.press('Enter');
  }
}

async function complete(page: Page, text: string) {
  await taskNamed(page, text).getByRole('checkbox').check();
}

test.describe('to-do list', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/todo');
  });

  test('a first-time visitor sees an empty list with no controls', async ({
    page,
  }) => {
    // Requirement: before any work is captured, the user is shown only the
    // input — no counter, filters or bulk actions to distract them.
    await expect(tasks(page)).toHaveCount(0);
    await expect(todoApp(page)).toHaveScreenshot('empty-list.png');
  });

  test('a captured task appears in the list', async ({ page }) => {
    // Requirement: typing a task and confirming adds it to the list.
    await capture(page, 'Buy groceries');

    await expect(taskNamed(page, 'Buy groceries')).toBeVisible();
    await expect(todoApp(page)).toHaveScreenshot('one-task.png');
  });

  test('tasks are listed in the order they were captured', async ({ page }) => {
    // Requirement: the list preserves capture order, top to bottom.
    await capture(page, 'Draft the proposal', 'Review the budget', 'Send invites');

    await expect(todoApp(page)).toHaveScreenshot('three-tasks-in-order.png');
  });

  test('the count reflects how much work is left to do', async ({ page }) => {
    // Requirement: the footer always shows the number of outstanding tasks.
    await capture(page, 'Pack bags', 'Book taxi', 'Check passport');
    await complete(page, 'Book taxi');

    await expect(page.getByTestId('todo-count')).toHaveText('2 items left');
    await expect(page.getByTestId('todo-count')).toHaveScreenshot(
      'count-two-left.png'
    );
  });

  test('the count uses singular wording when one task remains', async ({
    page,
  }) => {
    // Requirement: "1 item left", not "1 items left" — copy must read naturally.
    await capture(page, 'Water the plants');

    await expect(page.getByTestId('todo-count')).toHaveScreenshot(
      'count-one-left.png'
    );
  });

  test('completing a task shows it as done', async ({ page }) => {
    // Requirement: a finished task is visually distinct (struck through).
    await capture(page, 'Write report', 'Submit report');
    await complete(page, 'Write report');

    await expect(todoApp(page)).toHaveScreenshot('one-task-done.png');
  });

  test('the Active filter shows only unfinished work', async ({ page }) => {
    // Requirement: switching to "Active" hides anything already completed.
    await capture(page, 'Fix login bug', 'Update docs', 'Reply to support');
    await complete(page, 'Update docs');

    await page.getByRole('link', { name: 'Active' }).click();

    await expect(taskNamed(page, 'Update docs')).toBeHidden();
    await expect(todoApp(page)).toHaveScreenshot('filter-active.png');
  });

  test('the Completed filter shows only finished work', async ({ page }) => {
    // Requirement: "Completed" reveals exactly the done items, nothing else.
    await capture(page, 'Fix login bug', 'Update docs', 'Reply to support');
    await complete(page, 'Update docs');

    await page.getByRole('link', { name: 'Completed' }).click();

    await expect(taskNamed(page, 'Fix login bug')).toBeHidden();
    await expect(todoApp(page)).toHaveScreenshot('filter-completed.png');
  });

  test('unchecking a completed task returns it to active', async ({ page }) => {
    // Requirement: completion is reversible — a task can be reopened.
    await capture(page, 'Renew subscription');
    await complete(page, 'Renew subscription');
    await taskNamed(page, 'Renew subscription').getByRole('checkbox').uncheck();

    await expect(todoApp(page)).toHaveScreenshot('reopened-task.png');
  });

  test('a task can be renamed', async ({ page }) => {
    // Requirement: the user can correct a task's wording in place.
    await capture(page, 'Buy milk');

    await taskNamed(page, 'Buy milk').getByText('Buy milk').dblclick();
    const editor = page.getByRole('textbox', { name: 'Edit to-do' });
    await editor.fill('Buy oat milk');
    await editor.press('Enter');

    await expect(taskNamed(page, 'Buy oat milk')).toBeVisible();
    await expect(todoApp(page)).toHaveScreenshot('renamed-task.png');
  });

  test('removing a task takes it off the list', async ({ page }) => {
    // Requirement: a task can be deleted and disappears from the list.
    await capture(page, 'Temporary note', 'Keep this one');

    await taskNamed(page, 'Temporary note')
      .getByRole('button', { name: /delete/i })
      .click();

    await expect(taskNamed(page, 'Temporary note')).toHaveCount(0);
    await expect(todoApp(page)).toHaveScreenshot('after-delete.png');
  });

  test('marking all complete finishes every outstanding task', async ({
    page,
  }) => {
    // Requirement: a single control completes the whole list at once.
    await capture(page, 'Task one', 'Task two', 'Task three');

    await page.getByRole('checkbox', { name: 'Mark all as complete' }).check();

    await expect(todoApp(page)).toHaveScreenshot('all-complete.png');
  });

  test('clearing completed removes finished tasks in one action', async ({
    page,
  }) => {
    // Requirement: finished work can be swept away, leaving only active tasks.
    await capture(page, 'Keep active', 'Done one', 'Done two');
    await complete(page, 'Done one');
    await complete(page, 'Done two');

    await page.getByRole('button', { name: 'Clear completed' }).click();

    await expect(tasks(page)).toHaveCount(1);
    await expect(todoApp(page)).toHaveScreenshot('after-clear-completed.png');
  });
});
