# Alambana Healthcare

A full-stack telemedicine platform built for India. Connects patients with doctors for online consultations, prescriptions, and health records.

**Parent company:** Sejal Engitech Pvt Ltd

---

## Live

| Service | URL |
|---|---|
| Frontend | https://alambanahealthcare.vercel.app |
| Backend API | https://alambanahealthcare-production.up.railway.app |

---

## Stack

- **Frontend:** React 19, Tailwind CSS, Shadcn UI, Yarn
- **Backend:** FastAPI, MongoDB (Motor), PyJWT, bcrypt
- **AI:** OpenAI `gpt-4o-mini` (symptom checker)
- **Payments:** Razorpay
- **Deploy:** Vercel (frontend) + Railway Docker (backend + MongoDB)

---

## Local Development

### Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # fill in your values
python db_init.py      # one-time MongoDB setup
uvicorn server:app --reload --port 8000
```

### Frontend
```bash
cd frontend
yarn install
yarn start
```

Or use `start.bat` from the project root to launch both.

---

## Environment Variables

### Backend (`backend/.env`)
```
MONGO_URL=mongodb://...
DB_NAME=alambana_healthcare
JWT_SECRET_KEY=your_secret
CORS_ORIGINS=http://localhost:3000
OPENAI_API_KEY=sk-...
RAZORPAY_KEY_ID=rzp_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASSWORD=your_app_password
FROM_EMAIL=noreply@alambana.in
ADMIN_EMAIL=admin@alambana.in
FRONTEND_URL=http://localhost:3000
```

### Frontend (`frontend/.env`)
```
REACT_APP_BACKEND_URL=http://localhost:8000
REACT_APP_RAZORPAY_KEY_ID=rzp_test_...
```

---

## Key Features

- Doctor search, filtering, and booking
- Razorpay payment checkout
- Appointment cancel / reschedule
- PDF prescriptions (ReportLab)
- Doctor ratings and reviews
- AI symptom checker (GPT, rate-limited)
- Forgot / reset password flow
- Contact form with admin email notification
- Blog with full article view
- Admin dashboard for platform management

---

## Deployment

See `PROJECT_CONTEXT.md §9` for full deployment notes including Railway config, MongoDB setup, and serverbyt.in usage.

---

## Admin
Default admin account: `admin@alambana.in` / `Admin@1234`
