from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import smtplib
import hmac
import hashlib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
from openai import AsyncOpenAI
import razorpay
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET_KEY')
if not JWT_SECRET:
    raise ValueError("JWT_SECRET_KEY environment variable must be set")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30

# Razorpay Configuration
RAZORPAY_KEY_ID = os.environ.get('RAZORPAY_KEY_ID', '')
RAZORPAY_KEY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET', '')
RAZORPAY_WEBHOOK_SECRET = os.environ.get('RAZORPAY_WEBHOOK_SECRET', '')
if RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET:
    razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
else:
    razorpay_client = None

# Email Configuration
SMTP_HOST = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
SMTP_PORT = int(os.environ.get('SMTP_PORT', '587'))
SMTP_USER = os.environ.get('SMTP_USER', '')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', '')
FROM_EMAIL = os.environ.get('FROM_EMAIL', SMTP_USER)
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', SMTP_USER)
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')

# AI Rate Limiting (in-memory: {identifier: [timestamps]})
ai_rate_limit: Dict[str, List[float]] = {}

# Security
security = HTTPBearer()

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ========== MODELS ==========

class UserBase(BaseModel):
    email: EmailStr
    name: str
    phone: str
    role: str = "patient"  # patient, doctor, admin

class UserRegister(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_active: bool = True
    referral_code: str = Field(default_factory=lambda: str(uuid.uuid4())[:8].upper())
    referral_points: int = 0
    referred_by: Optional[str] = None

class DoctorProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    specialization: str
    qualification: str
    experience_years: int
    license_number: str
    license_file_url: Optional[str] = None
    bio: str = ""
    consultation_fee: float = 0.0
    available_days: List[str] = []
    available_time_slots: List[str] = []
    is_approved: bool = False
    approved_at: Optional[datetime] = None
    rating: float = 0.0
    total_consultations: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DoctorProfileCreate(BaseModel):
    specialization: str
    qualification: str
    experience_years: int
    license_number: str
    bio: str = ""
    consultation_fee: float = 0.0
    available_days: List[str] = []
    available_time_slots: List[str] = []

class Appointment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    patient_id: str
    doctor_id: str
    appointment_type: str  # online, offline
    appointment_date: str
    appointment_time: str
    status: str = "pending"  # pending, confirmed, completed, cancelled
    payment_status: str = "pending"
    payment_id: Optional[str] = None
    amount: float = 0.0
    notes: str = ""
    prescription_url: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AppointmentCreate(BaseModel):
    doctor_id: str
    appointment_type: str
    appointment_date: str
    appointment_time: str
    notes: str = ""

class HealthRecord(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    record_type: str  # weekly, monthly
    date: str
    weight: Optional[float] = None
    blood_pressure_systolic: Optional[int] = None
    blood_pressure_diastolic: Optional[int] = None
    oxygen_level: Optional[float] = None
    sugar_level: Optional[float] = None
    heart_rate: Optional[int] = None
    notes: str = ""
    report_file_url: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class HealthRecordCreate(BaseModel):
    record_type: str
    date: str
    weight: Optional[float] = None
    blood_pressure_systolic: Optional[int] = None
    blood_pressure_diastolic: Optional[int] = None
    oxygen_level: Optional[float] = None
    sugar_level: Optional[float] = None
    heart_rate: Optional[int] = None
    notes: str = ""
    report_file_base64: Optional[str] = None
    report_file_name: Optional[str] = None

class AISymptomCheck(BaseModel):
    symptoms: str
    age: Optional[int] = None
    gender: Optional[str] = None

class AISymptomResponse(BaseModel):
    assessment: str
    risk_level: str
    suggested_specialist: str
    lifestyle_advice: str
    emergency_alert: bool

class AIAssessmentHistory(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    symptoms: str
    assessment: str
    risk_level: str
    suggested_specialist: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BlogPost(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    author_id: str
    title: str
    content: str
    category: str
    tags: List[str] = []
    is_published: bool = False
    is_featured: bool = False
    featured_image_base64: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BlogPostCreate(BaseModel):
    title: str
    content: str
    category: str
    tags: List[str] = []
    is_published: bool = False
    is_featured: bool = False
    featured_image_base64: Optional[str] = None

class Payment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    appointment_id: str
    doctor_id: Optional[str] = None
    amount: float
    currency: str = "INR"
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    status: str = "pending"
    doctor_earnings: Optional[float] = None
    platform_earnings: Optional[float] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PaymentCreate(BaseModel):
    appointment_id: str
    amount: float

class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    appointment_id: str
    sender_id: str
    sender_role: str  # patient, doctor
    message: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatMessageCreate(BaseModel):
    appointment_id: str
    message: str

class Prescription(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    appointment_id: str
    doctor_id: str
    patient_id: str
    diagnosis: str
    medications: List[str] = []
    instructions: str = ""
    follow_up_date: Optional[str] = None
    prescription_file_base64: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Rating(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    patient_id: str
    doctor_id: str
    appointment_id: str
    rating: int  # 1 to 5
    review: str = ""
    is_hidden: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RatingCreate(BaseModel):
    appointment_id: str
    rating: int
    review: str = ""

class FeatureFlag(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    feature_name: str
    display_name: str
    is_enabled: bool = False
    description: str = ""
    estimated_cost: str = ""
    config: Dict[str, Any] = {}
    last_modified: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FeatureFlagUpdate(BaseModel):
    is_enabled: bool
    config: Optional[Dict[str, Any]] = None


class PrescriptionCreate(BaseModel):
    appointment_id: str
    diagnosis: str
    medications: List[str] = []
    instructions: str = ""
    follow_up_date: Optional[str] = None

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

class ContactMessage(BaseModel):
    name: str
    email: EmailStr
    subject: str
    message: str

class AppointmentReschedule(BaseModel):
    new_date: str
    new_time: str

class PlatformConfig(BaseModel):
    model_config = ConfigDict(extra="ignore")
    commission_percentage: float = 15.0
    referral_points_per_signup: int = 10
    updated_at: Optional[str] = None

class Advertisement(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    image_base64: str
    link_url: str
    position: str  # "top" | "sidebar" | "bottom"
    is_active: bool = True
    impressions: int = 0
    clicks: int = 0
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    created_at: Optional[str] = None

class AdvertisementCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    title: str
    image_base64: str
    link_url: str
    position: str
    is_active: bool = True
    start_date: Optional[str] = None
    end_date: Optional[str] = None


# ========== HELPER FUNCTIONS ==========

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def send_email(to: str, subject: str, html_body: str):
    """Send email via SMTP. Silently logs errors to avoid crashing request handlers."""
    if not SMTP_USER or not SMTP_PASSWORD:
        logging.warning("Email not configured — skipping send to %s", to)
        return
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = FROM_EMAIL
        msg["To"] = to
        msg.attach(MIMEText(html_body, "html"))
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
            server.ehlo()
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(FROM_EMAIL, to, msg.as_string())
    except Exception as e:
        logging.error("Failed to send email to %s: %s", to, str(e))

def check_ai_rate_limit(identifier: str) -> bool:
    """Returns True if request is allowed, False if rate limited (5 req/hour)."""
    import time
    now = time.time()
    hour_ago = now - 3600
    timestamps = [t for t in ai_rate_limit.get(identifier, []) if t > hour_ago]
    if len(timestamps) >= 5:
        return False
    timestamps.append(now)
    ai_rate_limit[identifier] = timestamps
    return True

# ========== AUTHENTICATION ROUTES ==========

@api_router.post("/auth/register")
async def register(user_data: UserRegister, referred_by: Optional[str] = None):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    hashed_pwd = hash_password(user_data.password)
    
    # Create user
    user = User(**user_data.model_dump(exclude={"password"}))
    user_dict = user.model_dump()
    user_dict["password"] = hashed_pwd
    user_dict["created_at"] = user_dict["created_at"].isoformat()
    
    # Handle referral
    if referred_by:
        referrer = await db.users.find_one({"referral_code": referred_by}, {"_id": 0})
        if referrer:
            user_dict["referred_by"] = referred_by
            # Get configurable referral points value
            config = await db.platform_config.find_one({}, {"_id": 0}) or {}
            referral_pts = config.get("referral_points_per_signup", 10)
            await db.users.update_one(
                {"referral_code": referred_by},
                {"$inc": {"referral_points": referral_pts}}
            )
    
    await db.users.insert_one(user_dict)
    user_dict.pop("_id", None)

    # Create token
    token = create_access_token({"id": user.id, "email": user.email, "role": user.role})

    return {
        "token": token,
        "user": {k: v for k, v in user_dict.items() if k != "password"}
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"id": user["id"], "email": user["email"], "role": user["role"]})
    
    return {
        "token": token,
        "user": {k: v for k, v in user.items() if k != "password"}
    }

@api_router.get("/auth/me")
async def get_current_user(payload: dict = Depends(verify_token)):
    user = await db.users.find_one({"id": payload["id"]}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@api_router.post("/auth/forgot-password")
async def forgot_password(request_data: PasswordResetRequest):
    user = await db.users.find_one({"email": request_data.email}, {"_id": 0})
    # Always return success to avoid email enumeration
    if user:
        token = str(uuid.uuid4())
        expires_at = (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()
        await db.password_reset_tokens.insert_one({
            "token": token,
            "email": request_data.email,
            "expires_at": expires_at,
            "used": False
        })
        reset_link = f"{FRONTEND_URL}/reset-password?token={token}"
        send_email(
            to=request_data.email,
            subject="Reset your Alambana Healthcare password",
            html_body=f"""
            <div style="font-family:Inter,sans-serif;max-width:500px;margin:auto;padding:32px">
              <h2 style="color:#0D9488">Alambana Healthcare</h2>
              <p>Hi {user.get('name', '')},</p>
              <p>We received a request to reset your password. Click the button below to set a new password.
              This link expires in <strong>1 hour</strong>.</p>
              <a href="{reset_link}" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#0D9488;color:#fff;border-radius:999px;text-decoration:none;font-weight:600">
                Reset Password
              </a>
              <p style="color:#64748B;font-size:13px">If you didn't request this, ignore this email.</p>
            </div>"""
        )
    return {"message": "If that email exists, a reset link has been sent."}

@api_router.post("/auth/reset-password")
async def reset_password(reset_data: PasswordResetConfirm):
    token_doc = await db.password_reset_tokens.find_one({"token": reset_data.token}, {"_id": 0})
    if not token_doc:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    if token_doc.get("used"):
        raise HTTPException(status_code=400, detail="Reset token already used")
    expires_at = datetime.fromisoformat(token_doc["expires_at"])
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail="Reset token has expired")
    if len(reset_data.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    hashed = hash_password(reset_data.new_password)
    await db.users.update_one({"email": token_doc["email"]}, {"$set": {"password": hashed}})
    await db.password_reset_tokens.update_one({"token": reset_data.token}, {"$set": {"used": True}})
    return {"message": "Password reset successfully"}

# ========== DOCTOR ROUTES ==========

@api_router.post("/doctors/profile")
async def create_doctor_profile(profile_data: DoctorProfileCreate, payload: dict = Depends(verify_token)):
    # Check if profile exists
    existing = await db.doctor_profiles.find_one({"user_id": payload["id"]}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Profile already exists")
    
    profile = DoctorProfile(user_id=payload["id"], **profile_data.model_dump())
    profile_dict = profile.model_dump()
    profile_dict["created_at"] = profile_dict["created_at"].isoformat()
    if profile_dict.get("approved_at"):
        profile_dict["approved_at"] = profile_dict["approved_at"].isoformat()
    
    # Create a copy for MongoDB (excludes _id)
    insert_dict = {k: v for k, v in profile_dict.items()}
    await db.doctor_profiles.insert_one(insert_dict)
    
    return profile_dict

@api_router.get("/doctors/profile/me")
async def get_my_doctor_profile(payload: dict = Depends(verify_token)):
    profile = await db.doctor_profiles.find_one({"user_id": payload["id"]}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

@api_router.put("/doctors/profile")
async def update_doctor_profile(profile_data: DoctorProfileCreate, payload: dict = Depends(verify_token)):
    result = await db.doctor_profiles.update_one(
        {"user_id": payload["id"]},
        {"$set": profile_data.model_dump()}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Profile not found")
    return {"message": "Profile updated successfully"}

@api_router.get("/doctors")
async def list_doctors(specialization: Optional[str] = None, approved_only: bool = True):
    query = {}
    if approved_only:
        query["is_approved"] = True
    if specialization:
        query["specialization"] = specialization
    
    doctors = await db.doctor_profiles.find(query, {"_id": 0}).to_list(100)
    
    # Enrich with user data
    for doctor in doctors:
        user = await db.users.find_one({"id": doctor["user_id"]}, {"_id": 0, "password": 0})
        if user:
            doctor["user"] = user
    
    return doctors

@api_router.get("/doctors/{doctor_id}")
async def get_doctor(doctor_id: str):
    doctor = await db.doctor_profiles.find_one({"id": doctor_id}, {"_id": 0})
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    user = await db.users.find_one({"id": doctor["user_id"]}, {"_id": 0, "password": 0})
    if user:
        doctor["user"] = user
    
    return doctor

# ========== APPOINTMENT ROUTES ==========

@api_router.post("/appointments")
async def create_appointment(appointment_data: AppointmentCreate, payload: dict = Depends(verify_token)):
    # Get doctor's fee
    doctor = await db.doctor_profiles.find_one({"id": appointment_data.doctor_id}, {"_id": 0})
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    # Slot conflict detection
    conflict = await db.appointments.find_one({
        "doctor_id": appointment_data.doctor_id,
        "appointment_date": appointment_data.appointment_date,
        "appointment_time": appointment_data.appointment_time,
        "status": {"$nin": ["cancelled"]}
    }, {"_id": 0})
    if conflict:
        raise HTTPException(status_code=409, detail="This time slot is already booked. Please choose another time.")

    appointment = Appointment(
        patient_id=payload["id"],
        **appointment_data.model_dump(),
        amount=doctor["consultation_fee"]
    )
    appointment_dict = appointment.model_dump()
    appointment_dict["created_at"] = appointment_dict["created_at"].isoformat()

    # Create a copy for MongoDB
    insert_dict = {k: v for k, v in appointment_dict.items()}
    await db.appointments.insert_one(insert_dict)

    return appointment_dict

@api_router.get("/appointments")
async def get_appointments(payload: dict = Depends(verify_token)):
    # Get appointments for current user (patient or doctor)
    user = await db.users.find_one({"id": payload["id"]}, {"_id": 0})
    
    if user["role"] == "patient":
        appointments = await db.appointments.find({"patient_id": payload["id"]}, {"_id": 0}).to_list(100)
        # Enrich with doctor data
        for apt in appointments:
            doctor = await db.doctor_profiles.find_one({"id": apt["doctor_id"]}, {"_id": 0})
            if doctor:
                doc_user = await db.users.find_one({"id": doctor["user_id"]}, {"_id": 0, "password": 0})
                doctor["user"] = doc_user
                apt["doctor"] = doctor
    else:
        # Get doctor profile
        doc_profile = await db.doctor_profiles.find_one({"user_id": payload["id"]}, {"_id": 0})
        if doc_profile:
            appointments = await db.appointments.find({"doctor_id": doc_profile["id"]}, {"_id": 0}).to_list(100)
            # Enrich with patient data
            for apt in appointments:
                patient = await db.users.find_one({"id": apt["patient_id"]}, {"_id": 0, "password": 0})
                if patient:
                    apt["patient"] = patient
        else:
            appointments = []
    
    return appointments

@api_router.put("/appointments/{appointment_id}/status")
async def update_appointment_status(appointment_id: str, status: str, payload: dict = Depends(verify_token)):
    result = await db.appointments.update_one(
        {"id": appointment_id},
        {"$set": {"status": status}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return {"message": "Status updated successfully"}

# ========== HEALTH RECORDS ROUTES ==========

@api_router.post("/health-records")
async def create_health_record(record_data: HealthRecordCreate, payload: dict = Depends(verify_token)):
    record = HealthRecord(user_id=payload["id"], **record_data.model_dump())
    record_dict = record.model_dump()
    record_dict["created_at"] = record_dict["created_at"].isoformat()
    
    # Create a copy for MongoDB
    insert_dict = {k: v for k, v in record_dict.items()}
    await db.health_records.insert_one(insert_dict)
    
    return record_dict

@api_router.get("/health-records")
async def get_health_records(payload: dict = Depends(verify_token)):
    records = await db.health_records.find({"user_id": payload["id"]}, {"_id": 0}).sort("date", -1).to_list(100)
    return records

@api_router.get("/health-records/{record_id}")
async def get_health_record(record_id: str, payload: dict = Depends(verify_token)):
    record = await db.health_records.find_one({"id": record_id, "user_id": payload["id"]}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    return record

@api_router.delete("/health-records/{record_id}")
async def delete_health_record(record_id: str, payload: dict = Depends(verify_token)):
    result = await db.health_records.delete_one({"id": record_id, "user_id": payload["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Record not found")
    return {"message": "Record deleted successfully"}

# ========== AI SYMPTOM CHECKER ==========

@api_router.post("/ai/symptom-check", response_model=AISymptomResponse)
async def ai_symptom_check(symptom_data: AISymptomCheck, request: Request, credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))):
    # Rate limiting: 5 requests per hour per IP (or per user if authenticated)
    user_id = None
    identifier = request.client.host if request.client else "unknown"
    if credentials:
        try:
            payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            user_id = payload.get("id")
            identifier = user_id
        except Exception:
            pass
    if not check_ai_rate_limit(identifier):
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Maximum 5 AI checks per hour.")

    # Initialize AI client
    llm_key = os.environ.get('OPENAI_API_KEY')
    if not llm_key:
        raise HTTPException(status_code=500, detail="AI service not configured")

    system_message = """You are a medical AI assistant for preliminary health assessment.
    Analyze symptoms and provide:
    1. Possible conditions (emphasize this is NOT a diagnosis)
    2. Risk level (Low/Medium/High/Emergency)
    3. Suggested specialist to consult
    4. Lifestyle advice
    5. Whether emergency care is needed

    Format your response as JSON with keys: assessment, risk_level, suggested_specialist, lifestyle_advice, emergency_alert (boolean)
    Always include medical disclaimer."""

    user_prompt = f"Patient symptoms: {symptom_data.symptoms}\n"
    if symptom_data.age:
        user_prompt += f"Age: {symptom_data.age}\n"
    if symptom_data.gender:
        user_prompt += f"Gender: {symptom_data.gender}\n"
    user_prompt += "Please analyze and provide assessment in JSON format."

    try:
        client = AsyncOpenAI(api_key=llm_key)
        completion = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.3
        )
        response = completion.choices[0].message.content
        
        # Parse response
        import json
        # Try to extract JSON from response
        response_text = response.strip()
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        try:
            result = json.loads(response_text)
        except (json.JSONDecodeError, ValueError):
            # If JSON parsing fails, create structured response from text
            result = {
                "assessment": response_text,
                "risk_level": "Medium",
                "suggested_specialist": "General Physician",
                "lifestyle_advice": "Please consult with a healthcare professional for personalized advice.",
                "emergency_alert": False
            }
        
        # Ensure all required fields are strings
        assessment_text = str(result.get("assessment", ""))
        risk_level_text = str(result.get("risk_level", "Medium"))
        specialist_text = str(result.get("suggested_specialist", "General Physician"))
        lifestyle_text = str(result.get("lifestyle_advice", ""))
        emergency = bool(result.get("emergency_alert", False))
        
        # Save to history only if user is authenticated
        if user_id:
            history = AIAssessmentHistory(
                user_id=user_id,
                symptoms=symptom_data.symptoms,
                assessment=assessment_text,
                risk_level=risk_level_text,
                suggested_specialist=specialist_text
            )
            history_dict = history.model_dump()
            history_dict["created_at"] = history_dict["created_at"].isoformat()
            
            # Create a copy for MongoDB
            insert_dict = {k: v for k, v in history_dict.items()}
            await db.ai_assessments.insert_one(insert_dict)
        
        return AISymptomResponse(
            assessment=assessment_text,
            risk_level=risk_level_text,
            suggested_specialist=specialist_text,
            lifestyle_advice=lifestyle_text,
            emergency_alert=emergency
        )
    except Exception as e:
        logging.error(f"AI assessment error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI assessment failed: {str(e)}")

@api_router.get("/ai/assessment-history")
async def get_assessment_history(payload: dict = Depends(verify_token)):
    history = await db.ai_assessments.find({"user_id": payload["id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return history

# ========== BLOG ROUTES ==========

@api_router.post("/blogs")
async def create_blog(blog_data: BlogPostCreate, payload: dict = Depends(verify_token)):
    # Only doctors and admins can create blogs
    user = await db.users.find_one({"id": payload["id"]}, {"_id": 0})
    if user["role"] not in ["doctor", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    blog = BlogPost(author_id=payload["id"], **blog_data.model_dump())
    blog_dict = blog.model_dump()
    blog_dict["created_at"] = blog_dict["created_at"].isoformat()
    blog_dict["updated_at"] = blog_dict["updated_at"].isoformat()
    
    await db.blogs.insert_one(blog_dict)
    blog_dict.pop("_id", None)
    return blog_dict

@api_router.get("/blogs")
async def get_blogs(category: Optional[str] = None, published_only: bool = True):
    query = {}
    if published_only:
        query["is_published"] = True
    if category:
        query["category"] = category
    
    blogs = await db.blogs.find(query, {"_id": 0}).sort("created_at", -1).to_list(50)
    
    # Enrich with author data
    for blog in blogs:
        author = await db.users.find_one({"id": blog["author_id"]}, {"_id": 0, "password": 0})
        if author:
            blog["author"] = author
    
    return blogs

@api_router.get("/blogs/{blog_id}")
async def get_blog(blog_id: str):
    blog = await db.blogs.find_one({"id": blog_id}, {"_id": 0})
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")
    
    author = await db.users.find_one({"id": blog["author_id"]}, {"_id": 0, "password": 0})
    if author:
        blog["author"] = author
    
    return blog

# ========== PAYMENT ROUTES ==========

@api_router.post("/payments/create-order")
async def create_payment_order(payment_data: PaymentCreate, payload: dict = Depends(verify_token)):
    if not razorpay_client:
        raise HTTPException(status_code=500, detail="Payment service not configured")
    
    # Get appointment
    appointment = await db.appointments.find_one({"id": payment_data.appointment_id}, {"_id": 0})
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    # Create Razorpay order
    amount_paise = int(payment_data.amount * 100)
    order = razorpay_client.order.create({
        "amount": amount_paise,
        "currency": "INR",
        "payment_capture": 1
    })
    
    # Save payment record
    payment = Payment(
        user_id=payload["id"],
        appointment_id=payment_data.appointment_id,
        doctor_id=appointment.get("doctor_id"),
        amount=payment_data.amount,
        razorpay_order_id=order["id"]
    )
    payment_dict = payment.model_dump()
    payment_dict["created_at"] = payment_dict["created_at"].isoformat()
    
    await db.payments.insert_one(payment_dict)
    
    return {
        "order_id": order["id"],
        "amount": payment_data.amount,
        "currency": "INR",
        "key_id": RAZORPAY_KEY_ID
    }

@api_router.post("/payments/verify")
async def verify_payment(razorpay_payment_id: str, razorpay_order_id: str, razorpay_signature: str, payload: dict = Depends(verify_token)):
    if not razorpay_client:
        raise HTTPException(status_code=500, detail="Payment service not configured")
    
    # Verify signature
    try:
        razorpay_client.utility.verify_payment_signature({
            "razorpay_order_id": razorpay_order_id,
            "razorpay_payment_id": razorpay_payment_id,
            "razorpay_signature": razorpay_signature
        })
        
        # Compute commission
        config = await db.platform_config.find_one({}, {"_id": 0}) or {}
        commission_pct = config.get("commission_percentage", 15.0)

        # Update payment status
        payment = await db.payments.find_one({"razorpay_order_id": razorpay_order_id}, {"_id": 0})
        if payment:
            amount = payment.get("amount", 0)
            doc_earnings = round(amount * (1 - commission_pct / 100), 2)
            plat_earnings = round(amount * (commission_pct / 100), 2)
            await db.payments.update_one(
                {"razorpay_order_id": razorpay_order_id},
                {"$set": {
                    "razorpay_payment_id": razorpay_payment_id,
                    "status": "completed",
                    "doctor_earnings": doc_earnings,
                    "platform_earnings": plat_earnings
                }}
            )
            await db.appointments.update_one(
                {"id": payment["appointment_id"]},
                {"$set": {"payment_status": "completed", "payment_id": razorpay_payment_id}}
            )

        return {"message": "Payment verified successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail="Payment verification failed")

@api_router.get("/payments/history")
async def get_payment_history(payload: dict = Depends(verify_token)):
    payments = await db.payments.find({"user_id": payload["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return payments

# ========== REFERRAL ROUTES ==========

@api_router.get("/referral/my-code")
async def get_referral_code(payload: dict = Depends(verify_token)):
    user = await db.users.find_one({"id": payload["id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "referral_code": user.get("referral_code"),
        "referral_points": user.get("referral_points", 0)
    }

@api_router.get("/referral/stats")
async def get_referral_stats(payload: dict = Depends(verify_token)):
    user = await db.users.find_one({"id": payload["id"]}, {"_id": 0})
    referral_code = user.get("referral_code")
    
    # Count referred users
    referred_count = await db.users.count_documents({"referred_by": referral_code})
    
    return {
        "referral_code": referral_code,
        "total_points": user.get("referral_points", 0),
        "total_referrals": referred_count
    }

# ========== ADMIN ROUTES ==========

@api_router.get("/admin/doctors/pending")
async def get_pending_doctors(payload: dict = Depends(verify_token)):
    user = await db.users.find_one({"id": payload["id"]}, {"_id": 0})
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    doctors = await db.doctor_profiles.find({"is_approved": False}, {"_id": 0}).to_list(100)
    
    # Enrich with user data
    for doctor in doctors:
        doc_user = await db.users.find_one({"id": doctor["user_id"]}, {"_id": 0, "password": 0})
        if doc_user:
            doctor["user"] = doc_user
    
    return doctors

@api_router.put("/admin/doctors/{doctor_id}/approve")
async def approve_doctor(doctor_id: str, approved: bool, payload: dict = Depends(verify_token)):
    user = await db.users.find_one({"id": payload["id"]}, {"_id": 0})
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    update_data = {"is_approved": approved}
    if approved:
        update_data["approved_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.doctor_profiles.update_one(
        {"id": doctor_id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    return {"message": "Doctor approval status updated"}

@api_router.get("/admin/analytics")
async def get_analytics(payload: dict = Depends(verify_token)):
    user = await db.users.find_one({"id": payload["id"]}, {"_id": 0})
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    total_users = await db.users.count_documents({})
    total_doctors = await db.doctor_profiles.count_documents({})
    approved_doctors = await db.doctor_profiles.count_documents({"is_approved": True})
    total_appointments = await db.appointments.count_documents({})
    completed_appointments = await db.appointments.count_documents({"status": "completed"})
    total_payments = await db.payments.count_documents({"status": "completed"})
    
    # Calculate total revenue
    payments = await db.payments.find({"status": "completed"}, {"_id": 0, "amount": 1}).to_list(1000)
    total_revenue = sum(p["amount"] for p in payments)
    
    return {
        "total_users": total_users,
        "total_doctors": total_doctors,
        "approved_doctors": approved_doctors,
        "total_appointments": total_appointments,
        "completed_appointments": completed_appointments,
        "total_payments": total_payments,
        "total_revenue": total_revenue
    }


# ========== CHAT ROUTES ==========

@api_router.post("/chat/send")
async def send_chat_message(message_data: ChatMessageCreate, payload: dict = Depends(verify_token)):
    # Get appointment to verify access
    appointment = await db.appointments.find_one({"id": message_data.appointment_id}, {"_id": 0})
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    # Get user role
    user = await db.users.find_one({"id": payload["id"]}, {"_id": 0})
    
    # Verify user is part of this appointment
    if user["role"] == "patient" and appointment["patient_id"] != payload["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    elif user["role"] == "doctor":
        doctor_profile = await db.doctor_profiles.find_one({"user_id": payload["id"]}, {"_id": 0})
        if not doctor_profile or appointment["doctor_id"] != doctor_profile["id"]:
            raise HTTPException(status_code=403, detail="Not authorized")
    
    # Create message
    chat_message = ChatMessage(
        appointment_id=message_data.appointment_id,
        sender_id=payload["id"],
        sender_role=user["role"],
        message=message_data.message
    )
    message_dict = chat_message.model_dump()
    message_dict["created_at"] = message_dict["created_at"].isoformat()
    
    insert_dict = {k: v for k, v in message_dict.items()}
    await db.chat_messages.insert_one(insert_dict)
    
    return message_dict

@api_router.get("/chat/{appointment_id}")
async def get_chat_messages(appointment_id: str, payload: dict = Depends(verify_token)):
    # Get appointment to verify access
    appointment = await db.appointments.find_one({"id": appointment_id}, {"_id": 0})
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    # Get user role
    user = await db.users.find_one({"id": payload["id"]}, {"_id": 0})
    
    # Verify user is part of this appointment
    if user["role"] == "patient" and appointment["patient_id"] != payload["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    elif user["role"] == "doctor":
        doctor_profile = await db.doctor_profiles.find_one({"user_id": payload["id"]}, {"_id": 0})
        if not doctor_profile or appointment["doctor_id"] != doctor_profile["id"]:
            raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get messages
    messages = await db.chat_messages.find({"appointment_id": appointment_id}, {"_id": 0}).sort("created_at", 1).to_list(1000)
    
    # Enrich with sender names
    for msg in messages:
        sender = await db.users.find_one({"id": msg["sender_id"]}, {"_id": 0, "name": 1})
        if sender:
            msg["sender_name"] = sender["name"]
    
    return messages

# ========== PRESCRIPTION ROUTES ==========

@api_router.post("/prescriptions")
async def create_prescription(prescription_data: PrescriptionCreate, payload: dict = Depends(verify_token)):
    # Only doctors can create prescriptions
    user = await db.users.find_one({"id": payload["id"]}, {"_id": 0})
    if user["role"] != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can create prescriptions")
    
    # Get doctor profile
    doctor_profile = await db.doctor_profiles.find_one({"user_id": payload["id"]}, {"_id": 0})
    if not doctor_profile:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    
    # Get appointment
    appointment = await db.appointments.find_one({"id": prescription_data.appointment_id}, {"_id": 0})
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    if appointment["doctor_id"] != doctor_profile["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Generate PDF
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas
    from io import BytesIO
    
    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    
    # Header
    p.setFont("Helvetica-Bold", 20)
    p.drawString(50, height - 50, "Alambana Healthcare")
    p.setFont("Helvetica", 10)
    p.drawString(50, height - 70, "A Unit of Sejal Engitech Pvt Ltd")
    
    # Doctor info
    p.setFont("Helvetica-Bold", 12)
    p.drawString(50, height - 100, f"Dr. {user['name']}")
    p.setFont("Helvetica", 10)
    p.drawString(50, height - 115, f"{doctor_profile['specialization']} - {doctor_profile['qualification']}")
    
    # Date
    p.drawString(50, height - 140, f"Date: {datetime.now(timezone.utc).strftime('%Y-%m-%d')}")
    
    # Patient info
    patient = await db.users.find_one({"id": appointment["patient_id"]}, {"_id": 0})
    p.setFont("Helvetica-Bold", 11)
    p.drawString(50, height - 170, f"Patient: {patient['name']}")
    
    # Diagnosis
    p.setFont("Helvetica-Bold", 12)
    p.drawString(50, height - 200, "Diagnosis:")
    p.setFont("Helvetica", 10)
    p.drawString(50, height - 220, prescription_data.diagnosis)
    
    # Medications
    p.setFont("Helvetica-Bold", 12)
    p.drawString(50, height - 250, "Medications:")
    p.setFont("Helvetica", 10)
    y_pos = height - 270
    for i, med in enumerate(prescription_data.medications, 1):
        p.drawString(60, y_pos, f"{i}. {med}")
        y_pos -= 20
    
    # Instructions
    if prescription_data.instructions:
        p.setFont("Helvetica-Bold", 12)
        p.drawString(50, y_pos - 20, "Instructions:")
        p.setFont("Helvetica", 10)
        p.drawString(50, y_pos - 40, prescription_data.instructions)
        y_pos -= 60
    
    # Follow-up
    if prescription_data.follow_up_date:
        p.setFont("Helvetica-Bold", 10)
        p.drawString(50, y_pos - 20, f"Follow-up Date: {prescription_data.follow_up_date}")
    
    # Footer
    p.setFont("Helvetica", 8)
    p.drawString(50, 50, "This is a digitally generated prescription from Alambana Healthcare")
    p.drawString(50, 35, f"Support: 8084161465")
    
    p.showPage()
    p.save()
    
    # Get PDF bytes and convert to base64
    pdf_bytes = buffer.getvalue()
    pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')
    
    # Create prescription record
    prescription = Prescription(
        appointment_id=prescription_data.appointment_id,
        doctor_id=doctor_profile["id"],
        patient_id=appointment["patient_id"],
        diagnosis=prescription_data.diagnosis,
        medications=prescription_data.medications,
        instructions=prescription_data.instructions,
        follow_up_date=prescription_data.follow_up_date,
        prescription_file_base64=pdf_base64
    )
    prescription_dict = prescription.model_dump()
    prescription_dict["created_at"] = prescription_dict["created_at"].isoformat()
    
    insert_dict = {k: v for k, v in prescription_dict.items()}
    await db.prescriptions.insert_one(insert_dict)
    
    # Update appointment with prescription
    await db.appointments.update_one(
        {"id": prescription_data.appointment_id},
        {"$set": {"prescription_url": prescription.id}}
    )
    
    return prescription_dict

@api_router.get("/prescriptions/appointment/{appointment_id}")
async def get_prescription_by_appointment(appointment_id: str, payload: dict = Depends(verify_token)):
    prescription = await db.prescriptions.find_one({"appointment_id": appointment_id}, {"_id": 0})
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")
    
    # Verify access
    user = await db.users.find_one({"id": payload["id"]}, {"_id": 0})
    if user["role"] == "patient" and prescription["patient_id"] != payload["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    elif user["role"] == "doctor":
        doctor_profile = await db.doctor_profiles.find_one({"user_id": payload["id"]}, {"_id": 0})
        if not doctor_profile or prescription["doctor_id"] != doctor_profile["id"]:
            raise HTTPException(status_code=403, detail="Not authorized")
    
    return prescription

@api_router.get("/prescriptions/{prescription_id}/download")
async def download_prescription(prescription_id: str, payload: dict = Depends(verify_token)):
    prescription = await db.prescriptions.find_one({"id": prescription_id}, {"_id": 0})
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")
    
    # Verify access
    user = await db.users.find_one({"id": payload["id"]}, {"_id": 0})
    if user["role"] == "patient" and prescription["patient_id"] != payload["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    elif user["role"] == "doctor":
        doctor_profile = await db.doctor_profiles.find_one({"user_id": payload["id"]}, {"_id": 0})
        if not doctor_profile or prescription["doctor_id"] != doctor_profile["id"]:
            raise HTTPException(status_code=403, detail="Not authorized")
    
    return {
        "file_base64": prescription.get("prescription_file_base64"),
        "filename": f"prescription_{prescription_id}.pdf"
    }

# ========== ENHANCED BLOG ROUTES ==========

@api_router.get("/blogs/search")
async def search_blogs(query: Optional[str] = None, category: Optional[str] = None, featured: Optional[bool] = None):
    search_query = {}
    if query:
        search_query["$or"] = [
            {"title": {"$regex": query, "$options": "i"}},
            {"content": {"$regex": query, "$options": "i"}},
            {"tags": {"$regex": query, "$options": "i"}}
        ]
    if category:
        search_query["category"] = category
    if featured is not None:
        search_query["is_featured"] = featured
    
    search_query["is_published"] = True
    
    blogs = await db.blogs.find(search_query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    # Enrich with author data
    for blog in blogs:
        author = await db.users.find_one({"id": blog["author_id"]}, {"_id": 0, "password": 0})
        if author:
            blog["author"] = author
    
    return blogs

@api_router.get("/blogs/categories")
async def get_blog_categories():
    # Get unique categories
    categories = await db.blogs.distinct("category", {"is_published": True})
    return categories



# ========== RATING & REVIEW ROUTES ==========

@api_router.post("/ratings")
async def create_rating(rating_data: RatingCreate, payload: dict = Depends(verify_token)):
    # Only patients can give ratings
    user = await db.users.find_one({"id": payload["id"]}, {"_id": 0})
    if user["role"] != "patient":
        raise HTTPException(status_code=403, detail="Only patients can give ratings")
    
    # Get appointment and verify
    appointment = await db.appointments.find_one({"id": rating_data.appointment_id}, {"_id": 0})
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    if appointment["patient_id"] != payload["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if appointment["status"] != "completed":
        raise HTTPException(status_code=400, detail="Can only rate completed consultations")
    
    if appointment.get("payment_status") != "completed":
        raise HTTPException(status_code=400, detail="Payment must be completed to rate")
    
    # Check if already rated
    existing = await db.ratings.find_one({"appointment_id": rating_data.appointment_id}, {"_id": 0})
    if existing:
        # Check if within 24 hours
        created_time = datetime.fromisoformat(existing["created_at"])
        if (datetime.now(timezone.utc) - created_time).total_seconds() > 86400:
            raise HTTPException(status_code=400, detail="Cannot edit rating after 24 hours")
        # Update existing
        await db.ratings.update_one(
            {"appointment_id": rating_data.appointment_id},
            {"$set": {"rating": rating_data.rating, "review": rating_data.review}}
        )
        existing["rating"] = rating_data.rating
        existing["review"] = rating_data.review
        
        # Recalculate doctor average
        await recalculate_doctor_rating(appointment["doctor_id"])
        
        return existing
    
    # Create new rating
    rating = Rating(
        patient_id=payload["id"],
        doctor_id=appointment["doctor_id"],
        appointment_id=rating_data.appointment_id,
        rating=rating_data.rating,
        review=rating_data.review
    )
    rating_dict = rating.model_dump()
    rating_dict["created_at"] = rating_dict["created_at"].isoformat()
    
    insert_dict = {k: v for k, v in rating_dict.items()}
    await db.ratings.insert_one(insert_dict)
    
    # Update doctor's average rating
    await recalculate_doctor_rating(appointment["doctor_id"])
    
    return rating_dict

async def recalculate_doctor_rating(doctor_id: str):
    # Get all non-hidden ratings for this doctor
    ratings = await db.ratings.find({"doctor_id": doctor_id, "is_hidden": False}, {"_id": 0, "rating": 1}).to_list(1000)
    
    if ratings:
        avg_rating = sum(r["rating"] for r in ratings) / len(ratings)
        total_reviews = len(ratings)
    else:
        avg_rating = 0.0
        total_reviews = 0
    
    # Update doctor profile
    await db.doctor_profiles.update_one(
        {"id": doctor_id},
        {"$set": {"rating": round(avg_rating, 1), "total_consultations": total_reviews}}
    )

@api_router.get("/ratings/doctor/{doctor_id}")
async def get_doctor_ratings(doctor_id: str, sort: str = "latest", limit: int = 5):
    # Get ratings (only non-hidden)
    query = {"doctor_id": doctor_id, "is_hidden": False}
    
    # Sort logic
    if sort == "highest":
        sort_field = [("rating", -1), ("created_at", -1)]
    elif sort == "lowest":
        sort_field = [("rating", 1), ("created_at", -1)]
    else:  # latest
        sort_field = [("created_at", -1)]
    
    ratings = await db.ratings.find(query, {"_id": 0}).sort(sort_field).limit(limit).to_list(limit)
    
    # Enrich with patient names
    for rating in ratings:
        patient = await db.users.find_one({"id": rating["patient_id"]}, {"_id": 0, "name": 1})
        if patient:
            rating["patient_name"] = patient["name"]
            rating["verified_patient"] = True  # All ratings from completed appointments are verified
    
    # Get summary
    all_ratings = await db.ratings.find(query, {"_id": 0, "rating": 1}).to_list(1000)
    summary = {
        "average_rating": round(sum(r["rating"] for r in all_ratings) / len(all_ratings), 1) if all_ratings else 0,
        "total_reviews": len(all_ratings),
        "five_star": len([r for r in all_ratings if r["rating"] == 5]),
        "four_star": len([r for r in all_ratings if r["rating"] == 4]),
        "three_star": len([r for r in all_ratings if r["rating"] == 3]),
        "two_star": len([r for r in all_ratings if r["rating"] == 2]),
        "one_star": len([r for r in all_ratings if r["rating"] == 1])
    }
    
    return {
        "ratings": ratings,
        "summary": summary
    }

@api_router.put("/admin/ratings/{rating_id}/hide")
async def hide_rating(rating_id: str, hide: bool, payload: dict = Depends(verify_token)):
    user = await db.users.find_one({"id": payload["id"]}, {"_id": 0})
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    rating = await db.ratings.find_one({"id": rating_id}, {"_id": 0})
    if not rating:
        raise HTTPException(status_code=404, detail="Rating not found")
    
    await db.ratings.update_one({"id": rating_id}, {"$set": {"is_hidden": hide}})
    
    # Recalculate doctor rating
    await recalculate_doctor_rating(rating["doctor_id"])
    
    return {"message": "Rating visibility updated"}

@api_router.delete("/admin/ratings/{rating_id}")
async def delete_rating(rating_id: str, payload: dict = Depends(verify_token)):
    user = await db.users.find_one({"id": payload["id"]}, {"_id": 0})
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    rating = await db.ratings.find_one({"id": rating_id}, {"_id": 0})
    if not rating:
        raise HTTPException(status_code=404, detail="Rating not found")
    
    await db.ratings.delete_one({"id": rating_id})
    
    # Recalculate doctor rating
    await recalculate_doctor_rating(rating["doctor_id"])
    
    return {"message": "Rating deleted"}

@api_router.get("/admin/ratings/all")
async def get_all_ratings(payload: dict = Depends(verify_token)):
    user = await db.users.find_one({"id": payload["id"]}, {"_id": 0})
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    ratings = await db.ratings.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    # Enrich with patient and doctor names
    for rating in ratings:
        patient = await db.users.find_one({"id": rating["patient_id"]}, {"_id": 0, "name": 1})
        doctor_profile = await db.doctor_profiles.find_one({"id": rating["doctor_id"]}, {"_id": 0, "user_id": 1})
        if doctor_profile:
            doctor = await db.users.find_one({"id": doctor_profile["user_id"]}, {"_id": 0, "name": 1})
            if doctor:
                rating["doctor_name"] = doctor["name"]
        if patient:
            rating["patient_name"] = patient["name"]
    
    return ratings

# ========== FEATURE FLAG ROUTES ==========

@api_router.get("/admin/feature-flags")
async def get_feature_flags(payload: dict = Depends(verify_token)):
    user = await db.users.find_one({"id": payload["id"]}, {"_id": 0})
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    flags = await db.feature_flags.find({}, {"_id": 0}).to_list(100)
    
    # If no flags exist, initialize default ones
    if not flags:
        default_flags = [
            {
                "id": str(uuid.uuid4()),
                "feature_name": "video_consultation",
                "display_name": "Video Consultation",
                "is_enabled": False,
                "description": "Agora/Twilio/Whereby video calling integration",
                "estimated_cost": "₹2000-5000/month",
                "config": {},
                "last_modified": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "feature_name": "cloud_storage",
                "display_name": "Cloud Storage (S3)",
                "is_enabled": False,
                "description": "AWS S3 or compatible storage for files",
                "estimated_cost": "₹500-2000/month",
                "config": {},
                "last_modified": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "feature_name": "sms_notifications",
                "display_name": "SMS Notifications",
                "is_enabled": False,
                "description": "Twilio/MSG91 SMS service",
                "estimated_cost": "₹1000-3000/month",
                "config": {},
                "last_modified": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "feature_name": "premium_email",
                "display_name": "Premium Email Service",
                "is_enabled": False,
                "description": "SendGrid/AWS SES professional emails",
                "estimated_cost": "₹1000-2000/month",
                "config": {},
                "last_modified": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "feature_name": "subscription_plans",
                "display_name": "Subscription Plans",
                "is_enabled": False,
                "description": "Monthly subscription for patients",
                "estimated_cost": "No extra cost",
                "config": {},
                "last_modified": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "feature_name": "medicine_store",
                "display_name": "Medicine Store Integration",
                "is_enabled": False,
                "description": "Online medicine ordering",
                "estimated_cost": "Coming Soon",
                "config": {},
                "last_modified": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "feature_name": "lab_integration",
                "display_name": "Lab Test Integration",
                "is_enabled": False,
                "description": "Book lab tests online",
                "estimated_cost": "Coming Soon",
                "config": {},
                "last_modified": datetime.now(timezone.utc).isoformat()
            }
        ]
        
        await db.feature_flags.insert_many(default_flags)
        flags = default_flags
    
    return flags

@api_router.put("/admin/feature-flags/{feature_id}")
async def update_feature_flag(feature_id: str, update_data: FeatureFlagUpdate, payload: dict = Depends(verify_token)):
    user = await db.users.find_one({"id": payload["id"]}, {"_id": 0})
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    update_dict = {"is_enabled": update_data.is_enabled, "last_modified": datetime.now(timezone.utc).isoformat()}
    if update_data.config:
        update_dict["config"] = update_data.config
    
    result = await db.feature_flags.update_one(
        {"id": feature_id},
        {"$set": update_dict}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Feature flag not found")
    
    return {"message": "Feature flag updated successfully"}

@api_router.get("/feature-flags/public")
async def get_public_feature_flags():
    # Public endpoint to check which features are enabled
    flags = await db.feature_flags.find({}, {"_id": 0, "feature_name": 1, "is_enabled": 1, "display_name": 1}).to_list(100)
    return {flag["feature_name"]: flag["is_enabled"] for flag in flags}

# ========== CONTACT FORM ==========

@api_router.post("/contact")
async def submit_contact(message_data: ContactMessage):
    doc = {
        "id": str(uuid.uuid4()),
        "name": message_data.name,
        "email": message_data.email,
        "subject": message_data.subject,
        "message": message_data.message,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.contact_messages.insert_one(doc)
    send_email(
        to=ADMIN_EMAIL,
        subject=f"[Alambana Contact] {message_data.subject}",
        html_body=f"""
        <div style="font-family:Inter,sans-serif;max-width:600px;margin:auto;padding:32px">
          <h2 style="color:#0D9488">New Contact Message</h2>
          <p><strong>From:</strong> {message_data.name} &lt;{message_data.email}&gt;</p>
          <p><strong>Subject:</strong> {message_data.subject}</p>
          <hr/>
          <p style="white-space:pre-wrap">{message_data.message}</p>
        </div>"""
    )
    send_email(
        to=message_data.email,
        subject="We received your message — Alambana Healthcare",
        html_body=f"""
        <div style="font-family:Inter,sans-serif;max-width:500px;margin:auto;padding:32px">
          <h2 style="color:#0D9488">Alambana Healthcare</h2>
          <p>Hi {message_data.name},</p>
          <p>Thank you for reaching out! We've received your message and will respond within 24 hours.</p>
          <p style="color:#64748B;font-size:13px">WhatsApp us at +91 8084161465 for faster support.</p>
        </div>"""
    )
    return {"message": "Message received. We'll get back to you shortly."}

# ========== RAZORPAY WEBHOOK ==========

@app.post("/api/payments/webhook")
async def razorpay_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("X-Razorpay-Signature", "")
    if RAZORPAY_WEBHOOK_SECRET:
        expected = hmac.new(
            RAZORPAY_WEBHOOK_SECRET.encode(),
            body,
            hashlib.sha256
        ).hexdigest()
        if not hmac.compare_digest(expected, signature):
            raise HTTPException(status_code=400, detail="Invalid webhook signature")
    import json as _json
    event = _json.loads(body)
    event_type = event.get("event")
    if event_type == "payment.captured":
        payment_entity = event.get("payload", {}).get("payment", {}).get("entity", {})
        razorpay_order_id = payment_entity.get("order_id")
        razorpay_payment_id = payment_entity.get("id")
        if razorpay_order_id:
            config = await db.platform_config.find_one({}, {"_id": 0}) or {}
            commission_pct = config.get("commission_percentage", 15.0)
            payment = await db.payments.find_one({"razorpay_order_id": razorpay_order_id}, {"_id": 0})
            if payment:
                amount = payment.get("amount", 0)
                doc_earnings = round(amount * (1 - commission_pct / 100), 2)
                plat_earnings = round(amount * (commission_pct / 100), 2)
                await db.payments.update_one(
                    {"razorpay_order_id": razorpay_order_id},
                    {"$set": {
                        "razorpay_payment_id": razorpay_payment_id,
                        "status": "completed",
                        "doctor_earnings": doc_earnings,
                        "platform_earnings": plat_earnings
                    }}
                )
                await db.appointments.update_one(
                    {"id": payment["appointment_id"]},
                    {"$set": {"payment_status": "completed", "payment_id": razorpay_payment_id, "status": "confirmed"}}
                )
    elif event_type == "payment.failed":
        payment_entity = event.get("payload", {}).get("payment", {}).get("entity", {})
        razorpay_order_id = payment_entity.get("order_id")
        if razorpay_order_id:
            await db.payments.update_one(
                {"razorpay_order_id": razorpay_order_id},
                {"$set": {"status": "failed"}}
            )
    return {"status": "ok"}

# ========== APPOINTMENT CANCEL & RESCHEDULE ==========

@api_router.put("/appointments/{appointment_id}/cancel")
async def cancel_appointment(appointment_id: str, payload: dict = Depends(verify_token)):
    user = await db.users.find_one({"id": payload["id"]}, {"_id": 0})
    appointment = await db.appointments.find_one({"id": appointment_id}, {"_id": 0})
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    # Authorization check
    if user["role"] == "patient" and appointment["patient_id"] != payload["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    if user["role"] == "doctor":
        doc_profile = await db.doctor_profiles.find_one({"user_id": payload["id"]}, {"_id": 0})
        if not doc_profile or appointment["doctor_id"] != doc_profile["id"]:
            raise HTTPException(status_code=403, detail="Not authorized")
    if appointment["status"] in ["completed", "cancelled"]:
        raise HTTPException(status_code=400, detail=f"Cannot cancel a {appointment['status']} appointment")
    update_fields = {
        "status": "cancelled",
        "cancelled_at": datetime.now(timezone.utc).isoformat(),
        "cancelled_by": user["role"]
    }
    if appointment.get("payment_status") == "completed":
        update_fields["payment_status"] = "refund_pending"
    await db.appointments.update_one({"id": appointment_id}, {"$set": update_fields})
    # Notify the other party
    patient = await db.users.find_one({"id": appointment["patient_id"]}, {"_id": 0})
    doctor_profile = await db.doctor_profiles.find_one({"id": appointment["doctor_id"]}, {"_id": 0})
    doctor_user = await db.users.find_one({"id": doctor_profile["user_id"]}, {"_id": 0}) if doctor_profile else None
    cancelled_by_name = user.get("name", "")
    if patient:
        send_email(
            to=patient["email"],
            subject="Appointment Cancelled — Alambana Healthcare",
            html_body=f"""<div style="font-family:Inter,sans-serif;max-width:500px;margin:auto;padding:32px">
              <h2 style="color:#EF4444">Appointment Cancelled</h2>
              <p>Hi {patient.get('name','')}, your appointment on <strong>{appointment['appointment_date']}</strong>
              at <strong>{appointment['appointment_time']}</strong> has been cancelled by {cancelled_by_name}.</p>
              {"<p>A refund will be processed within 5-7 business days.</p>" if appointment.get('payment_status') == 'completed' else ""}
              <p>Book a new appointment at <a href="{FRONTEND_URL}/doctors">Alambana Healthcare</a>.</p>
            </div>"""
        )
    if doctor_user:
        send_email(
            to=doctor_user["email"],
            subject="Appointment Cancelled — Alambana Healthcare",
            html_body=f"""<div style="font-family:Inter,sans-serif;max-width:500px;margin:auto;padding:32px">
              <h2 style="color:#EF4444">Appointment Cancelled</h2>
              <p>Hi Dr. {doctor_user.get('name','')}, the appointment with patient
              <strong>{patient.get('name','') if patient else ''}</strong> on
              <strong>{appointment['appointment_date']}</strong> at
              <strong>{appointment['appointment_time']}</strong> has been cancelled.</p>
            </div>"""
        )
    return {"message": "Appointment cancelled successfully"}

@api_router.put("/appointments/{appointment_id}/reschedule")
async def reschedule_appointment(appointment_id: str, reschedule_data: AppointmentReschedule, payload: dict = Depends(verify_token)):
    user = await db.users.find_one({"id": payload["id"]}, {"_id": 0})
    appointment = await db.appointments.find_one({"id": appointment_id}, {"_id": 0})
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    if user["role"] == "patient" and appointment["patient_id"] != payload["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    if appointment["status"] in ["completed", "cancelled"]:
        raise HTTPException(status_code=400, detail="Cannot reschedule this appointment")
    # Slot conflict check
    conflict = await db.appointments.find_one({
        "doctor_id": appointment["doctor_id"],
        "appointment_date": reschedule_data.new_date,
        "appointment_time": reschedule_data.new_time,
        "status": {"$nin": ["cancelled"]},
        "id": {"$ne": appointment_id}
    }, {"_id": 0})
    if conflict:
        raise HTTPException(status_code=409, detail="This time slot is already booked")
    await db.appointments.update_one(
        {"id": appointment_id},
        {"$set": {
            "appointment_date": reschedule_data.new_date,
            "appointment_time": reschedule_data.new_time,
            "status": "pending"
        }}
    )
    # Notify doctor
    doctor_profile = await db.doctor_profiles.find_one({"id": appointment["doctor_id"]}, {"_id": 0})
    if doctor_profile:
        doctor_user = await db.users.find_one({"id": doctor_profile["user_id"]}, {"_id": 0})
        if doctor_user:
            patient = await db.users.find_one({"id": appointment["patient_id"]}, {"_id": 0})
            send_email(
                to=doctor_user["email"],
                subject="Appointment Rescheduled — Alambana Healthcare",
                html_body=f"""<div style="font-family:Inter,sans-serif;max-width:500px;margin:auto;padding:32px">
                  <h2 style="color:#0D9488">Appointment Rescheduled</h2>
                  <p>Hi Dr. {doctor_user.get('name','')}, an appointment has been rescheduled.</p>
                  <p><strong>Patient:</strong> {patient.get('name','') if patient else ''}</p>
                  <p><strong>New Date:</strong> {reschedule_data.new_date} at {reschedule_data.new_time}</p>
                </div>"""
            )
    return {"message": "Appointment rescheduled successfully"}

# ========== PLATFORM CONFIG ROUTES ==========

@api_router.get("/admin/platform-config")
async def get_platform_config(payload: dict = Depends(verify_token)):
    user = await db.users.find_one({"id": payload["id"]}, {"_id": 0})
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    config = await db.platform_config.find_one({}, {"_id": 0})
    if not config:
        return {"commission_percentage": 15.0, "referral_points_per_signup": 10}
    return config

@api_router.put("/admin/platform-config")
async def update_platform_config(config_data: PlatformConfig, payload: dict = Depends(verify_token)):
    user = await db.users.find_one({"id": payload["id"]}, {"_id": 0})
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    update_dict = config_data.model_dump(exclude_none=True)
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.platform_config.update_one({}, {"$set": update_dict}, upsert=True)
    return {"message": "Platform config updated"}

# ========== DOCTOR EARNINGS ROUTES ==========

@api_router.get("/doctors/earnings")
async def get_doctor_earnings(payload: dict = Depends(verify_token)):
    user = await db.users.find_one({"id": payload["id"]}, {"_id": 0})
    if user["role"] != "doctor":
        raise HTTPException(status_code=403, detail="Doctors only")
    doc_profile = await db.doctor_profiles.find_one({"user_id": payload["id"]}, {"_id": 0})
    if not doc_profile:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    payments = await db.payments.find(
        {"doctor_id": doc_profile["id"], "status": "completed"}, {"_id": 0}
    ).to_list(1000)
    total_gross = sum(p.get("amount", 0) for p in payments)
    total_platform = sum(p.get("platform_earnings", 0) or 0 for p in payments)
    total_net = sum(p.get("doctor_earnings", 0) or 0 for p in payments)
    return {
        "total_gross": round(total_gross, 2),
        "total_platform_cut": round(total_platform, 2),
        "total_net": round(total_net, 2),
        "payment_count": len(payments)
    }

@api_router.get("/doctors/payment-history")
async def get_doctor_payment_history(payload: dict = Depends(verify_token), limit: int = 20):
    user = await db.users.find_one({"id": payload["id"]}, {"_id": 0})
    if user["role"] != "doctor":
        raise HTTPException(status_code=403, detail="Doctors only")
    doc_profile = await db.doctor_profiles.find_one({"user_id": payload["id"]}, {"_id": 0})
    if not doc_profile:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    payments = await db.payments.find(
        {"doctor_id": doc_profile["id"], "status": "completed"}, {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    # Enrich with patient name from appointment
    for p in payments:
        apt = await db.appointments.find_one({"id": p.get("appointment_id")}, {"_id": 0, "patient_id": 1})
        if apt:
            patient = await db.users.find_one({"id": apt["patient_id"]}, {"_id": 0, "name": 1})
            p["patient_name"] = patient["name"] if patient else "Unknown"
    return payments

# ========== ADMIN REVENUE ROUTE ==========

@api_router.get("/admin/revenue")
async def get_admin_revenue(payload: dict = Depends(verify_token)):
    user = await db.users.find_one({"id": payload["id"]}, {"_id": 0})
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    payments = await db.payments.find({"status": "completed"}, {"_id": 0}).to_list(10000)
    total_gross = sum(p.get("amount", 0) for p in payments)
    total_platform = sum(p.get("platform_earnings", 0) or 0 for p in payments)
    total_doctor = sum(p.get("doctor_earnings", 0) or 0 for p in payments)

    # Per-doctor breakdown
    doctor_map: Dict[str, dict] = {}
    for p in payments:
        did = p.get("doctor_id")
        if not did:
            continue
        if did not in doctor_map:
            doctor_map[did] = {"doctor_id": did, "total_gross": 0, "platform_cut": 0, "net_payout": 0, "consultation_count": 0, "doctor_name": ""}
        doctor_map[did]["total_gross"] += p.get("amount", 0)
        doctor_map[did]["platform_cut"] += p.get("platform_earnings", 0) or 0
        doctor_map[did]["net_payout"] += p.get("doctor_earnings", 0) or 0
        doctor_map[did]["consultation_count"] += 1

    for did, data in doctor_map.items():
        dp = await db.doctor_profiles.find_one({"id": did}, {"_id": 0, "user_id": 1})
        if dp:
            du = await db.users.find_one({"id": dp["user_id"]}, {"_id": 0, "name": 1})
            data["doctor_name"] = du["name"] if du else "Unknown"
        data["total_gross"] = round(data["total_gross"], 2)
        data["platform_cut"] = round(data["platform_cut"], 2)
        data["net_payout"] = round(data["net_payout"], 2)

    # By month (last 6 months)
    from collections import defaultdict
    monthly: Dict[str, dict] = defaultdict(lambda: {"total_gross": 0, "platform_earnings": 0})
    for p in payments:
        ts = p.get("created_at", "")
        month = ts[:7] if ts else "unknown"
        monthly[month]["total_gross"] += p.get("amount", 0)
        monthly[month]["platform_earnings"] += p.get("platform_earnings", 0) or 0

    by_month = sorted(
        [{"month_label": k, "total_gross": round(v["total_gross"], 2), "platform_earnings": round(v["platform_earnings"], 2)} for k, v in monthly.items()],
        key=lambda x: x["month_label"]
    )[-6:]

    return {
        "total_gross": round(total_gross, 2),
        "total_platform_earnings": round(total_platform, 2),
        "total_doctor_payouts": round(total_doctor, 2),
        "by_doctor": list(doctor_map.values()),
        "by_month": by_month
    }

# ========== AI MONITORING ROUTE ==========

@api_router.get("/admin/ai-monitoring")
async def get_ai_monitoring(payload: dict = Depends(verify_token)):
    user = await db.users.find_one({"id": payload["id"]}, {"_id": 0})
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    assessments = await db.ai_assessments.find({}, {"_id": 0}).to_list(10000)
    total_requests = len(assessments)
    emergency_alerts = sum(1 for a in assessments if a.get("emergency_alert") or a.get("risk_level", "").lower() == "emergency")

    # Risk distribution
    risk_dist: Dict[str, int] = {"low": 0, "medium": 0, "high": 0, "critical": 0, "emergency": 0}
    for a in assessments:
        rl = (a.get("risk_level") or "medium").lower()
        if rl in risk_dist:
            risk_dist[rl] += 1
        else:
            risk_dist["medium"] += 1

    # Top specialists
    from collections import Counter
    specialist_counts = Counter(a.get("suggested_specialist", "") for a in assessments if a.get("suggested_specialist"))
    top_specialists = [{"specialist": k, "count": v} for k, v in specialist_counts.most_common(5)]

    # Requests by day (last 30 days)
    cutoff = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    recent = [a for a in assessments if (a.get("created_at") or "") >= cutoff]
    day_counts: Dict[str, int] = {}
    for a in recent:
        day = (a.get("created_at") or "")[:10]
        day_counts[day] = day_counts.get(day, 0) + 1
    requests_by_day = sorted([{"date": k, "count": v} for k, v in day_counts.items()], key=lambda x: x["date"])

    return {
        "total_requests": total_requests,
        "emergency_alerts_count": emergency_alerts,
        "risk_distribution": risk_dist,
        "top_specialists": top_specialists,
        "requests_by_day": requests_by_day,
        "avg_per_day": round(total_requests / 30, 1) if total_requests else 0
    }

# ========== ADVERTISEMENT ROUTES ==========

@api_router.post("/admin/advertisements")
async def create_advertisement(ad_data: AdvertisementCreate, payload: dict = Depends(verify_token)):
    user = await db.users.find_one({"id": payload["id"]}, {"_id": 0})
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    ad = Advertisement(**ad_data.model_dump())
    ad_dict = ad.model_dump()
    ad_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.advertisements.insert_one(ad_dict)
    ad_dict.pop("_id", None)
    return ad_dict

@api_router.get("/admin/advertisements")
async def list_advertisements_admin(payload: dict = Depends(verify_token)):
    user = await db.users.find_one({"id": payload["id"]}, {"_id": 0})
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    ads = await db.advertisements.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return ads

@api_router.put("/admin/advertisements/{ad_id}")
async def update_advertisement(ad_id: str, ad_data: AdvertisementCreate, payload: dict = Depends(verify_token)):
    user = await db.users.find_one({"id": payload["id"]}, {"_id": 0})
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    update_dict = {k: v for k, v in ad_data.model_dump().items() if v is not None}
    result = await db.advertisements.update_one({"id": ad_id}, {"$set": update_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Ad not found")
    return {"message": "Advertisement updated"}

@api_router.delete("/admin/advertisements/{ad_id}")
async def delete_advertisement(ad_id: str, payload: dict = Depends(verify_token)):
    user = await db.users.find_one({"id": payload["id"]}, {"_id": 0})
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    result = await db.advertisements.delete_one({"id": ad_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Ad not found")
    return {"message": "Advertisement deleted"}

@api_router.get("/advertisements")
async def get_active_advertisements(position: Optional[str] = None):
    query: dict = {"is_active": True}
    if position:
        query["position"] = position
    ads = await db.advertisements.find(query, {"_id": 0}).to_list(10)
    if ads:
        ids = [a["id"] for a in ads]
        await db.advertisements.update_many({"id": {"$in": ids}}, {"$inc": {"impressions": 1}})
    return ads

@api_router.post("/advertisements/{ad_id}/click")
async def track_ad_click(ad_id: str):
    await db.advertisements.update_one({"id": ad_id}, {"$inc": {"clicks": 1}})
    return {"message": "Click tracked"}

# ========== ADMIN REFERRAL STATS ==========

@api_router.get("/admin/referral/stats")
async def get_admin_referral_stats(payload: dict = Depends(verify_token)):
    user = await db.users.find_one({"id": payload["id"]}, {"_id": 0})
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    total_referrals = await db.users.count_documents({"referred_by": {"$ne": None}})
    users_with_points = await db.users.find({"referral_points": {"$gt": 0}}, {"_id": 0}).to_list(10000)
    total_points_issued = sum(u.get("referral_points", 0) for u in users_with_points)
    # Leaderboard: top 20 by referral_points
    top_referrers = await db.users.find(
        {"referral_points": {"$gt": 0}},
        {"_id": 0, "name": 1, "email": 1, "referral_code": 1, "referral_points": 1}
    ).sort("referral_points", -1).limit(20).to_list(20)
    # Count referrals per user
    for u in top_referrers:
        u["total_referrals"] = await db.users.count_documents({"referred_by": u["referral_code"]})
    config = await db.platform_config.find_one({}, {"_id": 0}) or {}
    return {
        "total_referrals": total_referrals,
        "total_points_issued": total_points_issued,
        "points_per_signup": config.get("referral_points_per_signup", 10),
        "leaderboard": top_referrers
    }

# ========== HEALTH RECORDS PDF EXPORT ==========

@api_router.get("/health-records/export")
async def export_health_records_pdf(payload: dict = Depends(verify_token)):
    records = await db.health_records.find({"user_id": payload["id"]}, {"_id": 0}).sort("date", -1).to_list(1000)
    user = await db.users.find_one({"id": payload["id"]}, {"_id": 0})

    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas
    from reportlab.lib import colors
    from io import BytesIO

    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    # Header
    p.setFont("Helvetica-Bold", 18)
    p.drawString(50, height - 50, "Alambana Healthcare")
    p.setFont("Helvetica", 10)
    p.drawString(50, height - 68, "A Unit of Sejal Engitech Pvt Ltd")
    p.setFont("Helvetica-Bold", 13)
    p.drawString(50, height - 95, "Personal Health Report")
    p.setFont("Helvetica", 10)
    p.drawString(50, height - 112, f"Patient: {user.get('name', '')}   |   Exported: {datetime.now(timezone.utc).strftime('%Y-%m-%d')}")
    p.drawString(50, height - 128, f"Total Records: {len(records)}")

    # Table header
    y = height - 160
    headers = ["Date", "Type", "Weight", "BP", "O2%", "Sugar", "HR", "Notes"]
    col_x = [50, 110, 165, 215, 295, 345, 400, 445]
    p.setFont("Helvetica-Bold", 9)
    p.setFillColorRGB(0.05, 0.58, 0.53)
    p.rect(45, y - 4, width - 90, 16, fill=1, stroke=0)
    p.setFillColorRGB(1, 1, 1)
    for i, h in enumerate(headers):
        p.drawString(col_x[i], y, h)
    p.setFillColorRGB(0, 0, 0)
    y -= 20

    p.setFont("Helvetica", 8)
    for idx, r in enumerate(records):
        if y < 60:
            p.showPage()
            y = height - 60
            p.setFont("Helvetica", 8)
        if idx % 2 == 0:
            p.setFillColorRGB(0.97, 0.97, 0.97)
            p.rect(45, y - 4, width - 90, 14, fill=1, stroke=0)
            p.setFillColorRGB(0, 0, 0)
        bp = f"{r.get('blood_pressure_systolic','')}/{r.get('blood_pressure_diastolic','')}" if r.get('blood_pressure_systolic') else "-"
        row = [
            str(r.get("date", ""))[:10],
            str(r.get("record_type", "")),
            str(r.get("weight", "-")) + " kg" if r.get("weight") else "-",
            bp,
            str(r.get("oxygen_level", "-")),
            str(r.get("sugar_level", "-")),
            str(r.get("heart_rate", "-")),
            (r.get("notes", "") or "")[:30]
        ]
        for i, val in enumerate(row):
            p.drawString(col_x[i], y, val)
        y -= 16

    # Footer
    p.setFont("Helvetica", 8)
    p.drawString(50, 40, "Alambana Healthcare — Confidential Patient Health Report")
    p.drawString(50, 28, "Support: 8084161465 | alambana.in")
    p.showPage()
    p.save()

    pdf_bytes = buffer.getvalue()
    pdf_b64 = base64.b64encode(pdf_bytes).decode("utf-8")
    filename = f"health_report_{user.get('name','patient').replace(' ','_')}_{datetime.now(timezone.utc).strftime('%Y%m%d')}.pdf"
    return {"pdf_base64": pdf_b64, "filename": filename}

@api_router.post("/admin/seed")
async def seed_demo_data(payload: dict = Depends(verify_token)):
    """One-time seed endpoint. Admin only. Idempotent — skips existing records."""
    user = await db.users.find_one({"id": payload["id"]}, {"_id": 0})
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    created = []

    def hp(pw: str) -> str:
        import bcrypt
        return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

    now_ts = datetime.now(timezone.utc).isoformat()

    DOCTORS = [
        {"email": "dr.arjun.sharma@alambana.in",  "name": "Dr. Arjun Sharma",  "phone": "9876543210",
         "specialization": "Cardiology",   "qualification": "MBBS, MD (Cardiology), FACC",   "experience_years": 14,
         "license_number": "MCI-2010-CARD-4521", "consultation_fee": 800.0,
         "available_days": ["Monday","Wednesday","Friday"],
         "available_time_slots": ["10:00","11:00","12:00","14:00","15:00","16:00"],
         "rating": 4.8, "total_consultations": 1240,
         "bio": "Senior Interventional Cardiologist with 14 years of experience in coronary artery disease and heart failure management."},
        {"email": "dr.priya.menon@alambana.in",   "name": "Dr. Priya Menon",   "phone": "9876543211",
         "specialization": "Dermatology",  "qualification": "MBBS, DVD, FRCP (Dermatology)",   "experience_years": 9,
         "license_number": "MCI-2015-DERM-8832", "consultation_fee": 600.0,
         "available_days": ["Tuesday","Thursday","Saturday"],
         "available_time_slots": ["09:00","10:00","11:00","14:00","15:00"],
         "rating": 4.7, "total_consultations": 890,
         "bio": "Consultant Dermatologist & Cosmetologist specialising in skin diseases, acne, hair-loss, and cosmetic procedures. Trained at AIIMS Delhi."},
        {"email": "dr.rajesh.kumar@alambana.in",  "name": "Dr. Rajesh Kumar",  "phone": "9876543212",
         "specialization": "Ayurveda",     "qualification": "BAMS, MD (Ayurveda), PhD",         "experience_years": 18,
         "license_number": "CCIM-2005-AYU-1123", "consultation_fee": 400.0,
         "available_days": ["Monday","Tuesday","Wednesday","Thursday","Friday"],
         "available_time_slots": ["08:00","09:00","10:00","11:00","14:00","15:00","16:00"],
         "rating": 4.9, "total_consultations": 2150,
         "bio": "Renowned Ayurvedic physician with 18 years in Panchakarma therapy, chronic disease management, and holistic wellness."},
        {"email": "dr.anika.singh@alambana.in",   "name": "Dr. Anika Singh",   "phone": "9876543213",
         "specialization": "Mental Health","qualification": "MBBS, MD (Psychiatry), MRCPsych", "experience_years": 11,
         "license_number": "MCI-2013-PSY-6674",  "consultation_fee": 700.0,
         "available_days": ["Monday","Wednesday","Thursday","Saturday"],
         "available_time_slots": ["10:00","11:00","12:00","15:00","16:00","17:00"],
         "rating": 4.6, "total_consultations": 780,
         "bio": "Consultant Psychiatrist specialising in anxiety, depression, OCD, and relationship counselling. Evidence-based approach."},
        {"email": "dr.meera.nair@alambana.in",    "name": "Dr. Meera Nair",    "phone": "9876543214",
         "specialization": "Nutrition",    "qualification": "MBBS, MSc (Clinical Nutrition), RD","experience_years": 7,
         "license_number": "IDA-2018-NUT-3345",  "consultation_fee": 350.0,
         "available_days": ["Tuesday","Friday","Saturday"],
         "available_time_slots": ["09:00","10:00","11:00","12:00","14:00"],
         "rating": 4.5, "total_consultations": 560,
         "bio": "Clinical Nutritionist helping patients manage diabetes, obesity, PCOD, and hypertension through personalised diet plans."},
    ]

    for d in DOCTORS:
        if await db.users.find_one({"email": d["email"]}):
            continue
        uid = str(uuid.uuid4())
        u = {"id": uid, "email": d["email"], "name": d["name"], "phone": d["phone"],
             "role": "doctor", "password_hash": hp("Doctor@1234"), "is_active": True,
             "referral_code": str(uuid.uuid4())[:8].upper(), "referral_points": 0,
             "referred_by": None, "created_at": now_ts}
        await db.users.insert_one(u); u.pop("_id", None)
        prof = {"id": str(uuid.uuid4()), "user_id": uid, "is_approved": True, "approved_at": now_ts,
                "created_at": now_ts, "license_file_url": None,
                **{k: d[k] for k in ["specialization","qualification","experience_years","license_number",
                                      "consultation_fee","available_days","available_time_slots","rating","total_consultations","bio"]}}
        await db.doctor_profiles.insert_one(prof); prof.pop("_id", None)
        created.append(f"doctor:{d['name']}")

    PATIENTS = [
        {"email": "rahul.verma@gmail.com",  "name": "Rahul Verma",  "phone": "9123456780"},
        {"email": "sneha.patel@gmail.com",  "name": "Sneha Patel",  "phone": "9123456781"},
        {"email": "vikram.das@gmail.com",   "name": "Vikram Das",   "phone": "9123456782"},
    ]
    for p in PATIENTS:
        if await db.users.find_one({"email": p["email"]}):
            continue
        uid = str(uuid.uuid4())
        u = {"id": uid, "role": "patient", "password_hash": hp("Patient@1234"), "is_active": True,
             "referral_code": str(uuid.uuid4())[:8].upper(), "referral_points": 0,
             "referred_by": None, "created_at": now_ts, **p}
        await db.users.insert_one(u); u.pop("_id", None)
        created.append(f"patient:{p['name']}")

    BLOGS = [
        {"title": "10 Warning Signs of Heart Disease You Should Never Ignore",
         "category": "Cardiology", "tags": ["heart disease","prevention","warning signs"], "is_featured": True,
         "content": "Heart disease is the leading cause of death in India. Early detection saves lives.\n\n**1. Chest Pain** — squeezing or pressing sensation, may radiate to arm or jaw.\n**2. Shortness of Breath** — breathlessness during light activity.\n**3. Palpitations** — racing or fluttering heartbeat.\n**4. Swollen Ankles** — oedema can indicate heart failure.\n**5. Persistent Fatigue** — especially in women.\n**6. Dizziness** — inadequate blood flow to the brain.\n**7. Cold Sweats** — without exertion alongside chest pain.\n**8. Nausea** — can accompany a heart attack, especially in women.\n**9. Upper Body Pain** — shoulders, arms, neck, jaw.\n**10. Snoring/Sleep Apnoea** — significantly increases cardiovascular risk.\n\n**Prevention**: heart-healthy diet, 150 min/week exercise, quit smoking, manage stress, monitor BP and cholesterol. Consult a cardiologist at Alambana Healthcare today."},
        {"title": "Ayurvedic Approach to Chronic Digestive Disorders",
         "category": "Ayurveda", "tags": ["ayurveda","digestion","gut health","IBS"], "is_featured": False,
         "content": "Digestive disorders affect nearly 40% of Indians. Ayurveda treats the root cause.\n\n**Agni (Digestive Fire)** — when impaired, Ama (toxins) accumulate.\n\n**Acidity**: Amla powder in warm water 30 min before meals; Yashtimadhu soothes the oesophageal lining.\n\n**IBS**: Triphala churna (2 tsp in warm water at bedtime); Takrarishta restores healthy gut flora.\n\n**Constipation**: Isabgol (psyllium husk) adds bulk; Haritaki improves nutrient absorption.\n\n**Bloating**: Hingvastak Churna with asafoetida and pepper; Ajwain seeds after meals.\n\n**Panchakarma Therapies**: Virechana (purgation) for Pitta disorders; Basti (herbal enemas) for Vata issues.\n\n**Lifestyle**: eat only when hungry, walk 100 steps after each meal, sleep on the left side. Consult Dr. Rajesh Kumar at Alambana Healthcare."},
        {"title": "Managing Type 2 Diabetes: Diet, Lifestyle & Monitoring",
         "category": "Nutrition", "tags": ["diabetes","blood sugar","diet","lifestyle"], "is_featured": True,
         "content": "India has 77 million diabetics — the second highest globally. Type 2 diabetes is largely manageable through lifestyle.\n\n**Glycaemic Index**: Low GI foods (oats, lentils, vegetables) should dominate your plate. Avoid white rice, maida, and sugary drinks.\n\n**Plate Method**: 50% non-starchy vegetables, 25% lean protein, 25% complex carbs.\n\n**Beneficial Indian Foods**: Karela (mimics insulin), Methi (reduces glucose spikes), Jamun seeds (powder in water), Turmeric (activates glucose metabolism).\n\n**Exercise**: 30 min brisk walking 5x/week reduces HbA1c by 0.7%. Add resistance training 2–3x/week.\n\n**Targets**: Fasting glucose 80–130 mg/dL, postmeal <180 mg/dL, HbA1c <7%.\n\n**Complications**: annual eye exams, 6-monthly kidney function tests, daily foot inspection. Book with Dr. Meera Nair at Alambana Healthcare."},
        {"title": "Mental Health in India: Breaking the Stigma",
         "category": "Mental Health", "tags": ["mental health","depression","anxiety","stigma"], "is_featured": False,
         "content": "India carries 15% of the global mental health burden yet allocates <1% of its health budget to it.\n\n**Key Facts**: 150 million Indians need care; only 30 million seek it. Average delay from symptoms to treatment: 7 years.\n\n**Depression** — persistent low mood 2+ weeks, loss of interest, fatigue. Not weakness — a medical condition.\n\n**Anxiety** — GAD, social anxiety, panic disorder, OCD. Effective treatments exist.\n\n**Bipolar Disorder** — mania alternating with depression. Often misdiagnosed. Responds well to mood stabilisers.\n\n**Myths vs Reality**: Psychiatric medicines are mostly NOT addictive. Therapy is for anyone seeking better wellbeing. 1 in 4 people face a mental health issue in their lifetime.\n\n**Helplines**: iCall 9152987821, Vandrevala Foundation 1860-2662-345 (24/7).\n\nDr. Anika Singh at Alambana Healthcare provides compassionate, confidential care. Reach out today."},
    ]

    if await db.blogs.count_documents({}) == 0:
        admin_doc = await db.users.find_one({"email": "admin@alambana.in"}, {"_id": 0})
        author_id = admin_doc["id"] if admin_doc else user["id"]
        from datetime import timedelta
        for i, b in enumerate(BLOGS):
            ts = (datetime.now(timezone.utc) - timedelta(days=(len(BLOGS)-i)*3)).isoformat()
            doc = {"id": str(uuid.uuid4()), "author_id": author_id, "is_published": True,
                   "featured_image_base64": None, "created_at": ts, "updated_at": ts, **b}
            await db.blogs.insert_one(doc); doc.pop("_id", None)
        created.append(f"blogs:{len(BLOGS)}")

    if not await db.platform_config.find_one({}):
        await db.platform_config.insert_one(
            {"commission_percentage": 15.0, "referral_points_per_signup": 10, "updated_at": now_ts}
        )
        created.append("platform_config")

    skipped = "All records already exist." if not created else ""
    return {"message": "Seed complete", "created": created, "note": skipped,
            "credentials": {
                "doctors": "Doctor@1234 (all 5 doctors)",
                "patients": "Patient@1234 (rahul.verma@gmail.com, sneha.patel@gmail.com, vikram.das@gmail.com)"
            }}


@api_router.get("/health")
async def health_check():
    return {"status": "ok"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', 'http://localhost:3000').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()