export class NetworkAccessError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "NetworkAccessError";
  }
}
