from app import create_app
import os
import configparser
from dotenv import load_dotenv

load_dotenv()
config = configparser.ConfigParser()
config.read(os.path.abspath(os.path.join(".ini")))

if __name__ == "__main__":
    app = create_app()
    app.config['DEBUG'] = True
    app.config['MONGO_URI'] = config['PROD']['DB_URI']

    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))