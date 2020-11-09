export default function sleep(ms: number): Promise<void> {
  return new Promise((response) => setTimeout(response, ms));
}
