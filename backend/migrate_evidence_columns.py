import sqlite3
from pathlib import Path


DATABASE_PATH = Path(__file__).resolve().parent / "returniq.db"

NEW_COLUMNS = {
    "image_width": "INTEGER",
    "image_height": "INTEGER",
    "brightness_score": "REAL",
    "blur_score": "REAL",
    "dominant_red": "INTEGER",
    "dominant_green": "INTEGER",
    "dominant_blue": "INTEGER",
}


def migrate() -> None:
    if not DATABASE_PATH.exists():
        print(f"Database not found: {DATABASE_PATH}")
        return

    connection = sqlite3.connect(DATABASE_PATH)

    try:
        cursor = connection.cursor()

        cursor.execute("PRAGMA table_info(evidence)")
        existing_columns = {
            row[1]
            for row in cursor.fetchall()
        }

        for column_name, column_type in NEW_COLUMNS.items():
            if column_name in existing_columns:
                print(f"Already exists: {column_name}")
                continue

            cursor.execute(
                f"ALTER TABLE evidence "
                f"ADD COLUMN {column_name} {column_type}"
            )

            print(f"Added: {column_name}")

        connection.commit()
        print("Evidence table migration completed successfully.")

    except sqlite3.Error as error:
        connection.rollback()
        print(f"Migration failed: {error}")
        raise

    finally:
        connection.close()


if __name__ == "__main__":
    migrate()