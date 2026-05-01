# Team Task Manager

A full-stack task management platform for teams to create projects, manage members, assign work, and track delivery progress through a clean dashboard.

This project was built with:
- `Express` + `MongoDB` on the backend
- `React` + `Vite` on the frontend
- `JWT` authentication
- `Railway`-ready deployment setup

## Overview

Team Task Manager is designed around a simple but practical workflow:
- admins create and manage projects
- admins add team members to projects
- admins create and assign tasks
- members update their task status
- everyone with access can track progress from the dashboard

The app focuses on the features usually expected in an assignment project:
- authentication
- project and team management
- role-based access control
- task assignment and tracking
- dashboard insights
- deployment readiness

## Key Features

### Authentication

- Sign up and login
- JWT-based session handling
- Logout support
- Protected frontend routes
- Current-user session fetch with `/api/auth/me`

### Role-Based Access

- Global roles: `admin` and `member`
- Admins can create projects
- Project admins can add members
- Project admins can create, edit, and delete tasks
- Members can update task status when assigned or when allowed through project role access

### Project Management

- Create new projects
- Add members to a project by email
- Assign project-level roles
- View accessible projects

### Task Management

- Create tasks inside a project
- Assign tasks to project members
- Track task status: `todo`, `in_progress`, `done`
- Set task priority: `low`, `medium`, `high`
- Set due dates
- Filter tasks by project and status

### Dashboard

- Total tasks
- Todo tasks
- In-progress tasks
- Completed tasks
- Overdue tasks
- Tasks assigned to the logged-in user

## Tech Stack

### Frontend

- `React`
- `Vite`
- `React Router`
- `Axios`
- Custom dark UI with product-style layout

### Backend

- `Express`
- `Mongoose`
- `MongoDB Atlas`
- `JWT`
- `bcryptjs`
- `Zod`

### Deployment

- `Railway`

## Folder Structure

```txt
TaskManagement/
  backend_TaskManager/
    src/
      config/
      controllers/
      middlewares/
      models/
      routes/
      scripts/
      utils/
  frontend_TaskManager/
    src/
      api/
      components/
      context/
      layouts/
      pages/
  package.json
  railway.json
  README.md
```

## Seeded Demo Credentials

The database has already been seeded with demo data for presentation and testing.

### Main Admin Account

- Email: `admin@task.com`
- Password: `Password`

### Seeded Demo Users

All seeded demo users use the same password:
- Password: `Password`

Users:
- `admin@task.com` — Admin
- `aarav@task.com` — Member
- `sara@task.com` — Member
- `riya@task.com` — Member
- `kabir@task.com` — Member
- `neha@task.com` — Member

### Current Seeded Data

- Total users: `8`
- Total admins: `2`
- Total projects: `4`
- Total tasks: `18`

This gives enough demo data to show:
- multiple users
- multiple projects
- multiple assignments
- different task states
- dashboard counts

## Demo Flow for Presentation

Recommended 2 to 5 minute demo flow:

1. Log in as `admin@task.com`
2. Open the dashboard and show summary counts
3. Go to `Projects` and show team membership
4. Go to `Tasks` and show assigned tasks by project
5. Create a new task as admin
6. Log out
7. Log in as a seeded member like `aarav@task.com`
8. Update task status
9. Return to dashboard to show updated progress

## Local Setup

### 1. Install dependencies

From the project root:

```bash
npm install --prefix backend_TaskManager
npm install --prefix frontend_TaskManager
```

### 2. Create backend environment file

Create `backend_TaskManager/.env` using `backend_TaskManager/.env.example`.

Example:

```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
CLIENT_URL=http://localhost:5173
JWT_SECRET=your_secure_secret
NODE_ENV=development
```

### 3. Run the backend

```bash
npm run dev:backend
```

### 4. Run the frontend

In a second terminal:

```bash
npm run dev:frontend
```

### 5. Open the app

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

## Seed Script

A repeatable demo seed script is included.

Run it from:

```bash
cd backend_TaskManager
npm run seed:demo
```

What it does:
- creates or updates `admin@task.com`
- creates 5 additional demo users
- creates demo projects
- creates demo tasks with mixed statuses and due dates

## API Overview

### Auth Routes

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Project Routes

- `GET /api/projects`
- `GET /api/projects/:id`
- `POST /api/projects`
- `PATCH /api/projects/:id/members`

### Task Routes

- `GET /api/tasks`
- `GET /api/tasks/project/:projectId`
- `POST /api/tasks`
- `PATCH /api/tasks/:id`
- `PATCH /api/tasks/:id/status`
- `DELETE /api/tasks/:id`

### Dashboard Route

- `GET /api/dashboard/summary`

## Railway Deployment

This repository is prepared so Express serves the built React app in production.

### Steps

1. Push the project to GitHub
2. Create a new Railway project
3. Use the repository root as the service root
4. Add environment variables in Railway:

- `MONGODB_URI`
- `JWT_SECRET`
- `NODE_ENV=production`
- `PORT`

5. Deploy

The project uses:
- root [package.json](./package.json) for workspace-level scripts
- [railway.json](./railway.json) for build and start commands

In production:
- Express serves the React frontend
- API routes are available under `/api`
- frontend and backend share the same Railway URL

## Scripts

### Root

- `npm run build`
- `npm run start`
- `npm run dev:backend`
- `npm run dev:frontend`

### Backend

- `npm run dev`
- `npm run start`
- `npm run seed:demo`

### Frontend

- `npm run dev`
- `npm run build`
- `npm run lint`

## What This Project Demonstrates

- full-stack application structure
- REST API design
- MongoDB document relationships with Mongoose
- authentication and authorization
- frontend state handling with protected routes
- practical admin/member workflow
- deployment-ready app architecture

## Submission Checklist

- Live Railway URL
- GitHub repository URL
- README
- Demo video

## Author Notes

This project was intentionally kept straightforward in architecture:
- simple Express controller-route structure
- separate React frontend
- MongoDB with Mongoose references
- single-service Railway deployment path for easier hosting

That keeps the codebase easier to explain, demo, and extend.
