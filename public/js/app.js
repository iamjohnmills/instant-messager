
const init = async () => {
  const socket = io();

  let is_connected = false;

  let input_room_ui_state_0 = document.getElementById('input-room-ui-state-0');
  input_room_ui_state_0.focus();

  let input_room = document.getElementById('input-room');
  let input_username = document.getElementById('input-username');
  let input_message = document.getElementById('input-message');

  input_room_ui_state_0.addEventListener('keyup', async (event) => {
    const keyCode = event.code || event.key;
    if(keyCode !== 'Enter') return;
    await socket.emit('enter',event.target.value,socket.id,socket.io.engine.id);
  })
  input_room.addEventListener('keyup', async (event) => {
    const keyCode = event.code || event.key;
    if(keyCode !== 'Enter') return;

    await socket.emit('enter',event.target.value,socket.id,socket.io.engine.id);
  })
  input_username.addEventListener('keyup', async (event) => {
    const keyCode = event.code || event.key;
    if(keyCode !== 'Enter') return;
    await socket.emit('username', event.target.value, socket.io.engine.id);
  })
  input_message.addEventListener('keyup', async (event) => {
    const keyCode = event.code || event.key;
    if(keyCode !== 'Enter') return;
    if(event.target.value.trim() === '') return;
    if(typeof username === 'undefined' || input_username.value !== username.username){
      await socket.emit('username', input_username.value, socket.io.engine.id);
      await socket.emit('message', event.target.value, socket.io.engine.id);
    } else {
      await socket.emit('message', event.target.value, socket.io.engine.id);
    }
  })

  socket.on('me_fail_enter', function() {
    writeMessage(`<i>Error: Invalid room name.</i>`);
    input_room.focus();
  });
  socket.on('me_enter_room', function(response) {
    writeMessage(`<i>You entered the room ${response.room.name}.</i>`);
    //document.getElementById('username').classList.remove('hide');
    //document.getElementById('message').classList.remove('hide');
    is_connected = true;
    document.getElementById('ui-state-0').classList.add('hide');
    document.getElementById('ui-state-1').classList.remove('hide')
    input_room.value = response.room.name;
    input_username.value = socket.id;
    input_message.focus();
  });
  socket.on('someone_enter_room', function(response) {
    writeMessage(`<i>${response.client.username} entered the room.</i>`);
  });
  socket.on('me_try_change_username_in_use', function(response) {
    input_username.value = response.client.username;
    writeMessage(`<i>The username ${response.in_use} is already in use.</i>`);
    input_message.focus();
  });
  socket.on('me_change_username', function(response) {
    input_room.value = response.room.name;
    input_username.value = response.client.username;
    writeMessage(`<i>You changed your username from ${response.client.previous} to ${response.client.username}</i>`);
    input_message.focus();
  });
  socket.on('someone_in_room_change_username', function(response) {
    writeMessage(`<i>${response.client.previous} changed their username to ${response.client.username}</i>`);
  });
  socket.on('me_send_message', async function(response) {
    input_room.value = response.room.name;
    input_username.value = response.from.username;
    input_message.value = null;
    writeMessage(`<span><b>${response.from.username}</b>: <span>${response.message}</span></span>`);
  });
  socket.on('someone_in_room_send_message', async function(response) {
    writeMessage(`<b>${response.from.username}</b>: <span>${response.message}</span>`);
  });
  socket.on('me_leave_room', function(response) {
    writeMessage(`<i>You left ${response.room.name}.</i>`);
  });
  socket.on('someone_in_room_leave', function(response) {
    writeMessage(`<i>${response.client.username} left the room.</i>`);
  });
  socket.on('disconnect', function(response) {
    if(!is_connected) return;
    is_connected = false;
    writeMessage(`<i>You were disconnected from the room.</i>`);
    input_room.value = null;
    input_username.value = null;
    input_message.value = null;
    input_room.focus();
  });
  const writeMessage = (message) => {
    const el = document.createElement('div');
    el.innerHTML = `<div>${message}</div>`;
    document.getElementById('messages').append(el);
    window.scrollTo(0, document.body.scrollHeight);
  }
}
document.addEventListener('DOMContentLoaded',init)
