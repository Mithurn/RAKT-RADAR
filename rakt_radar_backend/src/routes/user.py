from flask import Blueprint, jsonify, request, session
import hashlib
import secrets
from datetime import datetime, timedelta
from src.models.user import User, db
from src.models.models import Hospital, BloodBank, Driver

user_bp = Blueprint('user', __name__)

def hash_password(password):
    """Simple password hashing for demo purposes"""
    return hashlib.sha256(password.encode()).hexdigest()

def generate_session_token():
    """Generate a secure session token"""
    return secrets.token_urlsafe(32)

@user_bp.route('/auth/login', methods=['POST'])
def login():
    """User login endpoint"""
    try:
        data = request.json
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({'error': 'Username and password are required'}), 400
        
        # Find user by username
        user = User.query.filter_by(username=username).first()
        
        if not user or user.password_hash != hash_password(password):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        if not user.is_active:
            return jsonify({'error': 'Account is deactivated'}), 403
        
        # Update last login
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        # Generate session token
        session_token = generate_session_token()
        session['user_id'] = user.id
        session['role'] = user.role
        
        # Get entity details based on role
        entity_details = None
        if user.entity_id:
            if user.role == 'hospital':
                entity = Hospital.query.get(user.entity_id)
                if entity:
                    entity_details = entity.to_dict()
            elif user.role == 'blood_bank':
                entity = BloodBank.query.get(user.entity_id)
                if entity:
                    entity_details = entity.to_dict()
            elif user.role == 'driver':
                entity = Driver.query.get(user.entity_id)
                if entity:
                    entity_details = entity.to_dict()
        
        return jsonify({
            'success': True,
            'user': user.to_dict_safe(),
            'entity_details': entity_details,
            'session_token': session_token
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/auth/logout', methods=['POST'])
def logout():
    """User logout endpoint"""
    try:
        session.clear()
        return jsonify({'success': True, 'message': 'Logged out successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/auth/me', methods=['GET'])
def get_current_user():
    """Get current authenticated user details"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'Not authenticated'}), 401
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get entity details
        entity_details = None
        if user.entity_id:
            if user.role == 'hospital':
                entity = Hospital.query.get(user.entity_id)
                if entity:
                    entity_details = entity.to_dict()
            elif user.role == 'blood_bank':
                entity = BloodBank.query.get(user.entity_id)
                if entity:
                    entity_details = entity.to_dict()
            elif user.role == 'driver':
                entity = Driver.query.get(user.entity_id)
                if entity:
                    entity_details = entity.to_dict()
        
        return jsonify({
            'user': user.to_dict_safe(),
            'entity_details': entity_details
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/auth/register', methods=['POST'])
def register():
    """User registration endpoint (for demo purposes)"""
    try:
        data = request.json
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        role = data.get('role')
        entity_id = data.get('entity_id')
        
        if not all([username, email, password, role]):
            return jsonify({'error': 'All fields are required'}), 400
        
        # Check if username or email already exists
        if User.query.filter_by(username=username).first():
            return jsonify({'error': 'Username already exists'}), 409
        
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email already exists'}), 409
        
        # Validate role
        valid_roles = ['hospital', 'blood_bank', 'driver', 'admin']
        if role not in valid_roles:
            return jsonify({'error': 'Invalid role'}), 400
        
        # Create user
        user = User(
            username=username,
            email=email,
            password_hash=hash_password(password),
            role=role,
            entity_id=entity_id
        )
        
        db.session.add(user)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'user': user.to_dict_safe(),
            'message': 'User registered successfully'
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/users', methods=['GET'])
def get_users():
    """Get all users (admin only)"""
    try:
        # Check if current user is admin
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'Not authenticated'}), 401
        
        current_user = User.query.get(user_id)
        if not current_user or current_user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        users = User.query.all()
        return jsonify([user.to_dict_safe() for user in users]), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/users/<user_id>', methods=['GET'])
def get_user(user_id):
    """Get specific user details"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify(user.to_dict_safe()), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/users/<user_id>', methods=['PUT'])
def update_user(user_id):
    """Update user details"""
    try:
        # Check if current user is admin or updating their own profile
        current_user_id = session.get('user_id')
        if not current_user_id:
            return jsonify({'error': 'Not authenticated'}), 401
        
        current_user = User.query.get(current_user_id)
        if not current_user:
            return jsonify({'error': 'Current user not found'}), 404
        
        # Only allow admin or self-update
        if current_user.role != 'admin' and current_user_id != user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.json
        
        # Update allowed fields
        if 'username' in data:
            user.username = data['username']
        if 'email' in data:
            user.email = data['email']
        if 'is_active' in data and current_user.role == 'admin':
            user.is_active = data['is_active']
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'user': user.to_dict_safe(),
            'message': 'User updated successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/users/<user_id>', methods=['DELETE'])
def delete_user(user_id):
    """Delete user (admin only)"""
    try:
        # Check if current user is admin
        current_user_id = session.get('user_id')
        if not current_user_id:
            return jsonify({'error': 'Not authenticated'}), 401
        
        current_user = User.query.get(current_user_id)
        if not current_user or current_user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'User deleted successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
