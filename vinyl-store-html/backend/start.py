from app import app, db
from init_db import init_db

if __name__ == '__main__':
    with app.app_context():
        # Initialize database and add sample records
        init_db()
        
    # Start the server
    app.run(debug=True, port=8000)