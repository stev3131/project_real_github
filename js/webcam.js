/*async function getWebCam(){
    try{
        const videoSrc=await navigator.mediaDevices.getUserMedia({video:true});
        var video=document.getElementById("video");
        video.srcObject=videoSrc;
    }catch(e){
        console.log(e);
    }
}
getWebCam();*/
const webcam = document.getElementById('div-webcam');

const socket = io();
const peers = {}
const myPeer = new Peer(undefined, {
})
//connesione al peer che è stata effetuata
myPeer.on('open', Id => {
  socket.emit('join-room', roomId, Id);
})

const myvideo = document.createElement('video')

//ottenerre dati dalla telecamera...
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: false
}).then(stream => {
  addVideoStream(myvideo, stream)
  //funzione che risponde alla chiamata del client e la inserisce a video
  myPeer.on('call', call => {
     call.answer(stream)
     const video = document.createElement('video')
     call.on('stream', userVideoStream => {
       addVideoStream(video, userVideoStream)
     })
   })

  socket.on('user-connected', userId => {
    connectToNewUser(userId, stream)
  })

  socket.on('user-disconnected', userId => {
    if (peers[userId]) peers[userId].close()
  })
})

//funzione che fa tipo la chiamata telefonica se stanno in chiamata riproduce il video se no rimuove il video
function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream)
  const video = document.createElement('video')
  call.on('stream', userVideoStream => {
    addVideoStream(video, userVideoStream)
  })
  call.on('close', () => {
    video.remove()
  })

  peers[userId] = call
}

//funzione che permette di attivare la telecamera e aggiungerla all'html
function addVideoStream(video, stream) {
  video.srcObject = stream
  video.addEventListener('loadedmetadata', () => {
    video.play()
  })
  webcam.append(video)
}
