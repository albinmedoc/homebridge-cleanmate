import net from 'net';

class TCPService {
  client: net.Socket;

  constructor(host: string, port: number) {
    this.client = new net.Socket();
    this.client.connect(port, host);
  }

  /* Maybe this should be a promise */
  sendPacket(packet: string): boolean {
    const data = Buffer.from(packet, 'hex');
    return this.client.write(data);
  }

  getResponse<T>(timeout = 2000): Promise<T> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        return reject();
      }, timeout);

      this.client.on('data', (data) => {
        try {
          const response = JSON.parse(data.toString('ascii'));
          return resolve(response);
        }catch(err) {
          //
        }
      });
    });
  }
}

export default TCPService;