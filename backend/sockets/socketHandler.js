const Attempt = require('../models/Attempt');
const Quiz = require('../models/Quiz');

// Track active quiz rooms: { quizId: { participants: Map(socketId -> {userId, name}) } }
const quizRooms = new Map();

const initializeSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // ─── Join Quiz Room ──────────────────────────────────────────────────────
    socket.on('join-quiz-room', async ({ quizId, userId, userName, role }) => {
      const room = `quiz-${quizId}`;
      socket.join(room);

      // Track participant
      if (!quizRooms.has(quizId)) {
        quizRooms.set(quizId, { participants: new Map() });
      }
      const quizRoom = quizRooms.get(quizId);
      quizRoom.participants.set(socket.id, { userId, userName, role, joinedAt: new Date() });

      const participantCount = [...quizRoom.participants.values()].filter(
        (p) => p.role === 'student'
      ).length;

      // Notify everyone in room
      io.to(room).emit('participant-count', { count: participantCount });
      io.to(room).emit('user-joined', { userId, userName, role });

      console.log(`👤 ${userName} (${role}) joined room: ${room}`);

      // Send current leaderboard to the new joiner
      try {
        const leaderboard = await getLeaderboard(quizId);
        socket.emit('leaderboard-update', { leaderboard });
      } catch (_) {}
    });

    // ─── Leave Quiz Room ─────────────────────────────────────────────────────
    socket.on('leave-quiz-room', ({ quizId }) => {
      leaveRoom(socket, quizId, io);
    });

    // ─── Timer Sync (teacher broadcasts timer) ──────────────────────────────
    socket.on('timer-update', ({ quizId, timeLeft }) => {
      socket.to(`quiz-${quizId}`).emit('timer-sync', { timeLeft });
    });

    // ─── Quiz Status Change ──────────────────────────────────────────────────
    socket.on('quiz-status-change', ({ quizId, status }) => {
      io.to(`quiz-${quizId}`).emit('quiz-status-updated', { status });
    });

    // ─── Request Leaderboard ─────────────────────────────────────────────────
    socket.on('request-leaderboard', async ({ quizId }) => {
      try {
        const leaderboard = await getLeaderboard(quizId);
        socket.emit('leaderboard-update', { leaderboard });
      } catch (error) {
        socket.emit('error', { message: 'Failed to fetch leaderboard.' });
      }
    });

    // ─── Disconnect ──────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);

      // Clean up from all rooms
      quizRooms.forEach((room, quizId) => {
        if (room.participants.has(socket.id)) {
          const user = room.participants.get(socket.id);
          leaveRoom(socket, quizId, io, user);
        }
      });
    });
  });
};

// Helper: Leave a quiz room and update participant count
const leaveRoom = (socket, quizId, io, userOverride = null) => {
  const room = `quiz-${quizId}`;
  socket.leave(room);

  if (quizRooms.has(quizId)) {
    const quizRoom = quizRooms.get(quizId);
    const user = userOverride || quizRoom.participants.get(socket.id);
    quizRoom.participants.delete(socket.id);

    const participantCount = [...quizRoom.participants.values()].filter(
      (p) => p.role === 'student'
    ).length;

    io.to(room).emit('participant-count', { count: participantCount });
    if (user) {
      io.to(room).emit('user-left', { userId: user.userId, userName: user.userName });
    }

    // Cleanup empty rooms
    if (quizRoom.participants.size === 0) {
      quizRooms.delete(quizId);
    }
  }
};

// Helper: Fetch sorted leaderboard from DB
const getLeaderboard = async (quizId) => {
  const attempts = await Attempt.find({
    quizId,
    status: { $in: ['submitted', 'timed-out'] },
  })
    .populate('studentId', 'name email avatar')
    .sort({ score: -1, submittedAt: 1 })
    .lean();

  return attempts.map((attempt, index) => ({
    rank: index + 1,
    studentId: attempt.studentId._id,
    name: attempt.studentId.name,
    avatar: attempt.studentId.avatar,
    score: attempt.score,
    totalMarks: attempt.totalMarks,
    percentage: attempt.percentage,
    submittedAt: attempt.submittedAt,
    timeTaken: attempt.timeTaken,
    passed: attempt.passed,
  }));
};

module.exports = { initializeSocket };
