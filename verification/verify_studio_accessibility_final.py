
from playwright.sync_api import sync_playwright, expect

def verify_studio_accessibility():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Create context with localStorage populated
        context = browser.new_context()
        page = context.new_page()

        # Bypass onboarding
        page.add_init_script("localStorage.setItem('harmoniq-studio-onboarding', 'true');")

        # Navigate to the Studio page
        page.goto("http://localhost:3001/studio")
        page.wait_for_load_state("networkidle")

        # Take screenshot for verification
        page.screenshot(path="/app/verification/studio_a11y.png", full_page=True)

        # Verify Production Tip Button has ARIA label
        tip_button = page.get_by_label("Get new production tip")
        expect(tip_button).to_be_visible()
        print("Verified: Production Tip button has correct ARIA label")

        # Switch to Theory tab to verify Piano Keys
        page.get_by_text("Theory").click()

        c_key = page.get_by_label("Note C", exact=True)
        expect(c_key).to_be_visible()
        expect(c_key).to_have_attribute("aria-pressed", "false")
        print("Verified: Piano Key (C) exists and has correct attributes")

        browser.close()

if __name__ == "__main__":
    try:
        verify_studio_accessibility()
        print("SUCCESS: Accessibility verification passed.")
    except Exception as e:
        print(f"FAILURE: {e}")
        exit(1)
