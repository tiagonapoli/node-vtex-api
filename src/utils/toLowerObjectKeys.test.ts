import { toLowerObjectKeys } from './toLowerObjectKeys'

test('Result object has keys lowercased', () => {
  expect(toLowerObjectKeys({ ABC: 123, bCd: 234 })).toStrictEqual({
    abc: 123,
    bcd: 234,
  })
})

test(`Object passed as argument isn't changed`, () => {
  const obj = { ABC: 123, bCd: 234 }
  toLowerObjectKeys(obj)
  expect(obj).toStrictEqual({ ABC: 123, bCd: 234 })
})
