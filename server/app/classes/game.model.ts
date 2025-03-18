import { Schema, model } from 'mongoose';
import { Game as GameInterface } from '@common/game.interface';

const gameSchema = new Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    mode: { type: String, required: true },
    previewImage: { type: String, required: true },
    mapSize: { type: String, required: true },
    lastModified: { type: Date, default: Date.now },
    isVisible: { type: Boolean, required: true },
    board: { type: [[Number]], required: true, default: Array },
    objects: { type: Array, required: true, default: Array },
});

export const game = model<GameInterface>('Game', gameSchema);
