import cloudinary
import cloudinary.uploader
import os
from dotenv import load_dotenv

load_dotenv()

cloudinary.config(
    cloud_name  = os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key     = os.getenv("CLOUDINARY_API_KEY"),
    api_secret  = os.getenv("CLOUDINARY_API_SECRET")
)

def upload_image(file_bytes: bytes, folder: str = "mcucsya") -> str:
    try:
        result = cloudinary.uploader.upload(
            file_bytes,
            folder=folder,
            resource_type="auto"
        )
        return result.get("secure_url", "")
    except Exception as e:
        print(f"Upload error: {e}")
        return ""

def upload_document(file_bytes: bytes, folder: str = "mcucsya/documents") -> str:
    try:
        result = cloudinary.uploader.upload(
            file_bytes,
            folder=folder,
            resource_type="raw"
        )
        return result.get("secure_url", "")
    except Exception as e:
        print(f"Upload error: {e}")
        return ""