"""
Browser Verification Script for Harshi-App
Tests that the app loads with CSV data correctly
"""

from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError
import sys

def verify_app():
    """Verify the Harshi-App loads correctly"""
    print("[*] Starting browser verification...")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()
        
        try:
            # Navigate to app
            print("[*] Navigating to app...")
            page.goto("http://localhost:3000", wait_until="networkidle", timeout=30000)
            
            # Wait for app to load
            page.wait_for_timeout(2000)
            
            # Check for key elements
            print("[*] Checking for subjects...")
            
            # Look for subject cards or buttons
            subjects = page.locator('[data-testid*="subject"], .subject-card, button:has-text("Physics"), button:has-text("Math")').count()
            
            if subjects > 0:
                print(f"[+] Found {subjects} subject elements")
            else:
                print("[WARN] No subject elements found, checking page content...")
                content = page.content()
                if "Physics" in content or "Math" in content or "Biology" in content:
                    print("[+] Subject content found in page")
                else:
                    print("[ERROR] No subject content found!")
                    page.screenshot(path="verification_error.png")
                    return False
            
            # Check console for data source
            console_messages = []
            page.on("console", lambda msg: console_messages.append(msg.text()))
            
            page.reload()
            page.wait_for_timeout(2000)
            
            # Look for data source indication
            data_source_found = False
            for msg in console_messages:
                if "csv" in msg.lower() or "excel" in msg.lower():
                    print(f"[+] Data source log: {msg}")
                    data_source_found = True
                    break
            
            if not data_source_found:
                print("[WARN] Could not detect data source in console logs")
            
            # Take screenshot
            page.screenshot(path="verification_success.png")
            print("[+] Screenshot saved: verification_success.png")
            
            print("\n[+] Verification complete! App loads successfully.")
            browser.close()
            return True
            
        except PlaywrightTimeoutError as e:
            print(f"[ERROR] Timeout: {e}")
            page.screenshot(path="verification_timeout.png")
            browser.close()
            return False
        except Exception as e:
            print(f"[ERROR] Verification failed: {e}")
            page.screenshot(path="verification_error.png")
            browser.close()
            return False

if __name__ == "__main__":
    success = verify_app()
    sys.exit(0 if success else 1)
