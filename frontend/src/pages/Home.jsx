import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createRoom, joinRoom } from '../api/room.api'
import useStore from '../store/useStore'

export default function Home() {
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [challenge, setChallenge] = useState('')
  const [roundDuration, setRoundDuration] = useState(60)
  const [validationError, setValidationError] = useState('')

  const navigate = useNavigate()
  const { user } = useStore()

  const handleCreateRoomSubmit = async (e) => {
    e.preventDefault()
    if (!challenge.trim()) {
      setValidationError('Challenge is required')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setValidationError('')
      
      const res = await createRoom({
        challenge: challenge.trim(),
        roundDuration: Number(roundDuration) || 60
      })
      
      const roomData = res.data.room
      useStore.getState().setRoom(roomData)
      const roomCode = roomData.code
      navigate(`/room/${roomCode}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create room')
      setLoading(false)
    }
  }

  const handleJoinRoom = async (e) => {
    e.preventDefault()
    if (!joinCode.trim()) return

    try {
      setLoading(true)
      setError(null)
      const res = await joinRoom(joinCode)
      const roomData = res.data.room
      useStore.getState().setRoom(roomData)
      const roomCode = roomData.code
      navigate(`/room/${roomCode}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join room. Please check the code.')
      setLoading(false)
    }
  }

  return (
    <div className="home-container auth-container">
      <div className="auth-card" style={{ maxWidth: '600px', width: '100%' }}>
        <div className="auth-header">
          <h2>Welcome, {user?.username || 'User'}!</h2>
          <p>Ready for the next AI battle?</p>
        </div>

        {error && <div className="auth-error alert alert-error" style={{ marginTop: '1rem' }}>{error}</div>}

        <div className="home-actions" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginTop: '2rem' }}>
          {/* Create Room Section */}
          <div className="action-section" style={{ padding: '1.5rem', background: 'var(--bg-input)', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Start a New Game</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Host a new AI battle room and invite others to join.</p>
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '1rem' }} 
              onClick={() => {
                setChallenge('')
                setRoundDuration(60)
                setValidationError('')
                setIsModalOpen(true)
              }}
              disabled={loading}
            >
              Create Room
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
            <span style={{ margin: '0 1rem' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
          </div>

          {/* Join Room Section */}
          <div className="action-section" style={{ padding: '1.5rem', background: 'var(--bg-input)', borderRadius: '12px', border: '1px solid var(--border)' }}>
             <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Join Existing Game</h3>
             <form onSubmit={handleJoinRoom} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <input
                    type="text"
                    placeholder="Enter Room Code (e.g. A1B2C3)"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    disabled={loading}
                    className="input"
                    style={{ textAlign: 'center', letterSpacing: '2px', fontSize: '1.2rem', padding: '1rem' }}
                  />
                </div>
                <button 
                  type="submit" 
                  className="btn btn-ghost" 
                  style={{ width: '100%', padding: '1rem' }}
                  disabled={loading || !joinCode.trim()}
                >
                  {loading ? 'Joining...' : 'Join Room'}
                </button>
             </form>
          </div>
        </div>
      </div>

      {/* Premium Create Room Modal */}
      {isModalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, animation: 'fadeIn 0.2s ease' }}>
          <div className="modal glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
            <h2 style={{ marginBottom: '0.5rem', color: 'var(--primary-dark)' }}>Configure Battle</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Define the challenge and time limits for your arena.</p>

            {validationError && (
              <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                {validationError}
              </div>
            )}

            <form onSubmit={handleCreateRoomSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label className="auth-label" style={{ fontWeight: '600' }}>Challenge <span style={{ color: 'var(--danger)' }}>*</span></label>
                <textarea
                  placeholder="Create the most insane luxury cyberpunk perfume campaign for Gen-Z"
                  value={challenge}
                  onChange={(e) => {
                    setChallenge(e.target.value)
                    if (e.target.value.trim()) setValidationError('')
                  }}
                  className="input"
                  rows={4}
                  style={{ resize: 'none', padding: '0.75rem', fontSize: '0.95rem' }}
                  required
                />
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label className="auth-label" style={{ fontWeight: '600' }}>Round Duration (seconds)</label>
                <input
                  type="number"
                  min="10"
                  max="3600"
                  value={roundDuration}
                  onChange={(e) => setRoundDuration(e.target.value)}
                  className="input"
                  style={{ padding: '0.75rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button 
                  type="button" 
                  className="btn btn-ghost" 
                  style={{ flex: 1, padding: '0.75rem' }} 
                  onClick={() => setIsModalOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 1, padding: '0.75rem' }}
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Launch Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
