# Job Application Tracker

A complete, production-ready full-stack web application for job seekers to manage applications, track statuses, schedule interviews, and analyze their job search progress.

## 🌟 Features

- **User Authentication** — JWT-based registration, login, logout, token refresh
- **Job Applications CRUD** — Add, view, edit, delete applications with full model fields
- **Search & Filtering** — Search by company/title, filter by status/job type/employment
- **Interview Management** — Schedule, edit, cancel, and track interview rounds
- **Analytics Dashboard** — Real-time charts: pie, bar, line — powered by MySQL aggregations
- **User Profile** — Edit name/email, change password
- **Django Admin** — Full admin panel for all models
- **Swagger/OpenAPI Docs** — Auto-generated at `/api/docs/`
- **Responsive Design** — Mobile-friendly sidebar navigation

---

## 🛠 Technology Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3, Django 4.2, Django REST Framework |
| Auth | djangorestframework-simplejwt (JWT) |
| Database | MySQL 8+ |
| DB Driver | PyMySQL |
| ORM | Django ORM |
| API Docs | drf-spectacular (Swagger/OpenAPI) |
| Frontend | React 19, Vite 8 |
| Styling | Tailwind CSS 3 |
| Charts | Recharts |
| Icons | Lucide React |
| HTTP Client | Axios |
| Routing | React Router DOM |
| Notifications | React Hot Toast |

---

## 📁 Project Structure

```
job-application-tracker/
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env                    # (Never commit this)
│   ├── .env.example
│   ├── config/
│   │   ├── settings.py         # Django settings (MySQL, JWT, CORS)
│   │   ├── urls.py             # Root URL conf
│   │   ├── wsgi.py
│   │   └── asgi.py
│   ├── accounts/               # User auth app
│   │   ├── models.py           # Custom User model (AbstractUser)
│   │   ├── serializers.py      # Register, Login, Profile serializers
│   │   ├── views.py            # Register, Login, Logout, Profile, ChangePassword
│   │   ├── urls.py
│   │   ├── admin.py
│   │   └── tests.py
│   ├── applications/           # Job Application CRUD app
│   │   ├── models.py           # JobApplication model
│   │   ├── serializers.py
│   │   ├── views.py            # ModelViewSet with user-scoped queryset
│   │   ├── urls.py
│   │   ├── filters.py          # Django Filter config
│   │   ├── admin.py
│   │   └── tests.py
│   ├── interviews/             # Interview management app
│   │   ├── models.py           # Interview model (FK to JobApplication + User)
│   │   ├── serializers.py
│   │   ├── views.py            # ViewSet with upcoming/past actions
│   │   ├── urls.py
│   │   ├── admin.py
│   │   └── tests.py
│   └── analytics/              # Dashboard analytics app
│       ├── views.py            # Overview, Status, Monthly stats (ORM aggregations)
│       ├── urls.py
│       └── tests.py
│
└── frontend/
    ├── src/
    │   ├── App.jsx             # Root with BrowserRouter + auth guards
    │   ├── main.jsx
    │   ├── index.css           # Tailwind + custom design system
    │   ├── context/
    │   │   └── AuthContext.jsx # Global auth state (login/logout/register)
    │   ├── layouts/
    │   │   └── DashboardLayout.jsx  # Sidebar + mobile header
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Applications.jsx
    │   │   ├── AddApplication.jsx
    │   │   ├── EditApplication.jsx
    │   │   ├── ApplicationDetail.jsx
    │   │   ├── Interviews.jsx
    │   │   ├── Analytics.jsx
    │   │   └── Profile.jsx
    │   ├── components/
    │   │   ├── StatusBadge.jsx
    │   │   ├── LoadingSpinner.jsx
    │   │   └── ConfirmDialog.jsx
    │   ├── services/
    │   │   ├── api.js              # Axios instance + JWT interceptors
    │   │   ├── authService.js
    │   │   ├── applicationService.js
    │   │   ├── interviewService.js
    │   │   └── analyticsService.js
    │   └── utils/
    │       └── helpers.js
    ├── tailwind.config.js
    ├── postcss.config.js
    └── vite.config.js
```

---

## 🗃 Database Schema

### User (accounts_user)
| Field | Type | Notes |
|-------|------|-------|
| id | BigAutoField (PK) | |
| username | VARCHAR | Unique |
| email | VARCHAR | Unique |
| first_name | VARCHAR | |
| last_name | VARCHAR | |
| password | VARCHAR | Hashed (Django PBKDF2) |
| date_joined | DATETIME | Auto-set |

### JobApplication (applications_jobapplication)
| Field | Type | Notes |
|-------|------|-------|
| id | BigAutoField (PK) | |
| user_id | FK → User | CASCADE delete |
| job_title | VARCHAR(200) | |
| company_name | VARCHAR(200) | Indexed |
| company_website | VARCHAR(500) | Optional |
| description | TEXT | Optional |
| location | VARCHAR(200) | Optional |
| job_type | VARCHAR | remote/on_site/hybrid |
| employment_type | VARCHAR | full_time/part_time/internship/contract |
| salary_range | VARCHAR(100) | Optional |
| application_date | DATE | Indexed |
| deadline | DATE | Optional |
| status | VARCHAR | applied/shortlisted/interview_scheduled/... |
| job_url | VARCHAR(500) | Optional |
| notes | TEXT | Optional |
| created_at | DATETIME | Auto |
| updated_at | DATETIME | Auto |

### Interview (interviews_interview)
| Field | Type | Notes |
|-------|------|-------|
| id | BigAutoField (PK) | |
| user_id | FK → User | CASCADE delete |
| application_id | FK → JobApplication | CASCADE delete |
| round | VARCHAR(200) | e.g. "Technical Round 1" |
| interview_date | DATE | Indexed |
| interview_time | TIME | |
| interview_type | VARCHAR | technical/hr/managerial/assessment |
| interview_mode | VARCHAR | online/offline |
| meeting_link | VARCHAR(500) | Optional |
| location | VARCHAR(300) | Optional |
| notes | TEXT | Optional |
| status | VARCHAR | scheduled/completed/cancelled |
| created_at | DATETIME | Auto |

---

## ⚙️ Setup Instructions

### Prerequisites
- Python 3.10+
- MySQL 8+
- Node.js 18+
- npm 9+

### 1. MySQL Setup

```sql
-- Run this in MySQL Workbench or CLI:
CREATE DATABASE job_tracker_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
.\venv\Scripts\activate

# Activate (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Edit `backend/.env`:
```env
SECRET_KEY=your-long-random-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# MySQL Database
DB_NAME=job_tracker_db
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_HOST=localhost
DB_PORT=3306

# JWT Settings (minutes/days)
ACCESS_TOKEN_LIFETIME=60
REFRESH_TOKEN_LIFETIME=7

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

### 4. Run Migrations

```bash
cd backend

# Activate venv first, then:
python manage.py makemigrations accounts
python manage.py makemigrations applications
python manage.py makemigrations interviews
python manage.py migrate

# Create admin user
python manage.py createsuperuser
```

### 5. Start Backend Server

```bash
python manage.py runserver
```

Backend runs at: **http://localhost:8000**

### 6. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: **http://localhost:5173**

---

## 🔗 API Endpoints

### Authentication (`/api/auth/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register/` | Create account |
| POST | `/api/auth/login/` | Login (get JWT tokens) |
| POST | `/api/auth/token/refresh/` | Refresh access token |
| POST | `/api/auth/logout/` | Blacklist refresh token |
| GET/PATCH | `/api/auth/profile/` | View or update profile |
| POST | `/api/auth/change-password/` | Change password |

### Applications (`/api/applications/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/applications/` | List all (with search/filter/pagination) |
| POST | `/api/applications/` | Create application |
| GET | `/api/applications/{id}/` | Get single application |
| PUT | `/api/applications/{id}/` | Full update |
| PATCH | `/api/applications/{id}/` | Partial update |
| DELETE | `/api/applications/{id}/` | Delete |

**Query params:** `?search=`, `?status=`, `?job_type=`, `?employment_type=`, `?ordering=`, `?page=`

### Interviews (`/api/interviews/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/interviews/` | List all interviews |
| POST | `/api/interviews/` | Schedule interview |
| GET | `/api/interviews/{id}/` | Get single interview |
| PUT | `/api/interviews/{id}/` | Full update |
| PATCH | `/api/interviews/{id}/` | Partial update |
| DELETE | `/api/interviews/{id}/` | Delete |
| GET | `/api/interviews/upcoming/` | Future scheduled interviews |
| GET | `/api/interviews/past/` | Past interviews |

### Analytics (`/api/analytics/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/overview/` | Total counts (apps, interviews, offers, etc.) |
| GET | `/api/analytics/status/` | Applications grouped by status |
| GET | `/api/analytics/monthly/` | Monthly activity for last 12 months |

---

## 🔐 Authentication Flow

```
Register → Store JWT tokens → Set Authorization header → Access protected routes
                ↓ on 401
         Refresh access token → Retry request
                ↓ on refresh failure
              Logout → Redirect to /login
```

**Token storage:** localStorage (simple, documented trade-off vs httpOnly cookies)

---

## 🧪 Running Tests

```bash
cd backend
.\venv\Scripts\activate  # Windows

# Run all tests
python manage.py test

# Run specific app tests
python manage.py test accounts
python manage.py test applications
python manage.py test interviews
python manage.py test analytics
```

---

## 📊 Swagger Documentation

After starting the backend, visit:
- **Swagger UI:** http://localhost:8000/api/docs/
- **ReDoc:** http://localhost:8000/api/redoc/
- **Django Admin:** http://localhost:8000/admin/

---

## 🚀 Key Django Concepts (Interview Notes)

| Concept | Used Where |
|---------|-----------|
| Custom User Model (AbstractUser) | `accounts/models.py` |
| Django REST Framework ModelViewSet | `applications/views.py`, `interviews/views.py` |
| JWT Authentication (SimpleJWT) | `config/settings.py`, `accounts/views.py` |
| IsAuthenticated permission | All protected views |
| `get_queryset()` override | User-scoped data isolation |
| DRF Serializers + Validation | All serializers.py files |
| Django ORM aggregations (Count, Q, TruncMonth) | `analytics/views.py` |
| Custom `@action` decorators | `interviews/views.py` (upcoming, past) |
| Token blacklisting | `accounts/views.py` LogoutView |
| django-filter + SearchFilter | `applications/views.py`, `interviews/views.py` |
| PyMySQL as MySQLdb drop-in | `config/settings.py` |

---

## 🔮 Future Improvements

- Email notifications for upcoming interviews
- Resume upload (file attachment)
- Export to CSV/PDF
- Calendar view for interviews
- Company contact management
- Application pipeline Kanban board
- Docker containerization
- Redis caching for analytics
- Email verification on registration
- OAuth (Google/GitHub login)
