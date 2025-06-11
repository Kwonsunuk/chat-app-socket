<template>
  <div>
    <!-- [1] 사용자 이름 입력 영역 userName이 아직 설정되지 않았을 때만 보임 -->

  </div>
</template>

<script setup>
// Vue Composition API에서 ref와 생명주기 훅 import
// socket.io 클라이언트 import
import { io } from 'socket.io-client';
import { onMounted, ref } from 'vue';

// 백엔드 서버에 연결 (개발 중엔 하드코딩 가능, 실무에선 env 사용 권장)
const socket = io('http://localhost:3000');

// 수신된 채팅 메시지를 저장할 반응형 배열
const messages = ref([]);

// 사용자 입력 메시지를 저장하는 반응형 변수
const newMessage = ref('');

// 컴포넌트가 마운트될 때 서버로부터 메시지를 수신할 리스너 설정
onMounted(() => {
  socket.on('chat message', (msg) => {
    messages.value.push(msg); // 수신된 메시지를 화면에 표시
  });
});

// 메시지 전송 함수
function sendMessage() {
  if (!newMessage.value.trim()) return; // 빈 문자열은 무시
  socket.emit('chat message', {
    user: '우기',
    text: newMessage.value,
  }); // 백엔드 서버로 메시지 전송
  newMessage.value = ''; // 입력 필드 초기화
}
</script>

<style scoped>
.chat-room {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
}
.messages {
  list-style: none;
  padding: 0;
  margin-bottom: 10px;
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #ccc;
}
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
