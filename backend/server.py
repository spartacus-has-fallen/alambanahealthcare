from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
from emergentintegrations.llm.chat import LlmChat, UserMessage
import razorpay
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET_KEY', 'default_secret_key')
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30

# Razorpay Configuration
RAZORPAY_KEY_ID = os.environ.get('RAZORPAY_KEY_ID', '')
RAZORPAY_KEY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET', '')
if RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET:
    razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
else:
    razorpay_client = None

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
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BlogPostCreate(BaseModel):
    title: str
    content: str
    category: str
    tags: List[str] = []
    is_published: bool = False

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
    
    appointment = Appointment(
        patient_id=payload["id"],
        **appointment_data.model_dump(),
        amount=doctor["consultation_fee"]
    )
    appointment_dict = appointment.model_dump()
    appointment_dict["created_at"] = appointment_dict["created_at"].isoformat()
    
    await db.appointments.insert_one(appointment_dict)
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
async def ai_symptom_check(symptom_data: AISymptomCheck, payload: dict = Depends(verify_token)):
    # Initialize AI chat
    llm_key = os.environ.get('EMERGENT_LLM_KEY')
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
    
    chat = LlmChat(
        api_key=llm_key,
        session_id=f"symptom_check_{payload['id']}_{datetime.now(timezone.utc).timestamp()}",
        system_message=system_message
    ).with_model("openai", "gpt-5.2")
    
    user_prompt = f"Patient symptoms: {symptom_data.symptoms}\n"
    if symptom_data.age:
        user_prompt += f"Age: {symptom_data.age}\n"
    if symptom_data.gender:
        user_prompt += f"Gender: {symptom_data.gender}\n"
    user_prompt += "Please analyze and provide assessment in JSON format."
    
    user_message = UserMessage(text=user_prompt)
    
    try:
        response = await chat.send_message(user_message)
        
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
        except:
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
        
        # Save to history
        history = AIAssessmentHistory(
            user_id=payload["id"],
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

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
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