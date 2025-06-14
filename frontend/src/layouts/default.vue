<!-- frontend/src/layouts/default.vue -->
<template>
  <div id="app">
    <div v-if="!nameConfirmed" class="username-form">
      <input v-model="usernameTemp" placeholder="닉네임을 입력하세요" />
      <button @click="confirmName">확인</button>
    </div>
    <div v-else>
      <div class="header-bar">
        <span>닉네임: {{ username }}</span>
        <button v-if="!currentRoom" @click="changeName">변경</button>
      </div>
      <RoomSelection v-if="!currentRoom" :username="username" @roomSelected="handleRoomSelected" />
      <ChatRoom v-else :room="currentRoom" :username="username" @leaveRoom="handleLeaveRoom" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

import ChatRoom from '../components/ChatRoom.vue';
import RoomSelection from '../components/RoomSelection.vue';

const username = ref('');
const usernameTemp = ref('');
const nameConfirmed = ref(false);
const currentRoom = ref('');

// 1) 서버에 이름 사용 가능 여부 확인
async function confirmName() {
  const name = usernameTemp.value.trim();
  if (!name) return;
  try {
    const res = await fetch(`http://localhost:3000/check-name?name=${encodeURIComponent(name)}`);
    const { available, message } = await res.json();
    if (!available) {
      alert(message || '이미 사용 중인 닉네임입니다.');
      return;
    }
    // 2) 가능하면 state에 저장
    username.value = name;
    nameConfirmed.value = true;
  } catch (e) {
    console.error(e);
    alert('닉네임 검사 중 오류가 발생했습니다.');
  }
}

function changeName() {
  nameConfirmed.value = false;
  usernameTemp.value = '';
}

function handleRoomSelected(room) {
  currentRoom.value = room;
}

function handleLeaveRoom() {
  currentRoom.value = '';
}
</script>

<style>
.username-form {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}
.header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
</style>
