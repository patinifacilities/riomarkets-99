export const getSessionId = () => {
  let id = localStorage.getItem('rm_session_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('rm_session_id', id);
  }
  return id;
};

export const getDeviceInfo = () => {
  const ua = navigator.userAgent || '';
  const isMobile = /Mobi|Android/i.test(ua);
  return {
    ua,
    isMobile,
    platform: navigator.platform || 'unknown',
    lang: navigator.language || 'pt-BR',
  };
};