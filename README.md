<p align="center">
  <h1 align="center">🛡️ Social Safe — Social Media Scam Detection Platform</h1>
  <p align="center">
    An AI-powered social media platform that automatically detects and filters spam, scam, and toxic content using a fine-tuned RoBERTa model, multimodal AI analysis (text + image via OpenRouter/Gemini), and rule-based pattern matching.
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-Express_5-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Python-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" />
  <img src="https://img.shields.io/badge/RoBERTa-ML_Model-FF6F00?style=for-the-badge&logo=pytorch&logoColor=white" />
  <img src="https://img.shields.io/badge/OpenRouter-AI_API-6366F1?style=for-the-badge&logo=openai&logoColor=white" />
  <img src="https://img.shields.io/badge/Gemini-Multimodal_AI-4285F4?style=for-the-badge&logo=google&logoColor=white" />
</p>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Database Setup](#database-setup)
  - [Running the Application](#running-the-application)
- [ML Model](#ml-model)
  - [Training](#training)
  - [Inference API](#inference-api)
- [API Endpoints](#api-endpoints)
- [Admin Panel](#admin-panel)
- [Screenshots](#screenshots)
- [Contributing](#contributing)
- [License](#license)

---

## 🔍 Overview

**Social Safe** is a full-stack social media platform designed to combat online scams, spam, and toxic content. Every post submitted by a user is automatically analyzed through a **triple-layer detection pipeline** that combines:

1. **ML-based detection** — A fine-tuned **RoBERTa** (Robustly optimized BERT) transformer model trained on 160,000+ samples from SMS Spam and Jigsaw Toxic Comment datasets.
2. **AI multimodal analysis** — **Gemini AI** (via OpenRouter) analyzes both **text AND images** for scam indicators like fake QR codes, phishing screenshots, fraudulent logos, and visual manipulation.
3. **Pattern-based detection** — Rule-based checks for phishing URLs, suspicious domains, scam keywords, and known scam phrases.

Posts flagged as suspicious are held for **admin review** before appearing in the public feed, ensuring a safe community environment.

---

## ✨ Features

### 🔐 User Authentication & Identity
- **Aadhaar UUID-based registration** — Links accounts to a unique identity to prevent mass fake account creation
- **Personal & Business accounts** — One personal account per Aadhaar UUID; multiple business accounts allowed
- **JWT-based authentication** with secure token management
- **Password hashing** using bcryptjs

### 📝 Post Management
- **Create posts** with text content and optional image uploads
- **Automatic scam detection** on every post before publishing
- **Post status workflow**: `pending` → `approved` / `rejected`
- **Public feed** showing only approved posts
- **User profile** with post history

### 🤖 AI-Powered Content Moderation
- **RoBERTa transformer model** fine-tuned for spam/scam classification (text-only)
- **Gemini AI multimodal analysis** via OpenRouter — analyzes both **text AND images** together
- **Image scam detection** — Catches fake QR codes, phishing screenshots, fraudulent logos, impersonation visuals
- **Scam category detection** — Identifies phishing, financial scams, impersonation, fake offers, urgency manipulation, etc.
- **Triple-layer hybrid detection** combining ML + AI + pattern rules
- **Phishing detection** for suspicious URLs, domains, and TLDs
- **Keyword matching** for known scam/spam phrases
- **Confidence scoring** with configurable thresholds (default: 0.6)
- **Auto-retry with exponential backoff** on AI rate limits (3 retries: 2s, 4s, 8s)
- **Graceful fallback** — Falls back to ML-only, then pattern-only if services are unavailable

### 👨‍💼 Admin Dashboard
- **Dedicated admin login** (`/admin/login`) separate from user login
- **Dashboard with analytics** — graphs and statistics for platform activity
- **Pending posts review** — Approve or reject flagged posts with scam details
- **Rejected posts management** — View rejected posts with author UUIDs and scam reasons
- **User management** — Block/unblock users, view account details

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                         │
│         Vite + React 19 + React Router + Framer Motion          │
│                    Runs on port 5173                            │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTP (Axios)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Backend (Node.js/Express)                    │
│              REST API · JWT Auth · Scam Checker                 │
│                      Runs on port 5000                          │
├──────────────────┬──────────────────────────────────────────────┤
│                  │                                              │
│   ┌──────────────▼──────────────┐   ┌─────────────────────────┐ │
│   │   Pattern-Based Checker     │   │    Supabase (Postgres)  │ │
│   │   Phishing · Scam · URLs    │   │    Users · Posts · RLS  │ │
│   └─────────────────────────────┘   │    Storage (Images)     │ │
│                  │                   └─────────────────────────┘ │
│                  │ HTTP                                          │
│   ┌──────────────▼──────────────────────────────────────┐       │
│   │          ML Service (FastAPI) — Port 8000           │       │
│   │  ┌─────────────────┐   ┌────────────────────────┐   │       │
│   │  │  RoBERTa Model  │   │  Gemini AI (OpenRouter) │  │       │
│   │  │  Text Analysis  │   │  Text + Image Analysis  │  │       │
│   │  │  PyTorch        │   │  Multimodal Vision      │  │       │
│   │  └─────────────────┘   └────────────────────────┘   │       │
│   │           Combined Score → is_scam + confidence      │       │
│   └──────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19.2 | UI framework |
| Vite | 7.3 | Build tool & dev server |
| React Router DOM | 7.13 | Client-side routing |
| Axios | 1.13 | HTTP client |
| Framer Motion | 12.35 | Animations & transitions |
| Lucide React | 0.577 | Icon library |
| React Icons | 5.6 | Additional icons |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | — | Runtime environment |
| Express | 5.1 | Web framework |
| Supabase JS | 2.49 | Database client (PostgreSQL) |
| JSON Web Token | 9.0 | Authentication |
| bcryptjs | 3.0 | Password hashing |
| express-validator | 7.2 | Input validation |
| Multer | 2.0 | File upload handling |
| CORS | 2.8 | Cross-origin requests |

### ML Model & AI
| Technology | Version | Purpose |
|---|---|---|
| Python | 3.11+ | ML runtime |
| FastAPI | 0.109 | ML API server |
| PyTorch | 2.1 | Deep learning framework |
| Transformers (HuggingFace) | 4.36 | RoBERTa model |
| OpenRouter API | — | AI gateway (Gemini, GPT, Claude) |
| Gemini 2.0 Flash | — | Multimodal text + image analysis |
| httpx | 0.27+ | Async HTTP client for AI API calls |
| python-dotenv | 1.0+ | Environment variable management |
| Uvicorn | 0.27 | ASGI server |
| Modal | — | Cloud GPU training (A100) |

### Database & Storage
| Technology | Purpose |
|---|---|
| Supabase (PostgreSQL) | Relational database with RLS |
| Supabase Storage | Post image uploads (bucket: `post-images`) |

---

## 📁 Project Structure

```
social_scam/
├── backend/                    # Node.js Express API server
│   ├── config/
│   │   └── supabase.js         # Supabase client initialization
│   ├── middleware/
│   │   ├── auth.js             # JWT authentication middleware
│   │   └── admin.js            # Admin role authorization
│   ├── routes/
│   │   ├── auth.js             # Auth routes (register, login)
│   │   ├── posts.js            # Post CRUD + scam checking
│   │   └── admin.js            # Admin dashboard & moderation APIs
│   ├── services/
│   │   └── scamChecker.js      # Hybrid scam detection (ML + AI + patterns)
│   ├── schema.sql              # Supabase database schema
│   ├── .env.example            # Environment variables template
│   ├── server.js               # Express app entry point
│   └── package.json
│
├── frontend/                   # React (Vite) SPA
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js        # Axios instance with auth interceptors
│   │   ├── components/
│   │   │   ├── AdminRoute.jsx  # Protected route for admin pages
│   │   │   ├── BrandIcons.jsx  # SVG brand icons
│   │   │   ├── Navbar.jsx      # Navigation bar
│   │   │   ├── PostCard.jsx    # Post display card
│   │   │   └── PrivateRoute.jsx # Protected route for logged-in users
│   │   ├── context/
│   │   │   └── AuthContext.jsx # Auth state management (React Context)
│   │   ├── pages/
│   │   │   ├── Home.jsx        # Landing page
│   │   │   ├── Login.jsx       # User login
│   │   │   ├── Register.jsx    # User registration
│   │   │   ├── Feed.jsx        # Public feed (approved posts)
│   │   │   ├── CreatePost.jsx  # Post creation form
│   │   │   ├── Profile.jsx     # User profile page
│   │   │   └── admin/
│   │   │       ├── AdminLogin.jsx    # Dedicated admin login
│   │   │       ├── Dashboard.jsx     # Admin dashboard + analytics
│   │   │       ├── PendingPosts.jsx  # Review pending posts
│   │   │       ├── RejectedPosts.jsx # View rejected posts
│   │   │       └── UserManagement.jsx # Manage users
│   │   ├── App.jsx             # Root component with routing
│   │   ├── main.jsx            # React entry point
│   │   └── index.css           # Global styles
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── ml_model/                   # Python ML + AI service
│   ├── api.py                  # FastAPI server (RoBERTa + OpenRouter/Gemini AI)
│   ├── train_modal.py          # Model training script (Modal + A100 GPU)
│   ├── requirements.txt        # Python dependencies
│   ├── .env                    # OpenRouter API key & model config
│   └── text_moderation_model/  # Trained RoBERTa model files
│       ├── config.json
│       ├── merges.txt
│       ├── model.safetensors   # Model weights (~500MB, gitignored)
│       ├── special_tokens_map.json
│       └── vocab.json
│
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+ and npm
- **Python** 3.11+
- **Supabase** account ([supabase.com](https://supabase.com))
- **OpenRouter** account ([openrouter.ai](https://openrouter.ai)) — Free tier available
- **Git**

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/Subbareddy2004/social_scam.git
cd social_scam
```

**2. Install backend dependencies**

```bash
cd backend
npm install
```

**3. Install frontend dependencies**

```bash
cd ../frontend
npm install
```

**4. Install ML model dependencies**

```bash
cd ../ml_model
pip install -r requirements.txt
```

### Environment Variables

**Backend** — Create `backend/.env`:

```bash
cp backend/.env.example backend/.env
```

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key

# JWT Secret
JWT_SECRET=your_secure_jwt_secret_key

# Server Port
PORT=5000

# ML Service URL (Python ML API)
ML_SERVICE_URL=http://127.0.0.1:8000/predict
ML_ANALYZE_URL=http://127.0.0.1:8000/analyze
```

**ML Model** — Create `ml_model/.env`:

```env
# OpenRouter API Key (get yours from https://openrouter.ai/keys)
OPENROUTER_API_KEY=sk-or-v1-your-key-here

# AI Model (Gemini Flash is free & great for image+text analysis)
OPENROUTER_MODEL=google/gemini-2.0-flash-001
```

> 💡 Get your free OpenRouter API key at [openrouter.ai/keys](https://openrouter.ai/keys)

### Database Setup

1. Go to your **Supabase Dashboard** → **SQL Editor**
2. Copy the contents of [`backend/schema.sql`](backend/schema.sql) and run it
3. This will create:
   - `users` table with Aadhaar UUID, roles, and blocking support
   - `posts` table with status workflow and scam metadata
   - Row Level Security policies
   - A default admin user (`admin@socialscam.com` / `admin123`)
4. Go to **Storage** → Create a public bucket named `post-images`

### Running the Application

You need to run **3 services** simultaneously:

**Terminal 1 — ML Model API (Python)**

```bash
cd ml_model
python api.py
```

> Starts on `http://localhost:8000` — Loads RoBERTa model + connects to OpenRouter AI for multimodal analysis

**Terminal 2 — Backend API (Node.js)**

```bash
cd backend
npm run dev
```

> Starts on `http://localhost:5000` — Express API with auto-reload via nodemon

**Terminal 3 — Frontend (React)**

```bash
cd frontend
npm run dev
```

> Starts on `http://localhost:5173` — Vite dev server with HMR

Once all 3 services are running, open **http://localhost:5173** in your browser.

---

## 🤖 ML Model

### Training

The model is trained using **Modal** for cloud GPU access (A100-80GB). Training uses two datasets:

| Dataset | Source | Samples | Purpose |
|---|---|---|---|
| SMS Spam Collection | UCI ML Repository | ~5,500 | SMS spam detection |
| Jigsaw Toxic Comments | Kaggle | ~160,000 | Toxic/abusive content |

**Training Configuration:**
- **Model**: `roberta-base` (125M parameters)
- **GPU**: NVIDIA A100-80GB
- **Batch Size**: 128
- **Epochs**: 3
- **Learning Rate**: 3e-5
- **Precision**: FP16 mixed precision
- **Max Sequence Length**: 128 tokens

**To train the model:**

```bash
cd ml_model
modal run train_modal.py
```

> ⚡ Training completes in ~5–8 minutes on an A100 GPU (~$0.50 cost)

After training, extract the model files to `ml_model/text_moderation_model/`.

### Inference API

The ML API is built with **FastAPI** and exposes:

| Endpoint | Method | Description |
|---|---|---|
| `/predict` | POST | Classify text as spam/safe (RoBERTa only, backward compatible) |
| `/analyze` | POST | **Combined analysis** — RoBERTa ML + Gemini AI (text + image) |
| `/analyze/ai` | POST | AI-only analysis via OpenRouter (text + image) |
| `/health` | GET | Health check + model & AI status |

**Combined Analysis Request (`/analyze`):**
```json
{
  "text": "Scan this QR code to win free iPhone!",
  "image_url": "https://example.com/suspicious-qr.jpg"
}
```

**Combined Analysis Response:**
```json
{
  "is_scam": true,
  "confidence": 0.95,
  "reason": "ML model: scam (95%) | AI analysis: scam (92%) | Categories: qr_code_scam, fake_offer",
  "label": "spam",
  "ml_result": {
    "is_scam": true,
    "confidence": 0.9542,
    "reason": "Text classified as spam/scam (confidence: 95.4%)",
    "label": "spam"
  },
  "ai_result": {
    "is_scam": true,
    "scam_score": 0.92,
    "safe_score": 0.08,
    "reason": "QR code combined with prize claim is a common scam pattern",
    "categories": ["qr_code_scam", "fake_offer"],
    "analysis_type": "text_and_image"
  }
}
```

**AI Scam Categories Detected:**
| Category | Description |
|---|---|
| `phishing` | Attempts to steal credentials or personal info |
| `financial_scam` | Fake investment, lottery, prize scams |
| `impersonation` | Pretending to be a brand/person/authority |
| `qr_code_scam` | Malicious QR codes |
| `fake_offer` | Too-good-to-be-true deals |
| `urgency_manipulation` | False urgency to pressure action |
| `fake_product` | Counterfeit or non-existent products |
| `data_harvesting` | Collecting personal data under false pretenses |
| `malware` | Links to malicious software |
| `safe` | Content appears legitimate |

---

## 📡 API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new user | ❌ |
| `POST` | `/api/auth/login` | User login (returns JWT) | ❌ |
| `GET` | `/api/auth/me` | Get current user profile | ✅ |

### Posts (`/api/posts`)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/posts/feed` | Get approved posts (public feed) | ✅ |
| `POST` | `/api/posts/create` | Create a new post (auto scam-checked) | ✅ |
| `GET` | `/api/posts/my-posts` | Get current user's posts | ✅ |
| `DELETE` | `/api/posts/:id` | Delete a post | ✅ |

### Admin (`/api/admin`)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/admin/stats` | Dashboard statistics | 🔒 Admin |
| `GET` | `/api/admin/pending` | Get pending posts | 🔒 Admin |
| `GET` | `/api/admin/rejected` | Get rejected posts | 🔒 Admin |
| `PUT` | `/api/admin/posts/:id/approve` | Approve a post | 🔒 Admin |
| `PUT` | `/api/admin/posts/:id/reject` | Reject a post | 🔒 Admin |
| `GET` | `/api/admin/users` | List all users | 🔒 Admin |
| `PUT` | `/api/admin/users/:id/block` | Block a user | 🔒 Admin |
| `PUT` | `/api/admin/users/:id/unblock` | Unblock a user | 🔒 Admin |

### Health Check

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Backend health status |
| `GET` | `http://localhost:8000/health` | ML service health status |

---

## 👨‍💼 Admin Panel

Access the admin panel at `/admin/login` with the default credentials:

| Field | Value |
|---|---|
| Email | `admin@socialscam.com` |
| Password | `admin123` |

### Admin Features:
- **Dashboard** — Overview statistics with interactive charts and graphs
- **Pending Posts** — Review posts flagged by the detection system, with scam confidence scores and reasons
- **Rejected Posts** — Historical view of rejected content with author UUID tracking
- **User Management** — View, block, and unblock user accounts

---

## 🔧 Scam Detection Pipeline

When a user creates a post, it goes through this triple-layer pipeline:

```
User submits post (text + optional image)
        │
        ▼
┌───────────────────────────────────────────────┐
│          Triple-Layer Detection               │
├──────────────┬──────────────┬─────────────────┤
│  RoBERTa ML  │  Gemini AI   │  Pattern Rules  │
│  (Text Only) │ (Text+Image) │  (Keywords/URL) │
│   PyTorch    │  OpenRouter   │  Rule-based     │
└──────┬───────┴──────┬───────┴────────┬────────┘
       │              │                │
       ▼              ▼                ▼
┌─────────────────────────────────────────────┐
│  Combine All Results                        │
│  • If ANY detector flags scam → is_scam     │
│  • Highest confidence score wins            │
│  • AI categories + reasons merged           │
└──────────────────┬──────────────────────────┘
                   │
        ┌──────────┼──────────┐
        │          │          │
   High conf.  Low conf.   Safe
    (≥0.7)     (<0.7)
        │          │          │
        ▼          ▼          ▼
 ┌──────────┐ ┌──────────┐ ┌───────────┐
 │ REJECTED │ │ PENDING  │ │ APPROVED  │
 │ (Auto)   │ │ (Review) │ │ (Visible) │
 └──────────┘ └──────────┘ └───────────┘
```

### Detection Sources:
- **RoBERTa ML Model**: Catches toxicity, threats, classic spam via learned patterns (text-only)
- **Gemini AI (OpenRouter)**: Analyzes text AND images for visual scams — fake QR codes, phishing screenshots, impersonation logos, fraudulent offers
- **Pattern Rules**: Catches phishing URLs, suspicious domains, scam keywords, and known phrases

### Fallback Strategy:
- If **AI is unavailable** → Falls back to ML + Pattern
- If **ML is unavailable** → Falls back to Pattern only
- **Rate limit auto-retry** → 3 retries with exponential backoff (2s, 4s, 8s)

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request


<p align="center">
  Made with ❤️ for a safer social media experience
</p>
