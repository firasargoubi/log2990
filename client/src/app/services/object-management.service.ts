import { Injectable } from '@angular/core';
import { DEFAULT_OBJECTS } from '@app/interfaces/default-objects';
import { Game } from '@app/interfaces/game.model';
import { Object } from '@app/interfaces/object';
import { ObjectsTypes } from '@app/interfaces/objectsTypes';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class ObjectManagementService {
    private objects = new BehaviorSubject<Object[]>([]);
    objects$ = this.objects.asObservable();
    private readonly randomItemID = 7;

    initializeObjects(board: Game) {
        if (board.id) {
            const newObjects = JSON.parse(JSON.stringify(board.objects));
            this.objects.next(newObjects);
        } else {
            const newObjects = JSON.parse(JSON.stringify(DEFAULT_OBJECTS));
            this.adjustCountersBySize(newObjects, board.mapSize);

            this.objects.next(newObjects);
        }
    }

    placeObject(objectId: number): boolean {
        const currentObjects = this.objects.value;
        const objectToUpdate = currentObjects.find((obj) => obj.id === objectId);
        const randomItem = this.getRandomItem();

        if (!objectToUpdate || !randomItem) return false;

        if (objectId === ObjectsTypes.SPAWN || objectId === ObjectsTypes.RANDOM) {
            if (objectToUpdate.count > 0) {
                objectToUpdate.count--;
                if (objectToUpdate.count === 0) {
                    objectToUpdate.isPlaced = true;
                }
                this.objects.next([...currentObjects]);
                return true;
            }
            return false;
        }

        // Pour les autres objets, on vérifie le nombre maximum autorisé
        if (randomItem.count) {
            objectToUpdate.isPlaced = true;
            objectToUpdate.count = 0;
            randomItem.count--;
            this.objects.next([...currentObjects]);
            return true;
        }

        return false;
    }

    removeObject(objectId: number): boolean {
        const currentObjects = this.objects.value;
        const objectToUpdate = currentObjects.find((obj) => obj.id === objectId);

        if (!objectToUpdate) return false;

        // Pour les points de départ et objets aléatoires
        if (objectId === ObjectsTypes.SPAWN || objectId === ObjectsTypes.RANDOM) {
            objectToUpdate.count++;
            if (objectToUpdate.count > 0) {
                objectToUpdate.isPlaced = false;
            }
            this.objects.next([...currentObjects]);
            return true;
        }

        // Pour les autres objets
        if (objectToUpdate.isPlaced) {
            objectToUpdate.isPlaced = false;
            objectToUpdate.count = 1;
            this.objects.next([...currentObjects]);
            return true;
        }

        return false;
    }

    private adjustCountersBySize(objects: Object[], mapSize: 'small' | 'medium' | 'large') {
        // Trouve les objets spéciaux
        const spawnPoint = objects.find((obj) => obj.id === ObjectsTypes.SPAWN);
        const randomItem = objects.find((obj) => obj.id === ObjectsTypes.RANDOM);

        if (spawnPoint && randomItem) {
            switch (mapSize) {
                case 'small':
                    spawnPoint.count = 2;
                    randomItem.count = 2;
                    break;
                case 'medium':
                    spawnPoint.count = 4;
                    randomItem.count = 4;
                    break;
                case 'large':
                    spawnPoint.count = 6;
                    randomItem.count = 6;
                    break;
            }
        }
    }
    private getRandomItem(): Object | undefined {
        return this.objects.value.find((obj) => obj.id === this.randomItemID);
    }
}
