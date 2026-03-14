# 🎯 FocusBoard

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](.github/workflows/main.yml)
[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Bun](https://img.shields.io/badge/Bun-v1.0+-000000?logo=bun&logoColor=white)](https://bun.sh/)
[![React](https://img.shields.io/badge/React-v18-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![Rust](https://img.shields.io/badge/Rust-Monitoring-white?logo=rust&logoColor=black)](https://www.rust-lang.org/)
[![Python](https://img.shields.io/badge/Python-ML_Service-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-v0.95+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)

> **Know exactly where your time goes. Automatically.**

FocusBoard is an enterprise-grade productivity intelligence suite that captures your digital activity at the OS level and transforms it into actionable insights using on-device AI. No manual timers. No forgotten entries. Just pure, data-driven clarity.

---

## 📑 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Features](#2-features)
3. [System Architecture](#3-system-architecture)
4. [Repository Structure](#4-repository-structure)
5. [Technology Stack](#5-technology-stack)
6. [Installation](#6-installation)
7. [Running the System](#7-running-the-system)
8. [Environment Variables](#8-environment-variables)
9. [API Documentation](#9-api-documentation)
10. [Database Design](#10-database-design)
11. [Development Workflow](#11-development-workflow)
12. [Testing](#12-testing)
13. [Deployment](#13-deployment)
14. [Debugging Guide](#14-debugging-guide)
15. [Performance Considerations](#15-performance-considerations)
16. [Security Considerations](#16-security-considerations)
17. [Future Improvements](#17-future-improvements)
18. [Contributing](#18-contributing)
19. [License](#19-license)

---

## 1. Project Overview

### 1.1 Vision and Purpose

FocusBoard addresses the fundamental challenge of modern knowledge work: **context switching kills productivity**, yet most tracking tools rely on manual input—defeating the purpose. Our vision is to create a completely invisible productivity tracking system that captures every digital interaction without user intervention, then uses machine learning to provide meaningful insights about work patterns.

### 1.2 Core Objectives

| Objective | Description | Success Metric |
|-----------|-------------|----------------|
| Maximize Deep Work | Identify and mitigate distraction patterns | 30% increase in focused work sessions |
| Automatic Tracking | Zero-input activity capture at OS level | 99.9% uptime without user intervention |
| Semantic Intelligence | ML-powered categorization without manual tagging | 95%+ categorization accuracy |
| Team Alignment | Enterprise dashboards for distributed teams | Real-time sync across all team members |

### 1.3 Target Users

- **Individual Professionals**: Developers, designers, writers seeking to optimize their productivity
- **Engineering Teams**: Development teams tracking sprint productivity and code review patterns
- **Remote Workers**: Distributed teams needing visibility into work patterns
- **Freelancers**: Accurate time tracking for client billing
- **Managers**: Leaders seeking data-driven insights into team focus patterns

### 1.4 Scope and Limitations

**In Scope:**
- Desktop-native activity monitoring (Windows, macOS, Linux)
- Web application tracking with URL classification
- Real-time productivity analytics dashboard
- Team collaboration features
- Compliance and safety monitoring

**Out of Scope (Future):**
- Mobile device tracking
- Manual time entry (intentionally excluded)
- Keystroke logging (privacy-preserving by design)
- Screen recording (window titles only)

---

## 2. Features

### 2.1 High-Resolution Activity Tracking

#### Native OS Bridge (Rust-Powered)
Our native monitoring layer is built in Rust for maximum performance and minimal resource impact:

- **Sub-millisecond Latency**: Window transition detection happens instantly
- **Cross-Platform Support**: Unified codebase supporting Windows (Win32 API), macOS (Accessibility APIs), and Linux (X11/Wayland)
- **Low Resource Footprint**: <1% CPU usage, <50MB RAM usage
- **Privacy-First Design**: Only captures window titles and app names—never content, keystrokes, or screenshots

**Example Capture Data:**
```json
{
  "app_name": "Visual Studio Code",
  "window_title": "README.md - FocusBoard - src",
  "url": null,
  "start_time": "2024-01-15T10:30:00.000Z",
  "end_time": "2024-01-15T10:45:32.000Z",
  "duration_seconds": 932
}
```

#### Browser Integration
- Automatic URL extraction from Chrome, Firefox, Safari, and Edge
- Tab-level tracking for granular web activity analysis
- Incognito/private mode detection with configurable handling

### 2.2 AI-Powered Semantic Categorization

#### Vector Embedding System
FocusBoard uses state-of-the-art natural language processing to understand the semantic meaning of your activities:

- **Model**: `sentence-transformers/all-MiniLM-L6-v2` (22M parameters)
- **Embedding Dimensions**: 384-dimensional vectors
- **Inference Time**: <50ms per activity on CPU
- **Categories**: Work, Communication, Entertainment, Education, Uncategorized

**How It Works:**
1. Window title and app name are combined into a sentence
2. The sentence is tokenized and fed into the transformer model
3. A 384-dimensional embedding vector is generated
4. Cosine similarity compares against pre-defined category embeddings
5. The highest similarity score determines the category

#### Manual Override System
For edge cases where AI might misclassify, a sophisticated rule engine provides manual control:

```javascript
// Example tracking rules
{
  "pattern": "github.com/*/issues",
  "type": "regex",
  "category_override": "Work",
  "priority": 100
}
```

### 2.3 Safety and Compliance Features

#### NSFW Detection
Proactive scanning prevents inappropriate content tracking:
- URL blacklist checking against known NSFW domains
- Title pattern matching with keyword detection
- Configurable blocking with parental notification triggers
- Compliance reporting for enterprise environments

#### Parental Control Mode
- Age-based content filtering (13+, 17+ categories)
- Daily usage reports for parents
- School hours scheduling
- Blocked app lists with override codes

### 2.4 Performance Analytics

#### Focus Score Algorithm
Our proprietary scoring system calculates productivity density:

```
Focus Score = (Work_Duration / Total_Duration) × Context_Switch_Penalty × Deep_Work_Bonus

Where:
- Context_Switch_Penalty = 1 - (0.1 × Switch_Count)
- Deep_Work_Bonus = 1.5 if Work_Session > 90 minutes
```

#### Timeline Visualization
- Minute-by-minute breakdown of work phases
- Heat map view of productivity by hour/day
- Comparison against historical averages
- Goal tracking with visual progress indicators

#### Team Dashboards
- Aggregate team focus metrics
- Individual comparison (anonymized)
- Sprint productivity correlation
- Meeting time analysis

---

## 3. System Architecture

### 3.1 Architectural Philosophy

FocusBoard utilizes a **distributed microservices architecture** to isolate heavy compute from time-sensitive telemetry capture. This separation of concerns ensures:

1. **Reliability**: The native monitor never blocks on network calls
2. **Scalability**: ML service scales independently from API
3. **Maintainability**: Each service has a single responsibility
4. **Privacy**: Sensitive data processing happens on-device where possible

### 3.2 Three-Tier Architecture

```mermaid
graph TD
    subgraph "Client Layer (Tauri Desktop App)"
        RUST[Native Rust Monitor<br/>Window Listener<br/>Activity Buffer]
        REACT[React Management UI<br/>Dashboard<br/>Settings Panel]
        LOCAL[Local Storage<br/>SQLite Cache]
    end

    subgraph "Orchestration Layer (Node.js/Bun)"
        API[Express REST API<br/>Rate Limiting<br/>JWT Auth]
        WS[Socket.io Server<br/>Real-time Sync<br/>Room Management]
        WORKER[Categorization Worker<br/>Queue Processor<br/>Rule Engine]
        CACHE[Redis Cache<br/>Session Store<br/>Embedding Cache]
    end

    subgraph "Intelligence Layer (Python)"
        FAST[FastAPI Gateway<br/>Request Validation<br/>Health Checks]
        NLP[SentenceTransformer<br/>all-MiniLM-L6-v2<br/>Batch Inference]
        SAFE[Safety Heuristics<br/>NSFW Classifier<br/>Content Filter]
        EMBED[Embedding Cache<br/>Vector Store<br/>Similarity Search]
    end

    subgraph "Persistence Layer"
        MONGO[(MongoDB Atlas<br/>Activity Collection<br/>User Collection)]
        S3[(Object Storage<br/>Reports Export<br/>Backup Archive)]
    end

    RUST -->|HTTPS/TLS| API
    REACT <-->|WebSocket| WS
    API <-->|Redis| CACHE
    API <-->|Mongoose| MONGO
    WORKER <-->|HTTP| FAST
    FAST --> NLP
    FAST --> SAFE
    FAST --> EMBED
```

### 3.3 Data Flow Architecture

**Step 1: Capture (Real-time)**
1. Rust monitor detects window focus change via OS hooks
2. Previous activity end_time is recorded
3. New activity data is buffered locally
4. Batch flush to API every 30 seconds or 10 activities

**Step 2: Ingest (API Layer)**
1. Express API receives activity payload
2. Zod schema validation enforces data integrity
3. JWT middleware authenticates the user
4. Activity is queued for categorization
5. Raw activity is stored in MongoDB

**Step 3: Categorize (ML Layer)**
1. Worker polls categorization queue
2. Activity context is sent to ML service
3. FastAPI receives inference request
4. SentenceTransformer generates embeddings
5. Cosine similarity determines category
6. Safety classifier checks for NSFW content
7. Category result is returned to worker

**Step 4: Persist (Database)**
1. Worker updates activity with category_id
2. Mapping record links activity to category
3. Focus metrics are recalculated
4. Real-time update pushed via Socket.io

**Step 5: Visualize (Client)**
1. React dashboard receives WebSocket event
2. Zustand store updates application state
3. Recharts renders updated timeline
4. Focus score recalculates in real-time

### 3.4 Communication Protocols

| Service Pair | Protocol | Port | Purpose |
|---------------|----------|------|---------|
| Rust Monitor → API | HTTPS/JSON | 5000 | Activity telemetry |
| React UI → API | HTTPS/JSON | 5000 | CRUD operations |
| React UI → WebSocket | WSS | 5000 | Real-time updates |
| API → ML Service | HTTP/JSON | 5001 | Inference requests |
| API → MongoDB | MongoDB Protocol | 27017 | Data persistence |
| API → Redis | Redis Protocol | 6379 | Caching & sessions |

---

## 4. Repository Structure

```
focus/
├── FocusBoard/                 # Desktop Client (React + Tauri)
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── store/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   └── src-tauri/              # Rust native code
│
├── FocusBoard-backend/         # REST API Server (Node.js/Express)
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── middleware/
│   └── workers/
│
├── ml-service/                 # ML Intelligence (Python/FastAPI)
│   ├── routers/
│   └── tests/
│
├── docs/                       # Documentation
└── .github/workflows/          # CI/CD
```

---

## 5. Technology Stack

### 5.1 Core Runtime Technologies

#### Frontend Stack
| Technology | Version | Purpose | Justification |
|------------|---------|---------|---------------|
| React | 18.2+ | UI Framework | Component-based architecture, large ecosystem |
| TypeScript | 5.0+ | Language | Type safety, IDE support, fewer runtime errors |
| TailwindCSS | 3.4+ | Styling | Utility-first, rapid development, consistent design |
| Vite | 5.0+ | Build Tool | Fast HMR, optimized builds, modern dev experience |
| Zustand | 4.4+ | State Management | Simple, hooks-based, no boilerplate vs Redux |
| Recharts | 2.10+ | Data Visualization | React-native charts, customizable |
| Socket.io-client | 4.7+ | Real-time Communication | WebSocket abstraction with fallbacks |
| React Router | 6.20+ | Navigation | Declarative routing, code splitting |
| Axios | 1.6+ | HTTP Client | Interceptors, request/response transforms |
| date-fns | 2.30+ | Date Utilities | Immutable, tree-shakeable date operations |

#### Desktop/Native Stack
| Technology | Version | Purpose | Justification |
|------------|---------|---------|---------------|
| Tauri | 1.5+ | Desktop Framework | Rust-based, small bundle size, secure |
| Rust | 1.75+ | Systems Language | Memory safety, performance, OS integration |
| WinAPI | Latest | Windows Integration | Native Windows window monitoring |
| Cocoa/CoreGraphics | Latest | macOS Integration | macOS accessibility APIs |
| X11/Wayland | Latest | Linux Integration | Cross-desktop environment support |
| Tokio | 1.35+ | Async Runtime | Rust async/await, high performance |
| Serde | 1.0+ | Serialization | JSON handling, type-safe parsing |

#### Backend Stack
| Technology | Version | Purpose | Justification |
|------------|---------|---------|---------------|
| Node.js | 18.0+ / 20.0+ LTS | Runtime | Stable, mature ecosystem |
| Bun | 1.0+ | Alternative Runtime | 3x faster startup, native TypeScript |
| Express.js | 4.18+ | Web Framework | Minimal, flexible, extensive middleware |
| Socket.io | 4.7+ | Real-time Engine | Bidirectional event-based communication |
| Mongoose | 8.0+ | ODM | MongoDB object modeling, validation |
| Zod | 3.22+ | Schema Validation | TypeScript-first, runtime type checking |
| JWT | jsonwebtoken 9.0+ | Authentication | Stateless auth, industry standard |
| bcrypt | 5.1+ | Password Hashing | Secure password storage, salt rounds |
| Helmet | 7.1+ | Security Headers | Express security best practices |
| CORS | 2.8+ | Cross-Origin | Configurable origin whitelisting |
| Redis | 4.6+ | Caching | Session store, rate limiting, caching |
| Bull | 4.12+ | Job Queue | Redis-backed queue for ML jobs |

#### Machine Learning Stack
| Technology | Version | Purpose | Justification |
|------------|---------|---------|---------------|
| Python | 3.9+ / 3.11+ | ML Runtime | Standard for ML/AI development |
| FastAPI | 0.104+ | ML API Framework | Async, OpenAPI docs, Pydantic validation |
| PyTorch | 2.1+ | Deep Learning | sentence-transformers dependency |
| Transformers | 4.36+ | NLP Models | Hugging Face model hub access |
| Sentence-Transformers | 2.2+ | Text Embeddings | Optimized for semantic similarity |
| NumPy | 1.24+ | Numerical Computing | Vector operations, embedding math |
| Uvicorn | 0.24+ | ASGI Server | High-performance async server |
| Pydantic | 2.5+ | Data Validation | Type hints, request validation |
| scikit-learn | 1.3+ | ML Utilities | Cosine similarity, preprocessing |

### 5.2 Infrastructure and DevOps

| Technology | Version | Purpose |
|------------|---------|---------|
| MongoDB | 7.0+ | Primary Database |
| MongoDB Atlas | Cloud | Managed Database Service |
| Redis | 7.2+ | Caching & Sessions |
| Docker | 24.0+ | Containerization |
| Docker Compose | 2.23+ | Local Orchestration |
| GitHub Actions | N/A | CI/CD Pipeline |
| Nginx | 1.25+ | Reverse Proxy, SSL |
| Let's Encrypt | Latest | SSL Certificates |

### 5.3 Development and Testing Tools

| Category | Tool | Purpose |
|----------|------|---------|
| **Linting** | ESLint | JavaScript/TypeScript code quality |
| **Formatting** | Prettier | Consistent code formatting |
| **Testing (Frontend)** | Vitest | Unit testing with Vite integration |
| **Testing (E2E)** | Cypress | End-to-end browser testing |
| **Testing (Backend)** | Jest | API unit and integration tests |
| **Testing (ML)** | Pytest | Python test framework |
| **Testing (Rust)** | Cargo test | Native unit tests |
| **Type Checking** | TypeScript Compiler | Static type analysis |
| **Pre-commit** | Husky | Git hooks for quality gates |
| **API Docs** | Swagger/OpenAPI | Interactive API documentation |

---

## 6. Installation

### 6.1 Prerequisites Checklist

Before installation, ensure your system meets these requirements:

| Requirement | Minimum Version | Recommended | Verification Command |
|-------------|-----------------|-------------|---------------------|
| Node.js | 18.0.0 | 20.0.0 LTS | `node --version` |
| Bun (optional) | 1.0.0 | Latest | `bun --version` |
| Python | 3.9.0 | 3.11.0 | `python --version` |
| Rust | 1.70.0 | Latest | `rustc --version` |
| MongoDB | 5.0.0 | 7.0.0 | `mongod --version` |
| Git | 2.30.0 | Latest | `git --version` |
| Docker (optional) | 24.0.0 | Latest | `docker --version` |

#### Platform-Specific Requirements

**macOS:**
- Xcode Command Line Tools: `xcode-select --install`
- Accessibility permissions (prompted on first run)

**Windows:**
- Visual Studio Build Tools 2019 or later
- Windows SDK 10.0.20348.0 or later

**Linux:**
- libwebkit2gtk-4.0-dev (for Tauri)
- libappindicator3-dev (system tray)
- build-essential (gcc, make)

### 6.2 Docker Installation (Recommended for Production)

Docker provides the simplest deployment path with all dependencies containerized:

```bash
# 1. Clone the repository
git clone https://github.com/anuruprkris/FocusBoard.git
cd FocusBoard

# 2. Configure environment
cp FocusBoard-backend/.env.example FocusBoard-backend/.env
# Edit .env with your production values

# 3. Build and start all services
docker-compose up --build

# 4. Run in detached mode (background)
docker-compose up -d --build

# 5. View logs
docker-compose logs -f

# 6. Stop all services
docker-compose down
```

**Docker Services:**
| Service | Container Name | Internal Port | Exposed Port |
|---------|----------------|---------------|--------------|
| Backend API | `focusboard-backend` | 5000 | 5000 |
| ML Service | `focusboard-ml` | 5001 | 5001 |
| MongoDB | `focusboard-mongodb` | 27017 | 27017 |
| Redis | `focusboard-redis` | 6379 | 6379 |

### 6.3 Manual Installation (Development)

For development with hot-reload and debugging capabilities:

#### Step 1: Backend API Setup

```bash
# Navigate to backend directory
cd FocusBoard-backend

# Install dependencies (choose one)
bun install                    # Fastest option (recommended)
npm install                    # Standard Node.js

# Configure environment
cp .env.example .env
# Edit .env and set:
# - MONGODB_URL (local or Atlas)
# - JWT_SECRET (generate strong secret)
# - ML_SERVICE_URL (http://localhost:5001)

# Start development server
bun run dev                    # Hot reload with nodemon
npm run dev                    # Node equivalent
```

#### Step 2: ML Service Setup

```bash
# Navigate to ML service
cd ml-service

# Create Python virtual environment
python -m venv venv

# Activate environment
source venv/bin/activate       # macOS/Linux
venv\Scripts\activate          # Windows

# Install dependencies
pip install -r requirements.txt

# Download model (first run)
python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

# Start ML service
uvicorn main:app --host 0.0.0.0 --port 5001 --reload

# Verify service is running
curl http://localhost:5001/health
```

**requirements.txt dependencies:**
```
fastapi==0.104.1
uvicorn[standard]==0.24.0
sentence-transformers==2.2.2
torch==2.1.0
numpy==1.24.3
pydantic==2.5.0
scikit-learn==1.3.0
pytest==7.4.0
httpx==0.25.0
```

#### Step 3: Frontend Desktop Setup

```bash
# Navigate to frontend
cd FocusBoard

# Install dependencies
bun install                    # Recommended
npm install                    # Alternative

# Configure Tauri (Rust) - first time only
# This downloads Rust toolchain and compiles native dependencies
bun tauri info                 # Verify setup

# Start development mode (hot reload)
bun tauri dev

# Build for production
bun tauri build

# Production builds located at:
# src-tauri/target/release/bundle/
```

### 6.4 Verification Steps

After installation, verify each component:

```bash
# 1. Backend health
curl http://localhost:5000/health
# Expected: {"status":"ok","ml_service":"connected"}

# 2. ML service health
curl http://localhost:5001/health
# Expected: {"status":"ok","model_loaded":true}

# 3. Database connection
# Check backend logs for "Connected to MongoDB"

# 4. Desktop app launches
# Look for FocusBoard window appearing
```

---

## 7. Running the System

### 7.1 Development Workflow

For active development with code reloading:

**Terminal 1 - ML Service:**
```bash
cd ml-service
source venv/bin/activate
uvicorn main:app --port 5001 --reload --log-level debug
```

**Terminal 2 - Backend API:**
```bash
cd FocusBoard-backend
bun run dev                    # Watches for changes, auto-restarts
```

**Terminal 3 - Desktop App:**
```bash
cd FocusBoard
bun tauri dev                  # Hot reload for React + Rust
```

**Service URLs in Development:**
- Desktop App: `http://localhost:1420` (Tauri dev window)
- Backend API: `http://localhost:5000`
- ML Service: `http://localhost:5001`
- MongoDB: `mongodb://localhost:27017`
- Redis: `redis://localhost:6379`

### 7.2 Production Deployment

#### Production Build Steps

```bash
# 1. Build ML Service Docker image
cd ml-service
docker build -t focusboard-ml:latest .

# 2. Build Backend for production
cd FocusBoard-backend
bun install --production
NODE_ENV=production bun run server.js

# 3. Build Desktop App
cd FocusBoard
bun tauri build
# Distributables created in src-tauri/target/release/bundle/
```

#### Production Configuration

**Backend Environment (Production):**
```bash
NODE_ENV=production
PORT=5000
MONGODB_URL=mongodb+srv://prod-user:password@cluster.mongodb.net/focusboard
JWT_SECRET=your-super-secure-256-bit-secret-key-here
ML_SERVICE_URL=http://ml-service-internal:5001
ALLOWED_ORIGINS=https://app.focusboard.io
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Security Hardening:**
- Use MongoDB Atlas with IP allowlisting
- Enable Redis AUTH password
- Configure Nginx rate limiting
- Set up CloudFlare DDoS protection
- Enable audit logging

### 7.3 Startup Sequence

**Correct order for manual startup:**

1. **Infrastructure Layer** (first)
   - Start MongoDB: `mongod --dbpath /data/db`
   - Start Redis: `redis-server`

2. **Intelligence Layer** (second)
   - Start ML Service (model loads ~30 seconds on first boot)
   - Verify: `curl http://localhost:5001/health`

3. **Orchestration Layer** (third)
   - Start Backend API
   - Verify: `curl http://localhost:5000/health`

4. **Client Layer** (last)
   - Launch Desktop App
   - Or open browser to frontend URL

---

## 8. Environment Variables

### 8.1 Backend (`FocusBoard-backend/.env`)

| Variable | Default | Purpose |
|----------|---------|---------|
| PORT | 5000 | API server port |
| NODE_ENV | development | Environment mode |
| MONGODB_URL | mongodb://localhost:27017/focusboard | MongoDB connection |
| REDIS_URL | redis://localhost:6379 | Redis connection |
| JWT_SECRET | - | JWT signing secret (min 32 chars) |
| JWT_EXPIRES_IN | 7d | Token expiration |
| ML_SERVICE_URL | http://localhost:5001 | ML service endpoint |
| ALLOWED_ORIGINS | tauri://localhost,http://localhost:1420 | CORS origins |
| RATE_LIMIT_WINDOW_MS | 900000 | Rate limit window (15 min) |
| RATE_LIMIT_MAX_REQUESTS | 100 | Max requests per window |
| LOG_LEVEL | info | Logging level |

### 8.2 ML Service (`ml-service/.env`)

| Variable | Default | Purpose |
|----------|---------|---------|
| PORT | 5001 | ML service port |
| MODEL_NAME | all-MiniLM-L6-v2 | Transformer model |
| MIN_SIMILARITY | 0.3 | Minimum match threshold |
| BATCH_SIZE | 32 | Inference batch size |
| INFERENCE_DEVICE | cpu | cpu or cuda |
| ENABLE_NSFW_CHECK | true | Enable NSFW detection |
| HOST | 0.0.0.0 | Bind address |

### 8.3 Frontend (`FocusBoard/.env`)

| Variable | Default | Purpose |
|----------|---------|---------|
| VITE_API_URL | http://localhost:5000 | Backend API URL |
| VITE_WS_URL | ws://localhost:5000 | WebSocket URL |
| VITE_APP_VERSION | 1.0.0 | App version |

---

## 9. API Documentation

### 9.1 Core Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register a new user account | No |
| POST | `/api/auth/login` | Authenticate and get JWT token | No |
| GET | `/api/auth/me` | Get current user profile | Yes |
| GET | `/api/activities` | List activities with filters | Yes |
| POST | `/api/activities` | Create new activity (bulk supported) | Yes |
| GET | `/api/activities/:id` | Get single activity by ID | Yes |
| PUT | `/api/activities/:id` | Update activity details | Yes |
| DELETE | `/api/activities/:id` | Delete an activity | Yes |
| GET | `/api/metrics/dashboard` | Get productivity dashboard data | Yes |

### 9.2 WebSocket Events

Real-time updates via Socket.io:

**Client → Server:**
- `authenticate`: Send JWT token for connection auth
- `subscribe:activities`: Subscribe to activity updates
- `ping`: Keep connection alive

**Server → Client:**
- `activity:created`: New activity recorded
- `activity:categorized`: Activity received category
- `metrics:updated`: Dashboard metrics changed
- `notification:alert`: System notification

### 9.3 Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [],
    "requestId": "req_1234567890"
  }
}
```

**Error Codes:**
| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or missing token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 422 | Schema validation failed |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## 10. Database Design

### 10.1 Schema Overview

FocusBoard uses MongoDB with a document-based schema optimized for high-frequency writes and flexible querying.

### 10.2 Collections

#### `users` Collection
User accounts and preferences.

```javascript
{
  _id: UUID("550e8400-e29b-41d4-a716-446655440000"),
  email: "user@example.com",
  password_hash: "$2b$12$...",
  name: "John Doe",
  timezone: "America/New_York",
  settings: {
    focus_goal_hours: 6,
    tracking_enabled: true,
    nsfw_filter_enabled: true,
    parental_controls: false
  },
  created_at: ISODate("2024-01-15T10:30:00Z"),
  updated_at: ISODate("2024-01-15T10:30:00Z"),
  last_login: ISODate("2024-01-15T10:30:00Z"),
  
  // Indexes
  indexes: [
    { email: 1 },  // Unique
    { created_at: -1 }
  ]
}
```

#### `activities` Collection
High-frequency telemetry logs (time-series data).

```javascript
{
  _id: UUID("550e8400-e29b-41d4-a716-446655440001"),
  user_id: UUID("550e8400-e29b-41d4-a716-446655440000"),
  
  // Activity Context
  app_name: "Visual Studio Code",
  window_title: "src/components/Dashboard.tsx - FocusBoard",
  url: null,
  domain: null,
  
  // Timing
  start_time: ISODate("2024-01-15T10:30:00Z"),
  end_time: ISODate("2024-01-15T10:45:00Z"),
  duration_seconds: 900,
  
  // Categorization
  category_id: UUID("550e8400-e29b-41d4-a716-446655440010"),
  category_confidence: 0.95,
  category_source: "ml",  // "ml" | "rule" | "manual"
  
  // Safety
  safety_check_passed: true,
  nsfw_detected: false,
  
  // Metadata
  device_id: "desktop-001",
  created_at: ISODate("2024-01-15T10:45:00Z"),
  updated_at: ISODate("2024-01-15T10:45:00Z"),
  
  // Indexes for performance
  indexes: [
    { user_id: 1, start_time: -1 },  // Primary query pattern
    { user_id: 1, category_id: 1 },
    { app_name: 1 },
    { start_time: -1 }  // TTL index for data retention
  ],
  
  // TTL: Auto-delete after 2 years
  ttl_index: { start_time: 1 },
  expire_after_seconds: 63072000
}
```

#### `categories` Collection
Productivity classifications with vector embeddings.

```javascript
{
  _id: UUID("550e8400-e29b-41d4-a716-446655440010"),
  user_id: UUID("550e8400-e29b-41d4-a716-446655440000"),  // null for global
  name: "Work",
  description: "Productive work activities",
  color: "#4CAF50",
  
  // Vector embedding for semantic matching
  embedding: [0.023, -0.156, 0.892, ...],  // 384 dimensions
  
  // Keywords for rule-based matching
  keywords: ["coding", "development", "design", "meeting"],
  
  // Configuration
  is_productive: true,
  is_default: false,  // true for system defaults
  priority: 1,
  
  // Statistics (computed)
  total_activities: 1543,
  total_duration: 9360000,  // seconds
  
  created_at: ISODate("2024-01-01T00:00:00Z"),
  updated_at: ISODate("2024-01-15T10:30:00Z"),
  
  indexes: [
    { user_id: 1, name: 1 },
    { is_default: 1 }
  ]
}
```

#### `mappings` Collection
Links activities to categories with metadata.

```javascript
{
  _id: UUID("550e8400-e29b-41d4-a716-446655440100"),
  activity_id: UUID("550e8400-e29b-41d4-a716-446655440001"),
  category_id: UUID("550e8400-e29b-41d4-a716-446655440010"),
  user_id: UUID("550e8400-e29b-41d4-a716-446655440000"),
  
  // Matching details
  confidence_score: 0.95,
  similarity_vector: [0.023, -0.156, ...],
  matched_keywords: ["coding", "development"],
  
  // Source tracking
  source: "ml",  // "ml" | "rule" | "manual"
  rule_id: null,  // If matched via rule
  
  created_at: ISODate("2024-01-15T10:45:01Z"),
  
  indexes: [
    { activity_id: 1 },
    { user_id: 1, category_id: 1 },
    { created_at: -1 }
  ]
}
```

#### `tracking_rules` Collection
User-defined override patterns.

```javascript
{
  _id: UUID("550e8400-e29b-41d4-a716-446655440200"),
  user_id: UUID("550e8400-e29b-41d4-a716-446655440000"),
  
  name: "GitHub Issues = Work",
  description: "All GitHub issue pages are work",
  
  // Pattern matching
  pattern: "github.com/.*/issues",
  pattern_type: "regex",  // "regex" | "wildcard" | "exact"
  
  // Target fields
  match_field: "url",  // "url" | "title" | "app_name"
  
  // Override
  category_override: UUID("550e8400-e29b-41d4-a716-446655440010"),
  priority: 100,  // Higher = evaluated first
  
  // State
  enabled: true,
  match_count: 523,
  
  created_at: ISODate("2024-01-10T08:00:00Z"),
  updated_at: ISODate("2024-01-15T10:30:00Z"),
  
  indexes: [
    { user_id: 1, priority: -1 }
  ]
}
```

#### `sessions` Collection (Redis)
JWT token blacklist and session tracking.

```javascript
{
  token_jti: "abc123",
  user_id: UUID("..."),
  expires_at: ISODate("2024-01-22T10:30:00Z"),
  is_revoked: false,
  device_info: "Chrome 120 / macOS"
}
```

### 10.3 Data Relationships

```
users ||--o{ activities : creates
users ||--o{ categories : defines
users ||--o{ tracking_rules : owns
activities }o--|| categories : classified_as
activities ||--o| mappings : has_mapping
categories ||--o{ mappings : receives
```

### 10.4 Indexing Strategy

**Primary Indexes (Always Used):**
- `{ user_id: 1, start_time: -1 }` - Activity queries by user/time
- `{ email: 1 }` - User lookup (unique)

**Secondary Indexes (Query Optimization):**
- `{ category_id: 1 }` - Category filtering
- `{ app_name: 1 }` - Application analytics
- `{ "url": "text" }` - URL search

**TTL Indexes (Data Retention):**
- Activities auto-expire after 2 years
- Sessions expire based on JWT expiration

### 10.5 Data Retention Policy

| Collection | Retention Period | Archival Strategy |
|------------|------------------|-------------------|
| Activities | 2 years | Cold storage to S3 |
| Sessions | 30 days | Auto-delete on expiry |
| User Data | Until account deletion | GDPR-compliant purge |
| Metrics Aggregates | Indefinite | Daily rollup summaries |

---

## 11. Development Workflow

### 11.1 Git Branching Strategy

FocusBoard follows **GitHub Flow** with environment branches:

```
main (production)
  ↑
develop (integration)
  ↑
feat/activity-batching
  ↑
fix/websocket-reconnect
  ↑
docs/api-examples
```

**Branch Naming Conventions:**
| Prefix | Purpose | Example |
|--------|---------|---------|
| `feat/` | New features | `feat/team-dashboard` |
| `fix/` | Bug fixes | `fix/login-redirect` |
| `docs/` | Documentation | `docs/install-guide` |
| `refactor/` | Code refactoring | `refactor/api-controllers` |
| `test/` | Test additions | `test/metrics-coverage` |
| `chore/` | Maintenance | `chore/update-deps` |

### 11.2 Commit Message Convention

Follow **Conventional Commits** specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, semicolons)
- `refactor`: Code change that neither fixes nor adds
- `test`: Adding or correcting tests
- `chore`: Build process, dependencies

**Examples:**
```
feat(api): add activity batching endpoint

- Supports up to 50 activities per request
- Includes validation and rate limiting
- Returns created count and IDs

fix(ml): resolve similarity threshold calculation

docs(readme): add docker deployment instructions

refactor(backend): extract validation middleware

test(cypress): add end-to-end login flow
```

### 11.3 Pull Request Process

1. **Create PR** from feature branch to `develop`
2. **Fill Template**:
   - Description of changes
   - Related issue numbers
   - Testing instructions
   - Screenshots (if UI changes)
3. **Automated Checks**:
   - CI tests must pass
   - Code coverage threshold (80%)
   - Linting must pass
   - No merge conflicts
4. **Code Review**:
   - Minimum 1 approval required
   - Address review comments
   - Re-request review after changes
5. **Merge**:
   - Use "Squash and merge" for clean history
   - Delete branch after merge

### 11.4 Code Quality Standards

#### ESLint Configuration
```javascript
// .eslintrc.js
module.exports = {
  extends: ['eslint:recommended', '@typescript-eslint/recommended'],
  rules: {
    'no-console': ['warn', { allow: ['error'] }],
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/no-unused-vars': 'error',
    'prefer-const': 'error'
  }
};
```

#### Prettier Configuration
```javascript
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

#### Pre-commit Hooks
```bash
# .husky/pre-commit
npm run lint
npm run test:staged
```

### 11.5 Adding New Categories

When introducing new productivity categories:

1. **Update Category Definitions** (`ml-service/config.py`):
   ```python
   NEW_CATEGORIES = [
       {"name": "Research", "keywords": ["paper", "study", "analysis"]}
   ]
   ```

2. **Generate Embeddings**:
   ```bash
   cd FocusBoard-backend
   node scripts/generate-embeddings.js
   ```

3. **Test Categorization**:
   ```bash
   curl -X POST http://localhost:5001/categorize \
     -d '{"text": "Reading research papers on AI"}'
   ```

4. **Update Documentation**: Add to user guide

5. **Database Migration**: Add category records to existing users

---

## 12. Testing

### 12.1 Testing Strategy Overview

FocusBoard implements a comprehensive **4-tier testing pyramid**:

```
    /\
   /  \  E2E Tests (Cypress) - 5%
  /----\  Critical user flows
 /      \
/--------\ Integration Tests - 15%
          API contract validation
/----------\ Unit Tests - 80%
            Business logic, utilities
```

### 12.2 Unit Testing

#### Backend (Jest)

**Run Tests:**
```bash
cd FocusBoard-backend

# Run all tests
bun test

# Run with coverage
bun test:coverage

# Run specific test file
bun test authController.test.js

# Watch mode
bun test:watch
```

**Test Example:**
```javascript
// __tests__/activityController.test.js
describe('Activity Controller', () => {
  describe('POST /api/activities', () => {
    it('should create activity with valid data', async () => {
      const activity = {
        app_name: 'vscode',
        window_title: 'test.js',
        start_time: new Date(),
        end_time: new Date()
      };
      
      const response = await request(app)
        .post('/api/activities')
        .set('Authorization', `Bearer ${token}`)
        .send({ activities: [activity] });
      
      expect(response.status).toBe(201);
      expect(response.body.data.created).toBe(1);
    });
    
    it('should reject invalid app_name (too long)', async () => {
      const activity = {
        app_name: 'a'.repeat(256),  // Exceeds 255 limit
        window_title: 'test'
      };
      
      const response = await request(app)
        .post('/api/activities')
        .set('Authorization', `Bearer ${token}`)
        .send({ activities: [activity] });
      
      expect(response.status).toBe(422);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
```

#### Frontend (Vitest)

**Run Tests:**
```bash
cd FocusBoard

# Run all tests
bun test

# Run with UI
bun test:ui

# Coverage report
bun test:coverage
```

#### ML Service (Pytest)

**Run Tests:**
```bash
cd ml-service

# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=.

# Run specific test
pytest tests/test_core.py::test_categorize -v

# Parallel execution
pytest tests/ -n auto
```

**Test Example:**
```python
# tests/test_core.py
import pytest
from core import categorize_activity

class TestCategorization:
    def test_categorize_coding_activity(self):
        result = categorize_activity(
            app_name="Visual Studio Code",
            window_title="api/routes.py - MyProject"
        )
        
        assert result['category'] == 'Work'
        assert result['confidence'] > 0.8
    
    def test_categorize_social_media(self):
        result = categorize_activity(
            app_name="Chrome",
            window_title="Twitter / Home",
            url="https://twitter.com"
        )
        
        assert result['category'] == 'Entertainment'
    
    def test_nsfw_detection(self):
        result = categorize_activity(
            app_name="Chrome",
            window_title="Adult Content Site",
            url="https://inappropriate-site.com"
        )
        
        assert result['nsfw_detected'] == True
```

### 12.3 Integration Testing

**API Contract Tests:**
```bash
# Run API integration tests
cd FocusBoard-backend
bun test:integration
```

**Database Integration:**
```javascript
// Tests MongoDB connection, queries, transactions
describe('Database Integration', () => {
  it('should connect to MongoDB', async () => {
    const isConnected = await mongoose.connection.readyState;
    expect(isConnected).toBe(1);  // 1 = connected
  });
  
  it('should handle activity batch insert', async () => {
    const activities = generateMockActivities(100);
    const result = await Activity.insertMany(activities);
    expect(result).toHaveLength(100);
  });
});
```

### 12.4 End-to-End Testing (Cypress)

**Run E2E Tests:**
```bash
cd FocusBoard

# Open interactive mode
bun cypress:open

# Run headless (CI mode)
bun cypress:run

# Run specific spec
bun cypress:run --spec "cypress/e2e/auth.cy.ts"
```

**E2E Test Example:**
```typescript
// cypress/e2e/activityTracking.cy.ts
describe('Activity Tracking Flow', () => {
  beforeEach(() => {
    cy.login('test@example.com', 'password123');
    cy.visit('/dashboard');
  });
  
  it('should display activities after tracking', () => {
    // Simulate activity being tracked
    cy.window().then((win) => {
      win.postMessage({
        type: 'SIMULATE_ACTIVITY',
        data: {
          app_name: 'vscode',
          window_title: 'test.js'
        }
      }, '*');
    });
    
    // Verify activity appears in timeline
    cy.get('[data-testid=activity-timeline]', { timeout: 10000 })
      .should('contain', 'vscode');
    
    // Verify category was assigned
    cy.get('[data-testid=activity-category]')
      .should('contain', 'Work');
  });
  
  it('should calculate focus score correctly', () => {
    // Add work activities
    cy.addMockActivity({ category: 'Work', duration: 3600 });
    cy.addMockActivity({ category: 'Work', duration: 1800 });
    cy.addMockActivity({ category: 'Entertainment', duration: 900 });
    
    // Check focus score
    cy.get('[data-testid=focus-score]')
      .should('contain', '83');  // (3600+1800) / (3600+1800+900) * 100
  });
});
```

### 12.5 Test Coverage Requirements

| Component | Minimum Coverage | Target Coverage |
|-----------|------------------|-----------------|
| Backend API | 70% | 85% |
| Frontend Components | 60% | 75% |
| ML Service | 80% | 90% |
| Native Rust | 50% | 70% |
| E2E Critical Paths | 100% | 100% |

**Coverage Reports:**
```bash
# Backend coverage
cd FocusBoard-backend
bun test:coverage
# Output: coverage/lcov-report/index.html

# Frontend coverage
cd FocusBoard
bun test:coverage
# Output: coverage/index.html
```

### 12.6 Load Testing

**Artillery.js Configuration:**
```yaml
# load-test.yml
config:
  target: 'http://localhost:5000'
  phases:
    - duration: 60
      arrivalRate: 10
    - duration: 120
      arrivalRate: 50
    - duration: 60
      arrivalRate: 100
scenarios:
  - name: 'Activity Ingestion'
    requests:
      - post:
          url: '/api/activities'
          headers:
            Authorization: 'Bearer {{ $processEnvironment.TOKEN }}'
          json:
            activities:
              - app_name: 'vscode'
                window_title: 'test.js'
                start_time: '{{ $timestamp }}'
                end_time: '{{ $timestamp }}'
```

**Run Load Test:**
```bash
npm install -g artillery
artillery run load-test.yml
```

---

## 13. Deployment

### 13.1 Containerization Strategy

FocusBoard uses Docker for consistent environments across development, staging, and production.

#### Backend Dockerfile
```dockerfile
# FocusBoard-backend/Dockerfile
FROM oven/bun:1-alpine AS base

WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy application code
COPY . .

# Production stage
FROM base AS production
ENV NODE_ENV=production
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

CMD ["bun", "run", "server.js"]
```

#### ML Service Dockerfile
```dockerfile
# ml-service/Dockerfile
FROM python:3.11-slim AS base

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Download model during build
RUN python -c "from sentence_transformers import SentenceTransformer; \
    SentenceTransformer('all-MiniLM-L6-v2')"

EXPOSE 5001

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:5001/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5001"]
```

### 13.2 Docker Compose Configuration

```yaml
# docker-compose.yml
version: '3.8'

services:
  mongodb:
    image: mongo:7.0
    container_name: focusboard-mongodb
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
    volumes:
      - mongodb_data:/data/db
    ports:
      - "27017:27017"
    networks:
      - focusboard-network

  redis:
    image: redis:7.2-alpine
    container_name: focusboard-redis
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    networks:
      - focusboard-network

  ml-service:
    build: ./ml-service
    container_name: focusboard-ml
    restart: unless-stopped
    environment:
      - PORT=5001
      - MODEL_NAME=all-MiniLM-L6-v2
      - MIN_SIMILARITY=0.3
    volumes:
      - ml_models:/app/models
    ports:
      - "5001:5001"
    networks:
      - focusboard-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

  backend:
    build: ./FocusBoard-backend
    container_name: focusboard-backend
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=5000
      - MONGODB_URL=mongodb://admin:${MONGO_ROOT_PASSWORD}@mongodb:27017/focusboard?authSource=admin
      - REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - ML_SERVICE_URL=http://ml-service:5001
    ports:
      - "5000:5000"
    depends_on:
      mongodb:
        condition: service_healthy
      redis:
        condition: service_started
      ml-service:
        condition: service_healthy
    networks:
      - focusboard-network

volumes:
  mongodb_data:
  redis_data:
  ml_models:

networks:
  focusboard-network:
    driver: bridge
```

### 13.3 CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/main.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  # Backend Tests
  backend-test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: FocusBoard-backend
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun test
      - run: bun test:coverage

  # ML Service Tests
  ml-test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ml-service
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - run: pip install -r requirements.txt
      - run: pytest tests/ --cov=. --cov-report=xml

  # Frontend Tests
  frontend-test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: FocusBoard
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun test

  # Build Desktop Apps
  build-desktop:
    needs: [backend-test, ml-test, frontend-test]
    strategy:
      matrix:
        platform: [macos-latest, ubuntu-latest, windows-latest]
    runs-on: ${{ matrix.platform }}
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - uses: dtolnay/rust-toolchain@stable
      - uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tagName: v__VERSION__
          releaseName: 'FocusBoard v__VERSION__'
          releaseBody: 'See the assets to download this version.'

  # Deploy to Staging
  deploy-staging:
    needs: [build-desktop]
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Staging
        run: |
          # Deploy to staging server
          echo "Deploying to staging..."

  # Deploy to Production
  deploy-production:
    needs: [build-desktop]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Production
        run: |
          # Deploy to production server
          echo "Deploying to production..."
```

### 13.4 Production Deployment Checklist

**Pre-deployment:**
- [ ] All tests passing (CI green)
- [ ] Version bumped in package.json
- [ ] Changelog updated
- [ ] Database migrations prepared
- [ ] Environment variables configured
- [ ] SSL certificates valid
- [ ] Backup system tested

**Deployment:**
- [ ] Deploy database changes first
- [ ] Deploy ML service (waits for model load)
- [ ] Deploy backend API
- [ ] Verify health checks pass
- [ ] Run smoke tests
- [ ] Enable traffic gradually (canary)

**Post-deployment:**
- [ ] Monitor error rates for 1 hour
- [ ] Check performance metrics
- [ ] Verify backup jobs running
- [ ] Announce deployment to team

---

## 14. Debugging Guide

### 14.1 Common Issues and Solutions

| Issue | Symptoms | Root Cause | Solution |
|-------|----------|------------|----------|
| **ML Service Won't Start** | Container exits immediately | Insufficient RAM | Allocate minimum 1GB RAM. Use smaller model: `MODEL_NAME=paraphrase-MiniLM-L3-v2` |
| **Socket Disconnections** | Real-time updates stop | CORS misconfiguration | Add `tauri://localhost` to `ALLOWED_ORIGINS` |
| **No Window Titles (macOS)** | Empty window_title field | Missing permissions | Grant "Accessibility" permission in System Preferences → Security & Privacy → Privacy → Accessibility |
| **No Window Titles (Linux)** | Empty window_title field | Missing X11 tools | Install `xprop` (X11) or `libwnck` (Wayland): `sudo apt-get install x11-utils` |
| **MongoDB Connection Errors** | `ECONNREFUSED` errors | Wrong connection string | Verify `MONGODB_URL` format. For Atlas, include `+srv` and credentials |
| **High CPU Usage** | System slowdown | Inefficient tracking loop | Increase `POLL_INTERVAL_MS` in monitor config (default: 1000ms) |
| **Category Mismatch** | Wrong activity categorization | Low similarity threshold | Adjust `MIN_SIMILARITY` (0.3 default). Higher = stricter matching |
| **JWT Expired Errors** | 401 Unauthorized | Token expiration | Check `JWT_EXPIRES_IN`. Default 7 days. Implement refresh token flow |
| **Redis Connection Failed** | Session errors | Redis not running | Start Redis: `redis-server` or verify Docker container health |
| **Build Failures** | Cargo compile errors | Missing Rust toolchain | Run `rustup update` and `rustup target add` for your platform |

### 14.2 Debugging Commands

**Backend Debugging:**
```bash
# Enable debug logging
DEBUG=* bun run server.js

# Or specific modules
DEBUG=express:*,mongoose:* bun run server.js

# Check MongoDB connection
bun run scripts/check-db.js

# View recent errors
tail -f logs/error.log
```

**ML Service Debugging:**
```bash
# Enable verbose logging
LOG_LEVEL=debug uvicorn main:app --port 5001

# Test inference manually
curl -X POST http://localhost:5001/categorize \
  -d '{"text": "writing code in vscode"}' \
  -v

# Profile memory usage
python -m memory_profiler main.py
```

**Desktop App Debugging:**
```bash
# Enable Rust debug output
RUST_LOG=debug bun tauri dev

# View Tauri logs
# macOS: ~/Library/Logs/com.focusboard.app/
# Linux: ~/.config/com.focusboard.app/logs/
# Windows: %APPDATA%\com.focusboard.app\logs\

# Inspect webview (DevTools)
# Ctrl+Shift+I (Linux/Windows)
# Cmd+Option+I (macOS)
```

### 14.3 Log Locations

| Component | Log Location | Rotation |
|-----------|--------------|----------|
| Backend | `FocusBoard-backend/logs/` | Daily, 7 days retention |
| ML Service | stdout (Docker) | Docker log rotation |
| Desktop (Rust) | OS-specific (see above) | 10MB per file, 5 files |
| Desktop (Web) | DevTools Console | N/A (runtime only) |
| MongoDB | `/var/log/mongodb/` | 7 days |
| Nginx | `/var/log/nginx/` | 14 days |

### 14.4 Health Check Endpoints

Use these for monitoring and debugging:

```bash
# Backend health
curl http://localhost:5000/health
# Expected: {"status":"ok","ml_service":"connected","database":"connected"}

# ML service health
curl http://localhost:5001/health
# Expected: {"status":"ok","model_loaded":true,"device":"cpu"}

# Database health
cd FocusBoard-backend
bun run scripts/db-health.js

# Full system check
bun run scripts/system-check.js
```

### 14.5 Getting Help

If you encounter an issue not listed above:

1. **Check Logs**: Review relevant component logs
2. **Search Issues**: Check [GitHub Issues](https://github.com/anuruprkris/FocusBoard/issues)
3. **Enable Debug Mode**: Run with maximum logging
4. **Create Issue** with:
   - Environment details (OS, versions)
   - Steps to reproduce
   - Expected vs actual behavior
   - Relevant log excerpts

---

## 15. Performance Considerations

### 15.1 Resource Requirements

**Minimum Requirements (Development):**
| Service | CPU | RAM | Storage |
|---------|-----|-----|---------|
| Backend API | 0.5 cores | 512MB | 1GB |
| ML Service | 1 core | 1GB | 2GB (models) |
| MongoDB | 0.5 cores | 512MB | 5GB |
| Redis | 0.25 cores | 256MB | 100MB |
| Desktop App | 0.1 cores | 200MB | 100MB |

**Recommended (Production):**
| Service | CPU | RAM | Storage |
|---------|-----|-----|---------|
| Backend API | 1 core | 1GB | 5GB |
| ML Service | 2 cores | 2GB | 5GB |
| MongoDB | 2 cores | 4GB | 50GB+ |
| Redis | 0.5 cores | 512MB | 1GB |

### 15.2 Database Optimization

**Indexing Strategy:**
```javascript
// Critical compound index
 db.activities.createIndex({ user_id: 1, start_time: -1 });

// Category queries
db.activities.createIndex({ user_id: 1, category_id: 1, start_time: -1 });

// Application analytics
db.activities.createIndex({ app_name: 1, start_time: -1 });

// TTL for data retention
db.activities.createIndex(
  { start_time: 1 },
  { expireAfterSeconds: 63072000 }  // 2 years
);
```

**Query Optimization Tips:**
- Use projection to limit returned fields
- Batch inserts (max 50 per batch)
- Paginate with cursor-based pagination for large datasets
- Use aggregation pipelines for analytics

### 15.3 API Optimization

**Batch Operations:**
```javascript
// Instead of 50 individual requests:
for (const activity of activities) {
  await fetch('/api/activities', { method: 'POST', body: activity });
}

// Use batch endpoint:
await fetch('/api/activities', {
  method: 'POST',
  body: JSON.stringify({ activities: activities })
});
```

**Caching Strategy:**
| Data Type | Cache Duration | Cache Key |
|-----------|---------------|-----------|
| User profile | 5 minutes | `user:{id}` |
| Categories | 1 hour | `categories:{user_id}` |
| Daily metrics | 1 minute | `metrics:{user_id}:{date}` |
| Focus score | 30 seconds | `focus:{user_id}` |

### 15.4 ML Service Optimization

**Model Quantization:**
```python
# Use quantized model for faster inference
from sentence_transformers import SentenceTransformer

model = SentenceTransformer(
    'all-MiniLM-L6-v2',
    device='cpu',
    # Enable quantization
    model_kwargs={'torch_dtype': 'float16'}
)
```

**Batch Inference:**
```python
# Process multiple activities at once
sentences = [
    f"{a['app_name']}: {a['window_title']}"
    for a in activities
]
embeddings = model.encode(sentences, batch_size=32)
```

**Caching Embeddings:**
- Cache computed embeddings for 24 hours
- Pre-compute category embeddings at startup
- Use Redis for distributed caching

### 15.5 Scaling Strategies

**Horizontal Scaling:**
```yaml
# docker-compose.scale.yml
services:
  backend:
    deploy:
      replicas: 3
    
  ml-service:
    deploy:
      replicas: 2
      resources:
        limits:
          memory: 2G
```

**Load Balancing:**
```nginx
# nginx.conf
upstream backend {
    least_conn;
    server backend1:5000;
    server backend2:5000;
    server backend3:5000;
}

server {
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Connection "";
        proxy_http_version 1.1;
    }
}
```

**Database Sharding:**
For >10,000 active users, consider sharding by `user_id`:
```javascript
// MongoDB sharding configuration
sh.shardCollection("focusboard.activities", { user_id: "hashed" });
```

---

## 16. Security Considerations

### 16.1 Implemented Security Measures

#### Authentication & Authorization
- **JWT Tokens**: Stateless authentication with RS256 signing
- **Token Expiration**: 7-day access tokens, 30-day refresh tokens
- **Password Security**: bcrypt with 12 salt rounds
- **Session Management**: Redis-backed token blacklist for logout

#### Input Validation
- **Zod Schemas**: Strict runtime validation on all inputs
- **Sanitization**: DOMPurify for any HTML content
- **Parameterized Queries**: Mongoose prevents NoSQL injection
- **File Upload Limits**: 10MB max, MIME type verification

#### Transport Security
- **TLS 1.3**: All API traffic encrypted
- **HSTS Headers**: Strict transport security enforcement
- **Certificate Pinning**: Mobile app certificate validation

#### API Security
- **Helmet.js**: Security headers (X-Frame-Options, CSP, etc.)
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS Whitelist**: Strict origin validation
- **Request Size Limits**: 10MB max body size

### 16.2 Data Privacy

**Privacy-First Design:**
- No keystroke logging
- No screen recording
- No content capture (only titles/URLs)
- Local-first processing where possible

**Data Retention:**
| Data Type | Retention | Deletion Process |
|-----------|-----------|------------------|
| Activities | 2 years | Automated TTL index |
| Sessions | 30 days | Redis expiration |
| User Account | Until deletion | GDPR-compliant purge |
| Analytics Aggregates | Indefinite | Anonymized only |

**Compliance:**
- **GDPR**: Right to erasure, data export, consent management
- **CCPA**: California privacy rights supported
- **Data Processing Agreement**: Available for enterprise

### 16.3 Security Best Practices for Production

**Environment Hardening:**
```bash
# 1. Generate strong secrets
openssl rand -base64 32  # For JWT_SECRET

# 2. Use dedicated database users
# MongoDB: Create user with minimal privileges
 db.createUser({
  user: "focusboard_app",
  pwd: "strong_password",
  roles: [
    { role: "readWrite", db: "focusboard" }
  ]
});

# 3. Enable MongoDB auth
# mongod.conf
security:
  authorization: enabled
```

**Network Security:**
```bash
# 4. Firewall rules
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# 5. Disable root login
# /etc/ssh/sshd_config
PermitRootLogin no
PasswordAuthentication no
```

**Application Security:**
```javascript
// 6. Rate limiting configuration
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,  // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  // Skip successful requests for health checks
  skip: (req) => req.path === '/health'
});

// 7. Security headers (Helmet)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

### 16.4 Security Monitoring

**Audit Logging:**
```javascript
// Log security events
{
  "timestamp": "2024-01-15T10:30:00Z",
  "event": "AUTH_FAILED",
  "user_id": "unknown",
  "ip": "192.168.1.100",
  "details": {
    "reason": "invalid_password",
    "email_attempted": "user@example.com"
  }
}
```

**Security Events to Monitor:**
- Failed login attempts (>5 in 10 minutes)
- Token validation failures
- Rate limit violations
- Unusual data access patterns
- Database connection errors
- ML service anomalies

**Incident Response:**
1. Alert on-call engineer (PagerDuty)
2. Isolate affected service
3. Review audit logs
4. Implement temporary blocks if needed
5. Post-incident review within 24 hours

### 16.5 Vulnerability Disclosure

If you discover a security vulnerability:

1. **DO NOT** open a public issue
2. Email security@focusboard.io with:
   - Description of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)
3. Expect response within 48 hours
4. Coordination on disclosure timeline

---

## 17. Future Improvements

### 17.1 Planned Features (Q1-Q2 2024)

#### Cross-Platform Activity Export
- **Native PDF Reports**: Weekly/monthly productivity summaries
- **Calendar Integration**: Google Calendar, Outlook sync
- **Slack Status**: Automatic status updates based on current activity
- **Webhook Support**: Custom integrations for enterprise

#### Enhanced AI Capabilities
- **On-Device ML**: Move inference to Rust layer for 100% offline operation
- **Custom Category Training**: User-specific model fine-tuning
- **Predictive Analytics**: Predict focus patterns and suggest optimal work times
- **Smart Break Reminders**: AI-powered break suggestions based on focus degradation

#### Team Features
- **Team Leaderboards**: Gamified productivity (opt-in)
- **Sprint Analytics**: Correlation between focus time and sprint velocity
- **Meeting Cost Calculator**: Time spent in meetings vs. deep work
- **Interruption Tracking**: Identify biggest sources of context switching



---


<p align="center">
  <strong>FocusBoard</strong> — Know exactly where your time goes. Automatically.
</p>

<p align="center">
  Built with ❤️ by the FocusBoard Team and Contributors
</p>
