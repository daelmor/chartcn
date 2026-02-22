export function imageKey(width: number, height: number, format: string): string {
  return `${width}x${height}.${format}`;
}
