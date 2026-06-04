# Usage Guide - Lucky Draw Application

## For Clients/Participants

### Step 1: Register for the Lucky Draw

1. Visit [http://localhost:3000](http://localhost:3000) (or your deployment URL)
2. You'll see the "Spin & Win Lucky Draw" landing page
3. Fill in the registration form with your details:
   - **Full Name**: Your complete name
   - **IC / Passport No.**: Your identification number
   - **Phone Number**: Your mobile number
   - **Email**: Your email address
   - **Project Name**: The property project name
   - **Unit No.**: Your unit number
   - **Agent Name**: Your agent's name

4. Click "Start Lucky Draw"

### Step 2: Spin the Wheel

1. After successful registration, you'll see the spin wheel
2. The wheel displays all available prizes with different colors
3. Click the "SPIN NOW" button
4. The wheel will spin for 4-6 seconds with smooth animation
5. Wait for the result

### Step 3: View Your Prize and Acknowledgement Letter

1. After spinning, you'll see:
   - 🎉 Congratulations message with your prize
   - Your unique draw reference number (LD-YYYY-XXXX)
   - Professional acknowledgement letter with all your details

2. On the acknowledgement letter, you can:
   - **Add Signature**: Click "Add Signature" to draw your digital signature
   - **Download PDF**: Click "Download PDF" to save the letter
   - **Close**: Return to the home page

### Step 4: Sign the Letter (Optional)

1. Click "Add Signature" button
2. Use your mouse (desktop) or finger (mobile) to draw your signature
3. Click "Clear Signature" if you want to start over
4. Click "Confirm Signature" when done
5. Download the PDF with your signature

### Important Notes

- **One Spin Per Person**: Each IC/Passport number can only participate once
- **Prize Claim Period**: You have 6 months to claim your prize
- **Keep Your Reference Number**: Save the draw reference number (LD-YYYY-XXXX) for prize redemption
- **Download Letter**: Always download and keep your acknowledgement letter

---

## For Administrators

### Access Admin Panel

1. Go to [http://localhost:3000/admin](http://localhost:3000/admin)
2. You should see the admin dashboard

### Tab 1: Prize Management

#### Adding a New Prize

1. Click "+ Add New Prize"
2. Fill in the form:
   - **Prize Name**: e.g., "RM500 Furniture Voucher"
   - **Probability (%)**: Set the likelihood of winning (e.g., 15%)
   - **Max Winners**: Set maximum number of people who can win (e.g., 5)
   - **Description**: Optional prize details

3. Click "Add Prize"

#### Editing a Prize

1. Find the prize in the table
2. Click "Edit"
3. Update the fields
4. Click "Update Prize"

#### Deleting a Prize

1. Find the prize in the table
2. Click "Delete"
3. Confirm deletion

#### Understanding Probabilities

- Probabilities should add up to 100% (or more, they're normalized)
- Higher percentage = more likely to be selected
- "Try Again" is typically given a higher probability
- Once a prize reaches max winners, it won't be selected anymore

**Example Setup:**
```
RM500 Voucher      → 15% probability, 5 max winners
RM1000 Voucher     → 12% probability, 3 max winners
Free Legal Fee     → 10% probability, 2 max winners
Free SPA Fee       → 10% probability, 2 max winners
RM300 Cash Rebate  → 15% probability, 10 max winners
Try Again          → 30% probability, 100 max winners
Thank You Gift     → 8% probability, 20 max winners
```

### Tab 2: Participant Management

#### View All Participants

1. Click on "Participants" tab
2. See all registered clients with their information:
   - Name
   - IC/Passport number
   - Phone
   - Project
   - Whether they've spun the wheel (Has Spun status)
   - Date joined

#### Search Participants

1. Use the search box at the top
2. Search by:
   - **Name**: Type client's name
   - **Phone**: Type phone number
   - **IC**: Type IC/Passport number
3. Results update in real-time

#### Export Participant Data

1. Click "Export CSV" button
2. A CSV file will download with all participant information
3. Open in Excel or Google Sheets for analysis

#### Participant Information

Each participant record shows:
- Full name
- IC/Passport number
- Phone number
- Email
- Project name
- Unit number
- Agent name
- Date and time they registered

### Tab 3: Draw Results

#### View All Winners

1. Click on "Results" tab
2. See all draw results with:
   - Draw reference number (LD-YYYY-XXXX)
   - Prize name won
   - Date and time of draw
   - Acknowledgement signature status

#### Check Signature Status

- **✓ Signed**: Client has signed the acknowledgement letter
- **Pending**: Client hasn't signed yet (may contact for completion)

#### Export Results Data

1. Click "Export CSV" button
2. Download includes:
   - Reference number
   - Prize won
   - Draw date
   - Signature status
   - Client name

#### Track Prize Distribution

Use the Results tab to:
- Verify fair distribution of prizes
- Identify which prizes are being drawn most
- Monitor client acknowledgement completion

---

## Common Tasks

### Task: Add Multiple Prizes

1. Go to Admin → Prizes tab
2. Click "+ Add New Prize"
3. Add each prize one by one
4. Total probabilities should equal around 100-120%

### Task: Monitor Campaign Progress

1. Check Participants tab → Total registrations
2. Check Results tab → Total winners so far
3. Note which prizes are close to max winners
4. Consider pausing popular prizes to ensure distribution

### Task: Handle No Spun Participants

1. Go to Participants tab
2. Search for clients with "Has Spun: No"
3. Contact them to encourage participation
4. Use Export CSV to get contact details

### Task: Prepare Winner List

1. Go to Results tab
2. Click "Export CSV"
3. Use in Excel to:
   - Create winner announcements
   - Prepare prize delivery
   - Generate reports

### Task: End Campaign or Reset

⚠️ **Important**: Backup your data before resetting!

1. Export all results and participants to CSV
2. Keep CSV files for record-keeping
3. You can then reset for a new campaign by:
   - Keeping prizes, deleting participants/results
   - Or creating a completely new Firebase database

---

## Prize Management Best Practices

### Setting Probabilities

1. **Popular Prize** (e.g., RM500 voucher):
   - 10-15% probability
   - 3-5 max winners
   
2. **Medium Prize** (e.g., Free subsidy):
   - 8-12% probability
   - 2-3 max winners
   
3. **Participation Prize** (e.g., Try Again):
   - 25-35% probability
   - 50-100 max winners (essentially unlimited)
   
4. **Thank You Gifts**:
   - 8-10% probability
   - 20-50 max winners

### Monitoring Prize Availability

- Check admin dashboard regularly
- If a prize is close to max winners, consider:
  - Reducing its probability percentage
  - Increasing the max winners limit
  - Or accepting it won't be drawn more

### Tips for Fair Distribution

1. Set max winners to ensure availability
2. Use "Try Again" as backup prize (high probability, high max)
3. Periodic reviews to ensure fairness
4. Export and analyze distribution

---

## Troubleshooting for Admins

### Issue: Prize not being selected

**Solutions:**
1. Check if max winners limit reached (shows in red)
2. Verify probability is set correctly
3. Ensure prize probability is > 0%
4. Reload the page

### Issue: Participant appears twice

**Solutions:**
1. Each IC/Passport should be unique
2. If duplicated, first registration is valid
3. Subsequent attempts blocked

### Issue: PDF not downloading

**Solutions:**
1. Check browser download settings
2. Try a different browser
3. Clear browser cache
4. Check for pop-up blocker

### Issue: Data export not working

**Solutions:**
1. Ensure at least one record exists
2. Try refreshing the page
3. Check browser console for errors
4. Try different browser

---

## Data Privacy & Security

### Important Reminders

1. **Backup Data Regularly**: Export CSV weekly
2. **Protect Reference Numbers**: They're used for prize claims
3. **Secure Access**: Only authorized admins should access
4. **Delete Old Data**: Follow your privacy policy for data retention
5. **Firebase Security**: Keep API keys in `.env.local` only

### GDPR Compliance

- Participants consent to data collection
- Maintain data for 6 months (prize claim period)
- Allow participants to request data deletion
- Keep secure backups

---

For technical support, refer to:
- README.md - Project overview
- FIREBASE_SETUP.md - Database configuration
- Check console (F12) for error messages
