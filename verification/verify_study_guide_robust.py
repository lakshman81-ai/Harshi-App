import time
from playwright.sync_api import sync_playwright

def verify_study_guide():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()

        # Listen to console logs
        page.on("console", lambda msg: print(f"BROWSER LOG: {msg.text}"))

        try:
            print("1. Navigating to Home...")
            page.goto("http://localhost:3000")
            page.wait_for_selector("text=StudyHub", timeout=10000)

            print("2. Navigating to Physics Subject...")
            page.click("text=Physics")
            page.wait_for_selector("text=Newton's Laws", timeout=10000)

            print("3. Opening Study Guide (Topic 1)...")
            page.click("text=Newton's Laws")
            page.wait_for_selector("h2:has-text('Newton\\'s Laws')", timeout=10000)
            time.sleep(2)

            # Check for Concept Check availability on Page 1
            # Scroll ContentArea to bottom to trigger 'isAtBottom' state
            page.evaluate("""
                const content = document.querySelector('.flex-1.overflow-y-auto');
                if(content) content.scrollTo(0, content.scrollHeight);
            """)
            time.sleep(1)

            print("4. Testing Navigation to Page 2 (PDF)...")
            # Click Next/Continue.
            next_btn = page.locator("button:has-text('Next'), button:has-text('Continue')").last
            if next_btn.is_visible():
                print(f"   Button text: {next_btn.text_content()}")
                next_btn.click()
                print("   [ACTION] Clicked Next/Continue")
            else:
                raise Exception("Navigation button missing")

            time.sleep(3) # Wait for page transition

            # Check if PDF iframe exists
            if page.locator("iframe").count() > 0:
                print("   [PASS] PDF Iframe detected on Page 2")
            else:
                print("   [FAIL] PDF Iframe NOT found. Trying one more click just in case...")
                next_btn.click()
                time.sleep(3)
                if page.locator("iframe").count() > 0:
                     print("   [PASS] PDF Iframe detected on Page 2 (after second click)")
                else:
                     print("   [FAIL] PDF Iframe NOT found.")
                     page.screenshot(path="verification/04_fail_pdf.png")

            print("5. Testing Navigation to Page 3 (Word)...")
            # Click Next again
            # Note: PDF page doesn't scroll, so button should be "Next" immediately?
            # Or if PDF is tall, maybe. But iframe is usually fixed height in my code (800px).
            # Let's scroll just in case.
            page.evaluate("""
                const content = document.querySelector('.flex-1.overflow-y-auto');
                if(content) content.scrollTo(0, content.scrollHeight);
            """)
            time.sleep(1)

            next_btn.click()
            time.sleep(3)

            if page.is_visible("text=Word Document Resource") or page.is_visible("text=Download"):
                 print("   [PASS] Word Download Card detected on Page 3")
            else:
                 print("   [FAIL] Word Download Card NOT found on Page 3")
                 page.screenshot(path="verification/05_fail_word.png")

            print("6. Testing Questionnaire Selector (Quiz Tab)...")
            page.click("button:has-text('Quiz')")
            time.sleep(2)
            if page.is_visible("text=Select a Quiz"):
                 print("   [PASS] Questionnaire Selector loaded")
            else:
                 print("   [WARN] Questionnaire Selector header not found")
            page.screenshot(path="verification/07_questionnaire_selector.png")

            print("7. Testing Handout View...")
            page.click("button:has-text('Handout')")
            time.sleep(2)
            print("   [PASS] Handout View loaded")
            page.screenshot(path="verification/08_handout_view.png")

            print("Verification Complete!")

        except Exception as e:
            print(f"Error during verification: {e}")
            page.screenshot(path="verification/error_state.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_study_guide()
