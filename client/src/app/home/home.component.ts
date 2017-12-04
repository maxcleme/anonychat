import { Component, ViewChild, OnInit } from "@angular/core";
import { Router } from '@angular/router';

@Component({
    selector: 'home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class HomeComponent {
    roomName: string = '';

    constructor(private router: Router) {
    }

    join() {
        this.router.navigate(['room', this.roomName]);
    }
}