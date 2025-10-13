class SCAudioBus {
  id: number;
  constructor(opts?: { id: number }) {
    this.id = opts?.id ?? 0;
  }
}

export { SCAudioBus };
