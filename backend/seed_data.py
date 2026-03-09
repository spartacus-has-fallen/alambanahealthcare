"""
Alambana Healthcare — Seed Script
Populates MongoDB with demo data for testing.
Safe to run multiple times — skips existing records.

Usage:
    cd backend
    python seed_data.py

Credentials after seeding:
    Admin:    admin@alambana.in        / Admin@1234
    Doctors:  dr.arjun.sharma@alambana.in etc.  / Doctor@1234
    Patients: rahul.verma@gmail.com etc.         / Patient@1234
"""
import asyncio
import os
import uuid
import bcrypt
from datetime import datetime, timezone, timedelta
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / '.env')

MONGO_URL = os.environ['MONGO_URL']
DB_NAME   = os.environ['DB_NAME']


def hp(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

def now() -> str:
    return datetime.now(timezone.utc).isoformat()

def daysago(n: int) -> str:
    return (datetime.now(timezone.utc) - timedelta(days=n)).isoformat()


# ─────────────────────────────────────────────────────────────────────────────
# SEED DATA
# ─────────────────────────────────────────────────────────────────────────────

ADMIN = {
    "email": "admin@alambana.in",
    "name":  "Alambana Admin",
    "phone": "9999999999",
    "role":  "admin",
    "password": "Admin@1234",
}

DOCTORS = [
    {
        "user": {
            "email": "dr.arjun.sharma@alambana.in",
            "name":  "Dr. Arjun Sharma",
            "phone": "9876543210",
        },
        "profile": {
            "specialization":    "Cardiology",
            "qualification":     "MBBS, MD (Cardiology), FACC",
            "experience_years":  14,
            "license_number":    "MCI-2010-CARD-4521",
            "bio": (
                "Senior Interventional Cardiologist with 14 years of experience. "
                "Specialises in coronary artery disease, heart failure management, "
                "and preventive cardiology. Has performed over 2,000 cardiac procedures."
            ),
            "consultation_fee":      800.0,
            "available_days":        ["Monday", "Wednesday", "Friday"],
            "available_time_slots":  ["10:00", "11:00", "12:00", "14:00", "15:00", "16:00"],
            "rating":                4.8,
            "total_consultations":   1240,
        },
    },
    {
        "user": {
            "email": "dr.priya.menon@alambana.in",
            "name":  "Dr. Priya Menon",
            "phone": "9876543211",
        },
        "profile": {
            "specialization":    "Dermatology",
            "qualification":     "MBBS, DVD, FRCP (Dermatology)",
            "experience_years":  9,
            "license_number":    "MCI-2015-DERM-8832",
            "bio": (
                "Consultant Dermatologist & Cosmetologist specialising in skin diseases, "
                "acne, hair-loss treatment, and cosmetic procedures. Trained at AIIMS Delhi."
            ),
            "consultation_fee":      600.0,
            "available_days":        ["Tuesday", "Thursday", "Saturday"],
            "available_time_slots":  ["09:00", "10:00", "11:00", "14:00", "15:00"],
            "rating":                4.7,
            "total_consultations":   890,
        },
    },
    {
        "user": {
            "email": "dr.rajesh.kumar@alambana.in",
            "name":  "Dr. Rajesh Kumar",
            "phone": "9876543212",
        },
        "profile": {
            "specialization":    "Ayurveda",
            "qualification":     "BAMS, MD (Ayurveda), PhD",
            "experience_years":  18,
            "license_number":    "CCIM-2005-AYU-1123",
            "bio": (
                "Renowned Ayurvedic physician with 18 years in Panchakarma therapy, "
                "chronic disease management, and holistic wellness. Treated over 5,000 patients."
            ),
            "consultation_fee":      400.0,
            "available_days":        ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            "available_time_slots":  ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00"],
            "rating":                4.9,
            "total_consultations":   2150,
        },
    },
    {
        "user": {
            "email": "dr.anika.singh@alambana.in",
            "name":  "Dr. Anika Singh",
            "phone": "9876543213",
        },
        "profile": {
            "specialization":    "Mental Health",
            "qualification":     "MBBS, MD (Psychiatry), MRCPsych",
            "experience_years":  11,
            "license_number":    "MCI-2013-PSY-6674",
            "bio": (
                "Consultant Psychiatrist specialising in anxiety, depression, OCD, and "
                "relationship counselling. Evidence-based therapy combined with medication "
                "management. Fluent in Hindi and English."
            ),
            "consultation_fee":      700.0,
            "available_days":        ["Monday", "Wednesday", "Thursday", "Saturday"],
            "available_time_slots":  ["10:00", "11:00", "12:00", "15:00", "16:00", "17:00"],
            "rating":                4.6,
            "total_consultations":   780,
        },
    },
    {
        "user": {
            "email": "dr.meera.nair@alambana.in",
            "name":  "Dr. Meera Nair",
            "phone": "9876543214",
        },
        "profile": {
            "specialization":    "Nutrition",
            "qualification":     "MBBS, MSc (Clinical Nutrition), RD",
            "experience_years":  7,
            "license_number":    "IDA-2018-NUT-3345",
            "bio": (
                "Clinical Nutritionist helping patients manage diabetes, obesity, PCOD, and "
                "hypertension through personalised diet plans and behaviour modification therapy."
            ),
            "consultation_fee":      350.0,
            "available_days":        ["Tuesday", "Friday", "Saturday"],
            "available_time_slots":  ["09:00", "10:00", "11:00", "12:00", "14:00"],
            "rating":                4.5,
            "total_consultations":   560,
        },
    },
]

PATIENTS = [
    {"email": "rahul.verma@gmail.com",   "name": "Rahul Verma",   "phone": "9123456780"},
    {"email": "sneha.patel@gmail.com",   "name": "Sneha Patel",   "phone": "9123456781"},
    {"email": "vikram.das@gmail.com",    "name": "Vikram Das",     "phone": "9123456782"},
]

BLOGS = [
    {
        "title": "10 Warning Signs of Heart Disease You Should Never Ignore",
        "category": "Cardiology",
        "tags": ["heart disease", "cardiac health", "prevention", "warning signs"],
        "is_featured": True,
        "days_ago": 10,
        "content": """\
Heart disease remains the leading cause of death in India, claiming over 2 million lives annually. \
Early detection can save your life.

**1. Chest Pain or Discomfort**
A squeezing, pressing, or burning sensation in the chest — may radiate to the left arm, jaw, neck, or back. \
Never ignore chest discomfort, especially if it lasts more than a few minutes.

**2. Shortness of Breath**
Feeling breathless during activities that previously didn't cause it — climbing stairs, brisk walking — can \
signal that your heart is struggling to pump adequately.

**3. Palpitations**
A racing, pounding, or fluttering heartbeat can indicate arrhythmias (irregular heart rhythms). \
Frequent episodes warrant investigation.

**4. Swollen Ankles and Feet**
Oedema (fluid retention) in the lower extremities can be a sign of heart failure, where the heart \
cannot pump blood efficiently.

**5. Persistent Fatigue**
Extreme exhaustion that doesn't improve with rest, especially in women, is an early warning of heart disease.

**6. Dizziness or Lightheadedness**
Sudden dizziness may indicate inadequate blood flow to the brain due to cardiac issues.

**7. Cold Sweats**
Breaking into a cold sweat without exertion, especially alongside chest pain, is a red flag.

**8. Nausea and Vomiting**
Often dismissed as a stomach issue — particularly in women — these symptoms can accompany a heart attack.

**9. Pain in the Upper Body**
Discomfort spreading to shoulders, arms, neck, jaw, or stomach can be referred pain from a cardiac event.

**10. Snoring and Sleep Apnoea**
Obstructive sleep apnoea significantly increases cardiovascular risk.

**Prevention Strategies**
- Maintain a heart-healthy diet rich in vegetables, fruits, and whole grains
- Exercise at least 150 minutes per week
- Quit smoking — it doubles your heart disease risk
- Manage stress through yoga and meditation
- Monitor blood pressure and cholesterol regularly

If you experience any of these symptoms, consult a cardiologist immediately. \
Our verified cardiologists at Alambana Healthcare are available for same-day consultations.
""",
    },
    {
        "title": "Ayurvedic Approach to Managing Chronic Digestive Disorders",
        "category": "Ayurveda",
        "tags": ["ayurveda", "digestion", "gut health", "IBS", "panchakarma"],
        "is_featured": False,
        "days_ago": 7,
        "content": """\
Digestive disorders affect nearly 40% of Indians. Ayurveda offers holistic solutions that address \
the root cause rather than just symptoms.

**Understanding Agni (Digestive Fire)**
Optimal digestion depends on a balanced Agni — the metabolic force governing all transformation in the body. \
When Agni is impaired, Ama (toxins) accumulate, leading to disease.

**Acidity and GERD**
- *Yashtimadhu (Licorice)* — soothes the oesophageal lining and reduces acid secretion
- *Amla (Indian Gooseberry)* — rich in Vitamin C, balances gastric acid naturally
- *Remedy*: Mix 1 tsp Amla powder in warm water, drink 30 minutes before meals

**Irritable Bowel Syndrome (IBS)**
- *Triphala* — combines Haritaki, Bibhitaki, and Amla for comprehensive gut support
- *Remedy*: 2 tsp Triphala churna in warm water at bedtime

**Constipation**
- *Isabgol (Psyllium Husk)* — adds bulk and promotes healthy bowel movements
- *Haritaki* — improves absorption of nutrients

**Bloating and Gas**
- *Hingvastak Churna* — contains asafoetida, dry ginger, and pepper; relieves gas instantly
- *Ajwain (Carom Seeds)* — chew ½ tsp with warm water after meals

**Panchakarma Therapies for Deep Cleansing**
1. Vamana (therapeutic emesis) — for Kapha-type disorders
2. Virechana (purgation therapy) — for Pitta disorders, chronic acidity
3. Basti (herbal enemas) — the most powerful treatment for Vata-related digestive issues

**Lifestyle Modifications**
- Eat only when truly hungry; avoid snacking
- Sit down to eat; no screens during meals
- Walk 100 steps after each meal (Shatapavali)

Consult Dr. Rajesh Kumar, our resident Ayurvedic expert, for a personalised Panchakarma plan.
""",
    },
    {
        "title": "Managing Type 2 Diabetes: A Complete Guide to Diet, Lifestyle, and Monitoring",
        "category": "Nutrition",
        "tags": ["diabetes", "type 2 diabetes", "blood sugar", "diet", "lifestyle"],
        "is_featured": True,
        "days_ago": 4,
        "content": """\
India has 77 million diabetics — the second highest globally. The good news? Type 2 diabetes is largely \
preventable and manageable through lifestyle changes.

**Understanding the Glycaemic Index (GI)**
- Low GI (0–55): Brown rice, oats, lentils, most vegetables ✓
- Medium GI (56–69): Whole wheat bread, basmati rice ⚠️
- High GI (70+): White rice, maida, sugar, potatoes ✗

**The Diabetes-Friendly Plate Method**
- 50% — Non-starchy vegetables (leafy greens, broccoli, cucumber, tomatoes)
- 25% — Lean protein (fish, paneer, eggs, legumes)
- 25% — Complex carbohydrates (whole grains, millets)

**Indian Foods That Help Control Blood Sugar**
- *Karela (Bitter Gourd)* — contains charantin which mimics insulin
- *Methi (Fenugreek)* — high in soluble fibre, reduces postprandial glucose spikes
- *Jamun (Black Plum)* — seeds powdered in water reduce blood glucose
- *Turmeric* — curcumin activates AMPK pathway, improving glucose metabolism

**Exercise Protocol for Diabetics**
1. Aerobic exercise — 30 min brisk walking, 5 days/week; reduces HbA1c by 0.7%
2. Resistance training — 2–3 days/week; improves insulin sensitivity
3. Yoga — Surya Namaskar and Pranayama regulate cortisol and insulin

**Monitoring Your Blood Sugar**
- Fasting glucose target: 80–130 mg/dL
- 2-hour postmeal target: <180 mg/dL
- HbA1c target: <7% (check every 3 months)

**Complications to Watch For**
- Diabetic retinopathy — annual eye exams
- Diabetic nephropathy — 6-monthly kidney function tests
- Diabetic neuropathy — daily foot inspection
- Cardiovascular disease — blood pressure and lipid control

Book a consultation with our nutrition specialist at Alambana Healthcare for a personalised diabetes management plan.
""",
    },
    {
        "title": "Mental Health in India: Breaking the Stigma and Seeking Help",
        "category": "Mental Health",
        "tags": ["mental health", "depression", "anxiety", "stigma", "therapy"],
        "is_featured": False,
        "days_ago": 2,
        "content": """\
India carries over 15% of the global mental health burden yet allocates less than 1% of its health budget \
to mental health. Stigma remains the biggest barrier to care.

**The State of Mental Health in India**
- 150 million Indians need mental healthcare; only 30 million seek it
- Suicide is the leading cause of death among Indians aged 15–39
- Average delay from symptom onset to treatment: 7 years

**Most Common Conditions**

*Depression* — more than sadness. A persistent low mood lasting 2+ weeks, with loss of interest, fatigue, \
and changes in sleep and appetite.

*Anxiety Disorders* — GAD, social anxiety, panic disorder, and OCD affect millions. Anxiety is not weakness; \
it is a medical condition with effective treatments.

*Bipolar Disorder* — episodes of mania alternating with depression. Often misdiagnosed for years. \
Responds well to mood stabilisers.

*PTSD* — not just for war veterans. Domestic abuse survivors, accident victims, and childhood trauma \
survivors can develop PTSD. Trauma-focused CBT and EMDR are highly effective.

**Busting Common Myths**
| Myth | Reality |
|------|---------|
| Mental illness is a sign of weakness | It's a medical condition, like diabetes |
| Psychiatric medicines are addictive | Most antidepressants are NOT addictive |
| Therapy is for 'mad' people | Therapy is a tool for better mental wellbeing |
| Mental health won't affect me | 1 in 4 people face a mental health issue in their lifetime |

**When to Seek Help**
- Symptoms persist for more than 2 weeks
- Affecting work, relationships, or daily functioning
- Using alcohol or substances to cope
- Thoughts of self-harm — seek help immediately

**Helplines**
- iCall: 9152987821
- Vandrevala Foundation: 1860-2662-345 (24/7)
- NIMHANS: 080-46110007

Dr. Anika Singh at Alambana Healthcare provides compassionate, confidential psychiatric care. Take the first step.
""",
    },
]


# ─────────────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────────────

async def seed():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    print(f"Connected to MongoDB: {DB_NAME}\n")

    # Ensure new collections exist
    existing_cols = await db.list_collection_names()
    for col in ["advertisements", "platform_config"]:
        if col not in existing_cols:
            await db.create_collection(col)
            print(f"  Created collection: {col}")

    # ── Admin ─────────────────────────────────────────────────────────────────
    if not await db.users.find_one({"email": ADMIN["email"]}):
        doc = {
            "id":               str(uuid.uuid4()),
            "email":            ADMIN["email"],
            "name":             ADMIN["name"],
            "phone":            ADMIN["phone"],
            "role":             "admin",
            "password_hash":    hp(ADMIN["password"]),
            "is_active":        True,
            "referral_code":    "ADMIN001",
            "referral_points":  0,
            "referred_by":      None,
            "created_at":       now(),
        }
        await db.users.insert_one(doc)
        doc.pop("_id", None)
        print(f"  ✓ Created admin: {ADMIN['email']}")
    else:
        print(f"  - Admin already exists: {ADMIN['email']}")

    # ── Doctors ───────────────────────────────────────────────────────────────
    print()
    doctor_ids = {}   # email → user_id
    for d in DOCTORS:
        existing = await db.users.find_one({"email": d["user"]["email"]})
        if existing:
            doctor_ids[d["user"]["email"]] = existing["id"]
            print(f"  - Doctor exists:  {d['user']['name']}")
            continue

        uid = str(uuid.uuid4())
        user_doc = {
            "id":               uid,
            "email":            d["user"]["email"],
            "name":             d["user"]["name"],
            "phone":            d["user"]["phone"],
            "role":             "doctor",
            "password_hash":    hp("Doctor@1234"),
            "is_active":        True,
            "referral_code":    str(uuid.uuid4())[:8].upper(),
            "referral_points":  0,
            "referred_by":      None,
            "created_at":       now(),
        }
        await db.users.insert_one(user_doc)
        user_doc.pop("_id", None)

        profile_doc = {
            "id":           str(uuid.uuid4()),
            "user_id":      uid,
            "is_approved":  True,
            "approved_at":  now(),
            "created_at":   now(),
            **d["profile"],
        }
        await db.doctor_profiles.insert_one(profile_doc)
        profile_doc.pop("_id", None)

        doctor_ids[d["user"]["email"]] = uid
        print(f"  ✓ Created doctor: {d['user']['name']} ({d['profile']['specialization']})")

    # ── Patients ──────────────────────────────────────────────────────────────
    print()
    patient_ids = {}
    for p in PATIENTS:
        existing = await db.users.find_one({"email": p["email"]})
        if existing:
            patient_ids[p["email"]] = existing["id"]
            print(f"  - Patient exists: {p['name']}")
            continue

        uid = str(uuid.uuid4())
        doc = {
            "id":               uid,
            "email":            p["email"],
            "name":             p["name"],
            "phone":            p["phone"],
            "role":             "patient",
            "password_hash":    hp("Patient@1234"),
            "is_active":        True,
            "referral_code":    str(uuid.uuid4())[:8].upper(),
            "referral_points":  0,
            "referred_by":      None,
            "created_at":       now(),
        }
        await db.users.insert_one(doc)
        doc.pop("_id", None)
        patient_ids[p["email"]] = uid
        print(f"  ✓ Created patient: {p['name']}")

    # ── Blog posts ────────────────────────────────────────────────────────────
    print()
    admin_user = await db.users.find_one({"email": ADMIN["email"]})
    admin_id   = admin_user["id"] if admin_user else "admin"

    blog_count = await db.blogs.count_documents({})
    if blog_count == 0:
        for b in BLOGS:
            ts = (datetime.now(timezone.utc) - timedelta(days=b["days_ago"])).isoformat()
            doc = {
                "id":                    str(uuid.uuid4()),
                "author_id":             admin_id,
                "title":                 b["title"],
                "content":               b["content"],
                "category":              b["category"],
                "tags":                  b["tags"],
                "is_published":          True,
                "is_featured":           b["is_featured"],
                "featured_image_base64": None,
                "created_at":            ts,
                "updated_at":            ts,
            }
            await db.blogs.insert_one(doc)
            doc.pop("_id", None)
            print(f"  ✓ Blog: {b['title'][:55]}...")
    else:
        print(f"  - Blogs already exist ({blog_count} found)")

    # ── Health records for first patient ─────────────────────────────────────
    print()
    if patient_ids:
        first_patient_id = list(patient_ids.values())[0]
        hr_count = await db.health_records.count_documents({"user_id": first_patient_id})
        if hr_count == 0:
            records = [
                {"date": "2026-01-15", "record_type": "monthly",  "weight": 78.5, "blood_pressure_systolic": 128, "blood_pressure_diastolic": 82, "oxygen_level": 98.0, "sugar_level": 110.0, "heart_rate": 76, "notes": "Post-festival checkup"},
                {"date": "2026-02-01", "record_type": "monthly",  "weight": 77.2, "blood_pressure_systolic": 124, "blood_pressure_diastolic": 80, "oxygen_level": 98.5, "sugar_level": 105.0, "heart_rate": 74, "notes": "Diet going well"},
                {"date": "2026-02-15", "record_type": "weekly",   "weight": 76.8, "blood_pressure_systolic": 122, "blood_pressure_diastolic": 78, "oxygen_level": 99.0, "sugar_level": 102.0, "heart_rate": 72, "notes": "Feeling better"},
                {"date": "2026-03-01", "record_type": "monthly",  "weight": 76.0, "blood_pressure_systolic": 120, "blood_pressure_diastolic": 76, "oxygen_level": 99.0, "sugar_level": 98.0,  "heart_rate": 70, "notes": "Good progress"},
                {"date": "2026-03-08", "record_type": "weekly",   "weight": 75.5, "blood_pressure_systolic": 118, "blood_pressure_diastolic": 76, "oxygen_level": 99.2, "sugar_level": 96.0,  "heart_rate": 68, "notes": "Running 3x/week"},
            ]
            for r in records:
                doc = {"id": str(uuid.uuid4()), "user_id": first_patient_id, "report_file_url": None, "created_at": now(), **r}
                await db.health_records.insert_one(doc)
                doc.pop("_id", None)
            print(f"  ✓ Seeded {len(records)} health records for Rahul Verma")
        else:
            print(f"  - Health records already exist")

    # ── Demo appointments (completed, for earnings testing) ───────────────────
    print()
    if patient_ids and doctor_ids:
        appt_count = await db.appointments.count_documents({})
        if appt_count == 0:
            pid1 = list(patient_ids.values())[0]
            pid2 = list(patient_ids.values())[1] if len(patient_ids) > 1 else pid1
            did1 = doctor_ids.get("dr.arjun.sharma@alambana.in")
            did2 = doctor_ids.get("dr.priya.menon@alambana.in")
            did3 = doctor_ids.get("dr.rajesh.kumar@alambana.in")

            appts = [
                {"patient_id": pid1, "doctor_id": did1, "appointment_type": "online",  "appointment_date": "2026-02-10", "appointment_time": "10:00", "status": "completed", "payment_status": "completed", "amount": 800.0},
                {"patient_id": pid2, "doctor_id": did1, "appointment_type": "offline", "appointment_date": "2026-02-15", "appointment_time": "11:00", "status": "completed", "payment_status": "completed", "amount": 800.0},
                {"patient_id": pid1, "doctor_id": did2, "appointment_type": "online",  "appointment_date": "2026-02-20", "appointment_time": "14:00", "status": "completed", "payment_status": "completed", "amount": 600.0},
                {"patient_id": pid2, "doctor_id": did3, "appointment_type": "online",  "appointment_date": "2026-03-01", "appointment_time": "09:00", "status": "completed", "payment_status": "completed", "amount": 400.0},
                {"patient_id": pid1, "doctor_id": did3, "appointment_type": "offline", "appointment_date": "2026-03-05", "appointment_time": "10:00", "status": "confirmed", "payment_status": "pending",   "amount": 400.0},
            ]
            cfg = await db.platform_config.find_one({}) or {}
            commission = cfg.get("commission_percentage", 15.0)

            for a in appts:
                amt  = a["amount"]
                d_earn = round(amt * (1 - commission / 100), 2)
                p_earn = round(amt * (commission / 100), 2)
                doc = {
                    "id":               str(uuid.uuid4()),
                    "notes":            "",
                    "prescription_url": None,
                    "created_at":       now(),
                    "doctor_earnings":  d_earn if a["payment_status"] == "completed" else None,
                    "platform_earnings": p_earn if a["payment_status"] == "completed" else None,
                    **a,
                }
                await db.appointments.insert_one(doc)
                doc.pop("_id", None)

                if a["payment_status"] == "completed":
                    pay_doc = {
                        "id":                str(uuid.uuid4()),
                        "user_id":           a["patient_id"],
                        "doctor_id":         a["doctor_id"],
                        "amount":            amt,
                        "status":            "completed",
                        "razorpay_order_id": f"order_demo_{str(uuid.uuid4())[:8]}",
                        "razorpay_payment_id": f"pay_demo_{str(uuid.uuid4())[:8]}",
                        "doctor_earnings":   d_earn,
                        "platform_earnings": p_earn,
                        "created_at":        now(),
                    }
                    await db.payments.insert_one(pay_doc)
                    pay_doc.pop("_id", None)

            print(f"  ✓ Seeded {len(appts)} demo appointments + payment records")
        else:
            print(f"  - Appointments already exist ({appt_count} found)")

    # ── Platform config ───────────────────────────────────────────────────────
    print()
    if not await db.platform_config.find_one({}):
        await db.platform_config.insert_one({
            "commission_percentage":    15.0,
            "referral_points_per_signup": 10,
            "updated_at":               now(),
        })
        print("  ✓ Seeded platform config (commission: 15%)")
    else:
        print("  - Platform config already exists")

    client.close()

    print("""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Seed complete!

  ADMIN
    admin@alambana.in            / Admin@1234

  DOCTORS (all: Doctor@1234)
    dr.arjun.sharma@alambana.in  — Cardiology     ₹800
    dr.priya.menon@alambana.in   — Dermatology    ₹600
    dr.rajesh.kumar@alambana.in  — Ayurveda       ₹400
    dr.anika.singh@alambana.in   — Mental Health  ₹700
    dr.meera.nair@alambana.in    — Nutrition      ₹350

  PATIENTS (all: Patient@1234)
    rahul.verma@gmail.com        — has health records + appointments
    sneha.patel@gmail.com
    vikram.das@gmail.com

  CONTENT
    4 published blog posts
    5 demo appointments (4 completed, 1 pending)
    Payment records with commission breakdown
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
""")


if __name__ == "__main__":
    asyncio.run(seed())
