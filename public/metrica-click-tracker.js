(function() {
  'use strict';
  
  // Configuration
  const METRICA_CLICK = {
    apiUrl: 'https://jmzlhnbkriagrchwochr.supabase.co/functions/v1/track-session',
    empresaId: null, // Will be set when script is loaded
    sessionKey: 'metrica_click_session_id',
    debug: false
  };

  // Utility functions
  function log(message, data) {
    if (METRICA_CLICK.debug) {
      console.log('[MétricaClick]', message, data || '');
    }
  }

  function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  }

  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }

  function setCookie(name, value, days = 30) {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
  }

  function getSessionId() {
    let sessionId = localStorage.getItem(METRICA_CLICK.sessionKey);
    if (!sessionId) {
      sessionId = getCookie(METRICA_CLICK.sessionKey);
      if (sessionId) {
        localStorage.setItem(METRICA_CLICK.sessionKey, sessionId);
      }
    }
    return sessionId;
  }

  function setSessionId(sessionId) {
    localStorage.setItem(METRICA_CLICK.sessionKey, sessionId);
    setCookie(METRICA_CLICK.sessionKey, sessionId);
  }

  function getDeviceInfo() {
    const ua = navigator.userAgent;
    let deviceType = 'desktop';
    
    if (/mobile|android|iphone/i.test(ua)) {
      deviceType = 'mobile';
    } else if (/tablet|ipad/i.test(ua)) {
      deviceType = 'tablet';
    }
    
    return {
      userAgent: ua,
      deviceType: deviceType,
      screen: `${screen.width}x${screen.height}`,
      language: navigator.language,
      referrer: document.referrer
    };
  }

  function collectTrackingData() {
    const data = {
      empresa_id: METRICA_CLICK.empresaId,
      utm_source: getUrlParameter('utm_source'),
      utm_medium: getUrlParameter('utm_medium'),
      utm_campaign: getUrlParameter('utm_campaign'),
      utm_term: getUrlParameter('utm_term'),
      utm_content: getUrlParameter('utm_content'),
      gclid: getUrlParameter('gclid'),
      fbclid: getUrlParameter('fbclid'),
      referrer: document.referrer,
      user_agent: navigator.userAgent,
      page_url: window.location.href,
      page_title: document.title,
      timestamp: new Date().toISOString()
    };

    // Add device info
    const deviceInfo = getDeviceInfo();
    Object.assign(data, deviceInfo);

    // Filter out null/undefined values
    Object.keys(data).forEach(key => {
      if (data[key] === null || data[key] === undefined || data[key] === '') {
        delete data[key];
      }
    });

    return data;
  }

  async function sendTrackingData(data) {
    try {
      const response = await fetch(METRICA_CLICK.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      log('Tracking data sent successfully', result);
      
      if (result.session_id) {
        setSessionId(result.session_id);
      }
      
      return result;
    } catch (error) {
      log('Error sending tracking data:', error);
      throw error;
    }
  }

  function shouldTrack() {
    // Don't track if no empresa_id is set
    if (!METRICA_CLICK.empresaId) {
      log('No empresa_id configured, skipping tracking');
      return false;
    }

    // Don't track on localhost (unless debug mode)
    if (window.location.hostname === 'localhost' && !METRICA_CLICK.debug) {
      log('Localhost detected, skipping tracking');
      return false;
    }

    // Don't track if Do Not Track is enabled
    if (navigator.doNotTrack === '1') {
      log('Do Not Track enabled, skipping tracking');
      return false;
    }

    return true;
  }

  async function initTracking() {
    if (!shouldTrack()) {
      return;
    }

    log('Initializing MétricaClick tracking');

    try {
      // Check if we already have a session for this visit
      const existingSessionId = getSessionId();
      
      // Always collect and send current page data
      const trackingData = collectTrackingData();
      
      if (existingSessionId) {
        log('Existing session found', existingSessionId);
        // For existing sessions, we might want to track page views separately
        // For now, we'll skip to avoid duplicate session creation
        return;
      }

      // Send tracking data to create new session
      const result = await sendTrackingData(trackingData);
      log('New session created', result);

    } catch (error) {
      log('Tracking initialization failed:', error);
    }
  }

  // Public API
  window.MetricaClick = {
    init: function(empresaId, options = {}) {
      METRICA_CLICK.empresaId = empresaId;
      METRICA_CLICK.debug = options.debug || false;
      
      log('Configuring MétricaClick', { empresaId, options });
      
      // Initialize tracking when DOM is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTracking);
      } else {
        initTracking();
      }
    },
    
    track: function(eventData = {}) {
      if (!shouldTrack()) return;
      
      const data = Object.assign(collectTrackingData(), eventData);
      return sendTrackingData(data);
    },
    
    getSessionId: function() {
      return getSessionId();
    },
    
    debug: function(enable = true) {
      METRICA_CLICK.debug = enable;
      log('Debug mode', enable ? 'enabled' : 'disabled');
    }
  };

  // Auto-initialize if data-empresa-id attribute is present on script tag
  const scriptTag = document.querySelector('script[data-empresa-id]');
  if (scriptTag) {
    const empresaId = scriptTag.getAttribute('data-empresa-id');
    const debug = scriptTag.getAttribute('data-debug') === 'true';
    
    window.MetricaClick.init(empresaId, { debug });
  }

  log('MétricaClick script loaded');
})();