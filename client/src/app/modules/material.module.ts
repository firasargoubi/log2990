import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AppComponent } from "@app/pages/app/app.component";
import { ModalCreationComponent } from '@app/components/modal-creation/modal-creation.component';
import { GameListComponent } from '@app/components/game-list/game-list.component';


const modules = [
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatExpansionModule,
    MatIconModule,
    MatRadioModule,
    MatToolbarModule,
    MatTooltipModule,
    MatSlideToggleModule,
    AppComponent,
    ModalCreationComponent,
    GameListComponent,
    
    ModalCreationComponent,
];

/**
 * Material module
 * IMPORTANT : Retirer les modules non utilisés et ajouter seulement ceux vraiment utilisés
 */
@NgModule({
    imports: [...modules],
    exports: [...modules],
    providers: [],
})
export class AppMaterialModule {}
