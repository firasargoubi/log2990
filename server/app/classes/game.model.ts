import { Schema, model } from 'mongoose';

const GameSchema = new Schema({
    id: {type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    mode: { type: String, required: true },
    mapSize: { type: String, required: true },
    lastModified: { type: Date, default: Date.now },
    isVisible: { type: Boolean, required: true},
    board: {type: [[Number]], required: true, default: Array}
});

export const Game = model('Game', GameSchema);
