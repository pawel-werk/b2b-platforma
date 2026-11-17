import { test, expect } from '@playwright/test';

test.describe('Nawigacja i Dostępność Menu', () => {
  test('Nawigacja w Panelu Administratora działa poprawnie', async ({ page }) => {
    await page.goto('/panel/logowanie');
    
    await page.fill('input[name="email"]', 'admin@italgroup.pl');
    await page.fill('input[name="password"]', 'super-silne-haslo');
    await page.click('button[type="submit"]');

    await expect(page.locator('aside').getByText('Katalog produktów')).toBeVisible();
    
    await page.click('text=Katalog produktów');
    await expect(page).toHaveURL(/.*\/panel\/produkty/);
    const activeLink = page.locator('a[aria-current="page"]');
    await expect(activeLink).toHaveText(/Katalog produktów/);

    await page.keyboard.press('Tab');
    await expect(page.getByText('Przejdź do treści')).toBeFocused();
  });
});
