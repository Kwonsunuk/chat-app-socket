import cors from 'cors';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

// 앱 및 서버 초기화
const app = express(); // Express 인스턴스 생성
app.use(cors()); // 모든 도메인 요청 허용

const httpServer = createServer(app); // Express 앱을 HTTP 서버로 변환

// Socket.IO 서버 초기화
const io = new Server(httpServer, {
  cors: {
    origin: '*', // 모든 도메인에서의 요청 허용
    methods: ['GET', 'POST'], // 허용할 HTTP 메소드
  },
});

// 클라이언트 연결 시 이벤트 핸들러 등록
io.on('connection', (socket) => {
  console.log('새로운 연결', socket.id);

  socket.on('chat message', (msg) => {
    console.log('메시지 수신:', msg);
    // 프론트에서 받은 메시지를 모든 클라이언트에게 수신
    io.emit('chat message', msg);
  });

  // 사용자 입장 이벤트 처리
  socket.on('join', (name) => {
    socket.broadcast.emit('system message', `${name}님이 입장했습니다`);
  });

  // 연결 해제 시 이벤트 처리
  socket.on('disconnect', (reason) => {
    console.log('연결 해제', socket.id, reason);
  });
});

// 서버 시작
const PORT = process.env.PORT || 3000; // 포트 설정
httpServer.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT}에서 실행 중입니다`); // 서버 시작 메시지
});
