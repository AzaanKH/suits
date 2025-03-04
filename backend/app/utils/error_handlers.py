from flask import jsonify
import traceback
import logging

class APIError(Exception):
    """Base exception class for API errors"""
    def __init__(self, message, status_code=400, payload=None):
        super().__init__()
        self.message = message
        self.status_code = status_code
        self.payload = payload
    
    def to_dict(self):
        error_dict = dict(self.payload or ())
        error_dict['message'] = self.message
        error_dict['status_code'] = self.status_code
        return error_dict

def register_error_handlers(app):
    # Custom API error
    @app.errorhandler(APIError)
    def handle_api_error(error):
        response = jsonify(error.to_dict())
        response.status_code = error.status_code
        return response
    
    # Bad request
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({
            'error': 'Bad request',
            'message': str(error)
        }), 400
    
    # Unauthorized
    @app.errorhandler(401)
    def unauthorized(error):
        return jsonify({
            'error': 'Unauthorized',
            'message': 'Authentication is required to access this resource'
        }), 401
    
    # Forbidden
    @app.errorhandler(403)
    def forbidden(error):
        return jsonify({
            'error': 'Forbidden',
            'message': 'You do not have permission to access this resource'
        }), 403
    
    # Not found
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            'error': 'Not found',
            'message': 'The requested resource was not found'
        }), 404
    
    # Method not allowed
    @app.errorhandler(405)
    def method_not_allowed(error):
        return jsonify({
            'error': 'Method not allowed',
            'message': 'The method is not allowed for the requested URL'
        }), 405
    
    # Internal server error
    @app.errorhandler(500)
    def server_error(error):
        # Log the error details
        current_app.logger.error(f"500 Error: {str(error)}")
        current_app.logger.error(traceback.format_exc())
        
        return jsonify({
            'error': 'Internal server error',
            'message': 'An unexpected error occurred'
        }), 500
    
    # Handle all other exceptions
    @app.errorhandler(Exception)
    def handle_exception(error):
        # Log the error
        current_app.logger.error(f"Unhandled Exception: {str(error)}")
        current_app.logger.error(traceback.format_exc())
        
        if app.config.get('DEBUG', False):
            # In development, return detailed error
            return jsonify({
                'error': 'Server error',
                'message': str(error),
                'traceback': traceback.format_exc()
            }), 500
        else:
            # In production, return generic error
            return jsonify({
                'error': 'Server error',
                'message': 'An unexpected error occurred'
            }), 500
            
# def register_error_handlers(app):
#     @app.errorhandler(400)
#     def bad_request(error):
#         return jsonify({"error": "Bad request", "message": str(error)}), 400
        
#     @app.errorhandler(401)
#     def unauthorized(error):
#         return jsonify({"error": "Unauthorized", "message": "Authentication required"}), 401
        
#     @app.errorhandler(403)
#     def forbidden(error):
#         return jsonify({"error": "Forbidden", "message": "You don't have permission to access this resource"}), 403
        
#     @app.errorhandler(404)
#     def not_found(error):
#         return jsonify({"error": "Not found", "message": "The requested resource was not found"}), 404
        
#     @app.errorhandler(405)
#     def method_not_allowed(error):
#         return jsonify({"error": "Method not allowed", "message": "The method is not allowed for the requested URL"}), 405
        
#     @app.errorhandler(500)
#     def server_error(error):
#         return jsonify({"error": "Internal server error", "message": "Something went wrong on our end"}), 500