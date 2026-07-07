const DEFAULT_URL = "https://fumonull.github.io/basic-english-coach/";
const httpModules = {
  "http:": await import("node:http"),
  "https:": await import("node:https"),
};

const args = process.argv.slice(2);
const requireConfigured = args.includes("--require-configured");
const targetArg = args.find((arg) => !arg.startsWith("--"));
const targetUrl = targetArg ?? DEFAULT_URL;

function withCacheBust(url) {
  const parsed = new URL(url);
  parsed.searchParams.set("t", String(Date.now()));
  return parsed.toString();
}

async function fetchText(url) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const client = httpModules[parsed.protocol];

    if (!client) {
      reject(new Error(`Unsupported URL protocol: ${parsed.protocol}`));
      return;
    }

    const request = client.get(parsed, (response) => {
      if (
        response.statusCode &&
        response.statusCode >= 300 &&
        response.statusCode < 400 &&
        response.headers.location
      ) {
        response.resume();
        fetchText(new URL(response.headers.location, parsed).toString()).then(resolve, reject);
        return;
      }

      if (response.statusCode !== 200) {
        response.resume();
        reject(new Error(`${url} returned ${response.statusCode} ${response.statusMessage ?? ""}`.trim()));
        return;
      }

      response.setEncoding("utf8");
      let body = "";
      response.on("data", (chunk) => {
        body += chunk;
      });
      response.on("end", () => resolve(body));
    });

    request.on("error", reject);
  });
}

function findScriptSrc(html) {
  const match = html.match(/<script[^>]+src="([^"]+index-[^"]+\.js)"/);
  if (!match) {
    throw new Error("Could not find the Vite JavaScript asset in the deployed HTML.");
  }

  return match[1];
}

function hasSupabaseConfig(js) {
  return /https:\/\/[A-Za-z0-9.-]+\.supabase\.co/.test(js);
}

function hasSyncUi(js) {
  return js.includes("发送登录链接") && js.includes("复制进度码") && js.includes("合并导入");
}

async function main() {
  const htmlUrl = withCacheBust(targetUrl);
  const html = await fetchText(htmlUrl);
  const scriptUrl = new URL(findScriptSrc(html), htmlUrl).toString();
  const js = await fetchText(scriptUrl);
  const configured = hasSupabaseConfig(js);
  const syncUiPresent = hasSyncUi(js);

  console.log(`Target: ${targetUrl}`);
  console.log(`HTML: ${htmlUrl}`);
  console.log(`JS: ${scriptUrl}`);
  console.log(`Sync UI: ${syncUiPresent ? "present" : "missing"}`);
  console.log(`Supabase config: ${configured ? "present" : "missing"}`);

  if (!syncUiPresent) {
    throw new Error("The deployed app does not appear to include the sync UI.");
  }

  if (requireConfigured && !configured) {
    throw new Error("Supabase config is missing from the deployed bundle.");
  }

  console.log(configured ? "Cloud sync can be enabled from the app." : "The app is currently in local/manual transfer mode.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
