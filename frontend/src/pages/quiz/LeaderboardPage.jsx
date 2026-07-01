import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Trophy, Medal, Users, Clock, RefreshCw, ArrowLeft, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { attemptService } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';

const RankBadge = ({ rank }) => {
  if (rank === 1) return <span className="text-2xl">🥇</span>;
  if (rank === 2) return <span className="text-2xl">🥈</span>;
  if (rank === 3) return <span className="text-2xl">🥉</span>;
  return <span className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-sm font-bold text-gray-400">#{rank}</span>;
};

export default function LeaderboardPage() {
  const { id } = useParams();
  const { socket, joinQuizRoom, leaveQuizRoom } = useSocket();
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [quiz, setQuiz] = useState(null);
  const [participants, setParticipants] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [flash, setFlash] = useState(null); // newly submitted student

  const fetchLeaderboard = useCallback(async () => {
    try {
      const { data } = await attemptService.getLeaderboard(id);
      setLeaderboard(data.leaderboard || []);
      setQuiz(data.quiz);
      setLastUpdate(new Date());
    } catch {
      toast.error('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchLeaderboard();
    joinQuizRoom(id);

    return () => leaveQuizRoom(id);
  }, [id]);

  // Real-time Socket.io events
  useEffect(() => {
    if (!socket) return;

    socket.on('leaderboard-update', ({ leaderboard: lb, newSubmission }) => {
      setLeaderboard(lb || []);
      setLastUpdate(new Date());
      if (newSubmission) {
        setFlash(newSubmission.studentId);
        setTimeout(() => setFlash(null), 3000);
        if (newSubmission.name !== user?.name) {
          toast(`${newSubmission.name} submitted — Rank #${newSubmission.rank}`, { icon: '⚡' });
        }
      }
    });

    socket.on('participant-count', ({ count }) => setParticipants(count));

    return () => {
      socket.off('leaderboard-update');
      socket.off('participant-count');
    };
  }, [socket, user]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-3 mt-4">
        {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-800 rounded-2xl skeleton" />)}
      </div>
    );
  }

  const myEntry = leaderboard.find(e => e.studentId === user?._id || e.studentId?.toString() === user?._id?.toString());

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to={user?.role === 'teacher' ? '/teacher' : '/student'}
          className="p-2 rounded-xl bg-gray-900 border border-gray-800 hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" /> Leaderboard
          </h1>
          {quiz && <p className="text-gray-400 text-sm">{quiz.title}</p>}
        </div>
        <button
          onClick={fetchLeaderboard}
          className="p-2 rounded-xl bg-gray-900 border border-gray-800 hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-white">{leaderboard.length}</p>
          <p className="text-xs text-gray-500">Submitted</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-white flex items-center justify-center gap-1">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse inline-block" />
            {participants}
          </p>
          <p className="text-xs text-gray-500">Online</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-white">{quiz?.totalMarks || 0}</p>
          <p className="text-xs text-gray-500">Max Marks</p>
        </div>
      </div>

      {/* Real-time indicator */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Zap className="w-3 h-3 text-indigo-400" />
        <span>Live updates via Socket.io</span>
        {lastUpdate && <span className="ml-auto">Last: {lastUpdate.toLocaleTimeString()}</span>}
      </div>

      {/* My rank (if student) */}
      {myEntry && user?.role === 'student' && (
        <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-4 flex items-center gap-3">
          <RankBadge rank={myEntry.rank} />
          <div className="flex-1">
            <p className="font-semibold text-white text-sm">Your Rank</p>
            <p className="text-gray-400 text-xs">{myEntry.score}/{quiz?.totalMarks} marks • {myEntry.percentage}%</p>
          </div>
          <span className="text-indigo-400 font-bold">#{myEntry.rank}</span>
        </div>
      )}

      {/* Leaderboard table */}
      {leaderboard.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
          <Trophy className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No submissions yet</p>
          <p className="text-gray-600 text-sm mt-1">Results will appear here in real-time</p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-gray-800 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <span className="col-span-1">Rank</span>
            <span className="col-span-5">Student</span>
            <span className="col-span-2 text-right">Score</span>
            <span className="col-span-2 text-right">%</span>
            <span className="col-span-2 text-right">Time</span>
          </div>

          <div className="divide-y divide-gray-800">
            {leaderboard.map((entry) => {
              const isMe = entry.studentId?.toString() === user?._id?.toString();
              const isFlashing = flash === entry.studentId?.toString() || flash === entry.studentId;
              const topThree = entry.rank <= 3;

              return (
                <div
                  key={entry.studentId}
                  className={`grid grid-cols-12 gap-2 px-4 py-3.5 items-center transition-all duration-500
                    ${isMe ? 'bg-indigo-500/5' : ''}
                    ${isFlashing ? 'bg-green-500/10' : ''}
                    ${topThree ? 'bg-amber-500/3' : ''}`}
                >
                  <div className="col-span-1 flex items-center justify-center">
                    <RankBadge rank={entry.rank} />
                  </div>

                  <div className="col-span-5 flex items-center gap-2 min-w-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                      ${isMe ? 'gradient-primary text-white' : 'bg-gray-800 text-gray-400'}`}>
                      {entry.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-medium truncate ${isMe ? 'text-indigo-300' : 'text-white'}`}>
                        {entry.name} {isMe && <span className="text-xs text-indigo-500">(you)</span>}
                      </p>
                      <p className={`text-xs ${entry.passed ? 'text-green-500' : 'text-red-500'}`}>
                        {entry.passed ? '✓ Passed' : '✗ Failed'}
                      </p>
                    </div>
                  </div>

                  <div className="col-span-2 text-right">
                    <span className="text-white font-bold text-sm">{entry.score}</span>
                    <span className="text-gray-600 text-xs">/{entry.totalMarks}</span>
                  </div>

                  <div className="col-span-2 text-right">
                    <span className={`font-semibold text-sm ${entry.percentage >= 80 ? 'text-green-400' : entry.percentage >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                      {entry.percentage}%
                    </span>
                  </div>

                  <div className="col-span-2 text-right text-xs text-gray-500">
                    {entry.submittedAt ? new Date(entry.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
