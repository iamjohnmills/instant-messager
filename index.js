const express = require('express');
const app = express();
const server = require('http').Server(app);
const serveStatic = require('serve-static');
const io = require('socket.io')(server);
const socketRooms = require('./rooms.js');
const rooms = new socketRooms();

app.use('/js', serveStatic(__dirname + '/public/js'));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/public/index.html');
})

String.prototype.escapeHTML = function() {
  return this.
    replace(/&/g, "&amp;").
    replace(/</g, "&lt;").
    replace(/>/g, "&gt;").
    replace(/\"/g, "&quot;");
};

io.on('connection', function(socket) {
  socket.on('enter', async function(roomname,client_id,engine_id){
    roomname = roomname.escapeHTML();
    // check if roomname is valid
    if(!roomname){
      io.to(client_id).emit('me_fail_enter');
      return false;
    }
    // check if already in the room
    const in_room = await rooms.getRoomByEngineId(engine_id);
    if(in_room && in_room.name == roomname){
      return false;
    }
    // leave other rooms first
    if(in_room){
      const client = await rooms.getClientByEngineId(engine_id);
      in_room.clients.forEach( async (room_client, i) => {
        if(room_client.client_id == client_id){
          await rooms.leaveRooms(engine_id);
          io.to(room_client.client_id).emit('me_leave_room', { room: in_room, client: client });
        } else {
          io.to(room_client.client_id).emit('someone_in_room_leave', { room: in_room, client: client });
        }
      })
      await rooms.removeEmptyRooms();
    }
    // create or join room
    const room_connection = await rooms.connectToRoom(roomname, client_id, engine_id);
    // emit the status to the room
    room_connection.room.clients.forEach( async (room_client, i) => {
      if(room_client.engine_id === socket.client.id){
        io.to(room_client.client_id).emit('me_enter_room', room_connection);
      } else {
        io.to(room_client.client_id).emit('someone_enter_room', room_connection);
      }
    });
  });
  socket.on('username', async function(username,engine_id){
    username = username.escapeHTML();
    const client = await rooms.getClientByEngineId(engine_id);
    // check if username not changed
    if(client.username === username){
      return false;
    }
    // check if username already is in use
    const username_in_use = await rooms.usernameInUse(username, engine_id);
    if(username_in_use){
      io.to(client.client_id).emit('me_try_change_username_in_use', { in_use: username, client: client });
      return false;
    }
    // set new username
    await rooms.setUsername(username,engine_id);
    // get the updated info and emit the change to the room
    const room = await rooms.getRoomByEngineId(engine_id);
    room.clients.forEach( async (room_client, i) => {
      if(room_client.engine_id == socket.client.id){
        io.to(room_client.client_id).emit('me_change_username', { room: room, client: client });
      } else {
        io.to(room_client.client_id).emit('someone_in_room_change_username', { room: room, client: client });
      }
    })
  });
  socket.on('message', async function(message,engine_id){
    message = message.escapeHTML();
    // get the room and client
    const room = await rooms.getRoomByEngineId(engine_id);
    const from = await rooms.getClientByEngineId(engine_id);
    // emit the message to the room
    room.clients.forEach( async (room_client, i) => {
      if(room_client.engine_id == socket.client.id){
        io.to(room_client.client_id).emit('me_send_message', { message: message, room: room, from: from });
      } else {
        io.to(room_client.client_id).emit('someone_in_room_send_message', { message: message, room: room, from: from });;
      }
    })
  });
  socket.on('disconnect', async function(){
    // get the room and client
    const room = await rooms.getRoomByEngineId(socket.client.id);
    if(!room) return false;
    const client = await rooms.getClientByEngineId(socket.client.id);
    // emit the status to the room
    room.clients.forEach( async (room_client, i) => {
      io.to(room_client.client_id).emit('someone_in_room_leave', { room: room, client: client });
    })
    // remove disconnected user from any rooms
    await rooms.leaveRooms(socket.client.id);
    // remove any empty rooms
    await rooms.removeEmptyRooms();
  });
});

const port = process.env.PORT || 8080;
server.listen(port);
console.log(`app is listening on port: ${port}`)
