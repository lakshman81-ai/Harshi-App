
import time
from playwright.sync_api import sync_playwright, expect

def verify_logs_feature():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Wait for app to start
        print("Waiting for app to load...")
        page.goto("http://localhost:3000")

        # Wait for dashboard to load
        expect(page.get_by_text("StudyHub", exact=True)).to_be_visible(timeout=30000)
        print("Navigated to Dashboard")

        logs_btn = page.get_by_title("System Logs")
        expect(logs_btn).to_be_visible()
        print("Found System Logs button")

        # Click it
        logs_btn.click()

        # Check for Modal
        expect(page.get_by_text("System Logs & Workflow")).to_be_visible()
        print("Logs Modal Opened")

        # Check for filter buttons
        expect(page.get_by_role("button", name="ALL", exact=True)).to_be_visible()
        expect(page.get_by_role("button", name="ERROR", exact=True)).to_be_visible()
        expect(page.get_by_role("button", name="GATE", exact=True)).to_be_visible()

        # Take screenshot
        page.screenshot(path="verification_logs.png")
        print("Screenshot saved to verification_logs.png")

        browser.close()

if __name__ == "__main__":
    verify_logs_feature()
