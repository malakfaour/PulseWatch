from __future__ import annotations

import argparse
import getpass

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.user import User


def main() -> None:
    parser = argparse.ArgumentParser(description="Create a PulseWatch superuser")
    parser.add_argument("--email", required=True)
    parser.add_argument("--password")
    args = parser.parse_args()

    password = args.password or getpass.getpass("Password: ")
    db = SessionLocal()
    try:
        existing_user = db.query(User).filter(User.email == args.email).first()
        if existing_user:
            print("User already exists.")
            return

        user = User(email=args.email, password=hash_password(password))
        db.add(user)
        db.commit()
        print(f"Created user {args.email}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
