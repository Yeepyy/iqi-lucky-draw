# Firebase Setup Guide

This guide will help you set up Firebase Firestore for the Lucky Draw application.

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a new project"
3. Enter project name (e.g., "lucky-draw-campaign")
4. Accept the terms and click "Create project"
5. Wait for the project to be created

## Step 2: Get Your Firebase Configuration

1. In Firebase Console, click the gear icon ⚙️ → "Project settings"
2. Scroll down to "Your apps" section
3. Click on the Web app (</>) icon to create a web app
4. Register your app and copy the configuration
5. You'll see something like:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyD...",
  authDomain: "lucky-draw-xxx.firebaseapp.com",
  projectId: "lucky-draw-xxx",
  storageBucket: "lucky-draw-xxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef..."
};
```

## Step 3: Create Firestore Database

1. In Firebase Console, click "Build" → "Firestore Database"
2. Click "Create database"
3. Choose location (closest to your users)
4. For security rules, select "Start in test mode" for development
5. Click "Create"

## Step 4: Create Collections

1. In Firestore Database, click "Start collection"
2. Create the following collections:

### Collection 1: `participants`
- Click "Start collection"
- Collection ID: `participants`
- Click "Next"
- Click "Auto ID" to create first document
- Add sample document with fields:
  ```
  fullName: "John Doe" (string)
  icPassport: "123456789" (string)
  phoneNumber: "0123456789" (string)
  email: "john@example.com" (string)
  projectName: "Project Name" (string)
  unitNumber: "Unit 101" (string)
  agentName: "Agent Name" (string)
  createdAt: (timestamp - current time)
  hasSpun: false (boolean)
  ```
- Click "Save"

### Collection 2: `prizes`
- Click "Start collection"
- Collection ID: `prizes`
- Click "Next"
- Click "Auto ID" to create first document
- Add sample prizes:

**Prize 1:**
```
name: "RM500 Furniture Voucher" (string)
probability: 15 (number)
maxWinners: 5 (number)
currentWinners: 0 (number)
description: "Furniture voucher from partner stores" (string)
```

**Prize 2:**
```
name: "RM1000 Renovation Voucher" (string)
probability: 12 (number)
maxWinners: 3 (number)
currentWinners: 0 (number)
description: "Renovation materials voucher" (string)
```

**Prize 3:**
```
name: "Free Legal Fee Subsidy" (string)
probability: 10 (number)
maxWinners: 2 (number)
currentWinners: 0 (number)
description: "Legal fee subsidy for property transaction" (string)
```

**Prize 4:**
```
name: "Free SPA Fee Subsidy" (string)
probability: 10 (number)
maxWinners: 2 (number)
currentWinners: 0 (number)
description: "Strata title and management fee subsidy" (string)
```

**Prize 5:**
```
name: "RM300 Cash Rebate" (string)
probability: 15 (number)
maxWinners: 10 (number)
currentWinners: 0 (number)
description: "Cash rebate for property purchase" (string)
```

**Prize 6:**
```
name: "Try Again" (string)
probability: 30 (number)
maxWinners: 100 (number)
currentWinners: 0 (number)
description: "Better luck next time!" (string)
```

**Prize 7:**
```
name: "Thank You Gift" (string)
probability: 8 (number)
maxWinners: 20 (number)
currentWinners: 0 (number)
description: "Exclusive thank you gift set" (string)
```

### Collection 3: `drawResults`
- Click "Start collection"
- Collection ID: `drawResults`
- Leave empty (will be populated by the application)

## Step 5: Set Up Environment Variables

1. Copy the Firebase config values from Step 2
2. Create a `.env.local` file in the project root:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Step 6: Configure Security Rules (Important for Production)

⚠️ **Important**: The default test mode rules expire in 30 days. For production, update them.

1. Go to Firestore Database → Rules tab
2. Replace with secure rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow reads from all
    match /{document=**} {
      allow read;
    }
    
    // Allow writes only from authenticated users or admin
    match /participants/{document=**} {
      allow create, update, delete: if request.auth != null;
    }
    
    match /prizes/{document=**} {
      allow create, update, delete: if request.auth != null;
    }
    
    match /drawResults/{document=**} {
      allow create, update, delete: if request.auth != null;
    }
  }
}
```

## Step 7: Test the Setup

1. Start the development server:
```bash
npm run dev
```

2. Open [http://localhost:3000](http://localhost:3000)
3. You should see the Lucky Draw page
4. Try registering and spinning (you may need to add more prizes first)
5. Go to admin panel: [http://localhost:3000/admin](http://localhost:3000/admin)
6. Add a prize if needed

## Troubleshooting

### Connection Error
- **Issue**: "Firebase configuration is not initialized"
- **Solution**: Check `.env.local` file exists and has correct values

### Collections Not Found
- **Issue**: Error creating participant
- **Solution**: Ensure collections exist in Firestore with correct names

### No Prizes Available
- **Issue**: "No prizes available" message
- **Solution**: Add prizes in Firebase Console or admin panel

### Test Mode Expired
- **Issue**: "Permission denied" after 30 days
- **Solution**: Update security rules in Firestore

## Next Steps

1. Customize the prizes according to your campaign
2. Update the prize probabilities based on your requirements
3. Set up Google Analytics (optional)
4. Deploy to Vercel or your hosting provider
5. Share the landing page URL with your clients

## Additional Resources

- [Firebase Console](https://console.firebase.google.com/)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)

For more help, refer to the main README.md file.
