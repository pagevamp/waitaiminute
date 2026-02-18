import { messages } from "./messages";

const ROTATION_INTERVAL = 30_000; // 30 seconds

let currentIndex = Math.floor(Math.random() * messages.length);
let intervalId: ReturnType<typeof setInterval> | null = null;

export function getRandomMessage(): string {
  currentIndex = Math.floor(Math.random() * messages.length);
  return messages[currentIndex];
}

export function getCurrentMessage(): string {
  return messages[currentIndex];
}

export function startRotation(
  onNewMessage: (message: string) => void
): () => void {
  stopRotation();

  intervalId = setInterval(() => {
    // Pick a different message than current
    let newIndex: number;
    do {
      newIndex = Math.floor(Math.random() * messages.length);
    } while (newIndex === currentIndex && messages.length > 1);
    currentIndex = newIndex;

    onNewMessage(messages[currentIndex]);
  }, ROTATION_INTERVAL);

  return stopRotation;
}

export function stopRotation(): void {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
