export class NotImplemented extends Error {
  constructor(public readonly strategyId: string) {
    super(`Feature identify not yet implemented for strategy: ${strategyId}`);
    this.name = "NotImplemented";
  }
}
