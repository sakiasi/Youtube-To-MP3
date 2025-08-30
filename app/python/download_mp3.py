import sys
import yt_dlp
import os
from pathlib import Path

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DOWNLOAD_DIR = os.path.join(BASE_DIR, "..", "..", "public", "downloads")
os.makedirs(DOWNLOAD_DIR, exist_ok=True)

if len(sys.argv) < 2:
    print("ERROR:No URL provided", flush=True)
    sys.exit(1)

url = sys.argv[1]
final_mp3_name = None

def progress_hook(d):
    global final_mp3_name
    if d['status'] == 'downloading':
        percent = d.get('_percent_str', '').strip()
        if percent:
            print(f"PROGRESS:{percent}", flush=True)
    elif d['status'] == 'finished':
        src = d.get('filename') or ''
        root, _ = os.path.splitext(src)
        mp3_path = root + ".mp3"
        final_mp3_name = os.path.basename(mp3_path)
        print("STEP:Converting to MP3...", flush=True)

ydl_opts = {
    'format': 'bestaudio/best',
    'progress_hooks': [progress_hook],
    'postprocessors': [{
        'key': 'FFmpegExtractAudio',
        'preferredcodec': 'mp3',
        'preferredquality': '192',
    }],
    'outtmpl': os.path.join(DOWNLOAD_DIR, '%(title)s.%(ext)s'),
    'quiet': True,
    'no_warnings': True,
}

try:
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([url])
except Exception as e:
    print(f"ERROR:{str(e)}", flush=True)
    sys.exit(1)

if not final_mp3_name:
    try:
        files = [f for f in os.listdir(DOWNLOAD_DIR) if f.lower().endswith(".mp3")]
        files.sort(key=lambda f: os.path.getmtime(os.path.join(DOWNLOAD_DIR, f)))
        if files:
            final_mp3_name = files[-1]
    except Exception:
        pass

if final_mp3_name:
    safe_name = Path(final_mp3_name).name
    print(f"FILE:{safe_name}", flush=True)
else:
    print("ERROR:Failed to determine output filename", flush=True)