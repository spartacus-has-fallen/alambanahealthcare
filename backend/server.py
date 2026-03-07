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
    amount: float
    currency: str = "INR"
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    status: str = "pending"
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
            # Update referrer points
            await db.users.update_one(
                {"referral_code": referred_by},
                {"$inc": {"referral_points": 10}}
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
        
        # Update payment status
        await db.payments.update_one(
            {"razorpay_order_id": razorpay_order_id},
            {"$set": {"razorpay_payment_id": razorpay_payment_id, "status": "completed"}}
        )
        
        # Update appointment payment status
        payment = await db.payments.find_one({"razorpay_order_id": razorpay_order_id}, {"_id": 0})
        if payment:
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
            await db.payments.update_one(
                {"razorpay_order_id": razorpay_order_id},
                {"$set": {"razorpay_payment_id": razorpay_payment_id, "status": "completed"}}
            )
            payment = await db.payments.find_one({"razorpay_order_id": razorpay_order_id}, {"_id": 0})
            if payment:
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