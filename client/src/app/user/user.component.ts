import { Component, Input, ChangeDetectorRef } from "@angular/core";
import { User } from "./user.model";
import { OnChanges } from "@angular/core/src/metadata/lifecycle_hooks";

@Component({
    selector: 'user',
    templateUrl: './user.component.html',
    styleUrls: ['./user.component.scss']
})
export class UserComponent {
    @Input() user: User;
    @Input() configurable: boolean;
    
    videoEnabled: boolean = true;
    audioEnabled: boolean = true;

    constructor(private ref: ChangeDetectorRef){
    }

    toggleVideo(){
        this.videoEnabled = !this.videoEnabled;
        this.ref.detectChanges();
    }

    toggleAudio(){
        this.audioEnabled = !this.audioEnabled;
        this.ref.detectChanges();
    }
}