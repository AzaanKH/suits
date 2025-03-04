# backend/app/routes.py
from flask import Blueprint, request, jsonify
from .db import create_user
from flask_bcrypt import Bcrypt, generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from .db import db

bp = Blueprint('auth', __name__, url_prefix='/api')
bcrypt = Bcrypt()

@bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    name = data.get('name')

    if not email or not password or not name:
        return jsonify({'error': 'Missing required fields'}), 400

    hashed_password = generate_password_hash(password).decode('utf-8')
    user_data = {'email': email, 'password': hashed_password, 'name': name}

    if create_user(user_data):
        return jsonify({'message': 'User registered successfully'}), 201
    else:
        return jsonify({'error': 'Email already exists'}), 400

@bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'Missing required fields'}), 400

    user = db.db.users.find_one({'email': email})
    if user and check_password_hash(user['password'], password):
        access_token = create_access_token(identity=str(user['_id']))
        return jsonify({'token': access_token}), 200
    else:
        return jsonify({'error': 'Invalid credentials'}), 401