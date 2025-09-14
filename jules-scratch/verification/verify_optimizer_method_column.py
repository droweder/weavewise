import re
import time
from playwright.sync_api import sync_playwright, Page, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        page.goto("http://localhost:5000")

        # --- Login ---
        try:
            logout_button = page.get_by_role("button", name="Sair")
            logout_button.wait_for(timeout=3000)
            print("Already logged in.")
        except:
            print("Not logged in, performing sign-up.")
            try:
                create_account_button = page.get_by_role("button", name="Criar conta")
                create_account_button.click()
                print("Switched to sign-up form.")
            except:
                print("Already on sign-up form.")

            unique_email = f"testuser_{int(time.time())}@example.com"
            password = "password123"

            page.get_by_label("Email").fill(unique_email)
            page.get_by_label("Senha").fill(password)

            page.get_by_role("button", name=re.compile("criar conta", re.IGNORECASE)).click()
            print(f"Submitted sign-up for user {unique_email}")

            logout_button = page.get_by_role("button", name="Sair")
            expect(logout_button).to_be_visible(timeout=15000)
            print("Sign-up and login successful.")

        # --- Navigate and Optimize ---
        optimizer_tab = page.get_by_role("button", name="Otimização de Corte")
        optimizer_tab.click()

        # Load sample data
        page.get_by_role("button", name="Exemplo").click()
        print("Loaded sample data.")

        # Click optimize
        page.get_by_role("button", name="Otimizar").click()
        print("Clicked optimize.")

        # --- Verification ---
        # Wait for the success message to ensure optimization is complete
        expect(page.get_by_text("Otimização concluída!")).to_be_visible(timeout=10000)
        print("Optimization success message is visible.")

        # Now that optimization is done, the table should be visible
        expect(page.get_by_role("columnheader", name="Método")).to_be_visible(timeout=5000)
        print("Results table with 'Método' column is visible.")

        # Take a screenshot
        screenshot_path = "jules-scratch/verification/optimizer_with_method.png"
        page.screenshot(path=screenshot_path, full_page=True)
        print(f"Screenshot saved to {screenshot_path}")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error.png", full_page=True)

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
