import time
from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Generate a unique email for signup
    unique_id = str(int(time.time()))
    email = f"testuser_{unique_id}@example.com"
    password = "password123"

    # --- Event Listener for Console Logs ---
    log_messages = []
    page.on("console", lambda msg: log_messages.append(msg.text))

    try:
        # Navigate to the app
        page.goto("http://localhost:5000", wait_until="networkidle")

        # --- SIGNUP/LOGIN to trigger the test ---
        page.get_by_role("button", name="Criar conta").click()
        page.get_by_label("Email").fill(email)
        page.get_by_label("Senha").fill(password)
        page.get_by_role("button", name="Criar conta").click()

        # Wait for the test to complete by looking for the final log message
        page.wait_for_function("() => window.testComplete === true", timeout=10000)

    except Exception as e:
        print(f"An error occurred during Playwright execution: {e}")
    finally:
        # Before closing, check for the test completion log one last time
        test_complete = any("--- TESTE DA LÓGICA CONCLUÍDO ---" in msg for msg in log_messages)
        if not test_complete:
            print("ERRO: A mensagem de conclusão do teste não foi encontrada nos logs.")

        browser.close()

        # Print all captured logs
        print("\n--- CONSOLE LOGS CAPTURADOS ---")
        for msg in log_messages:
            print(msg)
        print("--- FIM DOS CONSOLE LOGS ---")

# I need to modify the test function slightly to set a window flag
# Let's add that change to realApiService.ts as well.

with sync_playwright() as playwright:
    run(playwright)
