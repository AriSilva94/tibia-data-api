export class CollectorParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CollectorParseError';
  }
}
