"""
Alambana Healthcare — Database Initializer
Run once before first launch: python db_init.py
Creates collections, indexes, and seeds default feature flags.
"""
import asyncio
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / '.env')

MONGO_URL = os.environ['MONGO_URL']
DB_NAME = os.environ['DB_NAME']

DEFAULT_FEATURE_FLAGS = [
    {"feature_name": "video_consultation", "display_name": "Video Consultation",
     "description": "Agora/Twilio/Whereby video calling integration", "estimated_cost": "₹2000-5000/month"},
    {"feature_name": "cloud_storage", "display_name": "Cloud Storage (S3)",
     "description": "AWS S3 or compatible storage for files", "estimated_cost": "₹500-2000/month"},
    {"feature_name": "sms_notifications", "display_name": "SMS Notifications",
     "description": "Twilio/MSG91 SMS service", "estimated_cost": "₹1000-3000/month"},
    {"feature_name": "premium_email", "display_name": "Premium Email Service",
     "description": "SendGrid/AWS SES professional emails", "estimated_cost": "₹1000-2000/month"},
    {"feature_name": "subscription_plans", "display_name": "Subscription Plans",
     "description": "Monthly subscription for patients", "estimated_cost": "No extra cost"},
    {"feature_name": "medicine_store", "display_name": "Medicine Store Integration",
     "description": "Online medicine ordering", "estimated_cost": "Coming Soon"},
    {"feature_name": "lab_integration", "display_name": "Lab Test Integration",
     "description": "Book lab tests online", "estimated_cost": "Coming Soon"},
]

async def init():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

    print(f"Connected to MongoDB: {DB_NAME}")

    # ── Collections ────────────────────────────────────────────────────────────
    collections = [
        "users", "doctor_profiles", "appointments", "health_records",
        "ai_assessments", "blogs", "payments", "chat_messages",
        "prescriptions", "ratings", "feature_flags",
        "password_reset_tokens", "contact_messages"
    ]
    existing = await db.list_collection_names()
    for col in collections:
        if col not in existing:
            await db.create_collection(col)
            print(f"  Created collection: {col}")
        else:
            print(f"  Exists: {col}")

    # ── Indexes ────────────────────────────────────────────────────────────────
    await db.users.create_index("email", unique=True)
    await db.users.create_index("referral_code")
    await db.doctor_profiles.create_index("user_id", unique=True)
    await db.doctor_profiles.create_index("is_approved")
    await db.doctor_profiles.create_index("specialization")
    await db.appointments.create_index([("doctor_id", 1), ("appointment_date", 1), ("appointment_time", 1)])
    await db.appointments.create_index("patient_id")
    await db.appointments.create_index("status")
    await db.health_records.create_index("user_id")
    await db.ai_assessments.create_index("user_id")
    await db.blogs.create_index("is_published")
    await db.blogs.create_index("category")
    await db.payments.create_index("razorpay_order_id")
    await db.payments.create_index("user_id")
    await db.chat_messages.create_index("appointment_id")
    await db.prescriptions.create_index("appointment_id")
    await db.ratings.create_index([("doctor_id", 1), ("is_hidden", 1)])
    await db.password_reset_tokens.create_index("token")
    await db.password_reset_tokens.create_index("email")
    print("  Indexes created.")

    # ── Seed feature flags ────────────────────────────────────────────────────
    existing_flags = await db.feature_flags.count_documents({})
    if existing_flags == 0:
        now = datetime.now(timezone.utc).isoformat()
        docs = [{
            "id": str(uuid.uuid4()),
            "is_enabled": False,
            "config": {},
            "last_modified": now,
            **flag
        } for flag in DEFAULT_FEATURE_FLAGS]
        await db.feature_flags.insert_many(docs)
        print(f"  Seeded {len(docs)} feature flags.")
    else:
        print(f"  Feature flags already seeded ({existing_flags} found).")

    client.close()
    print("\nDatabase initialization complete.")

if __name__ == "__main__":
    asyncio.run(init())
