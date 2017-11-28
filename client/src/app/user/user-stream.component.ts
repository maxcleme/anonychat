import { Component, Input, SimpleChanges } from "@angular/core";
import { OnChanges } from "@angular/core/src/metadata/lifecycle_hooks";

@Component({
    selector: 'user-stream',
    templateUrl: './user-stream.component.html',
    styleUrls: ['./user-stream.component.css']
})
export class UserStreamComponent implements OnChanges {
    @Input() stream: MediaStream;
    @Input() video: boolean;
    @Input() audio: boolean;


    ngOnChanges(changes: SimpleChanges): void {
        if (this.stream) {
            if (this.video) {
                this.stream.getVideoTracks().forEach(videoTrack => videoTrack.enabled = true);
            } else {
                this.stream.getVideoTracks().forEach(videoTrack => videoTrack.enabled = false);
            }

            if (this.audio) {
                this.stream.getAudioTracks().forEach(audioTrack => audioTrack.enabled = true);
            } else {
                this.stream.getAudioTracks().forEach(audioTrack => audioTrack.enabled = false);
            }
        }
    }
}