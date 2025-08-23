import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";

export const maxDuration = 600; // 10 minutes max

export async function GET(req: Request) {
  const urlObj = new URL(req.url);
  const videoUrl = urlObj.searchParams.get("url");

  if (!videoUrl || !/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//.test(videoUrl)) {
    return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
  }

  const decodedUrl = decodeURIComponent(videoUrl);
  const scriptPath = path.join(process.cwd(), "app", "python", "download_mp3.py");
  const pythonPath = path.join(process.cwd(), "venv", "bin", "python3");

  return new Response(
    new ReadableStream({
      start(controller) {
        const process = spawn(pythonPath, [scriptPath, decodedUrl]);

        // Timeout after 8 minutes
        const timeout = setTimeout(() => {
          process.kill("SIGKILL");
          controller.enqueue(`data: ERROR:Download timed out\n\n`);
          controller.close();
        }, 480000);

        // Heartbeat every 15s to keep connection alive
        const heartbeat = setInterval(() => {
          controller.enqueue(`:\n\n`);
        }, 15000);

        process.stdout.on("data", (data) => {
          const text = data.toString().trim();
          controller.enqueue(`data: ${text}\n\n`);
        });

        process.stderr.on("data", (data) => {
          console.error(`Python error: ${data}`);
        });

        process.on("close", () => {
          clearTimeout(timeout);
          clearInterval(heartbeat);
          controller.enqueue(`data: DONE\n\n`);
          controller.close();
        });
      },
      cancel() {
        console.log("Client closed connection, killing process...");
      },
    }),
    {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    }
  );
}
