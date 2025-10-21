# 🔧 Plenária Backend

Backend API em Node.js + TypeScript + Express + MongoDB para a plataforma Plenária.

## 🚀 Stack

- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (access 15min + refresh 7days tokens)
- **Real-time**: Socket.IO for consultations chat
- **Security**: bcrypt (12 rounds), helmet, rate-limiting
- **Validation**: express-validator
- **Payment**: Stripe (prepared, not implemented yet)

## 📦 Getting Started

### Prerequisites

- Node.js v18 or higher
- MongoDB v6 or higher (running locally or Atlas)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install
```

### Environment Variables

The `.env` file is already configured for development:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/plenaria
JWT_ACCESS_SECRET=plenaria-access-secret-2025-dev-only
JWT_REFRESH_SECRET=plenaria-refresh-secret-2025-dev-only
FRONTEND_URL=http://localhost:8082
```

⚠️ **Production:** Generate new JWT secrets using:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Seed Database

```bash
npm run seed
```

Creates:
- 3 test users (admin, lawyer, customer) - password: **futurephantom**
- 8 project templates
- 8 courses

### Development

```bash
# Run in development mode with hot reload
npm run dev
```

Server will start on: **http://localhost:5000**

### Build & Production

```bash
# Build TypeScript to JavaScript
npm run build

# Run production server
npm start
```

## 📁 Project Structure

```
backend/src/
├── controllers/           # Business logic
│   └── consultationsController.ts
├── middleware/           # Auth, validation
│   └── auth.ts          # requireAuth, requireRole, requirePlan
├── models/              # Mongoose schemas
│   ├── User.ts          # Users (admin/lawyer/customer)
│   ├── Consultation.ts  # Consultation requests
│   ├── Message.ts       # Chat messages
│   ├── Template.ts      # Project templates
│   └── Course.ts        # Education courses
├── routes/              # API endpoints
│   ├── auth.ts          # POST /api/auth/login, /register
│   ├── templates.ts     # GET /api/templates
│   ├── courses.ts       # GET /api/courses
│   ├── consultations.ts # POST /api/consultations
│   └── admin.ts         # GET /api/admin/users, /metrics
├── services/            # Business services
│   └── metricsService.ts
├── sockets/             # WebSocket handlers
│   └── consultationsSocket.ts
├── utils/               # Helpers
│   ├── auth.ts          # JWT, bcrypt
│   └── db.ts            # MongoDB connection
├── seeds/               # Database seeds
│   └── seed.ts
├── app.ts               # Express setup
└── index.ts             # Server entry point
```

## 🔌 API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/register` | Register user | - |
| POST | `/login` | Login | - |
| POST | `/refresh` | Refresh tokens | - |
| POST | `/logout` | Logout | ✓ |
| GET | `/me` | Get current user | ✓ |

### Templates (`/api/templates`)

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/` | List templates | customer |
| POST | `/:id/download` | Download template | customer |

### Consultations (`/api/consultations`)

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/` | List consultations | all |
| POST | `/` | Create consultation | customer |
| GET | `/quota` | Check quota | customer |
| POST | `/:id/accept` | Accept consultation | lawyer |
| POST | `/:id/reject` | Reject consultation | lawyer |

### Admin (`/api/admin`)

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/users` | List all users | admin |
| GET | `/lawyers/pending` | Pending lawyers | admin |
| POST | `/lawyers/:id/approve` | Approve lawyer | admin |
| POST | `/users/:id/suspend` | Suspend user | admin |
| GET | `/metrics` | Get metrics | admin |

### WebSocket (`/consultations`)

- `join_consultation` - Join consultation room
- `send_message` - Send chat message
- `end_consultation` - End session

## 🔐 Authentication & Authorization

### JWT Flow

1. **Login** → Receive access + refresh tokens
2. **API Requests** → Send `Authorization: Bearer <accessToken>`
3. **Token Expires** → Use refresh token to get new pair
4. **Logout** → Clear tokens (client-side)

### Roles & Permissions

- **admin**: Full access to system
- **lawyer**: Manage consultations
- **customer**: Access materials, request consultations

### Plan-Based Quotas

- **basic**: 3 consultations/month
- **plus**: 5 consultations/month
- **premium**: Unlimited consultations

## 🗄️ Database Models

### User
```typescript
{
  email: string (unique)
  phone?: string
  passwordHash: string (bcrypt 12 rounds)
  role: 'admin' | 'lawyer' | 'customer'
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED'
  plan?: 'basic' | 'plus' | 'premium'
  isOnTrial: boolean
  trialExpiresAt?: Date
}
```

### Consultation
```typescript
{
  customer: ObjectId
  lawyer?: ObjectId
  question: string
  status: 'REQUESTED' | 'ACCEPTED' | 'IN_PROGRESS' | 'FINISHED'
  responseBy?: Date (24h SLA)
  sessionDuration?: number
}
```

## 🔒 Security Features

- ✅ bcrypt password hashing (12 rounds)
- ✅ JWT with short-lived access tokens (15min)
- ✅ Rate limiting (100 req/15min on /auth)
- ✅ Input validation with express-validator
- ✅ CORS properly configured
- ✅ Helmet for security headers
- ✅ Role-based access control (RBAC)

## 🧪 Testing

### Health Check
```bash
curl http://localhost:5000/health
```

### Test Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin@gmail.com","password":"futurephantom"}'
```

## 📊 Available Scripts

```bash
npm run dev     # Development with hot reload
npm run build   # Build TypeScript
npm start       # Production server
npm run seed    # Seed database
npm run lint    # Run linter
npm test        # Run tests (if configured)
```

## 🐛 Common Issues

### MongoDB Connection Error
```bash
# Check if MongoDB is running
mongosh

# Start MongoDB
mongod  # or: brew services start mongodb-community
```

### Port 5000 Already in Use
```bash
# Find process
netstat -ano | findstr :5000  # Windows
lsof -ti:5000                  # Mac/Linux

# Kill process
taskkill /PID [PID] /F         # Windows
kill -9 [PID]                  # Mac/Linux
```

## 📚 Additional Documentation

- `../README.md` - Main project documentation
- `../credentials.md` - Test credentials
- `../TROUBLESHOOTING.md` - Troubleshooting guide
- `./rule.md` - Development rules
- `./prompt.md` - Development steps
