import time
from playwright.sync_api import sync_playwright

def test_study_guide_flow():
    with sync_playwright() as p:
        # Launch browser
        browser = p.chromium.launch(headless=True)
        # Create a new context with a larger viewport
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()

        try:
            print("1. Navigating to Home...")
            page.goto("http://localhost:3000")
            # Wait for dashboard to load
            page.wait_for_selector("text=StudyHub", timeout=10000)
            page.screenshot(path="verification/01_dashboard.png")

            print("2. Navigating to Physics Subject...")
            # Click on Physics card
            page.click("text=Physics")
            page.wait_for_selector("text=Newton's Laws Fundamentals", timeout=5000)
            page.screenshot(path="verification/02_subject_overview.png")

            print("3. Opening Study Guide (Topic 1)...")
            # Click on first topic (Newton's Laws)
            # Assuming the first topic card or list item is clickable
            # Let's try finding the "Start Learning" or just the topic card
            page.click("text=Newton's Laws")
            time.sleep(2) # Allow transition
            page.screenshot(path="verification/03_study_guide_intro.png")

            print("4. Testing Navigation (Next Page - PDF)...")
            # Click Next button
            page.click("button:has-text('Next')")
            time.sleep(2)
            # Should see PDF iframe
            # Verify iframe exists
            iframe = page.query_selector("iframe")
            if iframe:
                print("   [PASS] PDF Iframe detected")
            else:
                print("   [FAIL] PDF Iframe NOT found")
            page.screenshot(path="verification/04_study_guide_pdf.png")

            print("5. Testing Navigation (Next Page - Word)...")
            page.click("button:has-text('Next')")
            time.sleep(2)
            # Should see Word download card
            page.screenshot(path="verification/05_study_guide_word.png")

            print("6. Testing Navigation (Next Page - Concept Check)...")
            page.click("button:has-text('Next')")
            time.sleep(2)
            # Should see "Concept Check" section at bottom
            # Scroll to bottom to make sure it's visible
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            time.sleep(1)
            page.screenshot(path="verification/06_study_guide_concept_check.png")

            print("7. Testing Questionnaire Selector...")
            # Switch to Quiz tab
            page.click("button:has-text('Quiz')")
            time.sleep(2)
            # Should see list of quizzes
            page.screenshot(path="verification/07_questionnaire_selector.png")

            print("8. Testing Handout View...")
            # Switch to Handout tab
            page.click("button:has-text('Handout')")
            time.sleep(2)
            # Should see Handout view (PDF or content)
            page.screenshot(path="verification/08_handout_view.png")

            print("Verification Complete!")

        except Exception as e:
            print(f"Error during verification: {e}")
            page.screenshot(path="verification/error_state.png")
        finally:
            browser.close()

if __name__ == "__main__":
    test_study_guide_flow()
