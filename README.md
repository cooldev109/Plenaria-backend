# Plenaria Backend

Backend API for Plenaria - A political platform designed for councilors and political agents.

## Features

- **Role-based Authentication**: Admin, Lawyer, and Customer roles
- **JWT-based Security**: Secure token-based authentication
- **Subscription Plans**: Tiered access with Basic, Plus, and Complete plans
- **Consultation System**: Legal consultations between customers and lawyers
- **Project Database**: Legal project templates and documents
- **Course System**: Training videos and educational content
- **Bilingual Support**: Ready for EN/PT language switching

## Tech Stack

- **Node.js** with **Express.js**
- **MongoDB** with **Mongoose**
- **TypeScript** for type safety
- **JWT** for authentication
- **bcryptjs** for password hashing
- **express-validator** for input validation

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Setup:**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   MONGODB_URI=mongodb://localhost:27017/plenaria
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRES_IN=7d
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   ```

3. **Initialize Database:**
   ```bash
   npm run init-db
   ```

4. **Seed Initial Data:**
   ```bash
   npm run seed
   ```

5. **Start Development Server:**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/me` - Update user profile
- `PUT /api/auth/change-password` - Change password

### Admin Routes (`/api/admin`)
- `GET /users` - Get all users
- `GET /users/:id` - Get user by ID
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user
- `GET /plans` - Get all plans
- `POST /plans` - Create new plan
- `PUT /plans/:id` - Update plan
- `DELETE /plans/:id` - Delete plan
- `GET /consultations` - Get all consultations
- `PUT /consultations/:id/assign` - Assign consultation to lawyer
- `GET /dashboard` - Get admin dashboard statistics

### Lawyer Routes (`/api/lawyer`)
- `GET /consultations` - Get assigned consultations
- `GET /consultations/:id` - Get consultation details
- `PUT /consultations/:id` - Update consultation
- `GET /consultations/available` - Get available consultations
- `POST /consultations/:id/claim` - Claim a consultation
- `GET /projects` - Get lawyer's projects
- `POST /projects` - Create new project
- `PUT /projects/:id` - Update project
- `DELETE /projects/:id` - Delete project
- `GET /courses` - Get lawyer's courses
- `POST /courses` - Create new course
- `PUT /courses/:id` - Update course
- `DELETE /courses/:id` - Delete course
- `GET /dashboard` - Get lawyer dashboard statistics

### Customer Routes (`/api/customer`)
- `GET /consultations` - Get customer's consultations
- `GET /consultations/:id` - Get consultation details
- `POST /consultations` - Create new consultation
- `PUT /consultations/:id` - Update consultation
- `PUT /consultations/:id/cancel` - Cancel consultation
- `GET /projects` - Get available projects
- `GET /projects/:id` - Get project details
- `GET /courses` - Get available courses
- `GET /courses/:id` - Get course details
- `GET /plans` - Get available plans
- `GET /plan` - Get current plan
- `GET /dashboard` - Get customer dashboard statistics

### Health Check
- `GET /api/health` - Server health status

## Database Models

### User
- `name`: User's full name
- `email`: Unique email address
- `password`: Hashed password
- `role`: admin | lawyer | customer
- `planId`: Reference to subscription plan (for customers)
- `isActive`: Account status

### Plan
- `name`: Plan name (Basic, Plus, Complete)
- `description`: Plan description
- `features`: Array of plan features
- `price`: Monthly/yearly price
- `maxConsultations`: Consultation limit (null = unlimited)
- `hasProjectDatabase`: Access to project database
- `hasCourses`: Access to training courses

### Consultation
- `customerId`: Reference to customer
- `lawyerId`: Reference to assigned lawyer
- `subject`: Consultation subject
- `description`: Detailed description
- `status`: pending | assigned | in_progress | completed | cancelled
- `priority`: low | medium | high | urgent
- `response`: Lawyer's response
- `notes`: Additional notes

### Project
- `title`: Project title
- `description`: Project description
- `category`: Project category
- `tags`: Searchable tags
- `fileUrl`: File download URL
- `createdBy`: Reference to creator (lawyer)
- `isPublic`: Public visibility
- `downloadCount`: Download statistics

### Course
- `title`: Course title
- `description`: Course description
- `category`: Course category
- `videoUrl`: Video content URL
- `duration`: Course duration in minutes
- `level`: beginner | intermediate | advanced
- `createdBy`: Reference to creator (lawyer)
- `isPublished`: Publication status
- `enrollmentCount`: Enrollment statistics

## Initial Users

After running the seed script, you can login with:

**Admin User:**
- Email: `walkerjames1127@gmail.com`
- Password: `futurephantom`

**Customer User:**
- Email: `mazenabass991@gmail.com`
- Password: `futurephantom`

## Subscription Plans

### Basic Plan - $29.99/month
- Access to project database
- 3 monthly consultations
- Email support
- Basic legal templates

### Plus Plan - $49.99/month
- Everything in Basic
- 5 monthly consultations
- Priority email support
- Advanced legal templates
- Document review service

### Complete Plan - $99.99/month
- Everything in Plus
- Unlimited consultations
- Access to training courses
- Priority phone support
- Premium legal templates
- Legal opinion drafting

## Development

### Scripts
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run seed` - Seed database with initial data
- `npm run init-db` - Clear all data from database

### Project Structure
```
src/
├── controllers/     # Route controllers
├── middleware/      # Custom middleware
├── models/         # Mongoose models
├── routes/         # Express routes
├── utils/          # Utility functions
├── server.ts       # Main server file
├── seed.ts         # Database seeding
└── init-db.ts      # Database initialization
```

## Security Features

- **Helmet.js**: Security headers
- **Rate Limiting**: API request limiting
- **CORS**: Cross-origin resource sharing
- **Input Validation**: Request validation with express-validator
- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Secure authentication tokens
- **Role-based Access**: Granular permission system

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/plenaria` |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_EXPIRES_IN` | JWT expiration time | `7d` |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

