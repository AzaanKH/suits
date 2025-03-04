from flask import current_app
from ..models.user import User
from datetime import datetime
from bson.objectid import ObjectId

def find_user_by_email(email):
    """Find a user by email"""
    if not email:
        return None
        
    db = current_app.mongo.db
    user_data = db.users.find_one({"email": email})
    
    if user_data:
        return User.from_dict(user_data)
    return None

def find_user_by_id(user_id):
    """Find a user by ID"""
    if not user_id:
        return None
        
    db = current_app.mongo.db
    
    try:
        # Convert string ID to ObjectId if necessary
        if isinstance(user_id, str):
            user_id = ObjectId(user_id)
            
        user_data = db.users.find_one({"_id": user_id})
        
        if user_data:
            return User.from_dict(user_data)
    except Exception as e:
        current_app.logger.error(f"Error finding user by ID: {str(e)}")
        
    return None

def create_user(user_data):
    """Create a new user"""
    if not user_data:
        return None
        
    db = current_app.mongo.db
    
    # Check if user with this email already exists
    existing_user = db.users.find_one({"email": user_data.get("email")})
    if existing_user:
        return None
    
    try:
        result = db.users.insert_one(user_data)
        return result.inserted_id
    except Exception as e:
        current_app.logger.error(f"Error creating user: {str(e)}")
        return None

def update_user(user_id, update_data):
    """Update user information"""
    if not user_id or not update_data:
        return False
        
    db = current_app.mongo.db
    
    try:
        # Convert string ID to ObjectId if necessary
        if isinstance(user_id, str):
            user_id = ObjectId(user_id)
            
        # Add updated_at timestamp
        update_data["updated_at"] = datetime.utcnow()
        
        # Never update email or password through this method
        if "email" in update_data:
            del update_data["email"]
        if "password" in update_data:
            del update_data["password"]
        
        result = db.users.update_one(
            {"_id": user_id},
            {"$set": update_data}
        )
        
        return result.modified_count > 0
    except Exception as e:
        current_app.logger.error(f"Error updating user: {str(e)}")
        return False

def update_password(user_id, new_password):
    """Update user password"""
    if not user_id or not new_password:
        return False
        
    db = current_app.mongo.db
    
    try:
        # Convert string ID to ObjectId if necessary
        if isinstance(user_id, str):
            user_id = ObjectId(user_id)
            
        # Create a User instance to hash the password
        user = User(None, new_password, None, None)
        
        result = db.users.update_one(
            {"_id": user_id},
            {
                "$set": {
                    "password": user.password,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        return result.modified_count > 0
    except Exception as e:
        current_app.logger.error(f"Error updating password: {str(e)}")
        return False

def update_last_login(user_id):
    """Update user's last_login timestamp"""
    if not user_id:
        return False
        
    db = current_app.mongo.db
    
    try:
        # Convert string ID to ObjectId if necessary
        if isinstance(user_id, str):
            user_id = ObjectId(user_id)
            
        result = db.users.update_one(
            {"_id": user_id},
            {
                "$set": {
                    "last_login": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        return result.modified_count > 0
    except Exception as e:
        current_app.logger.error(f"Error updating last login: {str(e)}")
        return False