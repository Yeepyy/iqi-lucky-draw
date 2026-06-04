# Complete Setup Instructions for Lucky Draw Application

This document provides step-by-step instructions to get the Lucky Draw application up and running.

## 📋 Pre-requisites

Before you start, ensure you have:
- Node.js 18 or higher installed
- npm (comes with Node.js)
- A Firebase account (free tier works fine)
- A modern web browser (Chrome, Firefox, Safari, or Edge)

## 🚀 Step 1: Firebase Configuration (REQUIRED)

### 1.1 Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a new project"
3. Enter project name: `lucky-draw` (or your preferred name)
4. Accept the terms and click "Create project"
5. Wait for project creation to complete (about 1-2 minutes)

### 1.2 Get Firebase Configuration

1. In Firebase Console, click the gear icon ⚙️ → "Project Settings"
2. Scroll down to "Your apps" section
3. Click the Web app (</>) icon
4. Register the app with name `Lucky Draw Web`
5. Copy the Firebase configuration that appears

You'll see something like:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyD...",
  authDomain: "lucky-draw-xxx.firebaseapp.com",
  projectId: "lucky-draw-xxx",
  storageBucket: "lucky-draw-xxx.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef..."
};
```

### 1.3 Create Firestore Database

1. In Firebase Console, click "Build" → "Firestore Database"
2. Click "Create database"
3. Choose your location (nearest to users)
4. For Development: Select "Start in test mode"
5. Click "Create"

Wait for database creation (about 1-2 minutes).

### 1.4 Create Collections

In Firestore Database, create these collections:

**Collection 1: participants**
- Click "Start collection"
- Collection ID: `participants`
- Click "Auto ID" and "Save"
- Leave empty (will be populated by users)

**Collection 2: prizes**
- Click "Start collection"
- Collection ID: `prizes`
- Click "Auto ID" and "Save"
- Leave empty (will be created via admin panel)

**Collection 3: drawResults**
- Click "Start collection"
- Collection ID: `drawResults`
- Click "Auto ID" and "Save"
- Leave empty (will be populated by spins)

## 🔧 Step 2: Project Setup

### 2.1 Create Environment Variables

1. In your project root directory, create a new file named `.env.local`
2. Add your Firebase configuration to this file:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_from_step_1.2
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain_from_step_1.2
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_from_step_1.2
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket_from_step_1.2
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_from_step_1.2
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_from_step_1.2
```

**Example:**
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyD1234567890abcdefghijklmnopqrst
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=lucky-draw-12345.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=lucky-draw-12345
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=lucky-draw-12345.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
```

### 2.2 Verify Dependencies

All dependencies are already installed. Verify with:
```bash
npm list | grep -E "(framer-motion|firebase|jspdf)"
```

You should see:
- framer-motion
- firebase
- jspdf
- html2canvas
- react-hot-toast

## ▶️ Step 3: Start Development Server

### 3.1 Run the Application

```bash
npm run dev
```

You should see:
```
  ▲ Next.js 16.2.7
  - Local:        http://localhost:3000
```

### 3.2 Access the Application

Open your browser and go to:
- **User Landing Page**: [http://localhost:3000](http://localhost:3000)
- **Admin Panel**: [http://localhost:3000/admin](http://localhost:3000/admin)

## 🎁 Step 4: Add Sample Prizes

### Via Admin Panel (Recommended)

1. Open [http://localhost:3000/admin](http://localhost:3000/admin)
2. Click "+ Add New Prize"
3. Add each prize with the following details:

**Prize 1: RM500 Furniture Voucher**
- Name: `RM500 Furniture Voucher`
- Probability: `15`
- Max Winners: `5`
- Description: `Furniture voucher from partner stores`

**Prize 2: RM1,000 Renovation Voucher**
- Name: `RM1,000 Renovation Voucher`
- Probability: `12`
- Max Winners: `3`
- Description: `Renovation materials voucher`

**Prize 3: Free Legal Fee Subsidy**
- Name: `Free Legal Fee Subsidy`
- Probability: `10`
- Max Winners: `2`
- Description: `Legal fee subsidy for property transaction`

**Prize 4: Free SPA Fee Subsidy**
- Name: `Free SPA Fee Subsidy`
- Probability: `10`
- Max Winners: `2`
- Description: `Strata title and management fee subsidy`

**Prize 5: RM300 Cash Rebate**
- Name: `RM300 Cash Rebate`
- Probability: `15`
- Max Winners: `10`
- Description: `Cash rebate for property purchase`

**Prize 6: Try Again**
- Name: `Try Again`
- Probability: `30`
- Max Winners: `100`
- Description: `Better luck next time!`

**Prize 7: Thank You Gift**
- Name: `Thank You Gift`
- Probability: `8`
- Max Winners: `20`
- Description: `Exclusive thank you gift set`

## ✅ Step 5: Test the Application

### 5.1 Test User Flow

1. Open [http://localhost:3000](http://localhost:3000)
2. Fill in the registration form:
   - Full Name: `John Doe`
   - IC/Passport: `123456789`
   - Phone: `0123456789`
   - Email: `john@example.com`
   - Project: `Luxury Park`
   - Unit: `Unit 101`
   - Agent: `Sarah Smith`
3. Click "Start Lucky Draw"
4. Click "SPIN NOW"
5. Watch the wheel spin (4-6 seconds)
6. View the prize result and acknowledgement letter
7. Download the PDF

### 5.2 Test Admin Panel

1. Open [http://localhost:3000/admin](http://localhost:3000/admin)
2. Check "Prizes" tab - should see all prizes
3. Check "Participants" tab - should see the test user
4. Check "Results" tab - should see the draw result
5. Try exporting CSV

## 📦 Step 6: Build for Production

When ready to deploy:

```bash
npm run build
npm start
```

## 🌐 Step 7: Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Click "New Project"
4. Select your GitHub repository
5. Add environment variables (same as `.env.local`)
6. Click "Deploy"

### Update Firebase Security Rules

For production, update Firestore security rules:

Go to Firebase Console → Firestore Database → Rules, and replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if true;
    }
    match /participants/{document=**} {
      allow create: if true;
      allow update, delete: if false;
    }
    match /prizes/{document=**} {
      allow read: if true;
      allow create, update, delete: if false;
    }
    match /drawResults/{document=**} {
      allow read: if true;
      allow create: if true;
      allow update: if resource.data.acknowledgementSigned == false;
      allow delete: if false;
    }
  }
}
```

## 🆘 Troubleshooting

### Issue: "Module not found" error
**Solution**: Run `npm install` to install dependencies

### Issue: Firebase connection fails
**Solution**: 
1. Check `.env.local` file exists
2. Verify all Firebase config values are correct
3. Check Firebase Console shows the project is active

### Issue: Can't see prizes in admin panel
**Solution**:
1. Check Firestore collections exist in Firebase Console
2. Ensure you added at least one prize
3. Refresh the page

### Issue: Build fails with TypeScript error
**Solution**:
1. Check for syntax errors in files
2. Run `npm run dev` to get detailed error messages
3. Review the error and fix accordingly

### Issue: Spin wheel doesn't work
**Solution**:
1. Open browser console (F12)
2. Check for error messages
3. Ensure at least one prize exists
4. Try refreshing the page

## 📚 Documentation Files

After setup, refer to:
- **README.md** - Project overview
- **USAGE_GUIDE.md** - How to use for clients and admins
- **FIREBASE_SETUP.md** - Detailed Firebase setup
- **.env.example** - Environment variable template

## ✨ You're All Set!

Your Lucky Draw application is now ready to use. 

### Next Steps:
1. Customize the prizes for your campaign
2. Adjust prize probabilities as needed
3. Share the landing page link with clients
4. Monitor results in the admin panel
5. Deploy to production when ready

## 📞 Support

For issues:
1. Check the troubleshooting section above
2. Check browser console for error messages
3. Refer to README.md for more details
4. Check FIREBASE_SETUP.md for database issues

---

**Happy Lucky Drawing! 🎉**
