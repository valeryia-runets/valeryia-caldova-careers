import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Derive the expected posting count from the job content collection so this
// assertion stays correct as roles are added or removed.
const jobsDir = fileURLToPath(new URL('../src/content/jobs', import.meta.url));
const expectedRoleCount = readdirSync(jobsDir).filter((f) => f.endsWith('.md')).length;

test.describe('Open roles listing', () => {
    test('shows the roles grid with all postings', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByRole('heading', { name: 'Open roles' })).toBeVisible();

        const grid = page.getByTestId('roles-grid');
        await expect(grid).toBeVisible();
        await expect(page.getByTestId('role-card')).toHaveCount(expectedRoleCount);
    });

    test('links through to a role detail page', async ({ page }) => {
        await page.goto('/');
        const firstCard = page.getByTestId('role-card').first();
        const title = await firstCard.getByTestId('role-title').textContent();
        await firstCard.click();
        await expect(page.getByTestId('role-detail-title')).toHaveText(title!.trim());
        await expect(page.getByTestId('apply-form')).toBeVisible();
    });

    for (const { title, location } of [
        { title: 'Senior Frontend Engineer', location: 'Remote (US & Canada)' },
        { title: 'Financial Analyst', location: 'Woodinville, WA, USA' },
    ]) {
        test(`shows ${title} location on the card and details`, async ({ page }) => {
            await page.goto('/');
            const card = page.getByTestId('role-card').filter({
                has: page.getByRole('heading', { name: title, exact: true }),
            });

            await expect(card).toBeVisible();
            await expect(card.getByTestId('role-location')).toHaveText(location);
            await card.click();
            await expect(page.getByText(location, { exact: true })).toBeVisible();
        });
    }

    test('has no automatically detectable accessibility violations', async ({ page }) => {
        await page.goto('/');
        const results = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa'])
            .analyze();
        expect(results.violations).toEqual([]);
    });
});

test.describe('Role filters', () => {
    /** Locate role cards that are currently shown (not hidden by filters). */
    const visibleCards = (page: import('@playwright/test').Page) =>
        page.getByTestId('role-card').locator('visible=true');

    test('filters by department', async ({ page }) => {
        await page.goto('/');
        await page.getByTestId('department-filter').getByLabel('Finance').check();
        await expect(visibleCards(page)).toHaveCount(2);
        await expect(page.getByTestId('role-department').locator('visible=true')).toHaveText([
            'Finance',
            'Finance',
        ]);
    });

    test('filters by location', async ({ page }) => {
        await page.goto('/');
        await page.getByTestId('location-filter').getByLabel('Woodinville, WA, USA').check();
        await expect(visibleCards(page)).toHaveCount(3);
    });

    test('combines department and location, and shows empty state', async ({ page }) => {
        await page.goto('/');
        await test.step('combine filters', async () => {
            await page.getByTestId('department-filter').getByLabel('Finance').check();
            await page.getByTestId('location-filter').getByLabel('Woodinville, WA, USA').check();
            await expect(visibleCards(page)).toHaveCount(1);
        });
        await test.step('no matches', async () => {
            await page.getByTestId('department-filter').getByLabel('Marketing').check();
            await page.getByTestId('department-filter').getByLabel('Finance').uncheck();
            await expect(visibleCards(page)).toHaveCount(0);
            await expect(page.getByTestId('empty-state-text')).toContainText('No roles match');
        });
    });

    test('resets filters to the full list', async ({ page }) => {
        await page.goto('/');
        await page.getByTestId('department-filter').getByLabel('Finance').check();
        await expect(visibleCards(page)).toHaveCount(2);
        await page.getByTestId('filter-reset').click();
        await expect(visibleCards(page)).toHaveCount(expectedRoleCount);
        await expect(page).not.toHaveURL(/department=/);
    });

    test('restores filters from the URL', async ({ page }) => {
        await page.goto('/?department=Finance');
        await expect(page.getByTestId('department-filter').getByLabel('Finance')).toBeChecked();
        await expect(visibleCards(page)).toHaveCount(2);
    });
});
