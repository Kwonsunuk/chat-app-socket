<!-- frontend/src/components/RoomSelection.vue -->
<template>
  <div class="room-selection">
    <h2>📂 방 선택</h2>
    <ul class="room-list">
      <li v-for="room in rooms" :key="room">
        <button @click="selectRoom(room)">{{ room }}</button>
      </li>
    </ul>
    <div class="new-room-form">
      <input v-model="newRoom" placeholder="새 방 이름을 입력하세요" @keyup.enter="createRoom" />
      <button @click="createRoom">생성 및 입장</button>
    </div>
  </div>
</template>

<script setup>
import { io } from 'socket.io-client';
import { onBeforeUnmount, onMounted, ref } from 'vue';

const props = defineProps({ username: String });
const emit = defineEmits(['roomSelected']);

const rooms = ref([]);
const newRoom = ref('');
let socket = null;

onMounted(() => {
  socket = io('http://localhost:3000', {
    query: { name: props.username },
  });
  // 실시간 방 목록 업데이트 수신
  socket.on('room list', (list) => {
    rooms.value = list;
  });
  // 최초 방 목록 요청
  socket.emit('request room list');
});

onBeforeUnmount(() => {
  if (socket) socket.disconnect();
});

function selectRoom(room) {
  emit('roomSelected', room);
}

function createRoom() {
  const name = newRoom.value.trim();
  if (!name) return;
  emit('roomSelected', name);
  newRoom.value = '';
}
</script>

<style scoped>
.room-selection {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.room-list {
  list-style: none;
  padding: 0;
}
.room-list li {
  margin-bottom: 8px;
}
.new-room-form {
  display: flex;
  gap: 8px;
}
input {
  flex: 1;
  padding: 8px;
}
button {
  padding: 8px 16px;
  cursor: pointer;
}
</style>
