import React, { useEffect, useState, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import { getRoomState } from '../api/room.api'
import { startRound, endRound } from '../api/round.api'
import { createSubmission } from '../api/submission.api'
import { submitScore } from '../api/score.api'
import { connectToRoom, disconnectSocket } from '../socket/socket'

export default function BattleRoom() {
  const { code } = useParams()
  const navigate = useNavigate()
  
  const {
    user,
    room,
    participants,
    currentRound,
    submissions,
    scores,
    restoreRoomState,
    addParticipant,
    addRound,
    updateSubmission,
    addSubmission,
    setScores,
    roomError,
    setRoomError,
    clearRoomError
  } = useStore()

  const [loading, setLoading] = useState(true)
  const [promptInput, setPromptInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  
  // Ref for socket to manage listeners
  const socketRef = useRef(null)

  // Initialization & Socket setup
  useEffect(() => {
    let mounted = true
    clearRoomError()

    const handleParticipantJoined = (data) => {
      if (data.participants) {
         useStore.getState().setParticipants(data.participants)
      } else if (data.user) {
         addParticipant(data.user)
      }
    }

    const handleRoomUpdated = (data) => {
      useStore.getState().updateRoom(data)
    }

    const handleRoundStarted = (round) => {
      useStore.getState().updateRound(round)
    }

    const handleRoundEnded = (data) => {
      if (data?.round) useStore.getState().updateRound(data.round)
    }

    const handleSubmissionQueued = (data) => {
      const submissionsList = useStore.getState().submissions
      const exists = submissionsList.some(s => 
        (s._id || s.id) === data.submissionId || 
        (s.prompt === data.prompt && (s.user?._id === data.user?.id || s.user?.id === data.user?.id || s.user?.username === data.user?.username))
      )
      if (!exists) {
        addSubmission({
          _id: data.submissionId,
          jobId: data.jobId,
          jobStatus: data.jobStatus || 'queued',
          user: { _id: data.user?.id, id: data.user?.id, username: data.user?.username },
          round: data.roundId,
          prompt: data.prompt,
          createdAt: new Date().toISOString()
        })
      } else {
        // Update existing matching (optimistic) submission with real IDs
        const matchingSub = submissionsList.find(s => 
          (s._id || s.id) === data.submissionId || 
          (s.prompt === data.prompt && (s.user?._id === data.user?.id || s.user?.id === data.user?.id || s.user?.username === data.user?.username))
        )
        if (matchingSub) {
          updateSubmission(matchingSub._id || matchingSub.id, {
            _id: data.submissionId,
            id: data.submissionId,
            jobId: data.jobId,
            jobStatus: data.jobStatus || 'queued',
            user: { _id: data.user?.id, id: data.user?.id, username: data.user?.username },
            round: data.roundId
          })
        }
      }
    }

    const handleSubmissionProcessing = (data) => {
      updateSubmission(data.submissionId, { jobStatus: data.jobStatus })
    }

    const handleSubmissionCompleted = (data) => {
      updateSubmission(data.submissionId, { jobStatus: data.jobStatus, aiOutput: data.aiOutput })
    }

    const handleSubmissionFailed = (data) => {
      updateSubmission(data.submissionId, { jobStatus: data.jobStatus, errorMessage: data.error })
    }

    const handleLeaderboardUpdated = (data) => {
      setScores(data.leaderboard)
    }
    
    async function initRoom() {
      try {
        setLoading(true)
        // Fetch current room state
        const res = await getRoomState(code)
        if (mounted) {
          restoreRoomState(res.data)
          
          // Connect to socket
          const socket = connectToRoom(code)
          socketRef.current = socket
          
          // Attach listeners
          socket.on('participant:joined', handleParticipantJoined)
          socket.on('room-updated', handleRoomUpdated)
          socket.on('round-started', handleRoundStarted)
          socket.on('round:started', (data) => {
            if (data?.round) useStore.getState().updateRound(data.round)
          })
          socket.on('round:ended', handleRoundEnded)
          socket.on('round-ended', handleRoundEnded)
          socket.on('submission:queued', handleSubmissionQueued)
          socket.on('submission-created', handleSubmissionQueued)
          socket.on('job-queued', handleSubmissionQueued)
          socket.on('submission:processing', handleSubmissionProcessing)
          socket.on('job-running', handleSubmissionProcessing)
          socket.on('submission:completed', handleSubmissionCompleted)
          socket.on('job-completed', handleSubmissionCompleted)
          socket.on('submission:failed', handleSubmissionFailed)
          socket.on('job-failed', handleSubmissionFailed)
          socket.on('leaderboard:updated', handleLeaderboardUpdated)
          socket.on('score-updated', handleLeaderboardUpdated)
        }
      } catch (err) {
        if (mounted) {
          setRoomError(err.response?.data?.message || 'Failed to load room')
          // navigate('/home') // Maybe wait a few seconds before redirecting
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }
    
    initRoom()
    
    return () => {
      mounted = false
      if (socketRef.current) {
        const socketObj = socketRef.current
        socketObj.off('participant:joined', handleParticipantJoined)
        socketObj.off('room-updated', handleRoomUpdated)
        socketObj.off('round-started', handleRoundStarted)
        socketObj.off('round:started')
        socketObj.off('round:ended', handleRoundEnded)
        socketObj.off('round-ended', handleRoundEnded)
        socketObj.off('submission:queued', handleSubmissionQueued)
        socketObj.off('submission-created', handleSubmissionQueued)
        socketObj.off('job-queued', handleSubmissionQueued)
        socketObj.off('submission:processing', handleSubmissionProcessing)
        socketObj.off('job-running', handleSubmissionProcessing)
        socketObj.off('submission:completed', handleSubmissionCompleted)
        socketObj.off('job-completed', handleSubmissionCompleted)
        socketObj.off('submission:failed', handleSubmissionFailed)
        socketObj.off('job-failed', handleSubmissionFailed)
        socketObj.off('leaderboard:updated', handleLeaderboardUpdated)
        socketObj.off('score-updated', handleLeaderboardUpdated)
      }
      disconnectSocket()
    }
  }, [code, clearRoomError, restoreRoomState, addParticipant, addRound, updateSubmission, setScores, setRoomError])

  const isHost = room?.host?.id === user?.id || room?.host?._id === user?.id

  // Actions
  const handleStartRound = async () => {
    try {
      await startRound(code)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to start round')
    }
  }

  const handleEndRound = async () => {
    if (!currentRound) return
    try {
      await endRound(currentRound._id || currentRound.id)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to end round')
    }
  }

  const handleSubmitPrompt = async (e) => {
    e.preventDefault()
    if (!promptInput.trim() || !currentRound) return
    
    try {
      setSubmitting(true)
      // Create a temporary optimistic submission object
      const tempId = `temp-${Date.now()}`
      const optimisticSub = {
        _id: tempId,
        user: { _id: user.id, username: user.username },
        round: currentRound._id,
        prompt: promptInput,
        jobStatus: 'queued', // Optimistic state
        createdAt: new Date().toISOString()
      }
      addSubmission(optimisticSub)
      
      const res = await createSubmission({
        roomCode: code,
        roundId: currentRound._id || currentRound.id,
        prompt: promptInput
      })
      
      // Update temp submission with real ID from server
      if (res.data?.submission) {
         updateSubmission(tempId, { _id: res.data.submission._id, ...res.data.submission })
      }
      setPromptInput('')
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit prompt')
    } finally {
      setSubmitting(false)
    }
  }

  const handleScore = async (submissionId, score) => {
    try {
       await submitScore({
         roomCode: code,
         roundId: currentRound._id || currentRound.id,
         submissionId,
         score
       })
    } catch (err) {
       alert(err.response?.data?.message || 'Failed to submit score')
    }
  }

  // Aggregate scores by user
  const aggregatedLeaderboard = useMemo(() => {
    const userScores = {}
    scores.forEach(entry => {
      const userId = entry.user?._id || entry.user?.id || 'unknown'
      const username = entry.user?.username || 'Unknown'
      if (!userScores[userId]) {
        userScores[userId] = { userId, username, score: 0 }
      }
      userScores[userId].score += entry.score || 0
    })
    return Object.values(userScores).sort((a, b) => b.score - a.score)
  }, [scores])

  if (loading) return <div className="loading-screen">Loading Room...</div>
  if (roomError) return <div className="error-screen"><h2>Error: {roomError}</h2><button className="btn btn-primary" onClick={() => navigate('/home')}>Go Home</button></div>

  // Filter submissions for current round
  const currentRoundSubmissions = currentRound 
    ? submissions.filter(s => s.round === currentRound._id || s.round?._id === currentRound._id)
    : []

  return (
    <div className="battle-room">
      <header className="room-header">
        <div className="room-info">
          <h1>Room: {code}</h1>
          {room?.challenge && (
            <div style={{ marginTop: '0.5rem', color: 'var(--primary-dark)', fontWeight: '600' }}>
              Challenge: <span style={{ color: 'var(--text-primary)', fontWeight: '400' }}>{room.challenge}</span>
            </div>
          )}
          <span className="participant-count" style={{ display: 'block', marginTop: '0.25rem' }}>{participants.length} Participant(s)</span>
        </div>
        <div className="user-info">
          <span className="role-badge">{isHost ? 'Host' : 'Player'}</span>
          <span>{user?.username}</span>
        </div>
      </header>
      
      <div className="room-layout">
        <main className="main-battle-area">
          {/* Round Control / Status */}
          <div className="round-panel glass-panel">
            {isHost ? (
              <div className="host-controls">
                <h3>Host Panel</h3>
                {!currentRound || currentRound.status === 'completed' ? (
                  <button className="btn btn-primary" onClick={handleStartRound}>
                    Start New Round
                  </button>
                ) : (
                  <div className="active-round-status" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <p>Round Active: Waiting for submissions...</p>
                    <button className="btn btn-danger" onClick={handleEndRound}>
                      End Current Round
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="player-status">
                <h3>Game Status</h3>
                {!currentRound || currentRound.status === 'completed' ? (
                  <p>Waiting for host to start the round...</p>
                ) : (
                  <div className="prompt-entry">
                    <p>Round started! Enter your AI prompt below.</p>
                    <form onSubmit={handleSubmitPrompt} className="prompt-form">
                      <textarea
                        value={promptInput}
                        onChange={(e) => setPromptInput(e.target.value)}
                        placeholder="e.g. A futuristic cyberpunk city at night with neon lights"
                        disabled={submitting}
                        rows={3}
                      />
                      <button type="submit" className="btn btn-primary" disabled={submitting || !promptInput.trim()}>
                        {submitting ? 'Submitting...' : 'Submit Prompt'}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Live Submissions Area */}
          <div className="submissions-panel">
             <h3>Live Generations</h3>
             {currentRoundSubmissions.length === 0 ? (
               <p className="no-data">No submissions yet for this round.</p>
             ) : (
               <div className="submissions-grid">
                 {currentRoundSubmissions.map(sub => (
                   <div key={sub._id || sub.id} className="submission-card glass-panel">
                     <div className="sub-header">
                       <span className="sub-user">{sub.user?.username || 'Unknown'}</span>
                       <span className={`status-badge status-${sub.jobStatus?.toLowerCase()}`}>
                         {sub.jobStatus}
                       </span>
                     </div>
                     <div className="sub-prompt">"{sub.prompt}"</div>
                     
                     {sub.jobStatus?.toLowerCase() === 'completed' && sub.aiOutput && (
                       <div className="sub-result" style={{ padding: '1rem', background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '8px', marginTop: '1rem', fontSize: '0.9rem', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                         {sub.aiOutput}
                       </div>
                     )}
                     
                     {/* Host Scoring Controls */}
                     {isHost && sub.jobStatus?.toLowerCase() === 'completed' && (
                       <div className="score-controls">
                          <span>Rate:</span>
                          {[1,2,3,4,5].map(score => (
                            <button 
                              key={score}
                              className="btn-score"
                              onClick={() => handleScore(sub._id || sub.id, score)}
                            >
                              {score}
                            </button>
                          ))}
                       </div>
                     )}
                   </div>
                 ))}
               </div>
             )}
          </div>
        </main>
        
        <aside className="sidebar">
          {/* Leaderboard */}
          <div className="leaderboard glass-panel">
            <h3>Leaderboard</h3>
            {aggregatedLeaderboard.length === 0 ? (
              <p className="no-data">No scores yet.</p>
            ) : (
              <ul className="score-list">
                {aggregatedLeaderboard.map((scoreEntry, index) => (
                  <li key={scoreEntry.userId} className="score-item">
                    <span className="rank">#{index + 1}</span>
                    <span className="name">{scoreEntry.username}</span>
                    <span className="score">{(scoreEntry.score !== undefined && scoreEntry.score !== null) ? scoreEntry.score : 0} pts</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          {/* Participants */}
          <div className="participants glass-panel mt-4">
             <h3>Participants</h3>
             <ul className="participant-list">
               {participants.map(p => (
                 <li key={p._id || p.id}>
                    {p.username} {room?.host?._id === p._id && '(Host)'}
                 </li>
               ))}
             </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}
