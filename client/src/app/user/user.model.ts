export class User {
    pcLocal: RTCPeerConnection
    pcRemote: RTCPeerConnection
    localIceCandidates: RTCIceCandidate[];
    remoteIceCandidates: RTCIceCandidate[];
    stream: MediaStream;

    constructor(pcLocal, pcRemote) {
        this.pcLocal = pcLocal;
        this.pcRemote = pcRemote;
        this.localIceCandidates = [];
        this.remoteIceCandidates = [];
    }
}