# Poiro AI Creative Battle Room

A real-time multiplayer AI-powered battle room platform where users compete through AI-generated creative challenges. The application supports real-time room collaboration, asynchronous AI job processing, role-based access control, and persistent state management.

---

## Live Demo

Frontend: 

Backend: 

Demo Video: 

GitHub Repository:
https://github.com/suryaKumar2408/poiroAssignment

---

## Project Overview

The project implements a complete AI battle workflow:

- User enters the application with persistent identity
- Host creates a room and defines a challenge
- Participants join using room code
- Host starts battle rounds
- Participants submit prompts
- Backend creates asynchronous generation jobs
- Jobs are processed independently
- AI-generated content is displayed
- Host scores submissions
- Leaderboard ranks participants

---

## Features

### Authentication & Identity
- JWT authentication
- Persistent login state
- Secure protected routes

### Room Management
- Create room
- Join room via room code
- Challenge-based room creation
- Shareable room system

### Role Separation

#### Host
- Create challenge room
- Start battle round
- Score participant submissions
- Control room lifecycle

#### Participant
- Join room
- Submit prompt entries
- View generated outputs

Backend permission checks enforce role restrictions.

---

## Real-Time Functionality

Implemented using Socket.IO:

- Room updates
- User joined events
- Round lifecycle updates
- Submission updates
- Job state updates
- Score updates
- Leaderboard updates

No polling or manual refresh required.

---

## Tech Stack

### Frontend
- React.js
- Vite
- TypeScript
- Zustand
- Tailwind CSS
- Axios
- Socket.IO Client

### Backend
- Node.js
- Express.js
- Socket.IO
- JWT
- BullMQ

### Database
- MongoDB Atlas

### Queue
- BullMQ
- Redis

### Deployment
- Vercel
- Render
- Railway Redis

---

## Architecture

```text
User
   ↓
React Frontend
   ↓
REST API + Socket.IO
   ↓
Node.js + Express Backend
   ↓
BullMQ Queue
   ↓
Worker
   ↓
AI Provider
   ↓
MongoDB + Redis
```

---

## Repository Structure

```text
poiroAssignment
│
├── backend
│   ├── src
│   │   ├── config
│   │   ├── controllers
│   │   ├── middlewares
│   │   ├── models
│   │   ├── queue
│   │   ├── routes
│   │   └── socket
│   │
│   ├── server.js
│   └── package.json
│
├── frontend
│   ├── src
│   │   ├── api
│   │   ├── components
│   │   ├── pages
│   │   ├── socket
│   │   ├── store
│   │   ├── main.jsx
│   │   └── index.css
│   │
│   ├── vite.config.js
│   └── package.json
│
├── README.md
└── .env.example
```

---

## Database Entity Model

### User

```text
id
name
email
password
role
```

### Room

```text
id
roomCode
hostId
challenge
status
```

### Participant

```text
id
roomId
userId
```

### Round

```text
id
roomId
roundNumber
status
```

### Submission

```text
id
userId
prompt
generatedOutput
score
status
```

### Job

```text
id
submissionId
status
```

---

## Realtime Event Model

### Client → Server

```javascript
join-room
start-round
submit-prompt
score-submission
```

### Server → Client

```javascript
room-updated
round-started
job-queued
job-running
job-completed
job-failed
score-updated
```

---

## Generation Job Lifecycle

```text
Participant submits prompt
        ↓
Submission created
        ↓
BullMQ Job created
        ↓
Redis Queue
        ↓
Worker picks job
        ↓
AI generation starts
        ↓
Database updates
        ↓
Socket event emitted
        ↓
Frontend updates instantly
```

---

## Battle Mechanism

Participants submit prompts according to the challenge.

Host manually scores outputs based on:

- Creativity
- Prompt quality
- Relevance
- Originality

### Weaknesses

- Subjective evaluation
- Human bias possible

### Production Improvements

- AI-assisted judging
- Weighted ranking system
- Community voting

---

## Persistence

Persisted:

- Users
- Rooms
- Participants
- Rounds
- Submissions
- Job states
- Scores

Refresh does not lose:

- Room state
- Challenge
- Participants
- Submission history
- Generated outputs
- Leaderboard

---

## Failure Handling

Implemented handling for:

- Invalid prompts
- Failed AI jobs
- Queue failures
- Socket disconnects
- Backend validation failures

---

## Local Setup

Clone repository:

```bash
git clone https://github.com/suryaKumar2408/poiroAssignment.git
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Backend:

```bash
cd backend
npm install
npm run dev
```

---

## Environment Variables

### Backend

```env
PORT=4000
MONGODB_URI=
REDIS_URL=
JWT_SECRET=
OPENROUTER_API_KEY=
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

---

## .env.example

```env
PORT=
MONGODB_URI=
REDIS_URL=
JWT_SECRET=
OPENROUTER_API_KEY=
ALLOWED_ORIGINS=
```

---

## Known Limitations

- Single-round implementation
- Basic scoring system
- Limited validations
- No advanced moderation
- No image generation

---

## Improvements With More Time

- AI judging system
- Image generation support
- Retry mechanism
- Spectator mode
- Reconnect recovery
- Multiple battle formats
- Automated tests

---

## Test Flow

```text
Login
↓
Create Room
↓
Enter Challenge
↓
Join Room
↓
Start Round
↓
Submit Prompt
↓
Queued
↓
Running
↓
Completed
↓
Score
↓
Leaderboard
```

---

## Author

Surya Kumar

Email:
suryashukla2408@gmail.com

GitHub:
https://github.com/suryaKumar2408
