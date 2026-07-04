"use client";

import React, { useState, useEffect } from "react";
import {
  Video,
  Music,
  Trash2,
  Heart,
  Eye,
  Share2,
  MessageCircle,
  Clock,
  AlertCircle,
  CheckCircle2,
  Info,
  Loader2,
  Sun,
  Moon,
} from "lucide-react";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface VideoData {
  id: string;
  title: string;
  videoUrl: string;
  audioUrl: string;
  coverUrl: string;
  authorName: string;
  authorHandle: string;
  authorAvatar: string;
  duration: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [canShareFiles, setCanShareFiles] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VideoData | null>(null);
  const [history, setHistory] = useState<VideoData[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("tt_theme") as "dark" | "light" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("tt_theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  const addToast = (message: string, type: "success" | "error" | "info" = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem("tt_download_history");
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load history from localStorage", e);
    }

    if (typeof window !== "undefined" && navigator.canShare) {
      try {
        const dummyFile = new File([""], "dummy.txt", { type: "text/plain" });
        if (navigator.canShare({ files: [dummyFile] })) {
          setCanShareFiles(true);
        }
      } catch (e) {
        console.warn("navigator.canShare is not supported or failed", e);
      }
    }
  }, []);

  const formatStats = (count: number): string => {
    if (!count) return "0";
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    }
    return count.toString();
  };

  const formatDuration = (seconds: number): string => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const parseApiResponse = (apiData: any): VideoData => {
    const data = apiData.data || apiData;

    const id = data.id || Math.random().toString(36).substring(2, 9);
    const title = data.title || "TikTok Video (No Description)";
    const videoUrl = data.play || data.downloadUrl || data.video_url || "";
    const audioUrl = data.music || data.audio_url || data.music_info?.play || "";
    const coverUrl = data.cover || data.origin_cover || data.cover_image || "";

    const author = data.author || {};
    const authorName = author.nickname || author.name || "TikTok Creator";
    const authorHandle = author.unique_id || author.username || "tiktok_user";
    const authorAvatar = author.avatar || author.avatar_thumb || "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";

    const duration = data.duration || 0;
    const views = data.play_count || data.views || 0;
    const likes = data.digg_count || data.likes || 0;
    const comments = data.comment_count || data.comments || 0;
    const shares = data.share_count || data.shares || 0;

    return {
      id,
      title,
      videoUrl,
      audioUrl,
      coverUrl,
      authorName,
      authorHandle,
      authorAvatar,
      duration,
      views,
      likes,
      comments,
      shares,
    };
  };

  const handleDownloadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      addToast("Please enter a TikTok video URL", "error");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    addToast("Analyzing video link...", "info");

    try {
      const response = await fetch("/api/download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: url.trim() }),
      });

      const resJson = await response.json();

      if (!response.ok) {
        throw new Error(resJson.error || "Failed to process video");
      }

      const parsedData = parseApiResponse(resJson);

      if (!parsedData.videoUrl) {
        throw new Error("No download URL was returned by the API.");
      }

      setResult(parsedData);
      setUrl(""); // Clear input on success
      addToast("Video analyzed successfully!", "success");

      setHistory((prev) => {
        const filtered = prev.filter((item) => item.id !== parsedData.id);
        const updated = [parsedData, ...filtered].slice(0, 12);
        localStorage.setItem("tt_download_history", JSON.stringify(updated));
        return updated;
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong while fetching the video.");
      addToast(err.message || "Failed to fetch video", "error");
    } finally {
      setLoading(false);
    }
  };

  const triggerDirectDownload = (mediaUrl: string, title: string, type: "video" | "audio") => {
    if (!mediaUrl) return;

    addToast(`Preparing ${type} download...`, "info");

    const sanitizedTitle = title
      .replace(/[^a-zA-Z0-9\s-]/g, "")
      .trim()
      .substring(0, 30)
      .replace(/\s+/g, "_");

    const filename = `${sanitizedTitle || "tiktok"}_no_wm.${type === "audio" ? "mp3" : "mp4"}`;

    const proxyUrl = `/api/video-proxy?url=${encodeURIComponent(mediaUrl)}&filename=${encodeURIComponent(
      filename
    )}&audio=${type === "audio"}`;

    const link = document.createElement("a");
    link.href = proxyUrl;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const triggerShare = async (mediaUrl: string, title: string, type: "video" | "audio") => {
    if (!mediaUrl) return;

    setSharing(true);
    const sanitizedTitle = title
      .replace(/[^a-zA-Z0-9\s-]/g, "")
      .trim()
      .substring(0, 30)
      .replace(/\s+/g, "_");

    const extension = type === "audio" ? "mp3" : "mp4";
    const filename = `${sanitizedTitle || "tiktok"}_no_wm.${extension}`;
    const contentType = type === "audio" ? "audio/mpeg" : "video/mp4";

    const proxyUrl = `/api/video-proxy?url=${encodeURIComponent(mediaUrl)}&filename=${encodeURIComponent(
      filename
    )}&audio=${type === "audio"}`;

    addToast("Скачиваем файл для отправки...", "info");

    try {
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error("Не удалось скачать файл через прокси");
      const blob = await response.blob();
      const file = new File([blob], filename, { type: contentType });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
        });
        addToast("Готово!", "success");
      } else {
        throw new Error("Ваш браузер не поддерживает отправку этого типа файлов");
      }
    } catch (err: any) {
      console.error(err);
      if (err.name !== "AbortError" && err.name !== "NotAllowedError") {
        addToast("Не удалось открыть меню отправки, пробуем обычное скачивание...", "error");
        triggerDirectDownload(mediaUrl, title, type);
      } else {
        addToast("Отменено пользователем", "info");
      }
    } finally {
      setSharing(false);
    }
  };

  const handleSelectHistoryItem = (item: VideoData) => {
    setResult(item);
    addToast("Loaded video from history", "success");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearHistory = () => {
    if (confirm("Are you sure you want to clear your download history?")) {
      setHistory([]);
      localStorage.removeItem("tt_download_history");
      addToast("Download history cleared", "info");
    }
  };

  return (
    <div className="app-container">
      {/* Theme Toggle Button */}
      <button onClick={toggleTheme} className="theme-toggle-btn" aria-label="Toggle Theme">
        {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
      </button>
      {/* Background Blur Blobs */}
      <div className="bg-glow-container">
        <div className="bg-glow-blob blob-1"></div>
        <div className="bg-glow-blob blob-2"></div>
      </div>

      {/* Toast Notification Banner Container */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            {toast.type === "success" && <CheckCircle2 size={18} />}
            {toast.type === "error" && <AlertCircle size={18} />}
            {toast.type === "info" && <Info size={18} />}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Top Meme Avatar */}
      <div className="top-avatar-container">
        <img
          src={theme === "dark" ? "/icon-dark.png" : "/icon-light.png"}
          className="top-avatar"
          alt="meme face"
        />
      </div>

      {/* Search Input Bar */}
      <div style={{ width: "100%", margin: "2rem 0" }}>
        <form onSubmit={handleDownloadSubmit}>
          <div className="input-group">
            <input
              type="text"
              placeholder="Ссылка..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="url-input"
              disabled={loading}
              autoComplete="off"
            />
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <Loader2 className="spinner" size={18} style={{ animation: "spin 1s linear infinite" }} />
              ) : (
                "→"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Active Result Card */}
      {result && (
        <section className="result-card glass-panel">
          {/* Column 1: Video Preview Player */}
          <div className="video-preview-wrapper">
            <div className="video-container">
              <video
                src={result.videoUrl}
                poster={result.coverUrl}
                controls
                playsInline
                className="video-preview"
              />
              {result.duration > 0 && (
                <div className="video-duration">
                  {formatDuration(result.duration)}
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Creator Details & Download Actions */}
          <div className="details-wrapper">
            <div>
              <div className="author-block">
                <img
                  src={result.authorAvatar}
                  alt={result.authorName}
                  className="author-avatar"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";
                  }}
                />
                <div className="author-info">
                  <div className="author-name">
                    {result.authorName}
                    <span className="verified-badge">
                      <CheckCircle2 size={14} fill="#ffffff" color="#000000" />
                    </span>
                  </div>
                  <div className="author-handle">@{result.authorHandle}</div>
                </div>
              </div>

              <div style={{ marginTop: "1rem" }}>
                <p className="video-title">{result.title}</p>
              </div>
            </div>

            <div>
              {/* Statistics Grid */}
              <div className="stats-grid">
                <div className="stat-item" title="Глазели">
                  <Eye className="stat-icon" size={16} />
                  <span className="stat-value">{formatStats(result.views)}</span>
                </div>
                <div className="stat-item" title="Залайкали">
                  <Heart className="stat-icon" size={16} />
                  <span className="stat-value">{formatStats(result.likes)}</span>
                </div>
                <div className="stat-item" title="Набазарили">
                  <MessageCircle className="stat-icon" size={16} />
                  <span className="stat-value">{formatStats(result.comments)}</span>
                </div>
                <div className="stat-item" title="Растащили">
                  <Share2 className="stat-icon" size={16} />
                  <span className="stat-value">{formatStats(result.shares)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="actions-block">
                {canShareFiles && (
                  <button
                    onClick={() => triggerShare(result.videoUrl, result.title, "video")}
                    className="btn-share-video"
                    disabled={sharing}
                  >
                    {sharing ? (
                      <Loader2 className="spinner" size={20} style={{ animation: "spin 1s linear infinite" }} />
                    ) : (
                      <Share2 size={20} />
                    )}
                    {sharing ? "Скачивание для отправки..." : "Сохранить в галерею / Поделиться 📲"}
                  </button>
                )}
                <button
                  onClick={() => triggerDirectDownload(result.videoUrl, result.title, "video")}
                  className="btn-download-video"
                  disabled={sharing}
                >
                  <Video size={20} />
                  Скачать файл видео напрямую 🎬
                </button>
                {result.audioUrl && (
                  <button
                    onClick={() => triggerDirectDownload(result.audioUrl, result.title, "audio")}
                    className="btn-download-audio"
                    disabled={sharing}
                  >
                    <Music size={20} />
                    Скачать аудио (MP3) 🎵
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* History section */}
      <section className="history-section">
        <div className="history-header">
          <h2 className="history-title">
            <Clock size={20} />
            Недавно скачанное 🗂️
          </h2>
          {history.length > 0 && (
            <button onClick={clearHistory} className="btn-clear-history">
              <Trash2 size={14} />
              Очистить
            </button>
          )}
        </div>

        <div className="history-grid">
          {history.length > 0 ? (
            history.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelectHistoryItem(item)}
                className="history-item"
              >
                <img src={item.coverUrl} alt={item.title} className="history-thumbnail" />
                <div className="history-content">
                  <div className="history-item-author">@{item.authorHandle}</div>
                  <div className="history-item-title">{item.title}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="history-empty">
              <Clock size={32} />
              <p>Тут пока пусто.</p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer>
        <p>
          &copy; {new Date().getFullYear()} Bodyan Downloader
        </p>
      </footer>
    </div>
  );
}
