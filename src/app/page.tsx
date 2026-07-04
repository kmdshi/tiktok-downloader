"use client";

import React, { useState, useEffect } from "react";
import {
  Download,
  Link2,
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
  Sparkles,
  Wrench,
  HelpCircle,
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
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VideoData | null>(null);
  const [history, setHistory] = useState<VideoData[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null); // null means checking
  const [maintenanceReason, setMaintenanceReason] = useState<"upgrade" | "link_claimed">("upgrade");
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
    const checkAuthAndActivation = async () => {
      try {
        const isLocalhost =
          window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1";

        if (isLocalhost) {
          setIsAuthorized(true);
          return;
        }

        const token = localStorage.getItem("tt_device_token");
        const searchParams = new URLSearchParams(window.location.search);
        const trigger = searchParams.get("utm_campaign");

        if (trigger) {

          if (token) {
            setIsAuthorized(true);
            window.location.href = window.location.origin + window.location.pathname;
            return;
          }

          setActivating(true);

          const res = await fetch("/api/activate", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ trigger }),
          });

          const data = await res.json();

          if (res.ok && data.token) {
            localStorage.setItem("tt_device_token", data.token);
            setIsAuthorized(true);
            addToast("Device activated successfully!", "success");

            window.location.href = window.location.origin + window.location.pathname;
            return;
          } else {
            console.warn("Activation failed:", data.error);
            if (data.code === "LINK_CLAIMED") {
              setMaintenanceReason("link_claimed");
              setIsAuthorized(false);
              setActivating(false);
              return;
            }
          }
        }

        if (token) {
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
        }
      } catch (err) {
        console.error("Auth check error:", err);
        setIsAuthorized(false);
      } finally {
        setActivating(false);
      }
    };

    checkAuthAndActivation();
  }, []);

  useEffect(() => {
    if (isAuthorized) {
      try {
        const stored = localStorage.getItem("tt_download_history");
        if (stored) {
          setHistory(JSON.parse(stored));
        }
      } catch (e) {
        console.error("Failed to load history from localStorage", e);
      }
    }
  }, [isAuthorized]);

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
      const token = localStorage.getItem("tt_device_token");
      const response = await fetch("/api/download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Device-Token": token || "",
        },
        body: JSON.stringify({ url: url.trim() }),
      });

      const resJson = await response.json();

      if (response.status === 401) {

        localStorage.removeItem("tt_device_token");
        setIsAuthorized(false);
        throw new Error("Your device authorization has expired.");
      }

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
    const token = localStorage.getItem("tt_device_token") || "";

    const proxyUrl = `/api/video-proxy?url=${encodeURIComponent(mediaUrl)}&filename=${encodeURIComponent(
      filename
    )}&audio=${type === "audio"}&token=${encodeURIComponent(token)}`;

    const link = document.createElement("a");
    link.href = proxyUrl;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  if (isAuthorized === null || activating) {
    return (
      <div className="maintenance-container" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", backgroundColor: "var(--color-bg)" }}>
        <Loader2 className="spinner-light" size={40} style={{ animation: "spin 1.5s linear infinite", color: "#ffffff" }} />
        <p style={{ marginTop: "1rem", color: "var(--text-secondary)", fontFamily: "var(--font-sans)" }}>Verifying service connection...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="maintenance-container">
        {/* Theme Toggle Button */}
        <button onClick={toggleTheme} className="theme-toggle-btn" aria-label="Toggle Theme">
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        {/* Glow Backdrops */}
        <div className="bg-glow-container">
          <div className="bg-glow-blob blob-1" style={{ opacity: 0.05 }}></div>
          <div className="bg-glow-blob blob-2" style={{ opacity: 0.05 }}></div>
        </div>

        <div className="maintenance-card glass-panel" style={{ padding: "3.5rem 2rem", maxWidth: "550px" }}>
          {maintenanceReason === "link_claimed" ? (
            <>
              <div className="maintenance-icon-wrapper" style={{ backgroundColor: "rgba(255, 255, 255, 0.05)", borderColor: "rgba(255, 255, 255, 0.1)", boxShadow: "none" }}>
                <AlertCircle size={32} style={{ color: "#ffffff" }} />
              </div>

              <h1 className="maintenance-title" style={{ fontSize: "2rem" }}>Тут уже кто-то был..</h1>

              <p className="maintenance-text" style={{ fontSize: "1rem", marginTop: "1rem" }}>
                Эта ссылка уже была активирована максимальное количество раз (2 устройства).
                Попробуй выпросить у создателя новую ссылку, если заслужил.
              </p>

              <div className="maintenance-timeline" style={{ marginTop: "1.5rem" }}>
                <div className="timeline-item">
                  <span className="timeline-label">Состояние ссылки:</span>
                  <span className="timeline-value" style={{ color: "#ffffff", fontWeight: "bold" }}>Сгорела / Использована</span>
                </div>
                <div className="timeline-item">
                  <span className="timeline-label">Активаций:</span>
                  <span className="timeline-value">2 из 2</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="maintenance-icon-wrapper">
                <Wrench size={32} className="maintenance-icon" />
              </div>

              <h1 className="maintenance-title" style={{ fontSize: "2rem" }}>Куда мы лезем, боже... </h1>

              <p className="maintenance-text" style={{ fontSize: "1rem", marginTop: "1rem" }}>
                Сюда вход только через нюдсы мне в лс, контакты{' '}
                <a href="https://www.youtube.com/watch?v=KQhVmtOuQrc" target="_blank" rel="noopener noreferrer" style={{ color: '#0088cc', textDecoration: 'underline' }}>
                  @dickpick.
                </a>
              </p>

            </>
          )}
        </div>
      </div>
    );
  }

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
                <button
                  onClick={() => triggerDirectDownload(result.videoUrl, result.title, "video")}
                  className="btn-download-video"
                >
                  <Video size={20} />
                  Скачать видео (без вотермарка) 🎬
                </button>
                {result.audioUrl && (
                  <button
                    onClick={() => triggerDirectDownload(result.audioUrl, result.title, "audio")}
                    className="btn-download-audio"
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
