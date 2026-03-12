from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # We'll use a mocked version of the page content since we can't easily spin up the full backend/auth
        # This HTML mimics the structure of the PlaylistCard we modified
        html_content = """
        <!DOCTYPE html>
        <html>
        <head>
            <script src="https://cdn.tailwindcss.com"></script>
            <script>
                tailwind.config = {
                    theme: {
                        extend: {
                            colors: {
                                destructive: '#ef4444',
                            }
                        }
                    }
                }
            </script>
        </head>
        <body class="bg-slate-900 p-10">
            <div class="max-w-md mx-auto">
                <!-- Playlist Card Simulation -->
                <div class="relative group block h-full">
                    <div class="bg-slate-800 rounded-2xl p-6 h-full relative overflow-hidden text-white">
                        <div class="flex justify-between items-start mb-4">
                            <div class="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                <span class="text-2xl">🎵</span>
                            </div>

                            <!-- The Button We Modified -->
                            <button
                                class="p-2 rounded hover:bg-slate-700 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                                aria-label="Delete playlist"
                                id="delete-btn"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 text-destructive"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                            </button>
                        </div>
                        <h3 class="text-xl font-bold mb-2">My Playlist</h3>
                        <p class="text-slate-400 text-sm">Description here...</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """

        page.set_content(html_content)

        # Test 1: Hover state (mouse users)
        page.hover(".group")
        page.screenshot(path="verification/1_hover_state.png")

        # Test 2: Focus state (keyboard users)
        # Move mouse away to ensure it's not hovering
        page.mouse.move(0, 0)

        # Focus the button programmatically (simulating Tab navigation)
        page.focus("#delete-btn")

        # Take screenshot of focus state
        page.screenshot(path="verification/2_focus_state.png")

        # Verify visibility
        btn = page.locator("#delete-btn")

        # Check if opacity is 1 (via computed style, as 'visible' check might be tricky with opacity transition)
        opacity = btn.evaluate("el => getComputedStyle(el).opacity")
        print(f"Button opacity when focused: {opacity}")

        browser.close()

if __name__ == "__main__":
    run()
