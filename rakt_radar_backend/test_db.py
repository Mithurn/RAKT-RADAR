import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from src.models import db, Hospital, BloodBank, BloodUnit, Transfer
from flask import Flask
from sqlalchemy import inspect

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///test.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

with app.app_context():
    db.create_all()
    print('Tables created successfully')
    inspector = inspect(db.engine)
    print('Tables:', inspector.get_table_names())

