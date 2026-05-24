export function speakText(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return false;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.82;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
  return true;
}

export function hasSpeechRecognition() {
  if (typeof window === "undefined") return false;
  const w = window as Window & {
    SpeechRecognition?: unknown;
    webkitSpeechRecognition?: unknown;
  };
  return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
}

export function startSpeechRecognition(onResult: (transcript: string) => void, onEnd: () => void, onError: () => void) {
  const w = window as Window & {
    SpeechRecognition?: new () => {
      lang: string;
      interimResults: boolean;
      maxAlternatives: number;
      start: () => void;
      stop: () => void;
      onresult: ((event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null;
      onerror: (() => void) | null;
      onend: (() => void) | null;
    };
    webkitSpeechRecognition?: new () => {
      lang: string;
      interimResults: boolean;
      maxAlternatives: number;
      start: () => void;
      stop: () => void;
      onresult: ((event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null;
      onerror: (() => void) | null;
      onend: (() => void) | null;
    };
  };

  const Recognition = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Recognition) {
    onError();
    return null;
  }

  const recognition = new Recognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.onresult = (event) => {
    const transcript = event.results[0]?.[0]?.transcript ?? "";
    onResult(transcript);
  };
  recognition.onerror = onError;
  recognition.onend = onEnd;
  recognition.start();
  return recognition;
}
