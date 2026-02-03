# 🚀 Quick Start - Get Running in 5 Minutes

## ⚠️ CRITICAL FIRST STEP

Your Google Sheets link format is **incorrect** for the API:

**Your Link (Won't Work):**
```
https://docs.google.com/spreadsheets/d/e/2PACX-1vSbs1FOe1F63VScBs0GliPb9e_N0RDymxtd41oqr3ACSichQcZjcpdoBp1Qs_0B_nXR8SKS_coAQwVT/pub?output=csv
```

**You Need:**
```
https://docs.google.com/spreadsheets/d/[YOUR_ACTUAL_SHEET_ID]/edit
```

### How to Get Your Correct Sheet ID:

1. Open your **original** Google Sheet (not the published version)
2. Look at the URL in your browser
3. Copy the ID between `/d/` and `/edit`
4. It should look like: `1ABCxyz123456789` (NOT starting with `2PACX-`)

---

## 📦 Installation

```bash
# Install dependencies
npm install
```

---

## ⚙️ Configuration

### 1. Update Sheet ID

Open `src/StudyHub.jsx` and update line 15:

```javascript
SHEET_ID: 'YOUR_ACTUAL_SHEET_ID_HERE',  // ← Replace with your ID from step above
```

### 2. API Key (Already Done ✅)

API key is already configured:
```javascript
API_KEY: 'AIzaSyCyYBK051jN0Ndr1bi6269z4EGJo3MyzTs',
```

### 3. Enable Google Sheets API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Go to **APIs & Services → Library**
3. Search for "Google Sheets API"
4. Click **Enable**

### 4. Share Your Google Sheet

1. Open your Google Sheet
2. Click "Share" button (top right)
3. Click "Change to anyone with the link"
4. Set permission to **Viewer**
5. Click "Done"

---

## ▶️ Run the App

```bash
# Start development server
npm start
```

This will:
- Start the app on http://localhost:3000
- Open Chrome automatically
- Enable hot-reload

---

## 🏗️ Build for Production

```bash
# Create production build
npm run build

# Test production build locally
npm run deploy
```

---

## ✅ Verification Checklist

Before running, make sure:

- [ ] Node.js 16+ is installed (`node --version`)
- [ ] Dependencies are installed (`npm install` completed)
- [ ] Correct Sheet ID is in `src/StudyHub.jsx` line 15
- [ ] Google Sheets API is enabled
- [ ] Your sheet is shared as "Anyone with link can view"
- [ ] Your sheet has all 9 required tabs (see README.md)

---

## 🐛 Troubleshooting

### App shows "Demo Mode"

**Cause:** Sheet ID is incorrect or API can't access the sheet

**Fix:**
1. Double-check Sheet ID (not the published URL ID)
2. Verify sheet is shared publicly
3. Check Google Sheets API is enabled

### "Failed to fetch" error

**Cause:** API key or permissions issue

**Fix:**
1. Verify API key is correct
2. Check browser console for detailed error
3. Ensure sheet is accessible

### Blank screen in browser

**Cause:** JavaScript error or build issue

**Fix:**
1. Check browser console (F12)
2. Try clearing cache and reload
3. Reinstall dependencies: `rm -rf node_modules && npm install`

---

## 📚 Next Steps

1. **Read DEPLOYMENT_GUIDE.md** for detailed deployment instructions
2. **Read GAPS_AND_IMPROVEMENTS.md** for known issues and improvements
3. **Check README.md** for sheet structure and data format

---

## 🎉 Success!

If you see subjects (Physics, Math, Chemistry, Biology) on the screen:
- ✅ Your app is working!
- ✅ Google Sheets integration is successful!
- ✅ You're ready to deploy!

---

## 📞 Need Help?

1. Check DEPLOYMENT_GUIDE.md troubleshooting section
2. Verify Sheet ID is correct (most common issue)
3. Check browser console for error messages
4. Ensure sheet structure matches template

**Common Issue:** 99% of problems are due to incorrect Sheet ID format!
