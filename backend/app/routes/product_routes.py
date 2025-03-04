from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from ..services.product_service import get_products, get_product_by_id, create_product

product_bp = Blueprint('products', __name__)

@product_bp.route('/', methods=['GET'])
def get_all_products():
    try:
        page = int(request.args.get('page', 0))
        limit = int(request.args.get('limit', 10))
        
        products = get_products(page, limit)
        
        return jsonify({
            "products": products,
            "page": page,
            "limit": limit,
            "total": len(products)
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@product_bp.route('/<product_id>', methods=['GET'])
def get_product(product_id):
    try:
        product = get_product_by_id(product_id)
        
        if not product:
            return jsonify({"error": "Product not found"}), 404
            
        return jsonify(product), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@product_bp.route('/', methods=['POST'])
@jwt_required()
def add_product():
    try:
        # Check for admin rights
        # This is a placeholder for actual role checking logic
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'price', 'description', 'category']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
                
        # Create product
        result = create_product(data)
        
        if result:
            return jsonify({"message": "Product created successfully", "id": str(result)}), 201
        else:
            return jsonify({"error": "Failed to create product"}), 500
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500