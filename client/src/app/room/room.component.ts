import { Component, ChangeDetectorRef, ElementRef, ViewChild } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";

import { environment } from '../../environments/environment';

import { User } from "../user/user.model";

import * as uuid from 'uuid/v4';

@Component({
    selector: 'room',
    templateUrl: './room.component.html',
    styleUrls: ['./room.component.scss']
})
export class RoomComponent {
    roomName: string;
    websocket: WebSocket;
    users: Map<string, User> = new Map<string, User>();
    me: User;
    userId: string;
    columnCount: number = 2;

    localStream: MediaStream;
    displayedStream: MediaStream;
    sharedStream: MediaStream;

    recordVideo: boolean = true;
    recordAudio: boolean = false;

    constructor(private route: ActivatedRoute, private router: Router, private ref: ChangeDetectorRef) { }

    ngOnInit() {
        this.route.params.subscribe(params => this.roomName = params['roomName']);
        this.me = new User(null, null);
        navigator.getUserMedia(
            {
                video: true,
                audio: true
            },
            (stream) => {
                stream.getAudioTracks().forEach(track => track.enabled = false);
                this.sharedStream = stream.clone();
                this.displayedStream = stream.clone();
                this.me.stream = this.displayedStream;
                this.start();


                console.log("local", this.localStream.getAudioTracks().map(track => track.enabled));
                console.log("displayed", this.displayedStream.getAudioTracks().map(track => track.enabled));
                console.log("shared", this.sharedStream.getAudioTracks().map(track => track.enabled));
            },
            (err) => {
                this.start();
            }
        );
    }

    onRecordVideoStateChange(state: boolean) {
        this.sharedStream.getVideoTracks().forEach(track => track.enabled = state);
        this.displayedStream.getVideoTracks().forEach(track => track.enabled = state);
    }

    onRecordAudioStateChange(state: boolean) {
        this.sharedStream.getAudioTracks().forEach(track => track.enabled = state);
    }

    get allUsers(): Iterable<User> {
        return this.users.values();
    }

    start() {
        // Test WS
        this.websocket = new WebSocket(`${environment.signalingServer}/ws/${this.roomName}`);
        this.websocket.onopen = () => {
            this.userId = uuid();
            console.log('connected', this.userId);
            this.websocket.onmessage = (e) => {
                try {
                    const msg = JSON.parse(e.data);
                    console.log(`<= ${msg.data.messageType} (${msg.userId})`)
                    switch (msg.data.messageType) {
                        case "HELLO":
                            this.processHelloMessage(msg);
                            break;
                        case "HELLO-RESPONSE":
                            this.processHelloResponseMessage(msg);
                            break;
                        case "OFFER":
                            this.processOfferMessage(msg);
                            break;
                        case "ANWSER":
                            this.processAnwserMessage(msg);
                            break;
                        case "CANDIDATE-LOCAL":
                            this.processCandidateLocalMessage(msg);
                        case "CANDIDATE-REMOTE":
                            this.processCandidateRemoteMessage(msg);
                            break;
                    }
                } catch (e) {
                    console.error("Invalid message", e);
                }
            }

            // Say "HELLO" to everyone
            this.sendHello();


            this.ref.detectChanges();
        }
    }



    quit() {
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
        }
        Array.from(this.users.values()).forEach(user => {
            if (user.pcLocal) {
                user.pcLocal.close();
            }
            if (user.pcRemote) {
                user.pcRemote.close();
            }
        })
        this.users = new Map<string, User>();
        this.websocket.close();

        this.router.navigate(['']);
    }



    processHelloMessage(msg: any) {
        if (!this.users.get(msg.userId)) {
            this.users.set(msg.userId, new User(null, null));
            this.sendHelloResponse(msg.userId);
        }
        this.offerStreamTo(msg.userId);
        this.ref.detectChanges();
    }

    processHelloResponseMessage(msg: any) {
        if (!this.users.get(msg.userId)) {
            this.users.set(msg.userId, new User(null, null));
        }
        this.offerStreamTo(msg.userId);
        this.ref.detectChanges();
    }

    offerStreamTo(recipientId: string) {
        if (!this.me.stream) {
            return;
        }
        const pcLocal = new RTCPeerConnection({
            iceServers: environment.iceServers
        });
        this.users.get(recipientId).pcLocal = pcLocal;

        pcLocal.onicecandidate = (e) => {
            if (e.candidate) {
                this.sendRemoteCandidate(recipientId, e.candidate);
            }
        }
        pcLocal.addStream(this.sharedStream);
        pcLocal.createOffer().then(desc => {
            pcLocal.setLocalDescription(desc);
            this.sendOffer(recipientId, desc);
        })
    }

    processOfferMessage(msg: any) {
        if (!this.users.get(msg.userId)) {
            this.users.set(msg.userId, new User(null, null));
        }
        const pcRemote = new RTCPeerConnection({
            iceServers: environment.iceServers
        });
        this.users.get(msg.userId).pcRemote = pcRemote;
        pcRemote.onicecandidate = (e) => {
            if (e.candidate) {
                this.sendLocalCandidate(msg.userId, e.candidate);
            }
        }
        pcRemote.onaddstream = (event) => {
            this.users.get(msg.userId).stream = event.stream
            this.ref.detectChanges();

            if (document.body.clientHeight > window.innerHeight) {
                this.columnCount++;
                this.ref.detectChanges();
            }

        }
        pcRemote.onremovestream = (event) => {
            console.log('remove stream');
            this.users.delete(msg.userId)
            this.ref.detectChanges();
        }
        pcRemote.oniceconnectionstatechange = () => {
            if (pcRemote.iceConnectionState == 'disconnected') {
                console.log('remove stream');
                this.users.delete(msg.userId)
                this.ref.detectChanges();
            }
        }

        pcRemote.setRemoteDescription(msg.data.content);
        pcRemote.createAnswer().then(desc => {
            pcRemote.setLocalDescription(desc);
            this.sendAnwser(msg.userId, desc);
        })

        if (!this.users.get(msg.userId).pcLocal) {
            this.offerStreamTo(msg.userId);
        }
    }

    processAnwserMessage(msg: any) {
        this.users.get(msg.userId).pcLocal.setRemoteDescription(msg.data.content);
    }


    processCandidateLocalMessage(msg: any) {
        this.users.get(msg.userId).pcLocal.addIceCandidate(msg.data.content);
    }
    processCandidateRemoteMessage(msg: any) {
        this.users.get(msg.userId).pcRemote.addIceCandidate(msg.data.content);
    }


    sendHello() {
        this.send({
            userId: this.userId,
            data: {
                "messageType": "HELLO"
            }
        });
    }

    sendHelloResponse(recipientId: string) {
        this.send({
            userId: this.userId,
            recipientId: recipientId,
            data: {
                "messageType": "HELLO-RESPONSE"
            }
        });
    }


    sendLocalCandidate(recipientId: string, candidate: RTCIceCandidate) {
        this.send({
            userId: this.userId,
            recipientId: recipientId,
            data: {
                "messageType": "CANDIDATE-LOCAL",
                "content": candidate.toJSON()
            }
        });
    }

    sendRemoteCandidate(recipientId: string, candidate: RTCIceCandidate) {
        this.send({
            userId: this.userId,
            recipientId: recipientId,
            data: {
                "messageType": "CANDIDATE-REMOTE",
                "content": candidate.toJSON()
            }
        });
    }

    sendOffer(recipientId: string, description: RTCSessionDescription) {
        this.send({
            userId: this.userId,
            recipientId: recipientId,
            data: {
                "messageType": "OFFER",
                "content": description.toJSON()
            }
        });
    }

    sendAnwser(recipientId: string, description: RTCSessionDescription) {
        this.send({
            userId: this.userId,
            recipientId: recipientId,
            data: {
                "messageType": "ANWSER",
                "content": description.toJSON()
            }
        });
    }

    send(message: any) {
        this.websocket.send(JSON.stringify(message));
    }
}



