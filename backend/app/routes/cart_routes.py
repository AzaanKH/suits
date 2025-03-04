from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..services.cart_service import get_user_cart, add_to_cart, remove_from_cart, update_cart_quantity

cart_bp = Blueprint('cart', __name__)

@cart_bp.route('/', methods=['GET'])
@jwt_required()
def get_cart():
    try:
        user_id = get_jwt_identity()
        cart_items = get_user_cart(user_id)
        
        return jsonify({"cart": cart_items}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@cart_bp.route('/', methods=['POST'])
@jwt_required()
def add_cart_item():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        if not data.get('product_id') or not data.get('quantity'):
            return jsonify({"error": "Product ID and quantity are required"}), 400
            
        # Add to cart
        result = add_to_cart({
            "user_id": user_id,
            "product_id": data['product_id'],
            "quantity": data['quantity'],
            "size": data.get('size')
        })
        
        if result:
            return jsonify({"message": "Item added to cart"}), 201
        else:
            return jsonify({"error": "Failed to add item to cart"}), 500
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@cart_bp.route('/<product_id>', methods=['DELETE'])
@jwt_required()
def remove_cart_item(product_id):
    try:
        user_id = get_jwt_identity()
        
        result = remove_from_cart(user_id, product_id)
        
        return jsonify({"message": "Item removed from cart"}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@cart_bp.route('/<product_id>', methods=['PUT'])
@jwt_required()
def update_cart_item(product_id):
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if 'quantity' not in data:
            return jsonify({"error": "Quantity is required"}), 400
            
        result = update_cart_quantity(user_id, product_id, data['quantity'])
        
        return jsonify({"message": "Cart updated"}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500