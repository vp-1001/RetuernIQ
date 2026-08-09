# ReturnIQ

ReturnIQ is a full-stack returns intelligence application for managing return evidence, AI-based review support, merchant analytics, and verification workflows.

## Project Structure

- `backend/` - Python FastAPI backend with database models, API routes, services, and authentication.
- `frontend/` - TypeScript React + Vite frontend with Tailwind CSS and AI evidence workflows.
- `backend/uploads/` - Uploaded evidence storage.

## Getting Started

### Backend
1. Create and activate a Python virtual environment in `backend/`.
2. Install dependencies:
   ```powershell
   cd backend
   python -m pip install -r requirements.txt
   ```
3. Run the API server:
   ```powershell
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

### Frontend
1. Install dependencies:
   ```powershell
   cd frontend
   npm install
   ```
2. Run the development server:
   ```powershell
   npm run dev
   ```

## Features

- Evidence review management
- AI-powered evidence analysis and verification
- Merchant analytics and reporting
- User authentication and merchant settings

## Notes

- Keep `backend/.venv` out of source control.
- Configure environment variables and database settings in the backend before starting the API.
