from dotenv import load_dotenv
import os
from werkzeug.security import check_password_hash

load_dotenv()

USERNAME = os.getenv("ADMIN_USERNAME", "").strip()
PASSWORD_HASH = os.getenv("ADMIN_PASSWORD_HASH", "").strip()

print(f"USERNAME from .env: '{USERNAME}'")
print(f"PASSWORD_HASH from .env: '{PASSWORD_HASH}'")

test_username = "skip"
test_password = "password"

print("Username match:", USERNAME == test_username)
print("Password hash check:", check_password_hash(PASSWORD_HASH, test_password))
