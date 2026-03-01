# 💸 Cute Brutal Expense Tracker

A fun, highly responsive, Gen-Z Neobrutalist financial tracker that looks like a modern app but is secretly powered entirely by your own Google Sheets! No databases, no paid tiers, just your data in your spreadsheet.

![Expense Tracker Preview](https://via.placeholder.com/800x450.png?text=Cute+Brutal+Expense+Tracker)

## 💖 Features

- **Neobrutalist UI**: Hard black borders, punchy drop-shadows, and a playful pink/pastel color palette designed for high contrast and readability.
- **Dynamic Categories**: Add, edit, and delete categories directly from the UI. Pick your own emojis and hex colors!
- **Real-time Google Sheets Sync**: Every time you add an expense or create a category, it instantly writes to a Google Sheet using Google Apps Script. 
- **Smart Dashboard**: Instantly summarizes your spending, shows your top categories, and filters everything smoothly by month.
- **Responsive Layout**: Works beautifully on ultra-wide desktop monitors down to the narrowest mobile screens.
- **Full-Screen Loading States**: Buttery-smooth frosted glass overlays prevent double-clicks and let you know exactly when data is syncing.

---

## 🚀 Getting Started

### 1. Set up the Google Sheet Backend

1. Create a new Google Sheet.
2. Go to **Extensions > Apps Script**.
3. Copy the entire contents of the Apps Script code (provided in the setup instructions) and paste it into the editor.
4. **Important**: Replace `const SPREADSHEET_ID = "<SHEET_ID>";` at the top with your actual Google Sheet ID (found in the URL of your sheet).
5. Click **Deploy > New Deployment**.
6. Select **Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
7. Click **Deploy**, authorize the permissions, and **copy the Deployment ID** provided at the end.

### 2. Set up the Next.js Frontend

1. Clone this repository.
2. Install the dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```
3. Create a `.env.local` file in the root directory (optional but recommended for hardcoding the URL):
   ```env
   APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000). If you didn't set up the \`.env.local\`, the app will cleanly prompt you to paste your **Deployment ID** right in the UI!

---

## 🛠 Tech Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **Language**: TypeScript
- **Styling**: Tailwind CSS & Inline Custom CSS
- **Database**: Google Sheets via Google Apps Script (REST API)
- **Typography**: Space Grotesk, DM Sans, and DM Mono for that punchy, financial-receipt look.

---

## 🎨 Design System

- **Background**: Light Pink \`#FFDBFD\`
- **Cards**: Pure White \`#FFFFFF\`
- **Accent**: Bright Pink \`#FF88BA\`
- **Borders/Shadows**: Hard Black \`#000000\`
- **Shadow Spec**: \`4px 4px 0px 0px #000000\`

Built for you 💖
