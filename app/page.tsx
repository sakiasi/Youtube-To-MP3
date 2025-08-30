"use client";

import { useState, useRef } from "react";
import Image from "next/image";

type VideoResult = {
  title: string;
  videoId: string;
  thumbnail: string;
  duration: string;
};

export default function Home() {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<VideoResult[]>([]);
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState("");
  const [file, setFile] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const evtRef = useRef<EventSource | null>(null);

  const handleSearch = async () => {
    if (!query) return;
    const res = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
    const data = await res.json();
    setSearchResults(data.items);
  };

  const handleDownload = (videoId?: string) => {
    const downloadUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : url;
    if (!downloadUrl) {
      setStatus("Please enter a YouTube URL.");
      return;
    }

    setUrl(downloadUrl);
    setStatus("Starting...");
    setFile("");
    setDownloading(true);
    setProgress(0);

    if (evtRef.current) {
      evtRef.current.close();
      evtRef.current = null;
    }

    const streamUrl = `/api/download?url=${encodeURIComponent(downloadUrl)}`;
    const es = new EventSource(streamUrl);
    evtRef.current = es;

    es.onmessage = (event) => {
      const data = event.data;

      if (data.startsWith("PROGRESS:")) {
        const pct = data.replace("PROGRESS:", "").replace("%", "").trim();
        setProgress(parseFloat(pct));
        setStatus(`Downloading... ${pct}%`);
      } else if (data.startsWith("STEP:")) {
        setStatus(data.replace("STEP:", ""));
      } else if (data.startsWith("FILE:")) {
        const filename = data.replace("FILE:", "");
        setFile(filename);
        setStatus("Process complete");
      } else if (data === "DONE") {
        setDownloading(false);
        es.close();
        evtRef.current = null;
      } else if (data.startsWith("ERROR:")) {
        setStatus(data.replace("ERROR:", ""));
        setDownloading(false);
        es.close();
        evtRef.current = null;
      }
    };

    es.onerror = () => {
      setStatus("Error occurred during download.");
      setDownloading(false);
      es.close();
      evtRef.current = null;
    };
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 flex flex-col items-center p-6">
      <h1 className="text-4xl font-bold mb-8 text-center text-blue-600 dark:text-blue-400">
        YouTube MP3 Downloader
      </h1>

      {/* Search Section */}
      <div className="flex flex-col sm:flex-row w-full max-w-3xl mb-6 gap-3">
        <input
          type="text"
          placeholder="Search YouTube..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 p-3 rounded-lg border border-gray-300 dark:border-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-800 dark:text-gray-100"
        />
        <button
          onClick={handleSearch}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg shadow transition-colors duration-200"
        >
          Search
        </button>
      </div>

      {/* Search Results */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-3xl">
        {searchResults.map((video) => (
          <div
            key={video.videoId}
            className="flex flex-col sm:flex-row items-center bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-200"
          >
            <Image
              src={video.thumbnail}
              alt={video.title}
              width={160}
              height={90}
              className="object-cover sm:w-40 sm:h-full"
            />
            <div className="p-4 flex flex-col justify-between w-full">
              <p className="font-semibold text-lg mb-2">{video.title}</p>
              <button
                onClick={() => handleDownload(video.videoId)}
                className="self-start bg-green-500 hover:bg-green-600 text-white font-medium px-4 py-2 rounded-lg transition-colors duration-200"
              >
                Download MP3
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Direct URL Download */}
      <div className="flex flex-col sm:flex-row mt-10 w-full max-w-3xl gap-3">
        <input
          type="text"
          placeholder="Or paste YouTube URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 p-3 rounded-lg border border-gray-300 dark:border-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-800 dark:text-gray-100"
        />
        <button
          onClick={() => handleDownload()}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg shadow transition-colors duration-200"
        >
          Download
        </button>
      </div>

      {/* Progress */}
      {downloading && (
        <div className="w-full max-w-3xl mt-6">
          <p className="mb-2 font-medium">{status}</p>
          <div className="w-full bg-gray-300 dark:bg-gray-700 rounded-full h-3">
            <div
              className="bg-green-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Download MP3 Button */}
      {file && (
        <button
          onClick={() => {
            const link = document.createElement("a");
            link.href = `/downloads/${encodeURIComponent(file)}`;
            link.download = file;
            link.click();
          }}
          className="mt-6 bg-purple-500 hover:bg-purple-600 text-white font-semibold px-6 py-3 rounded-lg shadow transition-colors duration-200"
        >
          Download MP3
        </button>
      )}
    </div>
  );
}
