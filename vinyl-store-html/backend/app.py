from flask import Flask, jsonify, request, session, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import os
import sys
from dotenv import load_dotenv
load_dotenv()

app = Flask(__name__, static_folder='../vinyl-store-enhanced', static_url_path='')
CORS(app, supports_credentials=True)

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
login_manager = LoginManager()
login_manager.init_app(app)

# Error handling for better debugging
@app.errorhandler(Exception)
def handle_error(error):
    print(f"Error: {str(error)}", file=sys.stderr)
    return jsonify({'error': str(error)}), 500

@app.before_request
def log_request():
    print(f"Request: {request.method} {request.url}", file=sys.stderr)
    if request.data:
        print(f"Data: {request.get_data(as_text=True)}", file=sys.stderr)

# Models
class User(UserMixin, db.Model):
    __tablename__ = 'users'
    UserID = db.Column(db.Integer, primary_key=True)
    Username = db.Column(db.String(50), unique=True, nullable=False)
    Email = db.Column(db.String(100), unique=True, nullable=False)
    PasswordHash = db.Column(db.String(255), nullable=False)
    FirstName = db.Column(db.String(50))
    LastName = db.Column(db.String(50))
    Address = db.Column(db.Text)
    PreferredGenres = db.Column(db.String(255))
    CreatedAt = db.Column(db.DateTime, default=datetime.utcnow)

    def get_id(self):
        return str(self.UserID)

class VinylRecord(db.Model):
    __tablename__ = 'vinylrecords'
    RecordID = db.Column(db.Integer, primary_key=True)
    Title = db.Column(db.String(255), nullable=False)
    Artist = db.Column(db.String(255), nullable=False)
    Genre = db.Column(db.String(100))
    ReleaseYear = db.Column(db.Integer)
    Condition = db.Column(db.String(50))
    Price = db.Column(db.Numeric(10, 2), nullable=False)
    Stock = db.Column(db.Integer, default=0)
    Format = db.Column(db.String(20), default='LP')
    Label = db.Column(db.String(100))
    CatalogNumber = db.Column(db.String(50))
    Description = db.Column(db.Text)
    CoverImageURL = db.Column(db.String(255))

# Authentication
@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Records API
@app.route('/api/records', methods=['GET'])
def get_records():
    try:
        # Get query parameters with defaults
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 12, type=int)
        
        # Build query
        query = VinylRecord.query
        
        # Apply filters if provided
        genre = request.args.get('genre')
        if genre:
            query = query.filter(VinylRecord.Genre == genre)
            
        condition = request.args.get('condition')
        if condition:
            query = query.filter(VinylRecord.Condition == condition)
            
        # Get total count before pagination
        total_records = query.count()
        
        # Apply pagination
        records = query.paginate(page=page, per_page=per_page, error_out=False)
        
        # Prepare response
        response = {
            'records': [{
                'RecordID': record.RecordID,
                'Title': record.Title,
                'Artist': record.Artist,
                'Genre': record.Genre,
                'ReleaseYear': record.ReleaseYear,
                'Price': float(record.Price),
                'Stock': record.Stock,
                'Condition': record.Condition,
                'Format': record.Format,
                'Label': record.Label,
                'CoverImageURL': record.CoverImageURL
            } for record in records.items],
            'pagination': {
                'total': total_records,
                'pages': records.pages,
                'current_page': records.page,
                'per_page': per_page,
                'has_next': records.has_next,
                'has_prev': records.has_prev
            }
        }
        
        return jsonify(response)
        
    except Exception as e:
        print(f"Error in /api/records: {str(e)}", file=sys.stderr)
        return jsonify({'error': str(e)}), 500

@app.route('/api/records/<int:id>', methods=['GET'])
def get_record(id):
    try:
        record = VinylRecord.query.get_or_404(id)
        
        return jsonify({
            'RecordID': record.RecordID,
            'Title': record.Title,
            'Artist': record.Artist,
            'Genre': record.Genre,
            'ReleaseYear': record.ReleaseYear,
            'Price': float(record.Price),
            'Stock': record.Stock,
            'Condition': record.Condition,
            'Format': record.Format,
            'Label': record.Label,
            'CoverImageURL': record.CoverImageURL,
            'Description': record.Description,
            'CatalogNumber': record.CatalogNumber
        })
        
    except Exception as e:
        print(f"Error in /api/records/{id}: {str(e)}", file=sys.stderr)
        return jsonify({'error': str(e)}), 500

# Authentication API
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if User.query.filter_by(Username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 400
        
    if User.query.filter_by(Email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 400
    
    user = User(
        Username=data['username'],
        Email=data['email'],
        PasswordHash=generate_password_hash(data['password']),
        FirstName=data.get('firstName'),
        LastName=data.get('lastName'),
        Address=data.get('address')
    )
    
    db.session.add(user)
    db.session.commit()
    
    return jsonify({'message': 'User registered successfully'}), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(Username=data['username']).first()
    
    if user and check_password_hash(user.PasswordHash, data['password']):
        login_user(user)
        return jsonify({
            'message': 'Logged in successfully',
            'user': {
                'id': user.UserID,
                'username': user.Username,
                'email': user.Email
            }
        })
    
    return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/api/auth/logout')
@login_required
def logout():
    logout_user()
    return jsonify({'message': 'Logged out successfully'})

@app.route('/api/test')
def test_api():
    return jsonify({
        'status': 'success',
        'message': 'API is working',
        'timestamp': datetime.utcnow().isoformat()
    })

# Serve frontend index.html for root and other routes
from flask import send_from_directory

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=8000)
