# EduBridge - Learning Management System

EduBridge is a modern, comprehensive learning management system built with the MERN stack (MongoDB, Express.js, React, Node.js). It provides an intuitive platform for students, teachers, parents, and administrators to manage educational content, track academic progress, and facilitate learning.

## 🚀 Features

### 👥 User Management
- **Role-based Authentication**: Secure JWT-based authentication for Students, Teachers, Parents, and Admins
- **Admin Account Protection**: Only existing admins can create new admin accounts
- **User Registration**: Self-registration for students, teachers, and parents (admin accounts restricted)

### 📚 Student Enrollment
- **Term-based Enrollment**: Teachers can enroll students to specific terms
- **Level Management**: Support for Junior Secondary School and Senior Secondary School levels
- **Bulk Import**: CSV import functionality for importing student data from registry department
- **Enrollment Tracking**: View and manage all enrolled students with their term and level information

### 📊 Academic Progress & Reports
- **Marks Management**: 
  - Teachers can add, edit, and delete marks for their subjects
  - Admins have full access to manage all marks
- **Term-based Progress Tables**: Academic progress organized by terms with detailed subject-wise breakdown
- **Visual Analytics**: 
  - Line charts showing progress trends across terms
  - Bar charts displaying performance by subject
  - Available for both students and parents
- **Grade System**: Automatic grade calculation (A+, A, B, C, D, F) with color-coded visualization
- **Report Generation**: Download marks reports as CSV files with filtering options

### 📝 Study Management
- **Study Plans**: Students can create and track study plans
- **Study Notes**: Digital note-taking for students
- **Mood Tracking**: Students can log daily moods, energy levels, and stress levels

### 👨‍🏫 Teacher Features
- **Subject Management**: Create and manage subjects
- **Marks Entry**: Enter marks for students with term and level information
- **Student Enrollment**: Enroll students to terms and levels
- **CSV Import/Export**: 
  - Import student data from CSV files
  - Export enrolled students and marks reports
- **Reports Dashboard**: View, filter, and download comprehensive marks reports

### 👨‍💼 Admin Features
- **User Management**: Create, update, and delete users
- **Marks Management**: Full access to view, edit, and delete any marks
- **Parent-Child Linking**: Link parents to their children (students)
- **System Reports**: Comprehensive reporting with filtering and CSV export
- **Dashboard Statistics**: Overview of students, teachers, parents, and subjects

### 👨‍👩‍👧 Parent Features
- **Child Progress Tracking**: View academic progress for all linked children
- **Term-based Reports**: Academic progress organized by terms
- **Visual Analytics**: Charts showing child's performance trends
- **Contact School**: Direct communication with teachers/school

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database with Mongoose ODM
- **JWT** - Authentication
- **Multer** - File upload handling
- **csv-parser** - CSV file processing
- **bcryptjs** - Password hashing

### Frontend
- **React 18** - UI library
- **React Router v6** - Routing
- **Redux Toolkit** - State management
- **Material-UI (MUI)** - Component library
- **Chart.js & react-chartjs-2** - Data visualization
- **Axios** - HTTP client
- **Vite** - Build tool

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Edubridge
   ```

2. **Backend Setup**
   ```bash
   cd server
   npm install
   ```

3. **Create environment file**
   ```bash
   # Create .env file in server directory
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   PORT=5000
   ```

4. **Frontend Setup**
   ```bash
   cd ../client
   npm install
   ```

5. **Create environment file**
   ```bash
   # Create .env file in client directory
   VITE_API_URL=http://localhost:5000/api
   ```

## 🚀 Running the Application

### Development Mode

1. **Start the backend server**
   ```bash
   cd server
   npm run dev
   ```
   Server will run on `http://localhost:5000`

2. **Start the frontend**
   ```bash
   cd client
   npm run dev
   ```
   Frontend will run on `http://localhost:5173`

### Production Build

1. **Build the frontend**
   ```bash
   cd client
   npm run build
   ```

2. **Start the backend**
   ```bash
   cd server
   npm start
   ```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user (admin role restricted)
- `POST /api/auth/login` - User login

### Students
- `GET /api/students/marks` - Get student's marks
- `GET /api/students/notes` - Get study notes
- `POST /api/students/notes` - Create study note
- `GET /api/students/study-plans` - Get study plans
- `POST /api/students/study-plans` - Create study plan
- `PATCH /api/students/study-plans/:id` - Update study plan
- `DELETE /api/students/study-plans/:id` - Delete study plan
- `GET /api/students/mood-entries` - Get mood entries
- `POST /api/students/mood-entries` - Create mood entry

### Teachers
- `GET /api/teachers/subjects` - Get teacher's subjects
- `POST /api/teachers/subjects` - Create subject
- `GET /api/teachers/students` - Get all students
- `POST /api/teachers/marks` - Add marks for student
- `GET /api/teachers/marks/all` - Get all marks (with filters)
- `PUT /api/teachers/marks/:markId` - Update mark
- `DELETE /api/teachers/marks/:markId` - Delete mark
- `GET /api/teachers/my-marks` - Get marks entered by teacher
- `GET /api/teachers/marks/stats` - Get marks statistics
- `POST /api/teachers/enroll` - Enroll student to term and level
- `GET /api/teachers/enrollments` - Get all enrolled students
- `PUT /api/teachers/enrollments/:studentId` - Update student enrollment
- `POST /api/teachers/import-students` - Import students from CSV
- `GET /api/teachers/export-students` - Export enrolled students to CSV
- `GET /api/teachers/reports/marks` - Export marks report to CSV

### Admins
- `GET /api/admin/users` - Get all users
- `POST /api/admin/users` - Create user (can create admins)
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/stats` - Get dashboard statistics
- `GET /api/admin/students/:id/marks` - Get student's marks
- `GET /api/admin/marks/all` - Get all marks (with filters)
- `PUT /api/admin/marks/:markId` - Update any mark
- `DELETE /api/admin/marks/:markId` - Delete any mark
- `GET /api/admin/reports/marks` - Export marks report to CSV
- `POST /api/admin/parent-child` - Link parent to student(s)
- `DELETE /api/admin/parent-child` - Unlink parent from student

### Parents
- `GET /api/parents/children` - Get linked children with their marks

## 📋 CSV Import Format

For importing students, use the following CSV format:

```csv
name,email,admissionNumber,term,level
John Doe,john.doe@example.com,ADM001,Term 1,Junior Secondary School
Jane Smith,jane.smith@example.com,ADM002,Term 1,Senior Secondary School
```

**Required Fields:**
- `name` - Student's full name
- `email` - Student's email address
- `admissionNumber` - Unique admission number
- `term` - Term (e.g., Term 1, Term 2, Term 3)
- `level` - Must be either "Junior Secondary School" or "Senior Secondary School"

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs for password security
- **Role-based Access Control**: Middleware protecting routes by role
- **Admin Account Protection**: Only existing admins can create new admin accounts
- **Input Validation**: Server-side validation for all inputs

## 📊 Data Models

### User
- `name` - User's full name
- `email` - Unique email address
- `password` - Hashed password
- `role` - User role (student, teacher, parent, admin)
- `admissionNumber` - Student admission number (students only)
- `level` - School level (Junior Secondary School / Senior Secondary School)
- `term` - Current term enrollment

### Mark
- `studentId` - Reference to student
- `subjectId` - Reference to subject
- `marks` - Marks percentage (0-100)
- `term` - Term for the marks
- `level` - School level

### Subject
- `name` - Subject name
- `teacherId` - Reference to teacher

## 🎨 UI Features

- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Material-UI Components**: Modern, accessible UI components
- **Interactive Charts**: Visual representation of academic progress
- **Real-time Updates**: Instant feedback on actions
- **Intuitive Navigation**: Easy-to-use tab-based interface

## 📝 Project Structure

```
Edubridge/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── admin/     # Admin dashboard
│   │   │   ├── teacher/   # Teacher dashboard
│   │   │   ├── student/   # Student dashboard
│   │   │   ├── parent/    # Parent dashboard
│   │   │   └── auth/      # Authentication components
│   │   ├── services/      # API service
│   │   ├── store/         # Redux store
│   │   └── utils/         # Utility functions
│   └── package.json
├── server/                # Express backend
│   ├── models/            # Mongoose models
│   ├── routes/            # API routes
│   ├── middleware/        # Auth middleware
│   └── package.json
└── README.md
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

- Your Name/Team

## 🙏 Acknowledgments

- Material-UI for the component library
- Chart.js for data visualization
- MongoDB for the database solution
