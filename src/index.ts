import createBridge, { type Bridge } from "@lame-wasm";

/** Mono or stereo */
export type Channels = 1 | 2;

export type InitOptions<C extends Channels> = {
  /** Channel count */
  channels: C;
  /** Input sample rate hz (eg 48000) */
  sampleRate: number;
  /** Output encoding bitrate per second (eg 128) */
  kilobitRate: number;
};

type Bytes = Uint8Array<ArrayBuffer>;

export type LameInstance<C extends Channels> = {
  /** Encode float PCM data */
  encodeFloat: C extends 2
    ? (left: Float32Array, right: Float32Array) => Bytes
    : (mono: Float32Array) => Bytes;
  /** Flush the encoder */
  flush: () => Bytes;
  /** Shutdown the encoder */
  close: () => void;
};

type Slice = {
  pointer: number;
  size: number;
};

const OUTPUT_MIN_BYTES = 7_200;

function assert(predicate: unknown, message: string) {
  if (!predicate) {
    throw new Error(message);
  }
}

function deallocateSlice(bridge: Bridge, slice: Slice | null): null {
  if (slice) {
    bridge._free(slice.pointer);
  }
  return null;
}

function allocateSlice(bridge: Bridge, slice: Slice | null, size: number): Slice {
  if (slice && slice.size >= size) {
    return slice;
  }

  if (slice) {
    bridge._free(slice.pointer);
  }

  return { pointer: bridge._malloc(size), size };
}

/** Initialize the encoder */
export async function init(options: InitOptions<1>): Promise<LameInstance<1>>;
export async function init(options: InitOptions<2>): Promise<LameInstance<2>>;
export async function init(options: InitOptions<Channels>): Promise<LameInstance<Channels>> {
  const bridge = await createBridge();

  let lamePointer = bridge._init(options.channels, options.sampleRate, options.kilobitRate);
  assert(lamePointer, "Failed to initialize LAME");

  let input: Slice | null = null;
  let output: Slice | null = null;

  return {
    encodeFloat({ length: sampleCount, byteLength: leftSize, buffer: leftBuffer }, right) {
      assert(lamePointer, "LAME already closed");

      const rightSize = right?.byteLength || 0;

      input = allocateSlice(bridge, input, leftSize + rightSize);
      const leftPointer = input.pointer;

      bridge.HEAPU8.set(new Uint8Array(leftBuffer), leftPointer);

      let rightPointer = leftPointer;
      if (rightSize) {
        assert(rightSize === leftSize, "Left and right must be the same size");
        rightPointer += leftSize;
        bridge.HEAPU8.set(new Uint8Array(right.buffer), rightPointer);
      }

      const outputWorstCaseSize = Math.ceil(1.25 * sampleCount + OUTPUT_MIN_BYTES);
      output = allocateSlice(bridge, output, outputWorstCaseSize);

      const writtenCount = bridge._encode_float(
        lamePointer,
        leftPointer,
        rightPointer,
        sampleCount,
        output.pointer,
        output.size,
      );
      assert(writtenCount >= 0, `Encoding issue -- return code ${writtenCount}`);

      return bridge.HEAPU8.slice(output.pointer, output.pointer + writtenCount);
    },
    flush() {
      output = allocateSlice(bridge, output, OUTPUT_MIN_BYTES);
      const writtenCount = bridge._flush(lamePointer, output.pointer, output.size);
      return bridge.HEAPU8.slice(output.pointer, output.pointer + writtenCount);
    },
    close() {
      bridge._close(lamePointer);
      input = deallocateSlice(bridge, input);
      output = deallocateSlice(bridge, output);
      lamePointer = 0;
    },
  };
}
