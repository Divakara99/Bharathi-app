export const PWA_CACHE_PREFIX = "bharathi-public-assets-";
export const PWA_RECOVERY_SESSION_KEY = "bharathi-dev-worker-recovered";

export function isDevelopmentPreviewHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return host === "v0.build" || host.endsWith(".v0.build");
}
export function isProductionPwa(production: boolean, hostname: string): boolean {
  return production && !isDevelopmentPreviewHost(hostname);
}

/** Unregister only this app's root worker; never clear localStorage, cookies, or business data. */
export async function clearAppWorkerCache(): Promise<void> {
  if (typeof window === "undefined") return;
  const jobs: Promise<unknown>[] = [];
  if ("serviceWorker" in navigator) {
    jobs.push(navigator.serviceWorker.getRegistrations().then((registrations) => Promise.all(registrations.filter((registration) => {
      if (registration.scope !== new URL("/", window.location.origin).href) return false;
      return [registration.active, registration.waiting, registration.installing].some((worker) => {
        if (!worker) return false;
        const url = new URL(worker.scriptURL);
        return url.origin === window.location.origin && url.pathname === "/sw.js";
      });
    }).map((registration) => registration.unregister()))).catch(() => {}));
  }
  if ("caches" in window) {
    jobs.push(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith(PWA_CACHE_PREFIX)).map((key) => caches.delete(key)))).catch(() => {}));
  }
  await Promise.all(jobs);
}

/** Runs as a plain head script, before React or the HMR runtime, so broken chunks cannot block cleanup. */
export function createPwaSafetyScript(production: boolean): string {
  return `(function(){
    var production=${JSON.stringify(production)};
    var host=location.hostname.toLowerCase();
    if(production&&host!=="v0.build"&&!host.endsWith(".v0.build"))return;
    var prefix=${JSON.stringify(PWA_CACHE_PREFIX)};
    var recoveryKey=${JSON.stringify(PWA_RECOVERY_SESSION_KEY)};
    var removedController=false;
    function owns(worker){
      if(!worker)return false;
      try{var url=new URL(worker.scriptURL);return url.origin===location.origin&&url.pathname==="/sw.js";}catch(e){return false;}
    }
    var jobs=[];
    if("serviceWorker" in navigator){
      jobs.push(navigator.serviceWorker.getRegistrations().then(function(registrations){
        return Promise.all(registrations.filter(function(reg){
          return reg.scope===new URL("/",location.origin).href&&(owns(reg.active)||owns(reg.waiting)||owns(reg.installing));
        }).map(function(reg){
          return reg.unregister().then(function(removed){if(removed&&owns(navigator.serviceWorker.controller))removedController=true;});
        }));
      }).catch(function(){}));
    }
    if("caches" in window){
      jobs.push(caches.keys().then(function(keys){return Promise.all(keys.filter(function(key){return key.startsWith(prefix);}).map(function(key){return caches.delete(key);}));}).catch(function(){}));
    }
    Promise.all(jobs).then(function(){
      if(!removedController)return;
      try{if(sessionStorage.getItem(recoveryKey))return;sessionStorage.setItem(recoveryKey,"1");}catch(e){return;}
      location.reload();
    });
  })();`;
}
