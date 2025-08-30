import { NextResponse } from "next/server";
import yts, { SearchResult, VideoSearchResult } from "yt-search";

export async function GET(req: Request) {
  const urlObj = new URL(req.url);
  const query = urlObj.searchParams.get("query");
  if (!query) {
    return NextResponse.json({ error: "No query provided" }, { status: 400 });
  }

  try {
    const results: SearchResult = await yts(query);
    const videos = results.videos.slice(0, 10).map((video: VideoSearchResult) => ({
      title: video.title,
      videoId: video.videoId,
      thumbnail: video.thumbnail,
      duration: video.timestamp,
    }));
    return NextResponse.json({ items: videos });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}
