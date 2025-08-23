"use client";
import { useState, useRef } from "react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState("");
  const [file, setFile] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const evtRef = useRef<EventSource | null>(null);

  const handleDownload = () => {
    if (!url) {
      setStatus("Please enter a YouTube URL.");
      return;
    }

    setStatus("Starting...");
    setFile("");
    setDownloading(true);
    setProgress(0);

    if (evtRef.current) {
      evtRef.current.close();
      evtRef.current = null;
    }

    const streamUrl = `/api/download?url=${encodeURIComponent(url)}`;
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

  const handleCancel = () => {
    if (evtRef.current) {
      evtRef.current.close();
      evtRef.current = null;
    }
    setDownloading(false);
    setStatus("Download canceled.");
  };

  const handleSave = () => {
    if (!file) return;
    const link = document.createElement("a");
    link.href = `/downloads/${encodeURIComponent(file)}`;
    link.download = file;
    link.click();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "100vh", padding: "2rem", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "#fff", fontFamily: "Arial, sans-serif", textAlign: "center" }}>
      <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>YouTube to MP3 Downloader</h1>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", width: "100%", maxWidth: "500px" }}>
        <input type="text" placeholder="Enter YouTube URL" value={url} onChange={(e) => setUrl(e.target.value)} style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "8px", border: "none", fontSize: "1rem", outline: "none" }} />
        
        <div style={{ display: "flex", gap: "10px", width: "100%" }}>
          <button onClick={handleDownload} disabled={downloading} style={{ flex: 1, padding: "0.75rem 1rem", borderRadius: "8px", border: "none", background: downloading ? "#999" : "#ff5c5c", color: "#fff", fontSize: "1rem", cursor: downloading ? "not-allowed" : "pointer" }}>
            {downloading ? "Processing..." : "Download"}
          </button>

          {downloading && (
            <button onClick={handleCancel} style={{ flex: 1, padding: "0.75rem 1rem", borderRadius: "8px", border: "none", background: "#555", color: "#fff", fontSize: "1rem", cursor: "pointer" }}>
              Cancel
            </button>
          )}
        </div>

        {downloading && (
          <div style={{ width: "100%", background: "#ccc", borderRadius: "8px", marginTop: "10px" }}>
            <div style={{ width: `${progress}%`, background: "#4caf50", height: "10px", borderRadius: "8px" }}></div>
          </div>
        )}
      </div>

      <p style={{ marginTop: "1rem", minHeight: "1.2rem" }}>{status}</p>

      {file && (
        <button onClick={handleSave} style={{ marginTop: "1rem", padding: "0.75rem 1rem", borderRadius: "8px", border: "none", background: "#4caf50", color: "#fff", fontSize: "1rem", cursor: "pointer" }}>
          Download MP3
        </button>
      )}
    </div>
  );
}
