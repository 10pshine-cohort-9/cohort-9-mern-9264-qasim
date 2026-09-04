# NovaNote

Think it. Note it.

A full-stack MERN note-taking application with per-user authentication, rich text editing, tags, pinning, search, and export/import — built as part of the 10Pearls Shine MERN internship program.

![Node.js](https://img.shields.io/badge/Node.js-20.19+-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Screenshots](#screenshots)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Running Tests](#running-tests)
- [Project Structure](#project-structure)
- [API Overview](#api-overview)
- [Code Quality](#code-quality)

## Features

- **Authentication** — email/password signup and login with JWT, password strength validation (8+ characters, one special character)
- **Notes CRUD** — create, edit, and delete notes with a rich text editor (Tiptap)
- **Tags** — attach multiple tags to a note, filter by tag from the sidebar, color-coded automatically
- **Pinning** — pin important notes to keep them at the top of the dashboard
- **Search & Sort** — live search across titles, content, and tags; sort by recently updated, oldest, or title
- **Export / Import** — export all notes to a JSON file and re-import them later
- **Profile Management** — update display name and change password from the Profile page
- **Sidebar Navigation** — quick access to All Notes, Pinned notes, and per-tag filtering
- **Structured Logging** — request/response and error logging via Pino
- **Automated Testing** — Mocha/Chai on the backend, Jest + React Testing Library on the frontend
- **Code Quality** — analyzed with SonarQube (see [Code Quality](#code-quality))

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, React Router, Axios, Tiptap |
| Backend | Node.js, Express 4, Mongoose |
| Database | MongoDB Atlas |
| Auth | JSON Web Tokens (JWT), bcryptjs |
| Logging | Pino, pino-http |
| Testing | Mocha, Chai, Supertest (backend) · Jest, React Testing Library (frontend) |
| Code Quality | SonarQube |

## Screenshots

_Screenshots of the dashboard, note editor, and profile page can be added here._

## Getting Started

### Prerequisites

- Node.js 20.19 or later
- npm
- A MongoDB Atlas connection string (or a local MongoDB instance)

### Backend Setup

    cd backend
    npm install
    cp .env.example .env
    # fill in the values in .env (see Environment Variables below)
    npm run dev

The backend runs on `http://localhost:5000` by default.

### Frontend Setup

    cd frontend
    npm install
    npm run dev

The frontend runs on `http://localhost:5173` by default.

## Environment Variables

Create a `backend/.env` file based on `backend/.env.example` with the following:

| Variable | Description |
| --- | --- |
| `PORT` | Port the backend server listens on |
| `NODE_ENV` | `development` or `production` |
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret used to sign JSON Web Tokens |
| `JWT_EXPIRES_IN` | Token expiry duration (e.g. `7d`) |
| `CORS_ORIGIN` | Allowed origin for CORS (e.g. `http://localhost:5173`) |

## Running Tests

### Backend

    cd backend
    npm test

### Frontend

    cd frontend
    npm test

## Project Structure

    cohort-9-mern-9264-qasim/
    ├── backend/
    │   ├── src/
    │   │   ├── config/         # Database and logger configuration
    │   │   ├── controllers/    # Route handler logic
    │   │   ├── middleware/     # Auth and error-handling middleware
    │   │   ├── models/         # Mongoose schemas
    │   │   ├── routes/         # Express route definitions
    │   │   └── utils/          # JWT and other helpers
    │   └── test/                # Mocha/Chai test suites
    └── frontend/
        └── src/
            ├── api/            # Axios API call wrappers
            ├── components/     # Reusable UI components
            ├── context/        # React context (auth state)
            ├── pages/          # Route-level page components
            └── utils/          # Shared utility functions

## API Overview

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/auth/register` | Create a new account |
| POST | `/api/auth/login` | Log in and receive a JWT |
| PUT | `/api/auth/profile` | Update display name and/or change password |
| GET | `/api/notes` | List the authenticated user's notes |
| GET | `/api/notes/:id` | Get a single note by id |
| POST | `/api/notes` | Create a new note |
| PUT | `/api/notes/:id` | Update an existing note |
| DELETE | `/api/notes/:id` | Delete a note |
| GET | `/health` | Health check endpoint |

All `/api/notes` and `/api/auth/profile` routes require a valid JWT in the `Authorization: Bearer <token>` header.

## Code Quality

This project was analyzed locally with SonarQube (Community Edition), covering both the backend and frontend codebases for bugs, vulnerabilities, code smells, and duplication. All identified security issues were resolved as part of this development cycle.
