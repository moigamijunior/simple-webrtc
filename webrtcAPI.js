const CONFIGURATION = {
    iceServers: [{
        url: 'turn:relay.backups.cz?transport=tcp',
        credential: 'webrtc',
        username: 'webrtc'
    }, {
        urls: [
            'stun:stun01.sipphone.com'
        ]
    }]
}
let pc
let stream
let offer
let answer
let debug
let myIce
let iceCandidate

const uuid = (() =>
    ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
    ))()


/**
 * API para iniciar conexão par-a-par.
 */
const webrtcAPI = {

    uuid: () => {
        return uuid
    },

    /**
     * debug API Webrtc.
     * @param {boolean} should - deve imprimir as saídas?
     */
    debug: (should = true) => {
        debug = should
    },

    /**
     * Abre uma conexão RTC.
     */
    create: () => {
        if (!pc) {
            pc = new RTCPeerConnection(CONFIGURATION)
        }
        (debug) ? console.log('CREATE PEERCONNECTION:', pc): '';
    },

    /**
     * Acessa a saída de áudio e adiciona no track.
     */
    getUserMedia: async() => {
        if (!stream && pc) {
            try {
                const STREAM = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
                stream = STREAM
                stream.getTracks().forEach((track) => {
                    pc.addTrack(track, stream);
                    (debug) ? console.log('ADDTRACK', track): ''
                })
            } catch (err) {
                console.error(err)
                throw err
            }
        }
    },

    /**
     * Recebe o áudio e toca.
     */
    ontrack: () => {
        if (pc) {
            pc.ontrack = (track) => {
                document.querySelector('#audio').srcObject = track.streams[0];
                (debug) ? console.log('ONTRACK', track): ''
            }
        }
    },

    configIce: (send) => {
        if (pc) {
            // Listen for connectionstatechange on the local RTCPeerConnection
            pc.addEventListener('connectionstatechange', event => {
                console.log('PCState:', pc.connectionState);
            });

            // Listen for local ICE candidates on the local RTCPeerConnection
            pc.addEventListener('icecandidate', event => {
                if (event.candidate) {
                    const REQUEST = {
                        request: 'ice-candidate',
                        uuid: webrtcAPI.uuid(),
                        body: event.candidate
                    }
                    myIce = event.candidate
                    send(JSON.stringify(REQUEST));
                }
            });
        }
    },

    getIceCandidate: () => {
        return myIce
    },

    setIceCanditade: async(candidate) => {
        // if (myIce != candidate) iceCandidate = candidate
        if (pc) {
            try {
                await pc.addIceCandidate(candidate);
            } catch (e) {
                console.error('Error adding received ice candidate', e);
            }
        }
    },

    createOffer: async() => {
        if (pc) {
            try {
                const OFFER = await pc.createOffer()
                pc.setLocalDescription(OFFER)
                offer = OFFER
            } catch (err) {
                console.error(err)
                throw err
            }
        }
        (debug) ? console.log('CREATE OFFER:', offer): ''
    },

    createAnswer: async() => {
        if (pc) {
            try {
                const ANSWER = await pc.createAnswer()
                pc.setLocalDescription(ANSWER)
                answer = ANSWER
            } catch (err) {
                console.error(err)
                throw err
            }
        }
        (debug) ? console.log('CREATE ANSWER:', answer): ''
    },

    setRemoteDesc: async(offer) => {
        if (pc) {
            try {
                await pc.setRemoteDescription(new RTCSessionDescription(offer))
                    // await pc.addIceCandidate(iceCandidate);
            } catch (e) {
                console.error('Error adding received ice candidate', e);
            }
        }
        (debug) ? console.log('SETOFFER:', offer): ''
    },

    getStream: () => {
        return stream
    },

    getOffer: () => {
        (debug) ? console.log('GETOFFER:', offer): ''
        return offer
    },

    getAnswer: () => {
        (debug) ? console.log('GETANSWER:', answer): ''
        return answer
    },

    destroy: async() => {
        if (pc) {
            await pc.close()
        }
        pc = null
        offer = null
        stream = null
    },

}

export default webrtcAPI