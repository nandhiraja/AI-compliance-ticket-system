# 🎫 AI-Powered Ticket Management System

[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![Flask](https://img.shields.io/badge/Flask-3.0+-green.svg)](https://flask.palletsprojects.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A customer support ticket system that uses **AI (BERT)** to automatically categorize and prioritize tickets — no manual sorting needed.

---

## 🎯 What It Does

When a user submits a support ticket, the AI reads the text and:
- **Assigns a department** → Technical, Billing, Account, Fraud, or General
- **Sets a priority** → Critical, High, Medium, or Low

This removes the need for manual ticket routing and speeds up resolution.

---

## ✨ Key Features

| Area | What's Included |
|------|----------------|
| 🤖 AI Classification | Auto-assigns department & priority using BERT |
| 👤 User Accounts | Sign up, login, profile management |
| 🎫 Ticket Lifecycle | Create → Track (Open / In Progress) → View History |
| 👨‍💼 Admin Panel | Manage users, edit tickets, view system stats |
| 📊 Analytics | Live counts for open, closed, and critical tickets |

---

## 🛠️ Tech Stack

**Frontend:** HTML5, CSS3, Vanilla JavaScript  
**Backend:** Python 3.11+, Flask, Flask-JWT-Extended, SQLite  
**AI/ML:** BERT (bert-base-uncased), PyTorch, Transformers, scikit-learn

---

## 🏗️ Architecture

```
Browser (HTML/CSS/JS)
       ↓ REST API
Flask Server (app.py)
   ├── Auth Module
   ├── Tickets Module
   └── Admin Module
       ↓
   ┌──────────┬───────────┐
   │ SQLite   │ AI Engine │
   │ Database │ (BERT)    │
   └──────────┴───────────┘
```

---

## 📦 Installation

### Prerequisites
- Python 3.11+
- pip
- Git

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/your-username/AI-compliance-ticket-system.git
cd AI-compliance-ticket-system

# 2. Create & activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run the server
python app.py
```

The server starts at **http://127.0.0.1:5000**

### Open the Frontend
- Open `templates/home.html` with **Live Server** (VS Code), or
- Double-click the HTML file directly

---

## 🚀 Usage

### Regular Users
1. **Sign up / Login** at the home page
2. **Create a ticket** — enter a title and description, the AI will predict department & priority
3. **Track tickets** — see active tickets under Progress, resolved ones under History

### Admin
- Login: `admin` / `123456`
- View & manage all users and tickets
- Edit department, priority, or status on any ticket

---

## 📡 API Reference

### Auth

```http
POST /api/auth/signup   → Register a new user
POST /api/auth/login    → Login and get JWT token
```

### Tickets

```http
POST /api/tickets/create              → Create ticket (AI auto-classifies)
GET  /api/tickets                     → Get current user's tickets
PUT  /api/tickets/{id}/status         → Update ticket status
```

### Admin

```http
GET  /api/admin/users                 → List all users
GET  /api/admin/tickets               → List all tickets
PUT  /api/admin/tickets/{id}          → Edit ticket details
```

### AI

```http
POST /api/ai/predict    → Preview AI prediction for a given text
```

---

## 📁 Project Structure

```
AI-compliance-ticket-system/
├── app.py                  # Main Flask app
├── models.py               # Database models
├── ml_predictor.py         # AI classification engine
├── requirements.txt        # Dependencies
│
├── models/                 # Trained AI model files (.pkl)
├── database/               # SQLite database
│
└── templates/              # Frontend
    ├── *.html              # Pages (home, login, dashboard, etc.)
    ├── css/                # Stylesheets
    └── js/                 # JavaScript
```

---

## 🤖 AI Model

The system uses a two-stage pipeline:

```
Ticket Text → BERT Embeddings → Logistic Regression → Department + Priority
```

| Detail | Value |
|--------|-------|
| Base Model | BERT-base-uncased |
| Training Data | 20,000 support tickets |
| Department Accuracy | ~95% |
| Priority Accuracy | ~94% |
| Model Size | ~58 KB total |

The models run on CPU — no GPU required.


---

<p align="center"><strong>Built with ❤️ for efficient customer support</strong></p>