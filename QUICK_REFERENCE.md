# Quick Reference Guide

## 🚀 Essential Commands

### Development
```bash
npm run dev          # Start development server (localhost:3000)
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
```

### Useful URLs
- User Landing: http://localhost:3000
- Admin Panel: http://localhost:3000/admin
- After deployment: https://yourdomain.com

---

## 📋 Setup Checklist

### Before Running App
- [ ] Node.js 18+ installed
- [ ] Firebase project created
- [ ] Firestore database created
- [ ] `.env.local` file created with Firebase config
- [ ] Collections created: participants, prizes, drawResults

### First Time Setup
```bash
# 1. Install dependencies (already done)
npm install

# 2. Create .env.local with Firebase credentials
# (See .env.example for template)

# 3. Start development server
npm run dev

# 4. Add prizes via admin panel
# http://localhost:3000/admin

# 5. Test the application
# http://localhost:3000
```

---

## 🔧 Common Tasks

### Add a New Prize
1. Go to http://localhost:3000/admin
2. Click "+ Add New Prize"
3. Fill in: Name, Probability %, Max Winners
4. Click "Add Prize"

### View Participants
1. Go to http://localhost:3000/admin
2. Click "Participants" tab
3. Search or view all

### Export Data
1. Go to admin panel
2. Click "Export CSV" button
3. Open in Excel/Sheets

### Troubleshoot Connection
1. Check `.env.local` exists
2. Verify Firebase config values
3. Check Firebase Console for active project
4. Run `npm run dev` again

---

## 📱 Test Scenarios

### Test User Registration
```
Name: Test User
IC: 123456789012
Phone: 0123456789
Email: test@example.com
Project: Test Project
Unit: 101
Agent: Test Agent
```

### Test Admin Panel
- Add sample prizes first
- Register test user
- Perform test spin
- Check results in admin

---

## 🔐 Firebase Commands

### Reset Database (Testing Only)
1. Go to Firebase Console
2. Delete collections (careful: deletes all data)
3. Recreate collections
4. Re-add prizes

### Backup Data
1. Go to admin panel
2. Export participants CSV
3. Export results CSV
4. Save to safe location

---

## 📊 File Locations

| File | Purpose |
|------|---------|
| `.env.local` | Firebase credentials |
| `src/app/page.tsx` | User landing page |
| `src/app/admin/page.tsx` | Admin dashboard |
| `src/components/SpinWheel.tsx` | Spin wheel |
| `src/lib/database.ts` | Database functions |
| `README.md` | Project info |

---

## 🚨 Common Errors & Fixes

| Error | Fix |
|-------|-----|
| "Firebase not initialized" | Create `.env.local` with config |
| "Collection not found" | Create collections in Firebase Console |
| "No prizes available" | Add prizes via admin panel |
| "Permission denied" | Check Firebase security rules |
| "Build failed" | Run `npm install` and `npm run build` |

---

## 🌐 Deployment Quick Steps

### Deploy to Vercel
```bash
# 1. Push to GitHub
git push origin main

# 2. Connect to Vercel via dashboard
# 3. Add environment variables
# 4. Deploy
```

### Deploy to Netlify
```bash
npm run build
# Then upload .next folder to Netlify
```

---

## 📞 Debug Commands

```bash
# Check Node version
node --version

# Check npm packages
npm list

# Clear npm cache (if issues)
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Build with verbose output
npm run build -- --debug
```

---

## 🎯 Monitoring

### Check Participants
- Admin panel → Participants tab
- Search by name, phone, or IC

### Track Winners
- Admin panel → Results tab
- Export CSV for analysis

### Monitor Prizes
- Admin panel → Prizes tab
- Check "Current Winners" vs "Max Winners"

---

## 💡 Tips & Tricks

1. **Speed up spins**: Add more prizes
2. **Fair distribution**: Adjust probabilities
3. **Sell out prizes**: Reduce max winners
4. **Popular prizes**: Lower probability or max winners
5. **Backup often**: Export CSV weekly

---

## 🎨 Customization

### Change Colors
Edit `src/app/globals.css`:
```css
--gold: #FFD700;
--red: #DC143C;
--black: #000000;
--white: #FFFFFF;
```

### Change Company Name
Edit `src/app/layout.tsx`:
```typescript
title: "Your Company - Lucky Draw"
```

### Change Wheel Size
Edit `src/components/SpinWheel.tsx`:
```typescript
const radius = 400; // Change canvas width/height
```

---

## 📈 Best Practices

✅ **Do:**
- Backup data weekly
- Monitor participation
- Adjust prizes based on data
- Test before deploying
- Update security rules before production

❌ **Don't:**
- Commit `.env.local` to Git
- Keep test mode rules in production
- Delete data without backup
- Share API keys publicly
- Modify database rules without testing

---

## 🆘 Need Help?

1. **Setup issues?** → SETUP_INSTRUCTIONS.md
2. **Firebase issues?** → FIREBASE_SETUP.md
3. **Usage issues?** → USAGE_GUIDE.md
4. **Overview?** → README.md
5. **Check browser console** → F12

---

## 📦 File Sizes

- Source code: ~150 KB
- Build output: ~300 KB
- Node modules: ~500 MB

---

## ⏱️ Typical Timings

- Development build: 1-2 seconds
- Production build: 5-10 seconds
- Page load: 1-2 seconds
- Spin wheel: 4-6 seconds
- PDF generation: 2-3 seconds

---

**Last Updated**: June 2026
**Version**: 1.0.0
**Status**: Production Ready ✅
