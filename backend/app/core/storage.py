from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[2]

UPLOADS_DIR = BASE_DIR / "uploads"
EVIDENCE_DIR = UPLOADS_DIR / "evidence"


def create_storage_directories() -> None:
    UPLOADS_DIR.mkdir(exist_ok=True)
    EVIDENCE_DIR.mkdir(exist_ok=True)