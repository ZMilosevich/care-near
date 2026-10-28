import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL(".", import.meta.url)));
const requestedPort = Number(process.env.PORT || 5173);
const host = process.env.HOST || "127.0.0.1";
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
};

function sendText(response, statusCode, message) {
  response.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
  });
  response.end(message);
}

function handleRequest(request, response) {
  try {
    const url = new URL(request.url || "/", "http://localhost");
    let pathname;
    try {
      pathname = decodeURIComponent(url.pathname);
    } catch {
      sendText(response, 400, "Bad request");
      return;
    }
    if (pathname === "/") pathname = "/index.html";

    const relative = normalize(pathname).replace(/^[/\\]+/, "");
    const filePath = resolve(join(root, relative));
    if (
      !filePath.startsWith(`${root}${sep}`) ||
      !existsSync(filePath) ||
      !statSync(filePath).isFile()
    ) {
      sendText(response, 404, "Not found");
      return;
    }

    response.writeHead(200, {
      "Content-Type":
        contentTypes[extname(filePath).toLowerCase()] ||
        "application/octet-stream",
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
    });
    const stream = createReadStream(filePath);
    response.on("close", () => stream.destroy());
    stream.on("error", () => {
      if (!response.headersSent) {
        sendText(response, 500, "Unable to read file");
      } else if (!response.writableEnded) {
        response.destroy();
      }
    });
    stream.pipe(response);
  } catch {
    if (!response.headersSent) {
      sendText(response, 400, "Bad request");
    } else if (!response.writableEnded) {
      response.destroy();
    }
  }
}

function listen(port, attemptsLeft = 5) {
  const server = createServer(handleRequest);
  server.once("error", (error) => {
    if (error.code === "EADDRINUSE" && attemptsLeft > 0) {
      listen(port + 1, attemptsLeft - 1);
      return;
    }
    console.error(error);
    process.exitCode = 1;
  });
  server.listen(port, host, () => {
    const address = server.address();
    const activePort =
      address && typeof address === "object" ? address.port : port;
    console.log(`CareNear demo running at http://${host}:${activePort}`);
  });
}

listen(requestedPort);
