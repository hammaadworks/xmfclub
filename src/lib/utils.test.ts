import { describe, it, expect } from 'vitest'
import { calculateTenure } from './utils'

describe('calculateTenure', () => {
  it('handles null, undefined, or empty string', () => {
    expect(calculateTenure(null)).toBe('Recent')
    expect(calculateTenure(undefined)).toBe('Recent')
    expect(calculateTenure('')).toBe('Recent')
    expect(calculateTenure('invalid-date')).toBe('Recent')
  })

  it('handles today as New Member', () => {
    const today = new Date().toISOString().split('T')[0]
    expect(calculateTenure(today)).toBe('New Member')
  })

  it('handles future date as Upcoming', () => {
    const future = new Date()
    future.setFullYear(future.getFullYear() + 1)
    expect(calculateTenure(future.toISOString().split('T')[0])).toBe('Upcoming')
  })

  it('handles exact years', () => {
    const past = new Date()
    past.setFullYear(past.getFullYear() - 2)
    const res = calculateTenure(past.toISOString().split('T')[0])
    expect(res).toBe('2Y')
  })

  it('handles years and months', () => {
    const past = new Date()
    past.setFullYear(past.getFullYear() - 3)
    past.setMonth(past.getMonth() - 2)
    const res = calculateTenure(past.toISOString().split('T')[0])
    expect(res).toContain('3Y')
  })
})
