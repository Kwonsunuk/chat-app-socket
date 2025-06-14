<!-- frontend/src/components/ChatRoom.vue -->
<template>
  <div class="chat-room">
    <header>
      <h2>🗨️ {{ props.room }} 방</h2>
      <button @click="emit('leaveRoom')">나가기</button>
    </header>

    <!-- 타이핑 인디케이터 -->
    <div class="typing-indicator" v-if="typingUsers.size">
      {{ Array.from(typingUsers).join(', ') }}님이 입력 중…
    </div>

    <!-- 채팅 이력 -->
    <ul class="messages">
      <li v-for="(msg, i) in messages" :key="i">
        <strong>{{ msg.user }}:</strong> {{ msg.text }}
      </li>
    </ul>

    <!-- 메시지 입력 -->
    <div class="message-form">
      <input
        v-model="newMessage"
        @input="handleTyping"
        @keyup.enter="sendMessage"
        placeholder="메시지를 입력하세요"
        autocomplete="off"
      />
      <button @click="sendMessage">전송</button>
    </div>

    <!-- 접속자 목록 -->
    <div class="user-list">
      <h3>🧑 접속 중인 사용자</h3>
      <ul>
        <li v-for="(user, i) in users" :key="i">
          {{ user }}<span v-if="user === props.username">(본인)</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { io } from 'socket.io-client';
import { onBeforeUnmount, onMounted, ref } from 'vue';

const props = defineProps({ room: String, username: String });
const emit = defineEmits(['leaveRoom']);

const socket = ref(null);
const messages = ref([]);
const users = ref([]);
const newMessage = ref('');
const typingUsers = ref(new Set());
let typingTimeout = null;

function setupSocketEvents() {
  socket.value.on('chat message', (msg) => messages.value.push(msg));
  socket.value.on('room history', (hist) => (messages.value = hist));
  socket.value.on('user list', (list) => (users.value = list));

  // 타이핑 이벤트 수신
  socket.value.on('typing', (user) => typingUsers.value.add(user));
  socket.value.on('stop typing', (user) => typingUsers.value.delete(user));
}

function handleTyping() {
  socket.value.emit('typing', { room: props.room, user: props.username });

  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socket.value.emit('stop typing', { room: props.room, user: props.username });
  }, 1000);
}

function sendMessage() {
  const text = newMessage.value.trim();
  if (!text) return;
  socket.value.emit('chat message', { room: props.room, user: props.username, text });
  newMessage.value = '';
  socket.value.emit('stop typing', { room: props.room, user: props.username });
}

onMounted(() => {
  socket.value = io('http://localhost:3000', { query: { name: props.username } });
  setupSocketEvents();
  messages.value = [];
  socket.value.emit('join room', { room: props.room, user: props.username });
  socket.value.emit('request room history', props.room);
  socket.value.emit('request user list');
});

onBeforeUnmount(() => {
  if (socket.value) {
    socket.value.emit('leave room', props.room);
    socket.value.disconnect();
  }
});
</script>

<style scoped>
.typing-indicator {
  font-style: italic;
  color: #666;
  padding: 4px 8px;
}
</style>
