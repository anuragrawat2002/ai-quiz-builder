import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user, token } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnected(false);
      }
      return;
    }

    const socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('✅ Socket connected');
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
      setConnected(false);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      setConnected(false);
    };
  }, [token, user]);

  const joinQuizRoom = (quizId) => {
    if (socketRef.current && user) {
      socketRef.current.emit('join-quiz-room', {
        quizId,
        userId: user._id,
        userName: user.name,
        role: user.role,
      });
    }
  };

  const leaveQuizRoom = (quizId) => {
    if (socketRef.current) {
      socketRef.current.emit('leave-quiz-room', { quizId });
    }
  };

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current,
      connected,
      joinQuizRoom,
      leaveQuizRoom,
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
