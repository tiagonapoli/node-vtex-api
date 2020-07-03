export function toLowerObjectKeys(obj: Record<string, any>) {
  const res: Record<string, any> = {}
  for (const key in obj) {
    res[key.toLowerCase()] = obj[key]
  }

  return res
}