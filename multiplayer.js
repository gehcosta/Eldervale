const Multiplayer = {
  socket: null,
  isHost: false,
  playerName: '',
  roomId: '',
  remotePlayers: {},
  onConnected: null,
  onDisconnected: null,

  init(serverUrl) {
    if(!this.socket) {
      this.socket = io(serverUrl || undefined);
      
      this.socket.on('playerUpdate', (state) => {
        this.remotePlayers[state.id] = state;
      });

      this.socket.on('playerLeft', (data) => {
        if(this.onDisconnected && data.name) this.onDisconnected(data.name);
        delete this.remotePlayers[data.id];
      });

      this.socket.on('playerJoined', (data) => {
        console.log(`${data.name} joined!`);
        if(this.onConnected) this.onConnected(data.name);
      });

      this.socket.on('playerSkill', (data) => {
        if(window.handleRemoteSkill) window.handleRemoteSkill(data);
      });
    }
  },

  initHost(name, onReady) {
    this.playerName = name;
    this.isHost = true;
    this.init();
    
    this.socket.emit('createRoom', { name }, (response) => {
      if (response.success) {
        this.roomId = response.roomId;
        if(onReady) onReady(response.roomId);
      } else {
        alert("Erro ao criar sala");
      }
    });
  },

  joinMatch(name, roomId, onReady, onError) {
    this.playerName = name;
    this.isHost = false;
    this.init();
    
    this.socket.emit('joinRoom', { name, roomId }, (response) => {
      if (response.success) {
        this.roomId = roomId;
        if(onReady) onReady();
      } else {
        if(onError) onError(response.message);
      }
    });
  },

  sendUpdate(state) {
    if (this.socket && this.roomId) {
      state.name = this.playerName;
      state.color = '#5cb85c';
      state.kind = 'remote_player';
      this.socket.emit('update', state);
    }
  },

  sendSkill(skillId, x, y, facing) {
    if (this.socket && this.roomId) {
      this.socket.emit('playerSkill', { skill: skillId, x, y, facing });
    }
  }
};
window.Multiplayer = Multiplayer;
