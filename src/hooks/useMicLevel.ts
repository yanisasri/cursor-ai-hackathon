import { useEffect, useState } from "react";

const SPEAKING_THRESHOLD = 0.03;

export function useMicLevel(stream: MediaStream | null, muted: boolean) {
  const [level, setLevel] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (!stream || muted) {
      setLevel(0);
      setIsSpeaking(false);
      return;
    }

    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.65;
    source.connect(analyser);

    const data = new Uint8Array(analyser.fftSize);
    let frame = 0;

    const tick = () => {
      analyser.getByteTimeDomainData(data);
      let sumSquares = 0;
      for (let i = 0; i < data.length; i++) {
        const sample = (data[i] - 128) / 128;
        sumSquares += sample * sample;
      }
      const rms = Math.sqrt(sumSquares / data.length);
      setLevel(rms);
      setIsSpeaking(rms >= SPEAKING_THRESHOLD);
      frame = requestAnimationFrame(tick);
    };

    void audioContext.resume();
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      source.disconnect();
      void audioContext.close();
    };
  }, [stream, muted]);

  return { level, isSpeaking };
}
