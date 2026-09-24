/* Qcon Guide — first-party analytics beacon.
 *
 * Posts OTLP/HTTP log records to the platform collector at
 * telemetry.ltc.bcit.ca, which routes them into the analytics Loki stream
 * behind the Qcon Guide Usage Grafana dashboard.
 *
 * Privacy posture: aggregate-only. No cookies, no user identifiers, no raw
 * user-agent or screen dimensions. The only persisted state is a
 * sessionStorage-scoped session ID. Client environment is reduced to the
 * same bounded taxonomy as HRIV telemetry (browser/os/device/viewport
 * buckets). Disabled outside *.ltc.bcit.ca so local development never emits.
 */
(function () {
  'use strict'

  var ENDPOINT = 'https://telemetry.ltc.bcit.ca/v1/logs'
  var SERVICE_NAME = 'qcon-guide-frontend'
  var SCHEMA_VERSION = 1
  var FLUSH_DELAY_MS = 1500
  var MAX_EVENTS_PER_REQUEST = 20
  var HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000
  var DOWNLOAD_EXTENSIONS = /\.(docx?|pdf|zip|xlsx?|pptx?|csv|txt)$/i

  if (typeof window === 'undefined' || typeof navigator === 'undefined') return
  if (!/\.ltc\.bcit\.ca$/.test(window.location.hostname)) return

  var params = new URLSearchParams(window.location.search)
  var synthetic = params.has('synthetic')

  var sessionId
  try {
    sessionId = window.sessionStorage.getItem('qcon-guide.session-id')
    if (!sessionId) {
      sessionId =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : String(Date.now()) + '-' + String(Math.random()).slice(2)
      window.sessionStorage.setItem('qcon-guide.session-id', sessionId)
    }
  } catch (e) {
    sessionId = 'ephemeral-' + String(Date.now())
  }

  /* Bounded client-environment detection (mirrors hriv clientEnv). Never
   * emit the raw UA, exact dimensions, or anything fingerprintable. */
  function detectBrowser(ua) {
    var patterns = [
      ['edge', /Edg(?:e|A|iOS)?\/(\d+)/],
      ['opera', /(?:OPR|Opera)\/(\d+)/],
      ['samsung', /SamsungBrowser\/(\d+)/],
      ['firefox', /(?:Firefox|FxiOS)\/(\d+)/],
      ['chrome', /(?:Chrome|CriOS)\/(\d+)/],
      ['safari', /Version\/(\d+).*Safari/],
    ]
    for (var i = 0; i < patterns.length; i++) {
      var m = ua.match(patterns[i][1])
      if (m) return { family: patterns[i][0], major: m[1] }
    }
    return { family: 'other' }
  }

  function detectOs(ua) {
    if (/Windows/.test(ua)) return 'windows'
    if (/CrOS/.test(ua)) return 'chromeos'
    if (/Android/.test(ua)) return 'android'
    if (/(iPhone|iPad|iPod)/.test(ua)) return 'ios'
    if (/Mac OS X|Macintosh/.test(ua)) return 'macos'
    if (/Linux/.test(ua)) return 'linux'
    return 'other'
  }

  function detectDeviceClass(ua, touch) {
    if (/iPad|Tablet/.test(ua) || (/Android/.test(ua) && !/Mobile/.test(ua))) return 'tablet'
    if (/Mobi|iPhone|iPod|Android/.test(ua)) return 'mobile'
    if (touch && /Macintosh/.test(ua)) return 'tablet' // iPadOS masquerades as macOS
    return 'desktop'
  }

  function viewportBucket(width) {
    if (width < 600) return 'xs'
    if (width < 900) return 'sm'
    if (width < 1200) return 'md'
    if (width < 1536) return 'lg'
    return 'xl'
  }

  var ua = navigator.userAgent || ''
  var touch =
    (typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 0) ||
    'ontouchstart' in window
  var browser = detectBrowser(ua)
  var clientEnv = {
    client_browser_family: browser.family,
    client_browser_major: browser.major,
    client_os_family: detectOs(ua),
    client_device_class: detectDeviceClass(ua, touch),
    client_viewport_bucket: viewportBucket(window.innerWidth || 0),
    client_touch_capable: touch,
  }

  var environment = /\.latest\./.test(window.location.hostname) ? 'latest' : 'stable'

  function currentPage() {
    return window.location.pathname
  }

  function attr(key, value) {
    if (value === undefined || value === null) return null
    var v
    if (typeof value === 'boolean') v = { boolValue: value }
    else if (typeof value === 'number') v = { doubleValue: value }
    else v = { stringValue: String(value) }
    return { key: key, value: v }
  }

  var pending = []
  var flushTimer = null

  function emit(eventName, attrs) {
    var record = { 'event.name': eventName }
    if (attrs) {
      for (var k in attrs) record[k] = attrs[k]
    }
    pending.push(record)
    scheduleFlush()
  }

  function scheduleFlush() {
    if (flushTimer !== null) return
    flushTimer = setTimeout(flush, FLUSH_DELAY_MS)
  }

  function flush() {
    if (flushTimer !== null) {
      clearTimeout(flushTimer)
      flushTimer = null
    }
    if (pending.length === 0) return
    var batch = pending.splice(0, pending.length)
    while (batch.length > 0) {
      post(batch.splice(0, MAX_EVENTS_PER_REQUEST))
    }
  }

  function post(events) {
    var now = String(Date.now()) + '000000'
    var logRecords = events.map(function (e) {
      var attributes = [
        attr('event.name', e['event.name']),
        attr('synthetic', synthetic),
        attr('session.id', sessionId),
        attr('page', currentPage()),
      ]
      for (var k in e) {
        if (k !== 'event.name') attributes.push(attr(k, e[k]))
      }
      for (var ck in clientEnv) attributes.push(attr(ck, clientEnv[ck]))
      attributes.push(attr('schema_version', SCHEMA_VERSION))
      return {
        timeUnixNano: now,
        attributes: attributes.filter(Boolean),
        body: { stringValue: e['event.name'] },
      }
    })

    var payload = {
      resourceLogs: [
        {
          resource: {
            attributes: [
              attr('service.name', SERVICE_NAME),
              attr('deployment.environment.name', environment),
            ],
          },
          scopeLogs: [
            {
              scope: { name: 'qcon-guide-analytics' },
              logRecords: logRecords,
            },
          ],
        },
      ],
    }

    try {
      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(function () {
        /* best-effort; never block the page */
      })
    } catch (e) {
      /* best-effort */
    }
  }

  /* ---- page views, including instant navigation ---- */

  var lastViewedPage = null
  function pageView() {
    var page = currentPage()
    if (page === lastViewedPage) return
    lastViewedPage = page
    emit('qcon_guide.page_view', { page_path: page })
  }

  /* Zensical/Material instant navigation goes through the History API. */
  ;['pushState', 'replaceState'].forEach(function (method) {
    var original = history[method]
    history[method] = function () {
      var result = original.apply(this, arguments)
      setTimeout(pageView, 0)
      return result
    }
  })
  window.addEventListener('popstate', pageView)

  /* ---- clicks: outbound click-through and downloads ---- */

  function targetKind(host) {
    if (host === 'qcon.ltc.bcit.ca') return 'qcon_service'
    if (host === 'learn.bcit.ca') return 'd2l'
    return 'external'
  }

  document.addEventListener(
    'click',
    function (ev) {
      var el = ev.target && ev.target.closest ? ev.target.closest('a[href]') : null
      if (!el) return
      var url
      try {
        url = new URL(el.getAttribute('href'), window.location.href)
      } catch (e) {
        return
      }
      if (DOWNLOAD_EXTENSIONS.test(url.pathname) || el.hasAttribute('download')) {
        emit('qcon_guide.download', {
          file: url.pathname.split('/').pop(),
          source_page: currentPage(),
        })
        return
      }
      if (url.host && url.host !== window.location.host) {
        emit('qcon_guide.click_through', {
          target_host: url.host,
          target_kind: targetKind(url.host),
          source_page: currentPage(),
        })
      }
    },
    { capture: true }
  )

  /* ---- session lifecycle ---- */

  try {
    if (!window.sessionStorage.getItem('qcon-guide.session-started')) {
      window.sessionStorage.setItem('qcon-guide.session-started', '1')
      var refHost = ''
      try {
        refHost = document.referrer ? new URL(document.referrer).host : ''
      } catch (e) {
        refHost = ''
      }
      emit('qcon_guide.session_started', {
        landing_page: currentPage(),
        referrer_host: refHost || undefined,
      })
    }
  } catch (e) {
    /* sessionStorage unavailable; skip session_started */
  }

  var heartbeat = setInterval(function () {
    if (document.visibilityState === 'visible') {
      emit('qcon_guide.session_heartbeat', { page: currentPage() })
    }
  }, HEARTBEAT_INTERVAL_MS)

  /* ---- web vitals ---- */

  var lcpMs = null
  var inpMs = null
  var clsScore = 0

  function supportsEntry(t) {
    return (
      typeof PerformanceObserver !== 'undefined' &&
      Array.isArray(PerformanceObserver.supportedEntryTypes) &&
      PerformanceObserver.supportedEntryTypes.indexOf(t) !== -1
    )
  }

  try {
    if (supportsEntry('largest-contentful-paint')) {
      new PerformanceObserver(function (list) {
        list.getEntries().forEach(function (entry) {
          lcpMs = Math.max(lcpMs || 0, entry.startTime)
        })
      }).observe({ type: 'largest-contentful-paint', buffered: true })
    }
    if (supportsEntry('layout-shift')) {
      new PerformanceObserver(function (list) {
        list.getEntries().forEach(function (entry) {
          if (!entry.hadRecentInput) clsScore += entry.value || 0
        })
      }).observe({ type: 'layout-shift', buffered: true })
    }
    if (supportsEntry('event')) {
      new PerformanceObserver(function (list) {
        list.getEntries().forEach(function (entry) {
          if (entry.interactionId && entry.duration) {
            inpMs = Math.max(inpMs || 0, entry.duration)
          }
        })
      }).observe({ type: 'event', durationThreshold: 16, buffered: true })
    }
  } catch (e) {
    /* observers are best-effort */
  }

  function emitVitals() {
    if (lcpMs !== null) emit('qcon_guide.web_vitals', { metric: 'lcp', value: Math.round(lcpMs) })
    if (inpMs !== null) emit('qcon_guide.web_vitals', { metric: 'inp', value: Math.round(inpMs) })
    if (clsScore > 0)
      emit('qcon_guide.web_vitals', {
        metric: 'cls',
        value: Math.round(clsScore * 10000) / 10000,
      })
  }

  /* ---- errors ---- */

  window.addEventListener('error', function () {
    emit('qcon_guide.error', { error_code: 'window_runtime_error' })
  })
  window.addEventListener('unhandledrejection', function () {
    emit('qcon_guide.error', { error_code: 'unhandled_promise_rejection' })
  })

  window.addEventListener('pagehide', function () {
    clearInterval(heartbeat)
    emitVitals()
    flush()
  })
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') {
      emitVitals()
      flush()
    }
  })

  pageView()
})()
