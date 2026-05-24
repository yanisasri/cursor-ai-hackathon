import { useCallback, useEffect, useRef, useState } from "react";

interface Props {
  active: boolean;
  envelopeColor: string;
  onComplete: () => void;
}

/** Letter drop (1.2s) + brief pause before overlay fades out */
const ANIMATION_MS = 1200;
const FADE_MS = 280;

export function MailboxSendAnimation({ active, envelopeColor, onComplete }: Props) {
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const finishedRef = useRef(false);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setExiting(true);
    window.setTimeout(() => {
      setVisible(false);
      setExiting(false);
      onCompleteRef.current();
      finishedRef.current = false;
    }, FADE_MS);
  }, []);

  useEffect(() => {
    if (!active) {
      setVisible(false);
      setExiting(false);
      finishedRef.current = false;
      return;
    }

    finishedRef.current = false;
    setVisible(true);
    setExiting(false);

    const timer = window.setTimeout(finish, ANIMATION_MS);
    return () => window.clearTimeout(timer);
  }, [active, finish]);

  if (!visible) return null;

  return (
    <div
      className={`mailbox-animation-overlay${exiting ? " mailbox-animation-overlay--exit" : ""}`}
      aria-live="polite"
      aria-label="Note delivered to mailbox"
    >
      <div className="mailbox-animation-stage">
        <div className="mailbox-animation-mailbox" aria-hidden>
          <div className="mailbox-animation-post" />
          <div className="mailbox-animation-box" />
          <div className="mailbox-animation-slot" />
          <div className="mailbox-animation-flag" />
        </div>
        <div
          className="mailbox-animation-letter"
          style={{ backgroundColor: envelopeColor }}
          onAnimationEnd={finish}
        >
          <div className="mailbox-animation-letter-flap" style={{ borderColor: envelopeColor }} />
        </div>
      </div>
      <p className="mailbox-animation-caption">Delivered to their mailbox</p>
    </div>
  );
}
