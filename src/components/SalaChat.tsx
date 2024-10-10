import React, { useState, useEffect, useRef } from 'react';
import { Send, Users, Video, VideoOff } from 'lucide-react';
import io from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

console.log('Backend URL:', BACKEND_URL);

const SalaChat = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [roomId, setRoomId] = useState('sala1');
  const [userId] = useState(uuidv4());
  const [username, setUsername] = useState('');
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const socketRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideosRef = useRef({});
  const peerConnectionsRef = useRef({});
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!username) {
      const newUsername = prompt('Por favor, ingresa tu nombre de usuario:');
      setUsername(newUsername || `Usuario${Math.floor(Math.random() * 1000)}`);
    }

    socketRef.current = io(BACKEND_URL);

    socketRef.current.emit('joinRoom', { roomId, userId, username });

    socketRef.current.on('message', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    socketRef.current.on('updateUserList', (users) => {
      setConnectedUsers(users);
    });

    socketRef.current.on('userJoined', handleUserJoined);
    socketRef.current.on('userLeft', handleUserLeft);
    socketRef.current.on('offer', handleOffer);
    socketRef.current.on('answer', handleAnswer);
    socketRef.current.on('ice-candidate', handleNewICECandidateMsg);

    return () => {
      Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
      socketRef.current.disconnect();
    };
  }, [roomId, userId, username]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (inputMessage.trim() !== '') {
      const messageObject = {
        id: uuidv4(),
        userId,
        username,
        text: inputMessage,
        timestamp: new Date().toISOString(),
      };
      socketRef.current.emit('sendMessage', { roomId, message: messageObject });
      setInputMessage('');
    }
  };

  const toggleVideo = async () => {
    try {
      if (!isVideoOn) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideoRef.current.srcObject = stream;
        setIsVideoOn(true);

        connectedUsers.forEach(user => {
          if (user.userId !== userId) {
            createPeerConnection(user.userId, stream);
          }
        });

        socketRef.current.emit('videoStarted', { roomId, userId });
      } else {
        const stream = localVideoRef.current.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
        localVideoRef.current.srcObject = null;
        setIsVideoOn(false);

        Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
        peerConnectionsRef.current = {};

        socketRef.current.emit('videoEnded', { roomId, userId });
      }
    } catch (error) {
      console.error('Error accessing media devices:', error);
    }
  };

  const createPeerConnection = (targetUserId, stream) => {
    const peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    stream.getTracks().forEach(track => {
      peerConnection.addTrack(track, stream);
    });

    peerConnection.ontrack = (event) => {
      if (!remoteVideosRef.current[targetUserId]) {
        remoteVideosRef.current[targetUserId] = document.createElement('video');
        remoteVideosRef.current[targetUserId].autoplay = true;
        document.getElementById('remoteVideos').appendChild(remoteVideosRef.current[targetUserId]);
      }
      remoteVideosRef.current[targetUserId].srcObject = event.streams[0];
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit('ice-candidate', { roomId, targetUserId, candidate: event.candidate });
      }
    };

    peerConnectionsRef.current[targetUserId] = peerConnection;

    return peerConnection;
  };

  const handleUserJoined = async ({ userId: newUserId }) => {
    if (isVideoOn && newUserId !== userId) {
      const peerConnection = createPeerConnection(newUserId, localVideoRef.current.srcObject);
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      socketRef.current.emit('offer', { roomId, targetUserId: newUserId, offer });
    }
  };

  const handleUserLeft = ({ userId: leftUserId }) => {
    if (peerConnectionsRef.current[leftUserId]) {
      peerConnectionsRef.current[leftUserId].close();
      delete peerConnectionsRef.current[leftUserId];
    }
    if (remoteVideosRef.current[leftUserId]) {
      remoteVideosRef.current[leftUserId].remove();
      delete remoteVideosRef.current[leftUserId];
    }
  };

  const handleOffer = async ({ fromUserId, offer }) => {
    if (!peerConnectionsRef.current[fromUserId]) {
      const peerConnection = createPeerConnection(fromUserId, localVideoRef.current.srcObject);
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      socketRef.current.emit('answer', { roomId, targetUserId: fromUserId, answer });
    }
  };

  const handleAnswer = async ({ fromUserId, answer }) => {
    await peerConnectionsRef.current[fromUserId].setRemoteDescription(new RTCSessionDescription(answer));
  };

  const handleNewICECandidateMsg = async ({ fromUserId, candidate }) => {
    if (peerConnectionsRef.current[fromUserId]) {
      await peerConnectionsRef.current[fromUserId].addIceCandidate(new RTCIceCandidate(candidate));
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <div className="w-1/4 bg-gray-100 p-4 border-r">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Users className="mr-2" /> Usuarios Conectados
        </h2>
        <ul>
          {connectedUsers.map((user) => (
            <li key={user.userId} className="mb-2">
              {user.username}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col w-3/4 bg-white">
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="mb-4">
            <button
              onClick={toggleVideo}
              className={`px-4 py-2 rounded-md ${isVideoOn ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white`}
            >
              {isVideoOn ? <VideoOff size={20} /> : <Video size={20} />}
              {isVideoOn ? ' Detener Video' : ' Iniciar Video'}
            </button>
          </div>
          <div className="flex flex-wrap mb-4">
            <video ref={localVideoRef} autoPlay muted className="w-1/2 h-auto" />
            <div id="remoteVideos" className="w-1/2 flex flex-wrap"></div>
          </div>
          {messages.map((msg) => (
            <div key={msg.id} className={`mb-2 ${msg.userId === userId ? 'text-right' : 'text-left'}`}>
              <span className="text-xs text-gray-500">{msg.username}</span>
              <br />
              <span className={`inline-block p-2 rounded-lg ${msg.userId === userId ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                {msg.text}
              </span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={sendMessage} className="flex p-4 border-t">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Escribe un mensaje..."
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default SalaChat;