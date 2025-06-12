import cors from 'cors';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

// 앱 및 서버 초기화
const app = express(); // Express 인스턴스 생성
app.use(cors()); // 모든 도메인 요청 허용

const httpServer = createServer(app); // Express 앱을 HTTP 서버로 변환
const userMap = new Map(); // 소켓 연결 시 사용자 이름을 저장할 Map 구조 생성

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
    userMap.set(socket.id, name); // 입장과 동시에 userMap에 사용자 소켓 아이디와 이름 저장
    socket.broadcast.emit('system message', `${name}님이 입장했습니다`);
    broadcastUserList();
  });

  // 연결 해제 시 이벤트 처리
  socket.on('disconnect', (reason) => {
    const name = userMap.get(socket.id);
    console.log(`🔌 연결 종료됨: ${socket.id}, 이름: ${name}, 사유: ${reason}`);
    if (name) {
      /*
        🔍 왜 socket.broadcast.emit()은 퇴장 메시지에 실패할까?

        socket.broadcast.emit()은 해당 소켓(연결된 클라이언트)을 제외한
        다른 모든 클라이언트에게 메시지를 보낸다.
        그러나 disconnect 이벤트 시점에는 socket 객체가 곧 연결 종료되기 때문에
        내부 상태가 완전히 유지되지 않을 수 있다.

        즉, 연결이 끊어지는 순간에는 해당 소켓의 broadcast 기능이 안정적으로 동작하지 않을 수 있다.
        이 때문에 퇴장 메시지가 다른 클라이언트에게 전달되지 않는 경우가 발생한다.

        반면 io.emit()은 특정 소켓에 의존하지 않고,
        서버 전체에 연결된 모든 클라이언트에게 메시지를 보내는 방식이다.
        따라서 disconnect 직전에도 안정적으로 브로드캐스트할 수 있어,
        퇴장 알림 메시지에는 io.emit()이 더 안전한 선택이라고 생각한다.
      */
      io.emit('system message', `${name}님이 퇴장했습니다`);
      userMap.delete(socket.id);
      broadcastUserList();
    }
  });
});

function broadcastUserList() {
  const userList = Array.from(userMap.values());
  io.emit('user list', userList);
}

// 서버 시작
const PORT = process.env.PORT || 3000; // 포트 설정
httpServer.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT}에서 실행 중입니다`); // 서버 시작 메시지
});
