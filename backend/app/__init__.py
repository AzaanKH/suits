# backend/app/__init__.py
from flask import Flask
from flask_pymongo import PyMongo
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from .routes import bp as auth_bp  # Corrected import
import configparser
from dotenv import load_dotenv
from .utils.user_helpers import find_user_by_id
import os

# Load environment variables
load_dotenv()

# Initialize extensions
mongo = PyMongo()
jwt = JWTManager()

def create_app():
    app = Flask(__name__)

    # Load configuration from .ini file
    config = configparser.ConfigParser()
    config.read(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', "config.ini")))

    # Configure Flask app
    app.config['DEBUG'] = True
    app.config['MONGO_URI'] = os.environ.get('MONGO_CONNECTION_STRING') # Use the correct section and key
    app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY")
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1)
    app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=30)
    app.config["JWT_BLACKLIST_ENABLED"] = True
    app.config["JWT_BLACKLIST_TOKEN_CHECKS"] = ["access", "refresh"]

    @jwt.user_identity_loader
    def user_identity_lookup(user_id):
        return user_id

    @jwt.user_lookup_loader
    def user_lookup_callback(_jwt_header, jwt_data):
        identity = jwt_data["sub"]
        return find_user_by_id(identity)

    @jwt.token_in_blocklist_loader
    def check_if_token_revoked(jwt_header, jwt_payload):
        jti = jwt_payload["jti"]
        token = app.mongo.db.revoked_tokens.find_one({"jti": jti})
        return token is not None

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({
            "error": "Token has expired",
            "message": "Please log in again"
        }), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({
            "error": "Invalid token",
            "message": "Authentication required"
        }), 401

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({
            "error": "Authorization required",
            "message": "Request does not contain an access token"
        }), 401

    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_payload):
        return jsonify({
            "error": "Token has been revoked",
            "message": "Please log in again"
        }), 401

    # Register blueprints
    app.register_blueprint(auth_bp)
    mongo.init_app(app)
    jwt.init_app(app)
    
    
    # what is cors and how does it work
    CORS(app, resources={
        # Allow specific endpoints
        r"/api/*": {
            # Define allowed origins
            "origins": ["http://localhost:3000", "https://yourdomain.com"],
            # Allow specific methods
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            # Allow specific headers
            "allow_headers": ["Content-Type", "Authorization"],
            # Allow credentials (cookies, authorization headers)
            "supports_credentials": True
        }
    })
     
    from .utils.error_handlers import register_error_handlers
    register_error_handlers(app)
    
    # Register blueprints
    from .routes.auth_routes import auth_bp
    from .routes.product_routes import product_bp
    from .routes.cart_routes import cart_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(product_bp, url_prefix='/api/products')
    app.register_blueprint(cart_bp, url_prefix='/api/cart')
    
    
    
    return app