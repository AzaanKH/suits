from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import (
    create_access_token, 
    create_refresh_token,
    jwt_required, 
    get_jwt_identity,
    get_jwt
)
from ..models.user import User
from ..services.user_service import (
    find_user_by_email, 
    find_user_by_id,
    create_user, 
    update_last_login
)
from datetime import datetime, timedelta, timezone
import re

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['email', 'password', 'first_name', 'last_name']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        
        # Validate email format
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_regex, data['email']):
            return jsonify({"error": "Invalid email format"}), 400
        
        # Validate password strength
        if len(data['password']) < 8:
            return jsonify({"error": "Password must be at least 8 characters long"}), 400
          
        # Check if user already exists
        existing_user = find_user_by_email(data['email'])
        if existing_user:
            return jsonify({"error": "Email already exists"}), 409
        
        # Prepare user data
        user = User(
            email=data['email'],
            password=data['password'],
            first_name=data['first_name'],
            last_name=data['last_name'],
            role="customer",
            phone_number=data.get('phone_number')
        )
        
        # Create user in database
        user_id = create_user(user.to_dict())
        
        if not user_id:
            return jsonify({"error": "Failed to create user"}), 500
        
        return jsonify({
            "message": "User registered successfully",
            "user_id": str(user_id)
        }), 201
        
    except Exception as e:
        current_app.logger.error(f"Registration error: {str(e)}")
        return jsonify({"error": "Registration failed"}), 500
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Log in a user"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('email') or not data.get('password'):
            return jsonify({"error": "Email and password are required"}), 400
        
        # Find user
        user = find_user_by_email(data['email'])
        
        # Check credentials
        if not user or not user.check_password(data['password']):
            return jsonify({"error": "Invalid credentials"}), 401
        
        if user.status != "active":
            return jsonify({"error": "Account is not active"}), 403
        
        # Update last login
        update_last_login(user._id)
        
        # Create access token
        access_token = create_access_token(
            identity=str(user._id),
            additional_claims={
                "role": user.role,
                "email": user.email
            }
        )
        
        # Create refresh token
        refresh_token = create_refresh_token(identity=str(user._id))
        
        return jsonify({
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": user.to_response_dict()
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Login error: {str(e)}")
        return jsonify({"error": "Login failed"}), 500
      
@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token"""
    try:
        # Get user identity from refresh token
        user_id = get_jwt_identity()
        
        # Find user
        user = find_user_by_id(user_id)
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Check if user is active
        if user.status != "active":
            return jsonify({"error": "Account is not active"}), 403
        
        # Create new access token
        access_token = create_access_token(
            identity=user_id,
            additional_claims={
                "role": user.role,
                "email": user.email
            }
        )
        
        return jsonify({
            "access_token": access_token
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Token refresh error: {str(e)}")
        return jsonify({"error": "Token refresh failed"}), 500

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user profile"""
    try:
        # Get user identity from token
        user_id = get_jwt_identity()
        
        # Find user
        user = find_user_by_id(user_id)
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        return jsonify(user.to_response_dict()), 200
        
    except Exception as e:
        current_app.logger.error(f"Get user profile error: {str(e)}")
        return jsonify({"error": "Failed to get user profile"}), 500

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Revoke access token (logout)"""
    try:
        jti = get_jwt()["jti"]
        
        # Store token in blocklist
        app.mongo.db.revoked_tokens.insert_one({
            "jti": jti,
            "expires_at": datetime.now(timezone.utc) + timedelta(hours=1)  # Should match token expiry
        })
        
        return jsonify({"message": "Successfully logged out"}), 200
        
    except Exception as e:
        current_app.logger.error(f"Logout error: {str(e)}")
        return jsonify({"error": "Logout failed"}), 500
        
# Also add a maintenance task to clean up expired tokens
# This could be a scheduled task or cron job
def cleanup_expired_tokens():
    """Remove expired tokens from blocklist"""
    app.mongo.db.revoked_tokens.delete_many({
        "expires_at": {"$lt": datetime.now(timezone.utc)}
    })