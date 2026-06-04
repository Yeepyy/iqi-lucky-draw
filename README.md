# Spin & Win Lucky Draw 🎡

A premium, mobile-first Lucky Draw Spin Wheel website for property agents and clients. This is a client appreciation campaign that lets users spin an animated wheel and win exclusive rewards, with professional acknowledgement letter generation.

## 🌟 Features

### User Features
- **Mobile-First Design**: Fully responsive vertical landing page optimized for mobile devices
- **Premium Styling**: Gold, black, red, and white color theme with modern, professional design
- **User Registration**: Clients register with their details
- **Interactive Spin Wheel**: Smooth, realistic 4-6 second spin animation
- **Prize Result Display**: Immediate prize announcement
- **Acknowledgement Letter**: Professional PDF letter with all draw details
- **Digital Signature**: Canvas-based signature capture
- **PDF Download**: Export acknowledgement letter as PDF

### Admin Features
- **Prize Management**: Create, edit, delete prizes with configurable probability
- **Participant Management**: View all participants, search by name/phone/IC
- **Draw Results**: Track all winners and their acknowledgement status
- **Data Export**: Export participant and result data as CSV

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Firebase project (Firestore database)

### Setup

1. **Environment Setup**:
Create `.env.local` in the root directory:
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

2. **Firestore Setup**:
Create these collections in Firebase Console:
- `participants`
- `prizes`
- `drawResults`

3. **Run Development Server**:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📱 Features

- User registration with IC/Passport validation
- Animated spin wheel (4-6 seconds)
- Prize selection based on probability
- Professional acknowledgement letter with digital signature
- PDF export functionality
- Admin dashboard with prize and participant management
- CSV export for data analysis
- Real-time winner count tracking

## 🎨 Tech Stack

- **Next.js 15+** with App Router and TypeScript
- **Tailwind CSS** for styling with custom gold/red/black theme
- **Framer Motion** for smooth wheel animations
- **Firebase Firestore** for database
- **jsPDF** and **html2canvas** for PDF generation
- **react-hot-toast** for notifications

## 📊 Database Structure

### participants
- fullName, icPassport, phoneNumber, email
- projectName, unitNumber, agentName
- createdAt, hasSpun (boolean)

### prizes
- name, probability, maxWinners, currentWinners, description

### drawResults
- participantId, prizeId, prizeName, drawDate
- referenceNumber (LD-YYYY-XXXX), acknowledgementSigned

## 🔧 Admin Panel

Access at: `http://localhost:3000/admin`

- Manage prizes with probability and winner limits
- View and search participants
- Track draw results and signature status
- Export data to CSV

## 🌐 Deployment

### Deploy to Vercel
```bash
npm run build
# Push to GitHub and connect to Vercel
```

## 📝 Project Structure

```
src/
├── app/
│   ├── page.tsx                 # Main landing page
│   ├── admin/page.tsx           # Admin dashboard
│   ├── layout.tsx               # Root layout
│   └── globals.css              # Global styles
├── components/
│   ├── SpinWheel.tsx            # Spin wheel component
│   ├── UserForm.tsx             # Registration form
│   ├── AcknowledgementLetter.tsx # Result & letter
│   └── AdminPanel.tsx           # Admin dashboard
├── config/firebase.ts           # Firebase config
├── lib/database.ts              # Database functions
└── types/index.ts               # TypeScript types
```

## 🔐 Key Features

- One spin per IC/Passport number
- Admin-configurable prize probability
- Maximum winner limits per prize
- Professional acknowledgement letters
- Digital signature capture
- PDF download functionality

## 📄 License

Custom project for property agent teams. Internal use only.

---

Built with ❤️ using Next.js, Framer Motion, and Firebase
