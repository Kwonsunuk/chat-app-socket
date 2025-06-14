<!-- frontend/src/components/ChatRoom.vue -->
<template>
  <div class="chat-room">
    <header>
      <h2>🗨️ {{ props.room }} 방</h2>
      <button @click="emit('leaveRoom')">나가기</button>
    </header>

    <ul class="messages">
      <li v-for="(msg, i) in messages" :key="i">
        <strong>{{ msg.user }}:</strong> {{ msg.text }}
      </li>
    </ul>

    <div class="message-form">
      <input
        v-model="newMessage"
        @keyup.enter="sendMessage"
        placeholder="메시지를 입력하세요"
        autocomplete="off"
      />
      <button @click="sendMessage">전송</button>
    </div>

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

const props = defineProps({
  room: String,
  username: String,
});
const emit = defineEmits(['leaveRoom']);

const socket = ref(null);
const messages = ref([]);
const users = ref([]);
const newMessage = ref('');

function setupSocketEvents() {
  socket.value.on('chat message', (msg) => {
    messages.value.push(msg);
  });
  socket.value.on('room history', (history) => {
    messages.value = history;
  });
  socket.value.on('user list', (list) => {
    users.value = list;
  });
}

function sendMessage() {
  const text = newMessage.value.trim();
  if (!text) return;
  socket.value.emit('chat message', {
    room: props.room,
    user: props.username,
    text,
  });
  newMessage.value = '';
}

onMounted(() => {
  socket.value = io('http://localhost:3000', {
    query: { name: props.username },
  });
  setupSocketEvents();
  messages.value = [];
  socket.value.emit('join room', {
    room: props.room,
    user: props.username,
  });
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
.chat-room {
  display: flex;
  flex-direction: column;
  height: 100%;
}
header {
  display: flex;
  justify-content: space-between;
  padding: 8px;
  background: #f0f0f0;
}
.messages {
  flex: 1;
  overflow-y: auto;
  list-style: none;
  margin: 0;
  padding: 8px;
}
.message-form {
  display: flex;
  gap: 8px;
  padding: 8px;
}
input {
  flex: 1;
  padding: 8px;
}
button {
  padding: 8px 16px;
  cursor: pointer;
}
.user-list {
  margin-top: 16px;
}
.user-list ul {
  list-style: none;
  padding: 0;
}
</style>
