# Poiro AI Creative Battle Room

A real-time multiplayer AI battle room where users compete through AI-generated creative challenges. Participants join rooms, submit prompts, receive generated outputs, and compete on a live leaderboard.

---

## Live Demo

Live App:
https://poiro-assignment.vercel.app


Demo Video:
https://drive.google.com/file/d/1iM9kwrronGHoFpZlM7-bXL1bln1tKHWK/view?usp=sharing

GitHub Repository:
https://github.com/suryaKumar2408/poiroAssignment

---

# Project Overview

This project implements a complete battle workflow:

1. Host creates a room
2. Host creates a challenge
3. Participants join via room code
4. Host starts the round
5. Participants submit prompts
6. Backend creates asynchronous generation jobs
7. Jobs execute independently
8. Results update in real time
9. Host scores submissions
10. Leaderboard updates instantly

---

# Architecture Overview

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
Worker Process
   ↓
AI Provider
   ↓
MongoDB + Redis
```

---

# Tech Stack

## Frontend

- React.js
- Vite
- Tailwind CSS
- Zustand
- Axios
- Socket.IO Client

## Backend

- Node.js
- Express.js
- Socket.IO
- JWT Authentication
- BullMQ

## Database

- MongoDB Atlas

## Queue

- Redis
- BullMQ

## Deployment

- Frontend → Vercel
- Backend → Render
- Redis → Railway

---

# Database Schema / Entity Model

## User

```text
id
name
email
password
role
```

## Room

```text
id
roomCode
hostId
challenge
status
```

## Participant

```text
id
roomId
userId
```

## Round

```text
id
roomId
roundNumber
status
```

## Submission

```text
id
userId
prompt
generatedOutput
score
status
```

## Job

```text
id
submissionId
status
```

---

# Role and Permission Logic

## Host Permissions

- Create room
- Add challenge
- Start rounds
- Score submissions
- Control room lifecycle

## Participant Permissions

- Join room
- Submit prompts
- View generated outputs

Permissions are enforced on the backend and not only on the frontend.

---

# Realtime Event Model

## Client → Server

```javascript
join-room
start-round
submit-prompt
score-submission
```

## Server → Client

```javascript
room-updated
round-started
job-queued
job-running
job-completed
job-failed
score-updated
leaderboard-updated
```

---

# Generation Job Lifecycle

```text
User submits prompt
        ↓
Submission created
        ↓
BullMQ job created
        ↓
Redis queue
        ↓
Worker picks job
        ↓
AI provider executes generation
        ↓
Database updates
        ↓
Socket event emitted
        ↓
Frontend updates automatically
```

Job states:

- Queued
- Running
- Completed
- Failed

---

# Chosen Judging / Scoring Mechanism

Current implementation uses manual scoring by the host.

Scoring criteria:

- Creativity
- Relevance to challenge
- Prompt quality
- Originality

Reason:

Manual scoring keeps the implementation simple and allows focus on completing the main battle loop.

---

# Persistence Strategy

## Persisted Data

- Users
- Rooms
- Participants
- Rounds
- Submissions
- Scores
- Job states

## Not Persisted

- Temporary socket connections
- Active connection IDs
- Frontend in-memory state

Refreshing pages does not lose:

- Current room
- Participants
- Challenge
- Submission history
- Leaderboard state

---

# AI / Provider Assumptions

Current assumptions:

- AI provider returns valid responses
- Queue jobs execute correctly
- AI response time remains acceptable
- Provider service remains available

Current Provider:

- OpenRouter API

---

# Failure Handling Strategy

Handled failures include:

### Validation Failures

- Empty prompts
- Invalid room codes
- Invalid challenge data

### Queue Failures

- Failed jobs move into failed state

### Socket Failures

- Automatic reconnect handling

### API Failures

- Error responses shown in UI

---

# Tradeoffs

### Node.js backend instead of Python

Reason:

Node.js aligns with my existing tech stack and enabled faster implementation of:

- Real-time Socket.IO communication
- Queue processing
- Event handling

### Manual scoring

Reason:

Keeps focus on the core battle workflow.

### Text generation instead of media generation

Reason:

The assignment prioritizes a complete playable loop over a production media pipeline.

---

# Known Limitations

- Single-round implementation
- Basic leaderboard logic
- Limited validation rules

The following were intentionally not implemented because they were outside assignment scope:

- Production-grade authentication
- Full media generation pipeline
- Advanced moderation systems
- Large-scale infrastructure
- Multiple tournament formats

---

# Improvements With More Time

- Spectator mode with reactions
- Retry/backoff for failed jobs
- Real image/media generation
- Reconnect recovery for WebSockets
- Event-sourced room activity log
- Automated backend tests
- Advanced tournament formats

---

# Local Setup Instructions

Clone repository:

```bash
git clone https://github.com/suryaKumar2408/poiroAssignment.git
```

Backend setup:

```bash
cd backend
npm install
npm run dev
```

Frontend setup:

```bash
cd frontend
npm install
npm run dev
```

---

# Environment Variables

Create:

`.env`

Example:

```env
PORT=4000

MONGODB_URI=

REDIS_URL=

JWT_SECRET=

OPENROUTER_API_KEY=

ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

---

# Main Battle Flow

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
Score Submission
↓
Leaderboard Update
```

---

# Author

Surya Kumar

Email: suryashukla2408@gmail.com

GitHub:
https://github.com/suryaKumar2408
