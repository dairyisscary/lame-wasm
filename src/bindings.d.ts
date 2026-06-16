declare module "@lame-wasm" {
  export type Bridge = {
    _init: (channels: number, sampleRate: number, bitrate: number) => number;
    _encode_float: (
      flags: number,
      input: number,
      inputSize: number,
      sampleCount: number,
      destination: number,
      destinationSize: number,
    ) => number;
    _flush: (flags: number, destination: number, destinationSize: number) => number;
    _close: (flags: number) => void;

    HEAPU8: Uint8Array;
    _free: (pointer: number) => void;
    _malloc: (size: number) => number;
  };

  const factory: () => Promise<Bridge>;
  export default factory;
}
