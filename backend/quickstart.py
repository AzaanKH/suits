from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

uri = os.environ.get('MONGO_CONNECTION_STRING')

client = MongoClient(uri)
try:
  database = client.get_database('userdb')
  users = database.get_collection('users')
  # print(client.list_database_names())
  # print("Collections in database:", database.list_collection_names())
  query = users.find_one({"user_id": "user_001"})
  print('Query result: ', query)
  client.close()
  # database = client.get_database('storedb')
  # products = database.get_collection('products')
    
  # # This query sorts the products by "averageRating" descending (-1)
  # # and then limits the result to the top 20 products.
  # top_20_products = products.find().sort("averageRating", -1).limit(20)
    
  # print("Top 20 Products:")
  # for product in top_20_products:
  #     print(product)
except Exception as e:
  raise Exception("Unable to find the document due to the following error: ", e)

