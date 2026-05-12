# EconoConnect — JavaScript + Supabase

A marketplace platform connecting businesses and suppliers, built with React, Vite, Tailwind CSS, and Supabase.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Routing | React Router v7 |
| Styling | Tailwind CSS v3 |
| Backend / DB | Supabase (PostgreSQL) |
| Auth | Supabase Auth (Email + Google OAuth) |
| Real-time | Supabase Realtime (messages) |
| Storage | Supabase Storage (product images, avatars) |
| Icons | Lucide React |

---

## Project Structure

```
src/
├── lib/
│   ├── supabase.js          # Supabase client
│   └── api.js               # All data access functions
├── app/
│   ├── context/
│   │   ├── AuthContext.jsx  # Auth state + Google OAuth
│   │   └── ThemeContext.jsx # Dark/light mode
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   ├── AccountTypeSelection.jsx
│   │   ├── Home.jsx             # Feed
│   │   ├── Dashboard.jsx        # Marketplace
│   │   ├── BusinessDashboard.jsx
│   │   ├── SupplierDashboard.jsx
│   │   ├── Messages.jsx         # Real-time chat
│   │   ├── Inventory.jsx
│   │   ├── InventoryCompanies.jsx
│   │   ├── CompanyProducts.jsx
│   │   ├── UserProfile.jsx
│   │   ├── VerifyAccount.jsx
│   │   └── SettingsNew.jsx
│   ├── components/
│   │   ├── Layout.jsx
│   │   ├── ProtectedRoute.jsx
│   │   ├── RoleBasedDashboard.jsx
│   │   ├── ProfileDropdown.jsx
│   │   ├── CreateProductModal.jsx
│   │   ├── ProductDetailsModal.jsx
│   │   ├── OrdersModal.jsx
│   │   ├── FilterModal.jsx
│   │   ├── MapViewModal.jsx
│   │   ├── SearchButton.jsx
│   │   ├── PostProductPrompt.jsx
│   │   └── Chatbot.jsx
│   ├── utils/
│   │   └── timeAgo.js
│   ├── routes.jsx
│   └── App.jsx
├── styles/
│   └── index.css
└── main.jsx
supabase/
└── schema.sql               # Full DB schema + RLS policies
```

---

## Quick Start

### 1. Clone and install

```bash
git clone <your-repo>
cd econoconnect
npm install
```

### 2. Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Open the **SQL Editor** and paste the entire contents of `supabase/schema.sql`, then run it.
3. In **Storage**, create two public buckets:
   - `products`
   - `avatars`

### 3. Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com).
2. Create a new project (or use an existing one).
3. Navigate to **APIs & Services → Credentials → Create OAuth 2.0 Client ID**.
4. Set **Authorized redirect URI** to:
   ```
   https://<your-project-id>.supabase.co/auth/v1/callback
   ```
5. Copy the **Client ID** and **Client Secret**.
6. In Supabase Dashboard → **Authentication → Providers → Google**, paste them in.
7. In Supabase Dashboard → **Authentication → URL Configuration**, add redirect URLs:
   ```
   http://localhost:5173/signup/account-type
   https://yourdomain.com/signup/account-type
   ```

### 4. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 5. Run the app

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Database Tables

| Table | Description |
|-------|-------------|
| `profiles` | Extends `auth.users` with account type, company, bio, etc. |
| `products` | Marketplace product and supply listings |
| `requests` | Business procurement requests |
| `offers` | Supplier offers on business requests |
| `conversations` | 1-on-1 message threads |
| `messages` | Individual chat messages (realtime) |
| `orders` | Purchase orders with status tracking |
| `inventory` | Per-user inventory management |

All tables have **Row Level Security (RLS)** enabled.

---

## User Roles

| Role | Capabilities |
|------|-------------|
| **Business** | Post supply requests, review offers, manage orders and inventory |
| **Supplier** | List products, submit offers on requests, manage inventory |
| **Guest** | Browse marketplace, view listings |

---

## Key Features

- **Google OAuth** — one-click sign in with Google
- **Real-time Messaging** — Supabase Realtime powers live chat
- **Role-based Dashboards** — different views for Business vs Supplier
- **Product Listings** — with image upload to Supabase Storage
- **Supply Requests** — businesses post requests, suppliers submit offers
- **Inventory Management** — track stock by category
- **Orders** — full order lifecycle management
- **Dark Mode** — persisted to localStorage
- **Chatbot** — rule-based in-app assistant

---

## Deployment (Vercel)

```bash
npm run build
# Deploy the dist/ folder to Vercel, Netlify, or any static host
```

In Vercel → Settings → Environment Variables, add:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

In Supabase → Auth → URL Configuration, add your production domain to allowed redirect URLs.
