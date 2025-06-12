<template>
  <div class="chat-room">
    <h2>💬 실시간 채팅</h2>
    <p v-if="errorMessage" style="color: red">{{ errorMessage }}</p>

    <!-- [1] 사용자 이름 입력 영역 -->
    <!-- userName이 아직 설정되지 않았을 때만 보임 -->
    <div v-if="!userName" class="username-form">
      <!-- tempName에 사용자 입력 값을 저장 -->
      <input v-model="tempName" placeholder="이름을 입력하세요" />
      <!-- 확인 버튼 클릭 시 confirmName 함수 실행 -->
      <button @click="confirmName">입장</button>
    </div>

    <!-- [2] 채팅 메시지 영역 -->
    <!-- userName이 설정되면 채팅 UI가 보임 -->
    <div v-else>
      <!-- 수신된 메시지 목록 출력 -->
      <ul class="messages">
        <!-- messages 배열을 반복해서 각 메시지를 <li>로 출력 -->
        <!-- key 속성은 Vue가상 DOM 최적화를 위해 사용 -->
        <li v-for="(msg, index) in messages" :key="index">
          {{ msg.user }}: {{ msg.text }}
          <!-- 사용자명: 메시지 형식 -->
        </li>
      </ul>

      <!-- 메시지 입력 폼 -->
      <form @submit.prevent="sendMessage" class="chat-form">
        <!-- newMessage 값과 input 양방향 바인딩 -->
        <input v-model="newMessage" placeholder="메시지를 입력하세요" autocomplete="off" />
        <!-- 폼 제출 대신 버튼 클릭으로 전송 -->
        <button type="submit">전송</button>
      </form>
    </div>
  </div>
  <!-- 사용자 목록 출력 -->
  <div class="user-list">
    <h3>🧑 접속 중인 사용자</h3>
    <ul>
      <li v-for="(user, i) in users" :key="i">
        {{ user }}<span v-if="user === userName">(본인)</span>
      </li>
    </ul>
  </div>
</template>

<script setup>
// 📦 외부 라이브러리 및 Vue 기능 import
import { io } from 'socket.io-client'; // socket.io 클라이언트 모듈
import { onMounted, ref } from 'vue'; // 반응형 변수, 라이프사이클 훅

// 🔌 백엔드 소켓 서버 연결 (실무에선 URL을 .env로 분리 권장)
const socket = ref(null); // ✅ 반응형 소켓 변수로 선언

// 💬 messages: 서버로부터 받은 모든 채팅 메시지를 저장하는 반응형 배열
const messages = ref([]);

// ✏️ newMessage: 사용자가 입력 중인 메시지
const newMessage = ref('');

// 🙋‍♂️ userName: 현재 사용자의 이름 (확정된 값)
// 🕶️ tempName: 입력 중인 사용자 이름 (확정 전)
const userName = ref('');
const tempName = ref('');

// 유저 목록을 저장할 반응형 배열
const users = ref([]);

// 에러를 저장할 반응형 변수
const errorMessage = ref('');

// ✅ 사용자가 이름을 입력하고 "입장" 버튼을 누를 때 호출되는 함수
function confirmName() {
  if (tempName.value.trim()) {
    errorMessage.value = '';
    userName.value = tempName.value.trim();

    // ✅ 이름을 쿼리 파라미터로 포함해서 연결
    socket.value = io('http://localhost:3000', {
      query: { name: userName.value },
    });

    setupSocketEvents(); // 소켓 연결 후 이벤트 핸들러 등록
  }
}

// 📤 메시지 전송 함수: 전송 버튼 클릭 또는 엔터 시 실행
function sendMessage() {
  // 빈 문자열이면 전송하지 않음
  if (!newMessage.value.trim()) return;

  // 서버에 메시지 전송: 사용자명과 메시지 텍스트 포함
  socket.value.emit('chat message', {
    user: userName.value,
    text: newMessage.value,
  });

  // 입력창 초기화
  newMessage.value = '';
}

// 🔁 컴포넌트 마운트 시 소켓 이벤트 수신 설정
function setupSocketEvents() {
  // 서버에서 보낸 'chat message' 이벤트 수신 시 실행
  socket.value.on('chat message', (msg) => {
    // 수신된 메시지를 messages 배열에 추가 → 화면에 자동 반영
    messages.value.push(msg);
  });
  // 서버에서 보낸 'system message' 이벤트 수신 시 실행
  socket.value.on('system message', (msg) => {
    messages.value.push({ user: '시스템', text: msg });
  });
  socket.value.on('user list', (list) => {
    users.value = list;
  });
  socket.value.on('join error', (msg) => {
    errorMessage.value = msg;
    userName.value = '';
    tempName.value = '';
  });
  socket.emit('request user list');
}

onMounted(() => {
  // 이름 입력 전이더라도 사용자 목록 요청 가능
  const tempSocket = io('http://localhost:3000');

  tempSocket.on('user list', (list) => {
    users.value = list;
    tempSocket.disconnect(); // 요청만 하고 바로 종료
  });

  tempSocket.emit('request user list');
});
</script>

<style scoped>
/* 전체 채팅 방 컨테이너 스타일 */
.chat-room {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
}

/* 사용자 이름 입력 영역 */
.username-form {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

/* 메시지 리스트 영역 */
.messages {
  list-style: none;
  padding: 0;
  margin-bottom: 10px;
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #ccc;
}

/* 메시지 입력 폼 스타일 */
.chat-form {
  display: flex;
  gap: 8px;
}

input {
  flex: 1;
  padding: 8px;
}

button {
  padding: 8px 16px;
}
</style>
