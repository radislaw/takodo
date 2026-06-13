import { describe, it, expect, vi, afterEach } from 'vitest'

describe('notifyTimerEnd', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it('does not throw when Notification is unsupported (jsdom default)', async () => {
    const { notifyTimerEnd } = await import('./notifyTimerEnd')
    await expect(notifyTimerEnd('Готово', 'Фокус завершён')).resolves.toBeUndefined()
  })

  it('does nothing when permission is not granted', async () => {
    const showNotification = vi.fn()
    vi.stubGlobal('Notification', vi.fn() as unknown as typeof Notification)
    Object.assign(Notification, { permission: 'default' })
    vi.stubGlobal('navigator', {
      serviceWorker: { getRegistration: vi.fn().mockResolvedValue({ showNotification }) },
    })

    const { notifyTimerEnd } = await import('./notifyTimerEnd')
    await notifyTimerEnd('Готово', 'Фокус завершён')

    expect(showNotification).not.toHaveBeenCalled()
  })

  it('uses the service worker registration when one exists', async () => {
    const showNotification = vi.fn()
    vi.stubGlobal('Notification', vi.fn() as unknown as typeof Notification)
    Object.assign(Notification, { permission: 'granted' })
    vi.stubGlobal('navigator', {
      serviceWorker: { getRegistration: vi.fn().mockResolvedValue({ showNotification }) },
    })

    const { notifyTimerEnd } = await import('./notifyTimerEnd')
    await notifyTimerEnd('Готово', 'Фокус завершён')

    expect(showNotification).toHaveBeenCalledWith(
      'Готово',
      expect.objectContaining({ body: 'Фокус завершён', tag: 'timer-end' }),
    )
  })

  it('falls back to a page Notification when no registration is present', async () => {
    const ctor = vi.fn()
    vi.stubGlobal('Notification', ctor as unknown as typeof Notification)
    Object.assign(Notification, { permission: 'granted' })
    vi.stubGlobal('navigator', {
      serviceWorker: { getRegistration: vi.fn().mockResolvedValue(undefined) },
    })

    const { notifyTimerEnd } = await import('./notifyTimerEnd')
    await notifyTimerEnd('Готово', 'Фокус завершён')

    expect(ctor).toHaveBeenCalledWith('Готово', expect.objectContaining({ body: 'Фокус завершён' }))
  })

  it('swallows errors thrown by showNotification', async () => {
    const showNotification = vi.fn().mockRejectedValue(new Error('boom'))
    vi.stubGlobal('Notification', vi.fn() as unknown as typeof Notification)
    Object.assign(Notification, { permission: 'granted' })
    vi.stubGlobal('navigator', {
      serviceWorker: { getRegistration: vi.fn().mockResolvedValue({ showNotification }) },
    })

    const { notifyTimerEnd } = await import('./notifyTimerEnd')
    await expect(notifyTimerEnd('Готово', 'Фокус завершён')).resolves.toBeUndefined()
  })
})
