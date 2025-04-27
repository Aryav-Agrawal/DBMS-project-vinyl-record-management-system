from app import app, db, VinylRecord
from datetime import datetime

def init_db():
    try:
        with app.app_context():
            # Create tables
            db.create_all()
            print("Tables created successfully!")
            # Sample record insertion disabled to avoid conflicts with MySQL database.sql data
            pass
    except Exception as e:
        print(f"Error initializing database: {e}")

if __name__ == '__main__':
    init_db()
