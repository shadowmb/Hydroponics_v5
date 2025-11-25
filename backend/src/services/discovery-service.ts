import dgram from 'dgram';
import { EventEmitter } from 'events';

export interface DiscoveredDevice {
    ip: string;
    mac: string;
    model?: string;
    firmware?: string;
    capabilities?: string[];
    lastSeen: Date;
}

export class DiscoveryService extends EventEmitter {
    private socket: dgram.Socket | null = null;
    private discoveredDevices: Map<string, DiscoveredDevice> = new Map();

    constructor() {
        super();
    }

    /**
     * Scans the network for controllers via UDP broadcast.
     * @param port The UDP port to send/receive on (default: 8888)
     * @param broadcastAddress The broadcast IP (default: 255.255.255.255)
     * @param timeoutMs Duration to listen for responses (default: 3000ms)
     */
    public async scan(
        port: number = 8888,
        broadcastAddress: string = '255.255.255.255',
        timeoutMs: number = 3000
    ): Promise<DiscoveredDevice[]> {
        return new Promise((resolve, reject) => {
            this.discoveredDevices.clear();
            this.socket = dgram.createSocket('udp4');

            this.socket.on('error', (err) => {
                console.error('[DiscoveryService] Socket error:', err);
                this.cleanup();
                reject(err);
            });

            this.socket.on('message', (msg, rinfo) => {
                try {
                    const messageStr = msg.toString();
                    console.log(`[DiscoveryService] Received from ${rinfo.address}:${rinfo.port}: ${messageStr}`);

                    const data = JSON.parse(messageStr);

                    // Validate response format: {"type":"ANNOUNCE", "mac":"...", ...}
                    if (data.type === 'ANNOUNCE' && data.mac) {
                        const device: DiscoveredDevice = {
                            ip: rinfo.address, // Use the actual IP from the packet header
                            mac: data.mac,
                            model: data.model || 'Unknown',
                            firmware: data.firmware || 'Unknown',
                            capabilities: data.capabilities || [],
                            lastSeen: new Date()
                        };
                        this.discoveredDevices.set(data.mac, device);
                    }
                } catch (err) {
                    console.warn('[DiscoveryService] Failed to parse message:', err);
                }
            });

            this.socket.bind(() => {
                if (!this.socket) return;

                this.socket.setBroadcast(true);

                const message = Buffer.from('HYDROPONICS_DISCOVERY');

                console.log(`[DiscoveryService] Broadcasting to ${broadcastAddress}:${port}...`);

                this.socket.send(message, 0, message.length, port, broadcastAddress, (err) => {
                    if (err) {
                        console.error('[DiscoveryService] Send error:', err);
                        this.cleanup();
                        reject(err);
                        return;
                    }
                });

                // Wait for responses
                setTimeout(() => {
                    const results = Array.from(this.discoveredDevices.values());
                    console.log(`[DiscoveryService] Scan finished. Found ${results.length} devices.`);
                    this.cleanup();
                    resolve(results);
                }, timeoutMs);
            });
        });
    }

    private cleanup() {
        if (this.socket) {
            try {
                this.socket.close();
            } catch (e) {
                // Ignore close errors
            }
            this.socket = null;
        }
    }
}

export const discoveryService = new DiscoveryService();
