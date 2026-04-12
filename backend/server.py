from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Header, File, UploadFile, Query, Response, Request
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import requests as http_requests
import razorpay
import math
import bcrypt
import jwt

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT config
JWT_ALGORITHM = "HS256"

def get_jwt_secret():
    return os.environ["JWT_SECRET"]

def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(hours=24), "type": "access"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

# Password hashing
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

# Razorpay client
razorpay_client = razorpay.Client(auth=(os.environ['RAZORPAY_KEY_ID'], os.environ['RAZORPAY_KEY_SECRET']))

# Object Storage
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "perfectly-good"
storage_key = None

def init_storage():
    global storage_key
    if storage_key:
        return storage_key
    resp = http_requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
    resp.raise_for_status()
    storage_key = resp.json()["storage_key"]
    return storage_key

def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    resp = http_requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120
    )
    resp.raise_for_status()
    return resp.json()

def get_object(path: str):
    key = init_storage()
    resp = http_requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key}, timeout=60
    )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ---------- Pydantic Models ----------

class RegisterInput(BaseModel):
    name: str
    email: str
    password: str

class LoginInput(BaseModel):
    email: str
    password: str

class FoodItemCreate(BaseModel):
    name: str
    description: str
    original_price: float
    discounted_price: float
    quantity_available: int
    pickup_start_time: str
    pickup_end_time: str
    image_url: Optional[str] = None

class FoodItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    original_price: Optional[float] = None
    discounted_price: Optional[float] = None
    quantity_available: Optional[int] = None
    pickup_start_time: Optional[str] = None
    pickup_end_time: Optional[str] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None

class OrderCreate(BaseModel):
    food_item_id: str
    quantity: int

class OrderVerify(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    food_item_id: str
    quantity: int

class VendorCreate(BaseModel):
    name: str
    location: dict
    category: str

# ---------- Auth Helper ----------

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"user_id": payload["sub"]}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ---------- Distance Helper ----------

def calculate_distance(lat1, lon1, lat2, lon2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    return R * c

# ---------- Brute Force Protection ----------

async def check_brute_force(ip: str, email: str):
    identifier = f"{ip}:{email}"
    record = await db.login_attempts.find_one({"identifier": identifier}, {"_id": 0})
    if record and record.get("attempts", 0) >= 5:
        locked_until = record.get("locked_until")
        if locked_until:
            if isinstance(locked_until, str):
                locked_until = datetime.fromisoformat(locked_until)
            if locked_until.tzinfo is None:
                locked_until = locked_until.replace(tzinfo=timezone.utc)
            if locked_until > datetime.now(timezone.utc):
                raise HTTPException(status_code=429, detail="Too many failed attempts. Try again in 15 minutes.")
            else:
                await db.login_attempts.delete_one({"identifier": identifier})

async def record_failed_attempt(ip: str, email: str):
    identifier = f"{ip}:{email}"
    record = await db.login_attempts.find_one({"identifier": identifier}, {"_id": 0})
    if record:
        new_attempts = record.get("attempts", 0) + 1
        update = {"$set": {"attempts": new_attempts}}
        if new_attempts >= 5:
            update["$set"]["locked_until"] = (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()
        await db.login_attempts.update_one({"identifier": identifier}, update)
    else:
        await db.login_attempts.insert_one({
            "identifier": identifier,
            "attempts": 1,
            "created_at": datetime.now(timezone.utc).isoformat()
        })

async def clear_failed_attempts(ip: str, email: str):
    identifier = f"{ip}:{email}"
    await db.login_attempts.delete_one({"identifier": identifier})

# ---------- Auth Endpoints ----------

@api_router.post("/auth/register")
async def register(data: RegisterInput):
    email = data.email.strip().lower()
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = f"user_{uuid.uuid4().hex[:12]}"
    password_hash = hash_password(data.password)

    user_doc = {
        "user_id": user_id,
        "email": email,
        "name": data.name.strip(),
        "password_hash": password_hash,
        "role": "user",
        "picture": None,
        "location": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)

    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)

    user_response = {k: v for k, v in user_doc.items() if k not in ["password_hash", "_id"]}

    response = JSONResponse(content=user_response)
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=True, samesite="none", max_age=86400, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=True, samesite="none", max_age=604800, path="/")
    return response

@api_router.post("/auth/login")
async def login(data: LoginInput, request: Request):
    email = data.email.strip().lower()
    ip = request.client.host if request.client else "unknown"

    await check_brute_force(ip, email)

    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user or not verify_password(data.password, user["password_hash"]):
        await record_failed_attempt(ip, email)
        raise HTTPException(status_code=401, detail="Invalid email or password")

    await clear_failed_attempts(ip, email)

    access_token = create_access_token(user["user_id"], email)
    refresh_token = create_refresh_token(user["user_id"])

    user_response = {k: v for k, v in user.items() if k != "password_hash"}

    response = JSONResponse(content=user_response)
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=True, samesite="none", max_age=86400, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=True, samesite="none", max_age=604800, path="/")
    return response

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return user

@api_router.post("/auth/logout")
async def logout():
    response = JSONResponse(content={"message": "Logged out successfully"})
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/")
    return response

@api_router.post("/auth/refresh")
async def refresh_token(request: Request):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"user_id": payload["sub"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        access_token = create_access_token(user["user_id"], user["email"])
        response = JSONResponse(content={"message": "Token refreshed"})
        response.set_cookie(key="access_token", value=access_token, httponly=True, secure=True, samesite="none", max_age=86400, path="/")
        return response
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

# ---------- Vendor Endpoints ----------

@api_router.post("/vendor/create")
async def create_vendor(vendor_data: VendorCreate, request: Request):
    current_user = await get_current_user(request)

    existing_vendor = await db.vendors.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
    if existing_vendor:
        raise HTTPException(status_code=400, detail="Vendor already exists for this user")

    vendor_id = f"vendor_{uuid.uuid4().hex[:12]}"
    vendor = {
        "vendor_id": vendor_id,
        "user_id": current_user["user_id"],
        "name": vendor_data.name,
        "location": vendor_data.location,
        "category": vendor_data.category,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.vendors.insert_one(vendor)
    await db.users.update_one({"user_id": current_user["user_id"]}, {"$set": {"role": "vendor"}})

    return {"vendor_id": vendor_id, "message": "Vendor created successfully"}

@api_router.post("/vendor/drops")
async def create_drop(drop_data: FoodItemCreate, request: Request):
    current_user = await get_current_user(request)
    vendor = await db.vendors.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=403, detail="User is not a vendor")

    item_id = f"item_{uuid.uuid4().hex[:12]}"
    food_item = {
        "item_id": item_id,
        "vendor_id": vendor["vendor_id"],
        "name": drop_data.name,
        "description": drop_data.description,
        "original_price": drop_data.original_price,
        "discounted_price": drop_data.discounted_price,
        "quantity_available": drop_data.quantity_available,
        "pickup_start_time": drop_data.pickup_start_time,
        "pickup_end_time": drop_data.pickup_end_time,
        "image_url": drop_data.image_url,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.food_items.insert_one(food_item)
    return {"item_id": item_id, "message": "Drop created successfully"}

@api_router.put("/vendor/drops/{item_id}")
async def update_drop(item_id: str, drop_data: FoodItemUpdate, request: Request):
    current_user = await get_current_user(request)
    vendor = await db.vendors.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=403, detail="User is not a vendor")

    item = await db.food_items.find_one({"item_id": item_id, "vendor_id": vendor["vendor_id"]}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Drop not found")

    update_data = {k: v for k, v in drop_data.model_dump().items() if v is not None}
    if update_data:
        await db.food_items.update_one({"item_id": item_id}, {"$set": update_data})
    return {"message": "Drop updated successfully"}

@api_router.get("/vendor/drops")
async def get_vendor_drops(request: Request):
    current_user = await get_current_user(request)
    vendor = await db.vendors.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=403, detail="User is not a vendor")

    items = await db.food_items.find({"vendor_id": vendor["vendor_id"]}, {"_id": 0}).to_list(1000)
    result = [{**item, "vendor_name": vendor["name"], "vendor_location": vendor["location"]} for item in items]
    return result

@api_router.get("/vendor/orders")
async def get_vendor_orders(request: Request):
    current_user = await get_current_user(request)
    vendor = await db.vendors.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=403, detail="User is not a vendor")

    orders = await db.orders.find({"vendor_id": vendor["vendor_id"]}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return orders

@api_router.post("/vendor/upload")
async def upload_image(file: UploadFile = File(...), request: Request = None):
    current_user = await get_current_user(request)
    vendor = await db.vendors.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=403, detail="User is not a vendor")

    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    path = f"{APP_NAME}/uploads/{vendor['vendor_id']}/{uuid.uuid4()}.{ext}"
    data = await file.read()
    result = put_object(path, data, file.content_type or "image/jpeg")

    await db.uploaded_files.insert_one({
        "file_id": str(uuid.uuid4()),
        "storage_path": result["path"],
        "original_filename": file.filename,
        "content_type": file.content_type,
        "size": result["size"],
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    image_url = f"/api/files/{result['path']}"
    return {"image_url": image_url, "storage_path": result["path"]}

# ---------- Drops Endpoints ----------

@api_router.get("/drops")
async def get_drops(lat: Optional[float] = Query(None), lon: Optional[float] = Query(None)):
    items = await db.food_items.find({"is_active": True, "quantity_available": {"$gt": 0}}, {"_id": 0}).to_list(1000)

    result = []
    for item in items:
        vendor = await db.vendors.find_one({"vendor_id": item["vendor_id"]}, {"_id": 0})
        if not vendor:
            continue

        food_item = {**item, "vendor_name": vendor["name"], "vendor_location": vendor["location"]}

        if lat is not None and lon is not None and vendor.get("location"):
            vendor_lat = vendor["location"].get("lat")
            vendor_lon = vendor["location"].get("lon")
            if vendor_lat and vendor_lon:
                distance = calculate_distance(lat, lon, vendor_lat, vendor_lon)
                food_item["distance"] = round(distance, 1)

        result.append(food_item)

    if lat is not None and lon is not None:
        result.sort(key=lambda x: x.get("distance", float('inf')))

    return result

@api_router.get("/drops/{item_id}")
async def get_drop_detail(item_id: str, lat: Optional[float] = Query(None), lon: Optional[float] = Query(None)):
    item = await db.food_items.find_one({"item_id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Drop not found")

    vendor = await db.vendors.find_one({"vendor_id": item["vendor_id"]}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    food_item = {**item, "vendor_name": vendor["name"], "vendor_location": vendor["location"]}

    if lat is not None and lon is not None and vendor.get("location"):
        vendor_lat = vendor["location"].get("lat")
        vendor_lon = vendor["location"].get("lon")
        if vendor_lat and vendor_lon:
            distance = calculate_distance(lat, lon, vendor_lat, vendor_lon)
            food_item["distance"] = round(distance, 1)

    return food_item

# ---------- Order Endpoints ----------

@api_router.post("/orders/create")
async def create_order(order_data: OrderCreate, request: Request):
    current_user = await get_current_user(request)

    item = await db.food_items.find_one({"item_id": order_data.food_item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Drop not found")
    if not item["is_active"]:
        raise HTTPException(status_code=400, detail="Drop is not active")
    if item["quantity_available"] < order_data.quantity:
        raise HTTPException(status_code=400, detail="Insufficient quantity available")

    total_amount = int(item["discounted_price"] * order_data.quantity * 100)

    razorpay_order = razorpay_client.order.create({
        "amount": total_amount,
        "currency": "INR",
        "payment_capture": 1
    })

    return {
        "razorpay_order_id": razorpay_order["id"],
        "amount": total_amount,
        "currency": "INR",
        "key_id": os.environ['RAZORPAY_KEY_ID']
    }

@api_router.post("/orders/verify")
async def verify_order(order_data: OrderVerify, request: Request):
    current_user = await get_current_user(request)

    try:
        razorpay_client.utility.verify_payment_signature({
            'razorpay_order_id': order_data.razorpay_order_id,
            'razorpay_payment_id': order_data.razorpay_payment_id,
            'razorpay_signature': order_data.razorpay_signature
        })
    except Exception as e:
        logger.error(f"Payment verification failed: {e}")
        raise HTTPException(status_code=400, detail="Payment verification failed")

    item = await db.food_items.find_one({"item_id": order_data.food_item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Drop not found")
    if item["quantity_available"] < order_data.quantity:
        raise HTTPException(status_code=400, detail="Insufficient quantity available")

    vendor = await db.vendors.find_one({"vendor_id": item["vendor_id"]}, {"_id": 0})

    order_id = f"order_{uuid.uuid4().hex[:12]}"
    total_price = item["discounted_price"] * order_data.quantity

    order = {
        "order_id": order_id,
        "user_id": current_user["user_id"],
        "food_item_id": order_data.food_item_id,
        "food_item_name": item["name"],
        "vendor_id": item["vendor_id"],
        "vendor_name": vendor["name"] if vendor else "Unknown",
        "vendor_location": vendor["location"] if vendor else {},
        "quantity": order_data.quantity,
        "total_price": total_price,
        "status": "reserved",
        "razorpay_order_id": order_data.razorpay_order_id,
        "razorpay_payment_id": order_data.razorpay_payment_id,
        "pickup_time": item["pickup_start_time"] + " - " + item["pickup_end_time"],
        "image_url": item.get("image_url"),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.orders.insert_one(order)

    new_quantity = item["quantity_available"] - order_data.quantity
    await db.food_items.update_one(
        {"item_id": order_data.food_item_id},
        {"$set": {"quantity_available": new_quantity}}
    )

    order.pop("_id", None)
    return order

@api_router.get("/orders/user")
async def get_user_orders(request: Request):
    current_user = await get_current_user(request)
    orders = await db.orders.find({"user_id": current_user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return orders

# ---------- File Serving ----------

@api_router.get("/files/{path:path}")
async def serve_file(path: str):
    record = await db.uploaded_files.find_one({"storage_path": path, "is_deleted": False}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=404, detail="File not found")
    try:
        data, content_type = get_object(path)
        return Response(content=data, media_type=record.get("content_type", content_type))
    except Exception as e:
        logger.error(f"File retrieval error: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve file")

# ---------- App Setup ----------

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

async def seed_admin():
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@perfectlygood.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")

    existing = await db.users.find_one({"email": admin_email}, {"_id": 0})
    if existing is None:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": admin_email,
            "name": "Admin",
            "password_hash": hash_password(admin_password),
            "role": "admin",
            "picture": None,
            "location": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info(f"Admin user seeded: {admin_email}")
    elif not verify_password(admin_password, existing.get("password_hash", "")):
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_password)}}
        )
        logger.info("Admin password updated")

@app.on_event("startup")
async def startup():
    try:
        init_storage()
        logger.info("Storage initialized")
    except Exception as e:
        logger.error(f"Storage init failed: {e}")

    await seed_admin()

    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    logger.info("Database indexes created")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
