import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

export class SocketService {
    private io: Server;

    constructor(server: HttpServer) {
        console.log('Initialisation du serveur WebSocket...');
        this.io = new Server(server, {
            cors: {
                origin: '*',
                methods: ['GET', 'POST'],
            },
        });
    }
    init(): void {
        this.io.on('connection', (socket: Socket) => {
            console.log(`User connected: ${socket.id}`);

            socket.on('message', (data) => {
                console.log(`Message reçu: ${data}`);
                this.io.emit('message', data);
            });

            socket.on('disconnect', () => {
                console.log(`User disconnected: ${socket.id}`);
            });
        });
    }
}
