import { Component, Input, ChangeDetectorRef } from "@angular/core";
import { User } from "./user.model";
import { OnChanges } from "@angular/core/src/metadata/lifecycle_hooks";

@Component({
    selector: 'user',
    templateUrl: './user.component.html',
    styleUrls: ['./user.component.css']
})
export class UserComponent {
    @Input("user") user: User;
    
    videoEnabled: boolean = true;
    audioEnabled: boolean = false;

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