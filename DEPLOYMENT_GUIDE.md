# StudyHub Deployment Guide

## Quick Start (Chrome Browser Ready)

### Prerequisites
- Node.js 16+ and npm installed
- Google Sheets API key (provided: AIzaSyCyYBK051jN0Ndr1bi6269z4EGJo3MyzTs)
- Google Sheet with proper structure

---

## Step 1: Install Dependencies

```bash
npm install
```

This will install:
- React 18.2.0
- React DOM 18.2.0
- Lucide React (icons)
- React Scripts 5.0.1
- Tailwind CSS
- All required dev dependencies

---

## Step 2: Configure Google Sheets

### IMPORTANT: Fix Your Google Sheets URL

**Your current link is INCORRECT for the API:**
```
❌ https://docs.google.com/spreadsheets/d/e/2PACX-1vSbs1FOe1F63VScBs0GliPb9e_N0RDymxtd41oqr3ACSichQcZjcpdoBp1Qs_0B_nXR8SKS_coAQwVT/pub?output=csv
```

This is a **published CSV URL** that doesn't work with Google Sheets API v4.

**You need to:**

1. Open your original Google Sheet (not the published version)
2. Look at the URL bar, it should look like:
   ```
   ✅ https://docs.google.com/spreadsheets/d/1ABCxyz123456789/edit
   ```
3. Copy the ID part (the long string between `/d/` and `/edit`)
4. Update `src/StudyHub.jsx` line 15:
   ```javascript
   SHEET_ID: '1ABCxyz123456789', // ← Your actual Sheet ID
   ```

### Enable Google Sheets API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create one)
3. Navigate to **APIs & Services → Library**
4. Search for "Google Sheets API"
5. Click **Enable**
6. Verify your API key (AIzaSyCyYBK051jN0Ndr1bi6269z4EGJo3MyzTs) is active

### Make Sheet Publicly Readable

Your Google Sheet must be shared properly:

1. Open your Google Sheet
2. Click "Share" (top right)
3. Click "Change to anyone with the link"
4. Set permission to **Viewer**
5. Click "Done"

---

## Step 3: Verify Sheet Structure

Your sheet MUST have these 9 tabs with exact names:

1. **Subjects** - Subject definitions
2. **Topics** - List of topics per subject
3. **Topic_Sections** - Sections within topics
4. **Learning_Objectives** - Learning goals
5. **Key_Terms** - Vocabulary definitions
6. **Study_Content** - Main educational content
7. **Formulas** - Mathematical formulas
8. **Quiz_Questions** - Multiple choice questions
9. **Achievements** - Badges and rewards

Use the provided `StudyHub_Data_Template.xlsx` as a reference.

---

## Step 4: Run Development Server

```bash
npm start
```

This will:
- Start the development server on http://localhost:3000
- Open Chrome browser automatically
- Enable hot-reload for development

**Expected Output:**
```
Compiled successfully!

You can now view studyhub-grade8 in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.1.x:3000
```

---

## Step 5: Build for Production

```bash
npm run build
```

This creates an optimized production build in the `build/` folder.

**Output:**
- Minified JavaScript bundles
- Optimized CSS
- Static HTML files
- Ready for deployment

---

## Step 6: Deploy to Web

### Option A: Local Testing (Chrome)

```bash
npm run deploy
```

This serves the build folder locally using `serve`:
- Runs on http://localhost:3000
- Production-ready build
- Can be opened in Chrome

### Option B: Deploy to Vercel (Recommended)

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Follow prompts to deploy

**Your app will be live at:** `https://your-app.vercel.app`

### Option C: Deploy to Netlify

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Deploy:
   ```bash
   netlify deploy --prod
   ```

3. Drag the `build` folder to Netlify Drop

### Option D: Deploy to GitHub Pages

1. Install gh-pages:
   ```bash
   npm install --save-dev gh-pages
   ```

2. Add to package.json:
   ```json
   "homepage": "https://yourusername.github.io/studyhub",
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d build"
   }
   ```

3. Deploy:
   ```bash
   npm run deploy
   ```

---

## Troubleshooting

### Issue: "Demo Mode" showing instead of real data

**Cause:** API key or Sheet ID is incorrect

**Solution:**
1. Verify Sheet ID is from regular Google Sheets URL (not published URL)
2. Check API key is correctly pasted in `src/StudyHub.jsx` line 18
3. Ensure Google Sheets API is enabled in Google Cloud Console
4. Check sheet is shared as "Anyone with link can view"

### Issue: CORS errors in console

**Cause:** Google Sheets API restricts some domains

**Solution:**
1. In Google Cloud Console, go to **APIs & Services → Credentials**
2. Edit your API key
3. Under "Application restrictions", select "HTTP referrers"
4. Add your domain: `https://your-domain.com/*`
5. Add localhost for testing: `http://localhost:3000/*`

### Issue: "Failed to fetch" errors

**Cause:** Network or permission issues

**Solution:**
1. Check internet connection
2. Verify Sheet ID is correct
3. Ensure sheet is publicly accessible
4. Check browser console for detailed error message

### Issue: Build fails

**Cause:** Missing dependencies or Node version

**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node version (need 16+)
node --version

# If too old, update Node.js
```

### Issue: Blank page in production

**Cause:** Incorrect routing or base URL

**Solution:**
1. Check browser console for errors
2. Verify all files are in `build/` folder
3. Check that the server is serving `index.html` for all routes

---

## Performance Optimization

The app is already optimized with:

✅ React.memo for component memoization
✅ useMemo and useCallback hooks
✅ Lazy loading where appropriate
✅ Efficient state management
✅ Optimized bundle size with React Scripts

**Lighthouse Score Target:**
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 90+

---

## Browser Compatibility

Tested and working in:
- ✅ Chrome 90+ (Recommended)
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

**Recommended:** Chrome for best performance

---

## Security Best Practices

1. **API Key Protection:**
   - Current setup embeds API key in frontend (acceptable for read-only public sheets)
   - For production, consider using API key restrictions in Google Cloud Console
   - Restrict API key to Google Sheets API only

2. **Sheet Permissions:**
   - Keep sheet as "View only" for public
   - Never grant edit access via the API key

3. **Content Validation:**
   - All user inputs are sanitized
   - XSS protection enabled
   - No eval() or dangerous HTML rendering

---

## Maintenance

### Updating Content

1. Edit your Google Sheet
2. Wait 60 seconds (auto-refresh)
3. Or click "Refresh" button in app header
4. Changes appear immediately

### Updating Code

1. Make changes to source files in `src/`
2. Test locally with `npm start`
3. Build and deploy with `npm run build`

### Monitoring

- Check browser console for errors
- Monitor Google Sheets API quota (free tier: 100 requests/100 seconds per user)
- Set up error tracking with Sentry or similar

---

## Need Help?

1. Check the main README.md
2. Review GAPS_AND_IMPROVEMENTS.md for known issues
3. Check browser console (F12) for detailed errors
4. Verify Google Sheet structure matches template

---

## Summary Checklist

Before deploying, ensure:

- [ ] Node.js 16+ installed
- [ ] Dependencies installed (`npm install`)
- [ ] Google Sheets API enabled
- [ ] Correct Sheet ID in src/StudyHub.jsx (NOT published URL)
- [ ] API key configured (already done: AIzaSyCyYBK051jN0Ndr1bi6269z4EGJo3MyzTs)
- [ ] Google Sheet has all 9 required tabs
- [ ] Sheet is shared as "Anyone with link can view"
- [ ] Development server works (`npm start`)
- [ ] Production build succeeds (`npm run build`)
- [ ] App opens in Chrome without errors

**You're ready to publish!** 🚀
