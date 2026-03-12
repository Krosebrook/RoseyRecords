from playwright.sync_api import sync_playwright

def test_titles(port):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # 1. Test Explore page
        print("Navigating to Explore page...")
        page.goto(f"http://localhost:{port}/explore")

        # Wait for the page to load
        page.wait_for_selector("text=Explore")

        # Hover over the like button to trigger tooltip and capture screenshot
        like_btn = page.get_by_test_id("button-like-1")
        like_btn.wait_for(state="visible")

        # Get the title attribute to verify
        title = like_btn.get_attribute("title")
        print(f"Explore page Like Button title attribute: {title}")

        # Hover
        like_btn.hover()
        page.wait_for_timeout(500)
        page.screenshot(path="verification/explore_tooltip.png")
        print("Screenshot saved to verification/explore_tooltip.png")

        # 2. Test Studio page
        print("Navigating to Studio page...")
        page.goto(f"http://localhost:{port}/studio")

        # Wait for the page to load
        page.wait_for_selector("text=Music Studio")

        # Click generate sample to show player
        prompt_input = page.get_by_test_id("input-audio-prompt")
        prompt_input.wait_for(state="visible")
        prompt_input.fill("A simple test track")

        # Get tip button
        tip_btn = page.get_by_test_id("button-get-tip")
        tip_title = tip_btn.get_attribute("title")
        print(f"Studio page Get Tip Button title attribute: {tip_title}")
        tip_btn.hover()
        page.wait_for_timeout(500)
        page.screenshot(path="verification/studio_tooltip.png")
        print("Screenshot saved to verification/studio_tooltip.png")

        browser.close()

if __name__ == "__main__":
    with open("verification/port.txt", "r") as f:
        port = f.read().strip()
    test_titles(port)
