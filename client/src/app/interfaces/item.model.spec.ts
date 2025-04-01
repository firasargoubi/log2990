import { ObjectsTypes } from '@common/game.interface';
import { ItemModel } from './item.model';

describe('ItemModel', () => {
    it('should create an instance with the correct type', () => {
        const itemModel = new ItemModel(ObjectsTypes.BOOTS);
        expect(itemModel.type).toBe(ObjectsTypes.BOOTS);
    });

    it('should initialize isPlaced to false by default', () => {
        const itemModel = new ItemModel(ObjectsTypes.BOOTS);
        expect(itemModel.isPlaced).toBeFalse();
    });

    it('should initialize tooltipText to null by default', () => {
        const itemModel = new ItemModel(ObjectsTypes.BOOTS);
        expect(itemModel.tooltipText).toBeNull();
    });

    describe('image getter', () => {
        const testCases = [
            { type: 1, expectedImage: 'assets/objects/boots.png' },
            { type: 2, expectedImage: 'assets/objects/sword.png' },
            { type: 3, expectedImage: 'assets/objects/potion.png' },
            { type: 4, expectedImage: 'assets/objects/wand.png' },
            { type: 5, expectedImage: 'assets/objects/crystal_ball.png' },
            { type: 6, expectedImage: 'assets/objects/berry-juice.png' },
            { type: 7, expectedImage: 'assets/objects/vortex.png' },
            { type: 8, expectedImage: 'assets/objects/gnome.png' },
            { type: 9, expectedImage: 'assets/objects/flag.png' },
            { type: 999, expectedImage: 'assets/objects/undefined.png' },
        ];

        testCases.forEach(({ type, expectedImage }) => {
            it(`should return correct image for type ${type}`, () => {
                const itemModel = new ItemModel(type);
                expect(itemModel.image).toBe(expectedImage);
            });
        });
    });

    describe('name getter', () => {
        const testCases = [
            { type: 1, expectedName: 'Bottes de vitesse' },
            { type: 2, expectedName: 'Épée de puissance' },
            { type: 3, expectedName: 'Potion de soin' },
            { type: 4, expectedName: 'Baguette magique' },
            { type: 5, expectedName: 'Boule de cristal' },
            { type: 6, expectedName: 'Jus de baies' },
            { type: 7, expectedName: 'Point de départ' },
            { type: 8, expectedName: 'Gnome mystère' },
            { type: 9, expectedName: 'Drapeau' },
            { type: 999, expectedName: 'Objet inconnu' },
        ];

        testCases.forEach(({ type, expectedName }) => {
            it(`should return correct name for type ${type}`, () => {
                const itemModel = new ItemModel(type);
                expect(itemModel.name).toBe(expectedName);
            });
        });
    });

    describe('description getter', () => {
        const testCases = [
            { type: 1, expectedDescription: 'Les bottes magiques vous permettront de vous déplacer à une vitesse SUPERSONIQUE!' },
            { type: 2, expectedDescription: 'Cette épée effectue plus de dégats sur vos ennemis!' },
            { type: 3, expectedDescription: 'Figez le temps et profitez-en pour vous déplacer une fois de plus que vos adversaires...' },
            {
                type: 4,
                expectedDescription: "Cette mystérieuse baguette vous permet d'ensorceler un de vos adversaires et de le dérouter de son chemin!",
            },
            { type: 5, expectedDescription: "Vos talents de clairvoyance vous permettent d'identifier tous les points faibles d'un de vos ennemis." },
            { type: 6, expectedDescription: 'Ne paniquez pas, ce nectar soignera toutes vos blessures!' },
            { type: 7, expectedDescription: "Cet objet indique l'endroit où une bataille épique est sur le point d'avoir lieu" },
            { type: 8, expectedDescription: 'Ce petit gnome farceur a un cadeau pour vous. À vos risque et périls...' },
            { type: 9, expectedDescription: "Cette relique à l'effigie de la reine de la forêt doit être sécurisé à tout prix." },
            { type: 999, expectedDescription: 'Bravo, vous avez réussi à débloquer cet item spécial.' },
        ];

        testCases.forEach(({ type, expectedDescription }) => {
            it(`should return correct description for type ${type}`, () => {
                const itemModel = new ItemModel(type);
                expect(itemModel.description).toBe(expectedDescription);
            });
        });
    });
});
