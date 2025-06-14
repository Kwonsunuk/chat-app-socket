// backend/server.js
import cors from 'cors';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

const activeNames = new Set();
const rooms = new Set();
const roomUsers = new Map();
const roomHistory = new Map();
const MAX_HISTORY = 100;

// 1) 이름 중복 확인용 REST API
app.get('/check-name', (req, res) => {
  const name = req.query.name;
  if (!name) {
    return res.status(400).json({ available: false, message: '이름을 보내주세요' });
  }
  res.json({ available: !activeNames.has(name) });
});

io.on('connection', (socket) => {
  const { name } = socket.handshake.query;

  // --- 타이핑 이벤트 처리 추가 ---
  socket.on('typing', ({ room, user }) => {
    socket.to(room).emit('typing', user);
  });
  socket.on('stop typing', ({ room, user }) => {
    socket.to(room).emit('stop typing', user);
  });
  // -----------------------------------

  activeNames.add(name);
  // 방 목록 요청
  socket.on('request room list', () => {
    socket.emit('room list', Array.from(rooms));
  });

  // 방 입장
  socket.on('join room', ({ room, user }) => {
    const roomName = room.trim();
    if (!roomName) {
      socket.emit('join error', '유효하지 않은 방 이름입니다.');
      return;
    }
    // 신규 방 생성 시
    if (!rooms.has(roomName)) {
      rooms.add(roomName);
      io.emit('room list', Array.from(rooms));
    }
    socket.join(roomName);
    // 사용자 목록 관리
    if (!roomUsers.has(roomName)) roomUsers.set(roomName, new Set());
    roomUsers.get(roomName).add(user);
    io.in(roomName).emit('user list', Array.from(roomUsers.get(roomName)));
    // 이력 전송
    const history = roomHistory.get(roomName) || [];
    socket.emit('room history', history);
  });

  // 메시지 송신
  socket.on('chat message', ({ room, user, text }) => {
    const msg = { user, text, time: Date.now() };
    if (!roomHistory.has(room)) roomHistory.set(room, []);
    const hist = roomHistory.get(room);
    hist.push(msg);
    if (hist.length > MAX_HISTORY) hist.shift();
    io.in(room).emit('chat message', msg);
  });

  // 방 퇴장
  socket.on('leave room', (room) => {
    socket.leave(room);
    if (roomUsers.has(room)) {
      roomUsers.get(room).delete(socket.handshake.query.name);
      io.in(room).emit('user list', Array.from(roomUsers.get(room)));
    }
  });

  // 이력 재요청
  socket.on('request room history', (room) => {
    const history = roomHistory.get(room) || [];
    socket.emit('room history', history);
  });

  // 연결 해제 시 사용자 목록 정리
  socket.on('disconnect', () => {
    activeNames.delete(name);
    rooms.forEach((r) => {
      if (roomUsers.has(r) && roomUsers.get(r).delete(socket.handshake.query.name)) {
        io.in(r).emit('user list', Array.from(roomUsers.get(r)));
      }
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Socket.IO 서버 실행 중 ➤ 포트 ${PORT}`));
