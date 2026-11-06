# Prince Williams Photography — Project README

## A full-featured luxury wedding photography website with client portal, admin dashboard, Paystack payments, and live chat.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [File Structure](#file-structure)
- [Prerequisites](#prerequisites)
- [Running Locally](#running-locally)
- [Configuration & API Keys](#configuration--api-keys)
- [Deployment Guide](#deployment-guide)
- [Paystack Payment Setup](#paystack-payment-setup)
- [Google Drive Integration](#google-drive-integration-future)
- [Email Receipts Setup](#email-receipts-setup-emailjs)
- [Admin Guide](#admin-guide)
- [Client Guide](#client-guide)
- [Default Credentials](#default-credentials)
- [Upgrading to a Real Backend](#upgrading-to-a-real-backend)
- [Troubleshooting](#troubleshooting)

---

## Project Overview

Prince Williams Photography is a complete luxury photography business website built with pure HTML, CSS, and Vanilla JavaScript — no frameworks, no build tools, no Node.js required.

**Tech Stack:** HTML5 · CSS3 · Vanilla JavaScript · Paystack Inline JS · Google Fonts
**Storage:** Browser localStorage (mock backend — replaceable with any real API)
**No build step required.** Open index.html in a browser and everything works.

---

## Features

### Public Website
- Responsive dark/light mode marketing site
- Elegant hero, portfolio, blog, FAQ, testimonials, and contact sections
- Cursive "Prince Williams" branding (Great Vibes font)
- Smooth scroll animations and micro-interactions
- Client Login button in navbar

### Client Portal
- Register / Sign In with full validation
- Photo Selection Gallery — admin sends unedited previews; client selects picks
  - Right-click disabled, drag-and-drop disabled, no download buttons
- Final Gallery — fully edited photos with individual and bulk download
- Packages and Payment — 3 packages with Paystack inline checkout
- Payment Receipt — generated on dashboard, printable as PDF
- Live Chat — real-time-feel messaging with admin (2.5s polling)
- Unread badges on sidebar for new photos and messages

### Admin Dashboard
- Overview stats: total clients, revenue, pending selections, unread messages
- Client Management — full client table with quick action buttons
- Send Photos — drag-and-drop uploader; assign to any client as Unedited or Final
- Client Selections — view what each client picked, mark as reviewed
- All Payments — total revenue display and full payment records table
- Multi-Client Chat — conversation list with chat window per client

---

## File Structure

```
prince-williams/
│
├── index.html                  Public marketing website
├── login.html                  Client sign-in page
├── register.html               Client registration page
├── client-dashboard.html       Client portal (4 tabs)
├── admin-dashboard.html        Admin control panel (5 tabs)
│
├── styles.css                  Public site design system
├── dashboard.css               Dashboard and auth design system
│
├── config.js                   ALL API keys and package config (edit this first)
├── auth.js                     Authentication (login/register/session)
├── backend.js                  Mock API layer (localStorage, fully replaceable)
├── script.js                   Public site interactions
├── dashboard.js                Client dashboard logic
└── admin.js                    Admin dashboard logic
│
└── images/
    ├── hero.jpg
    ├── portfolio-wedding.jpg
    ├── portfolio-engagement.jpg
    ├── photographer.jpg
    ├── blog-1.jpg
    ├── blog-2.jpg
    └── about.jpg
```

---

## Prerequisites

| Requirement   | Details                                              |
|---------------|------------------------------------------------------|
| Web Browser   | Chrome, Firefox, Edge, or Safari (modern version)    |
| Internet      | Only needed for Google Fonts + Paystack JS to load   |
| Node.js       | NOT required                                         |
| Build tool    | NOT required                                         |
| Server        | NOT required to run locally                          |

This is a zero-dependency static website. No npm install, no compilation needed.

---

## Running Locally

### Method 1 — Double-Click (Quickest)

1. Navigate to the project folder:
   ```
   C:\Users\HP\.gemini\antigravity\scratch\prince-williams\
   ```
2. Double-click **index.html** — it opens directly in your default browser.
3. Click "Client Login" in the navbar to access the portal.

> Note: When opening HTML files directly (file:// protocol), Paystack works but some browsers
> may block localStorage in private/incognito mode. Use Method 2 for full compatibility.

---

### Method 2 — VS Code Live Server (Recommended)

1. Install [Visual Studio Code](https://code.visualstudio.com/)
2. Install the **Live Server** extension (by Ritwick Dey)
3. Open the project folder in VS Code:
   ```
   File > Open Folder > C:\Users\HP\.gemini\antigravity\scratch\prince-williams
   ```
4. Right-click index.html > "Open with Live Server"
5. Your site opens at: http://127.0.0.1:5500

---

### Method 3 — Python Local Server

```bash
# Navigate to project folder
cd "C:\Users\HP\.gemini\antigravity\scratch\prince-williams"

# Python 3
python -m http.server 8080

# Then open in browser:
# http://localhost:8080
```

---

### Method 4 — Node.js serve

```bash
# Install serve globally (one-time setup)
npm install -g serve

# Navigate to project folder
cd "C:\Users\HP\.gemini\antigravity\scratch\prince-williams"

# Start server
serve .

# Then open in browser:
# http://localhost:3000
```

---

## Configuration & API Keys

All configuration lives in one file: **config.js**

Open config.js and replace the placeholder values before going live:

```javascript
const CONFIG = {

  // Admin credentials — CHANGE BEFORE DEPLOYING LIVE
  ADMIN_EMAIL:    'admin@princewilliams.com',
  ADMIN_PASSWORD: 'admin123',

  // Paystack — get from https://dashboard.paystack.com/#/settings/developer
  PAYSTACK_PUBLIC_KEY: 'pk_live_YOUR_KEY_HERE',

  // Google Drive — get from https://console.cloud.google.com (optional, for later)
  GOOGLE_CLIENT_ID:    'YOUR_CLIENT_ID.apps.googleusercontent.com',
  GOOGLE_API_KEY:      'YOUR_GOOGLE_API_KEY',
  GOOGLE_DRIVE_FOLDER: 'YOUR_DRIVE_FOLDER_ID',

  // EmailJS — get from https://emailjs.com (optional, for real email receipts)
  EMAILJS_SERVICE_ID:  'service_xxxxxxx',
  EMAILJS_TEMPLATE_ID: 'template_xxxxxxx',
  EMAILJS_PUBLIC_KEY:  'user_xxxxxxxxxxxxxxx',

  // Packages — edit name/price here only, no other files need changing
  PACKAGES: [
    { id: 'essential', name: 'Essential', price: 150000, ... },
    { id: 'premium',   name: 'Premium',   price: 300000, ... },
    { id: 'elite',     name: 'Elite',     price: 500000, ... },
  ],
};
```

---

## Deployment Guide

### Option A — Netlify (Recommended — Free, Instant)

Netlify hosts static sites for free with HTTPS and custom domain.

**Steps:**

1. Go to https://netlify.com and create a free account.

2. From your Netlify dashboard:
   - Click "Add new site" > "Deploy manually"

3. Drag and drop your entire project folder onto the Netlify deploy area:
   ```
   Drag this folder:
   C:\Users\HP\.gemini\antigravity\scratch\prince-williams\
   ```

4. Netlify deploys instantly. You get a URL like:
   ```
   https://sparkling-phoenix-abc123.netlify.app
   ```

5. Connect a custom domain (optional):
   - Site Settings > Domain Management > Add custom domain
   - Example: www.princewilliams.com
   - Update your domain DNS to point to Netlify (they give you the values)

6. Update SITE_URL in config.js with your live domain, then re-drag folder to redeploy.

Done — your site is live!

---

### Option B — Vercel

1. Go to https://vercel.com and sign up.

2. Optional — install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

3. From the project folder run:
   ```bash
   cd "C:\Users\HP\.gemini\antigravity\scratch\prince-williams"
   vercel
   ```
   Follow the prompts. Choose "No framework detected" when asked.

   OR use the web interface: New Project > Import > drag and drop folder.

4. Your site deploys to:
   ```
   https://prince-williams.vercel.app
   ```

---

### Option C — GitHub Pages (Free)

1. Create a [GitHub](https://github.com) account.

2. Create a new public repository (e.g. "prince-williams").

3. Upload all project files to the repository root:
   - Click "uploading an existing file" on GitHub
   - Drag all files from the project folder

4. Go to: Settings > Pages > Source > Deploy from branch > main > / (root)

5. Your site goes live at:
   ```
   https://YOUR-USERNAME.github.io/prince-williams/
   ```

---

### Option D — Traditional cPanel Web Hosting

For Hostinger, Namecheap, Bluehost, or any shared hosting:

1. Log in to your hosting cPanel or File Manager.

2. Navigate to "public_html" (your domain's root folder).

3. Upload all files from the project folder using File Manager or FTP (FileZilla).

4. Ensure this file layout at root:
   ```
   public_html/
   ├── index.html       <- must be at root
   ├── login.html
   ├── config.js
   ├── ... all other files
   └── images/
       └── ... all images
   ```

5. Visit your domain — site is live immediately.

---

## Paystack Payment Setup

1. Go to https://dashboard.paystack.com and create a free business account.

2. Complete your business profile and KYC verification.

3. Go to Settings > API Keys & Webhooks.

4. Copy your keys:
   - Test Public Key:  pk_test_xxxxxxxxxxxxxxx  (for testing)
   - Live Public Key:  pk_live_xxxxxxxxxxxxxxx  (for real payments)

5. Paste into config.js:
   ```javascript
   PAYSTACK_PUBLIC_KEY: 'pk_live_xxxxxxxxxxxxxxx',
   ```

6. Test the payment flow using Paystack test card:
   - Card number: 4084 0840 8408 4081
   - Expiry: any future date
   - CVV: 408
   - OTP: 123456

7. Go live: switch from pk_test_ to pk_live_ after verifying your Paystack account.

> SECURITY NOTE: In production, always verify Paystack payment references on your server
> before granting access. The current backend.js records payments client-side which is
> fine for demo but should use server-side verification in full production.

---

## Google Drive Integration (Future)

When ready to replace localStorage with Google Drive:

1. Go to https://console.cloud.google.com
2. Create a new project: "Prince Williams Photos"
3. Enable the Google Drive API
4. Create OAuth 2.0 credentials (Web Application type)
   - Set Authorized origins: https://www.princewilliams.com
5. Create an API Key (restrict to Drive API)
6. Create a shared Drive folder for client photos, copy the folder ID from URL
7. Update config.js with all three values
8. In backend.js, replace the sendPhotos() function body with Google Drive upload calls

---

## Email Receipts Setup (EmailJS)

To send real payment receipts by email (no server needed):

1. Go to https://emailjs.com and create a free account.

2. Add an Email Service (Gmail, Outlook, etc.) — copy the Service ID.

3. Create an Email Template with these variables:
   ```
   Subject: Payment Receipt — {{package_name}}
   Body:    Hi {{client_name}},
            Your payment of {{amount}} for {{package_name}} was successful.
            Reference: {{reference}}
            Date: {{date}}
            Thank you for choosing Prince Williams Photography.
   ```
   Copy the Template ID.

4. Go to Account > API Keys — copy your Public Key.

5. Update config.js with all three EmailJS values.

6. In backend.js, uncomment the [EMAIL] section inside recordPayment().

---

## Admin Guide

### First Login

```
URL:      /admin-dashboard.html
Email:    admin@princewilliams.com
Password: admin123
```

Change these in config.js before going live!

### How to Send Photos to a Client

1. Log in as admin
2. Go to the "Send Photos" tab
3. Select the client from the dropdown
4. Choose the gallery type:
   - Unedited Preview  — client can only select, cannot download
   - Final Edited Photos — client can download in full quality
5. Drag and drop photos or click to upload
6. Click "Send Photos" — client is notified instantly

### How to Review Client Selections

1. Go to "Client Selections" tab
2. See each client's selected photos with thumbnail previews
3. Click "View Photos" to open the full selection modal
4. Click "Mark Reviewed" once you have started editing those photos

### How to Chat with Clients

1. Go to "Chat" tab
2. Click any client from the left panel to open their conversation
3. Type your message and press Enter or click Send
4. Messages update automatically every 2.5 seconds

---

## Client Guide

### Getting Started

1. Click "Client Login" in the main website navbar
2. Click "Create one" to register a new account
3. Fill in your details — you are automatically logged in after registration

### Selecting Photos for Editing

1. Log in to your dashboard
2. Go to "Photo Selection" tab
3. Click any photo to select it (purple border + checkmark appears)
4. Click again to deselect
5. Once happy with your selections, click "Submit Selection"
6. Your photographer is automatically notified

### Downloading Final Photos

1. Go to "Final Gallery" tab
2. Hover over any photo and click the download icon
3. Or click "Download All" to download everything at once in full quality

### Making a Payment

1. Go to "Packages & Payment" tab
2. Review all three packages
3. Click "Pay with Paystack" on your chosen package
4. Complete payment in the secure Paystack popup
5. Your receipt appears instantly on the dashboard
6. Click "Print / Save PDF" to save your receipt

---

## Default Credentials

| Role   | Email                         | Password   |
|--------|-------------------------------|------------|
| Admin  | admin@princewilliams.com      | admin123   |
| Client | Register at /register.html    | Your choice|

CHANGE THE ADMIN PASSWORD IN config.js BEFORE DEPLOYING LIVE!

---

## Upgrading to a Real Backend

The backend.js file is designed to be replaced function by function.
Each function has comments showing what real API call to substitute.

### Example — Replace sendPhotos() with a real API call

Current (localStorage):
```javascript
function sendPhotos(clientId, photos, type) {
  const db = _get(KEYS.galleries);
  // saves to localStorage
}
```

Replace with (fetch to your real server):
```javascript
async function sendPhotos(clientId, photos, type) {
  const response = await fetch('/api/photos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + getToken(),
    },
    body: JSON.stringify({ clientId, photos, type }),
  });
  return response.json();
}
```

All function signatures and return shapes stay identical — only the bodies change.

### Recommended Backend Options

| Option                         | Best For                   | Cost                   |
|-------------------------------|----------------------------|------------------------|
| Firebase (Firestore + Storage) | Quickest real backend      | Free tier available    |
| Supabase                       | SQL + Storage + Auth       | Free tier available    |
| Node.js + Express + MongoDB    | Full custom control        | Server hosting needed  |
| Django / Python                | Advanced features          | Server hosting needed  |

---

## Troubleshooting

### Fonts not loading
- Ensure you have an internet connection (Google Fonts load from CDN)
- If going offline, download and self-host the fonts

### Paystack popup not opening
- Make sure PAYSTACK_PUBLIC_KEY in config.js is a real key, not the placeholder text
- Open browser DevTools (F12) > Console and look for error messages
- Ensure https://js.paystack.co/v1/inline.js is loading (needs internet connection)
- Test keys start with pk_test_ and live keys start with pk_live_

### Photos not appearing after upload (admin)
- Browser localStorage has a 5-10 MB limit — large images fill it quickly
- Compress images before uploading, or connect Google Drive storage
- Check DevTools > Application > Storage to see how much space is used

### Login redirects back to login page
- Clear browser localStorage: DevTools > Application > Local Storage > Clear All
- Make sure config.js is loaded before auth.js in all HTML files

### Chat messages not updating
- Messages poll every 2.5 seconds — there may be a slight delay
- Both tabs (admin and client) must be open in the SAME browser (shared localStorage)

### Site looks broken after deployment
- Make sure ALL files are uploaded including the images/ folder
- Check that index.html is at the ROOT of your hosting directory
- All links use relative paths — do not move files into subdirectories

### Payment recorded but receipt not showing
- Open DevTools > Console and check for JavaScript errors
- Make sure config.js loads before backend.js in the HTML file order
- Try clearing localStorage and making the payment again with test credentials

---

## Project Summary

```
Total Files:    20
HTML Pages:      5  (index, login, register, client-dashboard, admin-dashboard)
CSS Files:       2  (styles.css, dashboard.css)
JS Files:        6  (config, auth, backend, script, dashboard, admin)
Images:          7  (AI-generated placeholders, replace with real photos)
Dependencies:    0  (no npm packages, no frameworks)
Build Step:      None required
```

---

Prince Williams Photography
Capturing timeless love stories.

2026 Prince Williams. All rights reserved.
