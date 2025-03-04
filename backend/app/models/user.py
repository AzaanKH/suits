from datetime import datetime, timezone
from bson import ObjectId
from werkzeug.security import generate_password_hash, check_password_hash

class User:
    """User model for authentication and profile management"""
    
    def __init__(self, email, password, first_name, last_name, 
                 role="customer", phone_number=None, addresses=None):
        self.email = email
        self.password = self._hash_password(password) if password else None
        self.first_name = first_name
        self.last_name = last_name
        self.role = role
        self.phone_number = phone_number
        self.addresses = addresses or []
        self.created_at = datetime.now(timezone.utc)
        self.updated_at = datetime.now(timezone.utc)
        self.last_login = None
        self.status = "active"
    
    def _hash_password(self, password):
        """Hash a password for storing"""
        return generate_password_hash(password)
    
    def check_password(self, password):
        """Check a stored password against one provided by user"""
        if not self.password:
            return False
        return check_password_hash(self.password, password)
    
    def to_dict(self):
        """Convert user object to dictionary for database storage"""
        return {
            "email": self.email,
            "password": self.password,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "role": self.role,
            "phone_number": self.phone_number,
            "addresses": self.addresses,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "last_login": self.last_login,
            "status": self.status
        }
    
    @classmethod
    def from_dict(cls, data):
        """Create a user object from dictionary data"""
        if not data:
            return None
            
        user = cls(
            email=data.get("email"),
            password=None,  # Don't rehash the password
            first_name=data.get("first_name"),
            last_name=data.get("last_name"),
            role=data.get("role", "customer"),
            phone_number=data.get("phone_number"),
            addresses=data.get("addresses", [])
        )
        
        # Set attributes that aren't part of the constructor
        user.password = data.get("password")
        user.created_at = data.get("created_at", datetime.now(timezone.utc))
        user.updated_at = data.get("updated_at", datetime.now(timezone.utc))
        user.last_login = data.get("last_login")
        user.status = data.get("status", "active")
        
        # Add _id if it exists
        if "_id" in data:
            user._id = data["_id"]
            
        return user
    
    def to_response_dict(self):
        """Convert user object to dictionary for API response (no sensitive data)"""
        return {
            "id": str(getattr(self, "_id", None)),
            "email": self.email,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "role": self.role,
            "status": self.status
        }