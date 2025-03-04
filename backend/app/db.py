import bson

from flask import current_app, g
from werkzeug.local import LocalProxy
from flask_pymongo import PyMongo
from pymongo.errors import DuplicateKeyError, OperationFailure
from bson.objectid import ObjectId
from bson.errors import InvalidId

def get_db():
  
    db = getattr(g, '_database', None)

    if db is None:
        db = g._database = PyMongo(current_app)

    return db

db = LocalProxy(get_db)

def create_user(data):
    try:
        db.users.insert_one(data)
    except DuplicateKeyError:
        return False
    return True

def get_products(page, per_page):
    return list(db.products.find().skip(page * per_page).limit(per_page))

def get_product(id):
    try:
        return db.products.find_one({"_id": ObjectId(id)})
    except InvalidId:
        return None

def create_customization_product(data):
    try:
        db.customization.insert_one(data)
    except OperationFailure:
        return False
    return True

def add_to_cart(data):
    try:
        db.cart.insert_one(data)
    except OperationFailure:
        return False
    return True

def get_cart(user_id):
    return list(db.cart.find({"user_id": user_id}))

def delete_cart_item(user_id, product_id):
    db.cart.delete_one({"user_id": user_id, "product_id": product_id})