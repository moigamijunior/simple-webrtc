import webrtcAPI from "./webrtcAPI.js";

let started
let request

document.querySelector('#button').onclick = () => { if (!started) start() }

const WS = new WebSocket('ws://45.6.178.19:3088');

WS.onopen = () => {
    console.log('conexão bem sucedida!', webrtcAPI.uuid());
}

WS.onmessage = message => {
    console.log('Mensagem do servidor:', message.data);
    message = JSON.parse(message.data)

    switch (message.response) {
        case 'offer':
            if (message.uuid != webrtcAPI.uuid()) offer(message.body)
            break;
        case 'answer':
            if (message.uuid != webrtcAPI.uuid()) answer(message.body)
            break;
        case 'ice-candidate':
            if (message.uuid != webrtcAPI.uuid()) webrtcAPI.setIceCanditade(message.body)
            break;

        default:
            break;
    }

}

WS.onclose = () => {
    console.log('Conexão fechada!');
}

WS.onerror = err => {
    console.error('Erro na conexão:', err);
}

function sendMessage(message) {
    WS.send(message);
}

function start() {
    started = true
    Promise.resolve()
        .then(async() => {
            webrtcAPI.debug(true)
            webrtcAPI.create()
        })
        .then(async() => {
            await webrtcAPI.getUserMedia()
            await webrtcAPI.createOffer()
            request = {
                request: 'offer',
                uuid: webrtcAPI.uuid(),
                body: webrtcAPI.getOffer()
            }
            sendMessage(JSON.stringify(request))
            webrtcAPI.configIce(sendMessage)
        })
        .catch(err => {
            console.error(err);
            throw err
        })

}

function offer(offer) {
    started = true
    Promise.resolve()
        .then(async() => {
            webrtcAPI.debug(true)
            webrtcAPI.create()
        })
        .then(async() => {
            await webrtcAPI.getUserMedia()
            await webrtcAPI.setRemoteDesc(offer)
            await webrtcAPI.createAnswer()
            webrtcAPI.ontrack()
            request = {
                request: 'answer',
                uuid: webrtcAPI.uuid(),
                body: webrtcAPI.getAnswer()
            }
            sendMessage(JSON.stringify(request))
            webrtcAPI.configIce(sendMessage)
        })
        .catch(err => {
            console.error(err);
            throw err
        })
}

function answer(answer) {
    webrtcAPI.setRemoteDesc(answer)
    webrtcAPI.ontrack()
}