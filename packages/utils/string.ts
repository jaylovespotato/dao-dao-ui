export function pad(num: number, width = 1, z = '0') {
  const n = String(num)
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n
}
