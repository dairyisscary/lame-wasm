import { init } from "@/";

const CONTROL = document.getElementById("control") as HTMLButtonElement;
const STATUS = document.getElementById("status")!;

async function record() {
  const context = new AudioContext();

  const [stream, lame] = await Promise.all([
    navigator.mediaDevices.getUserMedia({ audio: true, video: false }),
    init({
      channels: 1,
      sampleRate: context.sampleRate,
      kilobitRate: 128,
    }),
  ]);

  const microphone = context.createMediaStreamSource(stream);

  const processor = context.createScriptProcessor(
    0, // Browser chooses the buffer size
    1, // Single input channel (mono)
    1, // Single output channel (mono)
  );

  microphone.connect(processor);
  processor.connect(context.destination);

  const chunks: BlobPart[] = [];

  function cleanup() {
    processor.removeEventListener("audioprocess", onProcessAudio);
    processor.disconnect();
    microphone.disconnect();
    if (context.state !== "closed") {
      void context.close();
    }
    lame.close();
  }

  function handleError(error?: unknown) {
    cleanup();
    console.error(error); // oxlint-disable-line no-console
  }

  function onProcessAudio({ inputBuffer }: AudioProcessingEvent) {
    try {
      const data = inputBuffer.getChannelData(0);
      chunks.push(lame.encodeFloat(data));
    } catch (error) {
      handleError(error);
    }
  }

  function downloadBlob(blob: Blob) {
    const url = window.URL.createObjectURL(blob);

    const anchor = document.createElement("a");
    anchor.style.display = "none";
    anchor.href = url;
    anchor.download = "recording.mp3";

    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    window.URL.revokeObjectURL(url);
  }

  function stopRecording() {
    chunks.push(lame.flush());

    if (!chunks.length) {
      handleError(new Error("No audio data was recorded"));
      return;
    }

    cleanup();
    downloadBlob(new Blob(chunks, { type: "audio/mp3" }));
  }

  await new Promise((resolve) => setTimeout(resolve, 300));
  processor.addEventListener("audioprocess", onProcessAudio);

  return stopRecording;
}

let recording = false;
let stop: (() => void) | undefined;
CONTROL.onclick = function onControlClick() {
  if (recording) {
    recording = false;
    STATUS.textContent = "Done!";
    CONTROL.textContent = "Start";
    stop?.();
    stop = undefined;
    return;
  }

  recording = true;
  STATUS.textContent = "Recording...";
  CONTROL.textContent = "Stop";
  void record().then((cb) => {
    if (recording) {
      stop = cb;
    } else {
      cb();
    }
  });
};
