import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { PageUrl } from '@app/Consts/route-constants';
// import { LobbyService } from '@app/services/lobby.service';

@Component({
    selector: 'app-stats-page',
    imports: [],
    templateUrl: './stats-page.component.html',
    styleUrls: ['./stats-page.component.scss'],
    standalone: true,
})
export class StatsPageComponent {
    private router = inject(Router);
    // private lobbyService = inject(LobbyService);

    return() {
        // this.lobbyService.disconnect();
        this.router.navigate([PageUrl.Home], { replaceUrl: true });
    }
}
