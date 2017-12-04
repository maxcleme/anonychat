import { Component, Input, EventEmitter, Output, ChangeDetectorRef } from '@angular/core';

@Component({
    selector: 'record-button',
    templateUrl: './record-button.component.html',
    styleUrls: ['./record-button.component.scss']
})
export class RecordButtonComponent {
    @Input() text: string;
    @Input() record: boolean;
    @Output() onRecordStateChange: EventEmitter<boolean> = new EventEmitter<boolean>();

    constructor(private ref: ChangeDetectorRef){
    }

    toggle() {
        this.record = !this.record;
        this.onRecordStateChange.emit(this.record);
        this.ref.detectChanges();
    }
}