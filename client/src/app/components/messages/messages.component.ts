import { Component } from '@angular/core';

@Component({
    selector: 'app-messages',
    templateUrl: './messages.component.html',
    styleUrls: ['./messages.component.scss'],
})
export class MessagesComponent {
    chatMessages = [];
    eventLog = [];

    activeTab: string = 'chat';
}
