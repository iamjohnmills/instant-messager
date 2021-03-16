module.exports = class Rooms {
  constructor() {
    this.rooms = []
  }
  async connectToRoom(roomname,client_id,engine_id){
    const index = this.getRoomIndex(roomname);
    if(index === false){
      return this.createRoom(roomname,client_id,engine_id);
    } else {
      return this.joinRoom(index,client_id,engine_id);
    }
  }
  getRooms(){
    return this.rooms;
  }
  createRoom(roomname,client_id,engine_id){
    const client = {
      client_id: client_id,
      engine_id: engine_id,
      username: client_id
    }
    const room = {
      name: roomname,
      clients: [client]
    }
    this.rooms.push(room);
    return {
      room: room,
      client: client,
    };
  }
  joinRoom(index,client_id,engine_id){
    const client = {
      client_id: client_id,
      engine_id: engine_id,
      username: client_id
    };
    this.rooms[index].clients.push(client);
    return {
      room: this.rooms[index],
      client: client
    };
  }
  getRoomIndex(name){
    const index = this.rooms.findIndex(room => room.name == name);
    return index !== -1 ? index : false;
  }
  getRoom(name){
    return this.rooms[this.getRoomIndex(name)];
  }
  getRoomByEngineId(engine_id){
    const index = this.rooms.findIndex(room => {
      return room.clients.findIndex(client => client.engine_id == engine_id) !== -1
    })
    return index !== -1 ? this.rooms[index] : false;
  }
  usernameInUse(username,engine_id){
    const room = this.getRoomByEngineId(engine_id);
    if(room){
      return room.clients.findIndex(client => client.username === username && client.engine_id !== engine_id ) !== -1;
    } else {
      return false;
    }
  }
  setUsername(username,engine_id){
    const room = this.getRoomByEngineId(engine_id);
    if(!room) return false;
    const index = this.getRoomIndex(room.name);
    this.rooms[index].clients = this.rooms[index].clients.map(client => {
      if(client.engine_id == engine_id){
        client.previous = client.username;
        client.username = username !== '' ? username.substr(0,32) : client.client_id;
      }
      return client;
    })
  }
  getClientByEngineId(engine_id){
    const room = this.getRoomByEngineId(engine_id);
    if(!room) return false;
    const index = room.clients.findIndex(client => client.engine_id === engine_id);
    return index !== -1 ? room.clients[index] : false;
  }
  leaveRooms(engine_id){
    this.rooms.forEach((room, i) => {
      room.clients = room.clients.filter(client => {
        return client.engine_id != engine_id;
      })
    });
  }
  removeEmptyRooms(){
    this.rooms = this.rooms.filter(room => room.clients.length);
  }
}
