export class SocketTestHelper {
    private callbacks: Map<string, Array<(...args: any[]) => void>> = new Map();

    id = 'test-socket-id';
    connected = true;

    on(event: string, callback: (...args: any[]) => void): void {
        if (!this.callbacks.has(event)) {
            this.callbacks.set(event, []);
        }
        this.callbacks.get(event)?.push(callback);
    }

    emit(event: string, ...args: any[]): boolean {
        return true;
    }

    disconnect(): void {
        this.connected = false;
    }

    connect(): void {
        this.connected = true;
    }

    // Helper method to trigger events
    peerSideEmit(event: string, ...args: any[]): void {
        if (this.callbacks.has(event)) {
            const callbacks = this.callbacks.get(event) || [];
            callbacks.forEach((callback) => callback(...args));
        }
    }
}
