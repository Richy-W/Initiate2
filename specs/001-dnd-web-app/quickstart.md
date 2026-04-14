# Quickstart Guide: D&D Character and Campaign Management Web Application

## Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 14+
- Git

## Quick Setup

### 1. Clone Repository
```bash
git clone https://github.com/yourorg/dnd-web-app.git
cd dnd-web-app
```

### 2. Backend Setup (Django)
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment variables
cp .env.example .env
# Edit .env with your database settings

# Run migrations
python manage.py migrate

# Load D&D content
python manage.py load_dnd_content data/

# Create superuser
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

### 3. Frontend Setup (React)
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

### 4. Access Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Admin interface: http://localhost:8000/admin

## Development Workflow

### Running Tests
```bash
# Backend tests
python manage.py test

# Frontend tests
cd frontend && npm test
```

### Database Migrations
```bash
# Create migration
python manage.py makemigrations

# Apply migration
python manage.py migrate
```

### API Documentation
- Swagger UI: http://localhost:8000/api/docs/
- ReDoc: http://localhost:8000/api/redoc/

## Key Features Overview

### Character Creation
1. Create account and log in
2. Click "Create Character"
3. Choose species, class, and background
4. Allocate ability scores
5. Select starting equipment

### Campaign Management
1. DM creates campaign with settings
2. Invite players via email or join code
3. Players assign characters to campaign
4. Begin sessions with initiative tracking

### Combat Tracking
1. DM initiates combat encounter
2. Roll initiative for all participants
3. Track HP, spell effects, and turns
4. Real-time updates for all players

## File Structure

```
backend/
├── config/              # Django settings
├── apps/
│   ├── characters/      # Character management
│   ├── campaigns/       # Campaign management
│   ├── combat/          # Initiative tracking
│   ├── content/         # D&D content and homebrew
│   └── users/          # User authentication
├── data/               # JSON data files
└── requirements.txt

frontend/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/         # Route components
│   ├── services/      # API interactions
│   ├── context/       # Global state management
│   └── utils/         # Helper functions
└── package.json
```

## Environment Configuration

### Backend (.env)
```
DEBUG=True
SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://user:pass@localhost:5432/dnd_db
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

### Frontend (.env)
```
REACT_APP_API_BASE_URL=http://localhost:8000/api
REACT_APP_WS_URL=ws://localhost:8000/ws
```

## Troubleshooting

### Common Issues

**Database Connection Error**
- Verify PostgreSQL is running
- Check database credentials in .env
- Ensure database exists

**Frontend Build Errors**
- Clear node_modules: `rm -rf node_modules && npm install`
- Check Node.js version compatibility
- Verify API URL in environment variables

**Authentication Issues**
- Check CORS settings in Django settings
- Verify JWT token configuration
- Ensure secure cookie settings for production

### Development Tools

**Django Extensions**
```bash
pip install django-extensions
python manage.py shell_plus  # Enhanced shell
python manage.py show_urls   # List all URLs
```

**React Developer Tools**
- Install browser extension for React DevTools
- Enable Redux DevTools for state debugging

## Next Steps

1. **Read the Architecture Guide**: Understand Django apps and React components structure
2. **API Reference**: Explore endpoint documentation at `/api/docs/`
3. **Contributing Guide**: Follow code standards and testing requirements
4. **Deployment Guide**: Setup production environment with Docker