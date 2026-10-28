import { useEffect, useState } from 'react';

const SCRIPT_ID = 'givebutter-widgets';

/**
 * Loads the Givebutter widget library exactly once per page load.
 * Returns true when the script has loaded (the <givebutter-widget> element is then defined).
 */
export function useGivebutter(accountId?: string) {
  const [ready, setReady] = useState(
    () => typeof window !== 'undefined' && Boolean(window.customElements?.get('givebutter-widget')),
  );

  useEffect(() => {
    if (!accountId || ready) return;
    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    const onLoad = () => setReady(true);
    if (!script) {
      script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.async = true;
      script.src = `https://widgets.givebutter.com/latest.umd.cjs?acct=${encodeURIComponent(accountId)}&p=other`;
      document.body.appendChild(script);
    }
    script.addEventListener('load', onLoad);
    return () => script?.removeEventListener('load', onLoad);
  }, [accountId, ready]);

  return ready;
}
