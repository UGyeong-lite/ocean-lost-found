/**
 * Google Apps Script 웹앱 진입점.
 * 기존 GitHub Pages의 최신 앱을 표시하고, 데이터는 기존 Supabase를 사용합니다.
 * GitHub Pages를 삭제하거나 비공개로 바꾸면 이 웹앱도 작동하지 않습니다.
 */
function doGet() {
  const html = `<!doctype html>
<html lang="ko">
  <head>
    <base target="_top">
    <style>
      body { margin: 0; font-family: sans-serif; }
      #loading { padding: 3rem 1rem; text-align: center; color: #22586a; }
    </style>
  </head>
  <body>
    <div id="root"><p id="loading">오션 lost and found를 불러오는 중입니다...</p></div>
    <script>
      (async function () {
        const site = 'https://ugyeong-lite.github.io/ocean-lost-found/';
        try {
          const response = await fetch(site, { cache: 'no-cache' });
          if (!response.ok) throw new Error('사이트를 불러올 수 없습니다.');
          const page = new DOMParser().parseFromString(await response.text(), 'text/html');
          const cssPath = page.querySelector('link[rel="stylesheet"]')?.getAttribute('href');
          const scriptPath = page.querySelector('script[type="module"]')?.getAttribute('src');
          if (!cssPath || !scriptPath) throw new Error('앱 파일을 찾지 못했습니다.');
          const css = document.createElement('link');
          css.rel = 'stylesheet';
          css.href = new URL(cssPath, site).href;
          document.head.appendChild(css);
          const script = document.createElement('script');
          script.type = 'module';
          script.src = new URL(scriptPath, site).href;
          script.onerror = function () {
            document.getElementById('loading').textContent = '앱을 불러오지 못했습니다. 아래 링크로 접속해 주세요.';
          };
          document.body.appendChild(script);
        } catch (error) {
          document.getElementById('loading').textContent = '앱을 불러오지 못했습니다. 아래 링크로 접속해 주세요.';
        }
      })();
    </script>
    <noscript>JavaScript를 켜고 다시 시도해 주세요.</noscript>
    <a id="fallback" href="https://ugyeong-lite.github.io/ocean-lost-found/" target="_top" style="display:block; text-align:center; padding:1rem; color:#176c82">사이트 직접 열기</a>
  </body>
</html>`;
  return HtmlService.createHtmlOutput(html)
    .setTitle('오션 lost and found')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}
