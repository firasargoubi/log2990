import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Player } from '@common/player';
import { NotificationService } from '@app/services/notification.service';

interface BonusConfig {
    life?: number;
    speed?: number;
    attack?: 'D4' | 'D6';
    defense?: 'D4' | 'D6';
}

@Component({
    selector: 'app-virtual-player-dialog',
    templateUrl: './virtual-player-dialog.component.html',
    styleUrls: ['./virtual-player-dialog.component.scss'],
    imports: [CommonModule],
})
export class VirtualPlayerDialogComponent implements OnInit {
    selectedProfile: 'aggressive' | 'defensive' | null = null;
    generatedBonuses: BonusConfig = {};

    constructor(
        public dialogRef: MatDialogRef<VirtualPlayerDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: BonusConfig,
        private notificationService: NotificationService,
    ) {}

    ngOnInit(): void {
        this.generateRandomBonuses();
    }

    selectProfile(profile: 'aggressive' | 'defensive'): void {
        this.selectedProfile = profile;
        this.generateRandomBonuses();
    }

    onConfirm(): void {
        if (!this.selectedProfile) {
            this.notificationService.showError('Veuillez sélectionner un profil');
            return;
        }

        const baseStats = {
            life: 4,
            speed: 4,
            attack: 4,
            defense: 4,
        };

        const finalStats = {
            ...baseStats,
            life: baseStats.life + (this.generatedBonuses.life || 0),
            speed: baseStats.speed + (this.generatedBonuses.speed || 0),
        };

        const virtualPlayer: Player = {
            id: '', // Server will assign
            name: '', // Server will assign
            avatar: '', // Server will assign
            isHost: false,
            ...finalStats,
            maxLife: finalStats.life,
            bonus: {
                ...this.generatedBonuses,
            },
            winCount: 0,
            virtualPlayerData: {
                profile: this.selectedProfile,
                decisionDelay: Math.floor(Math.random() * 1500) + 500,
            },
        };

        this.dialogRef.close(virtualPlayer);
    }

    onCancel(): void {
        this.dialogRef.close();
    }

    private generateRandomBonuses(): void {
        const attribute = Math.random() < 0.5 ? 'life' : 'speed';

        const useD6ForAttack = Math.random() < 0.5;
        const attackDice: 'D4' | 'D6' = useD6ForAttack ? 'D6' : 'D4';
        const defenseDice: 'D4' | 'D6' = useD6ForAttack ? 'D4' : 'D6';

        this.generatedBonuses = {
            [attribute]: 2,
            attack: attackDice,
            defense: defenseDice,
        };
    }
}
