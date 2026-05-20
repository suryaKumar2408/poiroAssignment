import { create } from 'zustand'

const useStore = create((set, get) => ({
  // ─── Auth ────────────────────────────────────────────────────────────────────
  user: null,
  isAuthenticated: false,
  authLoading: true,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setAuthLoading: (val) => set({ authLoading: val }),
  logout: () => set({
    user: null,
    isAuthenticated: false,
    room: null,
    participants: [],
    rounds: [],
    currentRound: null,
    submissions: [],
    scores: [],
  }),

  // ─── Room ────────────────────────────────────────────────────────────────────
  room: null,
  participants: [],

  setRoom: (room) => set({ room }),
  setParticipants: (participants) => set({ participants }),

  addParticipant: (user) => set((state) => {
    const already = state.participants.some(p => p.id === user.id || p._id === user.id)
    if (already) return state
    return { participants: [...state.participants, user] }
  }),

  // ─── Rounds ──────────────────────────────────────────────────────────────────
  rounds: [],
  currentRound: null,

  setRounds: (rounds) => {
    const active = rounds.find(r => r.status === 'active') || rounds[rounds.length - 1] || null
    set({ rounds, currentRound: active })
  },

  addRound: (round) => set((state) => ({
    rounds: [...state.rounds, round],
    currentRound: round,
  })),

  updateRound: (updatedRound) => set((state) => ({
    rounds: state.rounds.map(r => r._id === updatedRound.id ? { ...r, ...updatedRound } : r),
    currentRound:
      state.currentRound?._id === updatedRound.id
        ? { ...state.currentRound, ...updatedRound }
        : state.currentRound,
  })),

  // ─── Submissions ─────────────────────────────────────────────────────────────
  submissions: [],

  setSubmissions: (submissions) => set({ submissions }),

  addSubmission: (submission) => set((state) => ({
    submissions: [submission, ...state.submissions],
  })),

  updateSubmission: (submissionId, updates) => set((state) => ({
    submissions: state.submissions.map(s =>
      (s._id === submissionId || s.id === submissionId)
        ? { ...s, ...updates }
        : s
    ),
  })),

  // ─── Scores / Leaderboard ────────────────────────────────────────────────────
  scores: [],

  setScores: (scores) => set({ scores }),

  // ─── UI State ────────────────────────────────────────────────────────────────
  roomError: null,
  setRoomError: (msg) => set({ roomError: msg }),
  clearRoomError: () => set({ roomError: null }),

  // Restore everything after page refresh
  restoreRoomState: ({ room, participants, rounds, submissions, scores }) => {
    const active = rounds.find(r => r.status === 'active') || rounds[rounds.length - 1] || null
    set({
      room,
      participants: participants || [],
      rounds: rounds || [],
      currentRound: active,
      submissions: submissions || [],
      scores: scores || [],
    })
  },
}))

export default useStore
