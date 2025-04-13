import { TileTypes } from '@common/game.interface';
import { GAME_IMAGES } from './app-constants';

export const TILE_IMAGES: Record<number, string> = {
    [TileTypes.Grass]: GAME_IMAGES.grass,
    [TileTypes.Water]: GAME_IMAGES.water,
    [TileTypes.Ice]: GAME_IMAGES.ice,
    [TileTypes.DoorClosed]: GAME_IMAGES.doorClosed,
    [TileTypes.DoorOpen]: GAME_IMAGES.doorOpen,
    [TileTypes.Wall]: GAME_IMAGES.wall,
};

export const DEFAULT_TILE_IMAGE = GAME_IMAGES.default;

export const MAX_TILE = 6;
