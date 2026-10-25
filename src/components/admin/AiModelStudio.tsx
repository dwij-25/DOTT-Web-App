"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

interface StickerItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string;
  collection: string;
  slot_number: number | null;
  tags: string[];
  price: number;
  stock: number;
}

interface AiProposal {
  name: string;
  originalAiName?: string;
  tags: string[];
  description: string;
  model: string;
  applied?: boolean;
}

const STAMP_SLOTS = [9, 13, 20, 25, 47, 65, 66, 67, 74, 86, 90, 174, 221, 222, 223, 224, 225, 226, 227, 233, 245, 253, 268, 275, 286, 334, 340, 341, 342];

const getTagBadgeStyle = (tag: string) => {
  const t = tag.toUpperCase();
  if (t === "STAMP" || t === "POSTAGE" || t === "PHILATELY") return "bg-amber-500/20 text-amber-300 border-amber-500/40";
  if (t === "SNEAKERS" || t === "NIKE" || t === "KICKS" || t === "DUNK") return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
  if (t === "ANIME" || t === "MANGA" || t === "SAMURAI") return "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40";
  if (t === "GAMING" || t === "ARCADE" || t === "PIXEL-ART" || t === "16-BIT") return "bg-cyan-500/20 text-cyan-300 border-cyan-500/40";
  if (t === "FINE-ART" || t === "ART" || t === "IMPRESSIONISM" || t === "MASTERPIECE") return "bg-rose-500/20 text-rose-300 border-rose-500/40";
  if (t === "MOTORSPORT" || t === "JDM" || t === "CARS" || t === "DRIFT") return "bg-orange-500/20 text-orange-300 border-orange-500/40";
  if (t === "MUSIC" || t === "LO-FI" || t === "CASSETTE" || t === "VINYL") return "bg-teal-500/20 text-teal-300 border-teal-500/40";
  if (t === "TECH" || t === "CYBERPUNK" || t === "HACKER" || t === "LINUX") return "bg-blue-500/20 text-blue-300 border-blue-500/40";
  if (t === "SPACE" || t === "COSMIC" || t === "ASTRONAUT") return "bg-purple-500/20 text-purple-300 border-purple-500/40";
  if (t === "Y2K" || t === "ACID" || t === "CHROME" || t === "HOLO") return "bg-lime-500/20 text-lime-300 border-lime-500/40";
  return "bg-white/10 text-white/80 border-white/15";
};

export default function AiModelStudio({
  stickers: initialStickers,
  settings = {},
  showToast,
}: {
  stickers: StickerItem[];
  settings: Record<string, string>;
  showToast: (msg: string) => void;
}) {
  const router = useRouter();
  const [stickers, setStickers] = useState<StickerItem[]>(initialStickers);
  
  // Gemini API Key config state
  const [geminiKey, setGeminiKey] = useState<string>(settings.GEMINI_API_KEY || "");
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [showKeyText, setShowKeyText] = useState(false);
  const [hasConfiguredKey, setHasConfiguredKey] = useState<boolean>(Boolean(settings.GEMINI_API_KEY));
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<{ success: boolean; message: string; latencyMs?: number } | null>(null);

  // Filters & Search
  const [filterType, setFilterType] = useState<"ALL" | "STAMPS" | "GENERIC" | "BOOT" | "STANDARD">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // AI Single Scan states: map of stickerId -> proposal
  const [proposals, setProposals] = useState<Record<string, AiProposal>>({});
  const [scanningId, setScanningId] = useState<string | null>(null);

  // Batch states
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; message: string } | null>(null);
  const [batchLogs, setBatchLogs] = useState<Array<{ id: string; name: string; tags: string[]; model: string }>>([]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = stickers.length;
    const stamps = stickers.filter(
      (s) => (s.tags || []).includes("STAMP") || (s.slot_number !== null && STAMP_SLOTS.includes(s.slot_number))
    ).length;
    const generic = stickers.filter(
      (s) =>
        s.name.startsWith("STANDARD") ||
        s.name.startsWith("BOOT STICKER") ||
        !s.tags ||
        s.tags.length === 0 ||
        (s.tags.length === 1 && s.tags[0] === "BOOT")
    ).length;
    const categorized = total - generic;

    return { total, stamps, generic, categorized };
  }, [stickers]);

  // Filtered stickers list
  const filteredStickers = useMemo(() => {
    return stickers.filter((s) => {
      // Type filter
      if (filterType === "STAMPS") {
        const isStamp = (s.tags || []).includes("STAMP") || (s.slot_number !== null && STAMP_SLOTS.includes(s.slot_number));
        if (!isStamp) return false;
      } else if (filterType === "GENERIC") {
        const isGeneric =
          s.name.startsWith("STANDARD") ||
          s.name.startsWith("BOOT STICKER") ||
          !s.tags ||
          s.tags.length === 0 ||
          (s.tags.length === 1 && s.tags[0] === "BOOT");
        if (!isGeneric) return false;
      } else if (filterType === "BOOT") {
        if (s.collection !== "BOOT") return false;
      } else if (filterType === "STANDARD") {
        if (s.collection !== "STANDARD") return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = s.name.toLowerCase().includes(q);
        const matchSlot = s.slot_number?.toString() === q;
        const matchTag = (s.tags || []).some((t) => t.toLowerCase().includes(q));
        if (!matchName && !matchSlot && !matchTag) return false;
      }

      return true;
    });
  }, [stickers, filterType, searchQuery]);

  // Save or delete Gemini API Key
  const handleSaveGeminiKey = async (clear = false) => {
    setIsSavingKey(true);
    const keyToSave = clear ? "" : geminiKey.trim();

    try {
      const res = await fetch("/api/admin/ai-categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save-gemini-key",
          apiKey: keyToSave,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setHasConfiguredKey(!clear && Boolean(keyToSave));
        if (clear) setGeminiKey("");
        showToast(data.message || "Model key updated");
        router.refresh();
      } else {
        showToast(data.error || "Failed to save key");
      }
    } catch {
      showToast("Error updating API key");
    } finally {
      setIsSavingKey(false);
    }
  };

  // Test live connection to Google Gemini multimodal vision AI
  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setConnectionResult(null);

    try {
      const res = await fetch("/api/admin/ai-categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "test-connection",
          apiKey: geminiKey || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setConnectionResult({
          success: true,
          message: data.message,
          latencyMs: data.latencyMs,
        });
        showToast(`AI Online: ${data.latencyMs}ms`);
      } else {
        setConnectionResult({
          success: false,
          message: data.error || data.message || "Failed to reach AI model",
        });
        showToast("AI test failed");
      }
    } catch (e: any) {
      setConnectionResult({
        success: false,
        message: `Connection error: ${e.message}`,
      });
      showToast("Network error testing AI");
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Run single sticker AI scan
  const handleScanSingle = async (sticker: StickerItem, applyImmediately = false) => {
    setScanningId(sticker.id);

    try {
      const res = await fetch("/api/admin/ai-categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "single",
          stickerId: sticker.id,
          apply: applyImmediately,
          apiKey: geminiKey || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const proposalData = data.preview || {
          name: data.sticker.name,
          tags: data.sticker.tags,
          description: data.sticker.description,
        };

        setProposals((prev) => ({
          ...prev,
          [sticker.id]: {
            name: proposalData.name,
            originalAiName: proposalData.name,
            tags: proposalData.tags,
            description: proposalData.description,
            model: data.model || "Vision Model",
            applied: applyImmediately,
          },
        }));

        if (applyImmediately && data.sticker) {
          // Update local state
          setStickers((prev) =>
            prev.map((s) => (s.id === sticker.id ? { ...s, ...data.sticker } : s))
          );
          showToast(`Applied: ${data.sticker.name}`);
        } else {
          showToast(`Generated proposal for ${sticker.name}`);
        }
      } else {
        showToast(data.error || "Vision scan failed");
      }
    } catch {
      showToast("Network error running vision scan");
    } finally {
      setScanningId(null);
    }
  };

  // Pending unapplied proposals
  const [isSavingAll, setIsSavingAll] = useState(false);

  const pendingProposals = useMemo(() => {
    return Object.entries(proposals)
      .filter(([_, p]) => !p.applied)
      .map(([stickerId, p]) => {
        const sticker = stickers.find((s) => s.id === stickerId);
        return {
          id: stickerId,
          name: p.name,
          tags: p.tags,
          description: p.description,
          slot_number: sticker?.slot_number,
        };
      });
  }, [proposals, stickers]);

  // Update proposal name in real time
  const handleUpdateProposalName = (stickerId: string, newName: string) => {
    setProposals((prev) => {
      const existing = prev[stickerId];
      if (!existing) return prev;
      return {
        ...prev,
        [stickerId]: { ...existing, name: newName },
      };
    });
  };

  // Remove a word from proposal name on the spot
  const handleRemoveWordFromProposal = (stickerId: string, wordIndex: number) => {
    setProposals((prev) => {
      const existing = prev[stickerId];
      if (!existing) return prev;
      const words = existing.name.split(/\s+/).filter(Boolean);
      words.splice(wordIndex, 1);
      const updatedName = words.join(" ").trim();
      return {
        ...prev,
        [stickerId]: { ...existing, name: updatedName || existing.name },
      };
    });
  };

  // Reset proposal name back to original AI suggestion
  const handleResetProposalName = (stickerId: string) => {
    setProposals((prev) => {
      const existing = prev[stickerId];
      if (!existing || !existing.originalAiName) return prev;
      return {
        ...prev,
        [stickerId]: { ...existing, name: existing.originalAiName },
      };
    });
  };

  // Remove a tag from proposal on the spot
  const handleRemoveTagFromProposal = (stickerId: string, tagToRemove: string) => {
    setProposals((prev) => {
      const existing = prev[stickerId];
      if (!existing) return prev;
      return {
        ...prev,
        [stickerId]: {
          ...existing,
          tags: existing.tags.filter((t) => t !== tagToRemove),
        },
      };
    });
  };

  // Dismiss all pending proposals
  const handleDismissAllProposals = () => {
    if (confirm(`Dismiss all ${pendingProposals.length} pending proposals?`)) {
      setProposals((prev) => {
        const next = { ...prev };
        pendingProposals.forEach((p) => {
          delete next[p.id];
        });
        return next;
      });
      showToast("Dismissed all pending proposals");
    }
  };

  // Overall Save: commits all pending proposals across the page to database
  const handleSaveAllProposals = async () => {
    if (pendingProposals.length === 0) {
      showToast("No pending proposals to save");
      return;
    }

    setIsSavingAll(true);
    try {
      const res = await fetch("/api/admin/ai-categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save-batch-proposals",
          updates: pendingProposals.map((p) => ({
            id: p.id,
            name: p.name.trim().toUpperCase(),
            tags: p.tags,
            description: p.description,
            slot_number: p.slot_number,
          })),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Mark all proposals as applied
        setProposals((prev) => {
          const next = { ...prev };
          pendingProposals.forEach((p) => {
            if (next[p.id]) {
              next[p.id] = { ...next[p.id], name: p.name.trim().toUpperCase(), applied: true };
            }
          });
          return next;
        });

        // Update local stickers state
        setStickers((prev) =>
          prev.map((s) => {
            const matched = pendingProposals.find((p) => p.id === s.id);
            if (matched) {
              return {
                ...s,
                name: matched.name.trim().toUpperCase(),
                tags: matched.tags,
                description: matched.description || s.description,
              };
            }
            return s;
          })
        );

        showToast(`Successfully saved all ${data.savedCount} stickers to the store!`);
        router.refresh();
      } else {
        showToast(data.error || "Failed to batch save proposals");
      }
    } catch (e: any) {
      showToast(`Error saving: ${e.message}`);
    } finally {
      setIsSavingAll(false);
    }
  };

  // Accept and apply a single generated proposal to DB
  const handleAcceptProposal = async (sticker: StickerItem) => {
    const prop = proposals[sticker.id];
    if (!prop) return;

    const finalName = prop.name.trim().toUpperCase();
    setScanningId(sticker.id);
    try {
      const res = await fetch("/api/admin/stickers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: sticker.id,
          name: finalName,
          tags: prop.tags,
          description: prop.description,
          slug: `${finalName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${sticker.slot_number || sticker.id}`,
        }),
      });

      if (res.ok) {
        setStickers((prev) =>
          prev.map((s) =>
            s.id === sticker.id
              ? {
                  ...s,
                  name: finalName,
                  tags: prop.tags,
                  description: prop.description,
                }
              : s
          )
        );

        setProposals((prev) => ({
          ...prev,
          [sticker.id]: { ...prop, name: finalName, applied: true },
        }));

        showToast(`Saved: ${finalName}`);
      } else {
        showToast("Failed to save sticker changes");
      }
    } catch {
      showToast("Error updating sticker");
    } finally {
      setScanningId(null);
    }
  };

  // Run Batch AI categorization
  const handleBatchRun = async (apply: boolean) => {
    const actionLabel = apply ? "Classify & Apply (Write to Database)" : "Scan & Preview";
    if (
      apply &&
      !confirm(
        `Are you sure you want to run AI categorization and save the resulting names & tags directly to the database for [${filterType}]?`
      )
    ) {
      return;
    }

    setIsBatchRunning(true);
    setBatchLogs([]);
    setBatchProgress({ current: 0, total: filteredStickers.length, message: `Starting ${actionLabel}...` });

    try {
      // Convert UI filter to API filter parameter
      const apiFilter =
        filterType === "STAMPS"
          ? "stamps_only"
          : filterType === "GENERIC"
          ? "generic_only"
          : filterType === "BOOT"
          ? "boot"
          : filterType === "STANDARD"
          ? "standard"
          : "all";

      const res = await fetch("/api/admin/ai-categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "batch",
          filter: apiFilter,
          apply,
          apiKey: geminiKey || undefined,
          limit: 100,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const results = data.results || [];
        setBatchLogs(results);

        // Store proposals or update stickers
        const newProps: Record<string, AiProposal> = {};
        results.forEach((r: any) => {
          newProps[r.id] = {
            name: r.newName,
            originalAiName: r.newName,
            tags: r.tags,
            description: r.description,
            model: r.model,
            applied: apply,
          };
        });
        setProposals((prev) => ({ ...prev, ...newProps }));

        if (apply) {
          // Refresh list from updated results
          setStickers((prev) =>
            prev.map((s) => {
              const matched = results.find((r: any) => r.id === s.id);
              if (matched) {
                return {
                  ...s,
                  name: matched.newName,
                  tags: matched.tags,
                  description: matched.description,
                };
              }
              return s;
            })
          );
          showToast(`Successfully categorized ${data.updatedCount} items!`);
          router.refresh();
        } else {
          showToast(`Previewed ${results.length} items. Review proposals below.`);
        }
      } else {
        showToast(data.error || "Batch processing failed");
      }
    } catch {
      showToast("Error executing batch AI categorization");
    } finally {
      setIsBatchRunning(false);
      setBatchProgress(null);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* 1. Header & Engine Configuration */}
      <div className="border border-white/20 bg-[#0d0d0d] p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#b4ff39]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[10px] tracking-[0.25em] font-mono px-2 py-0.5 bg-[#b4ff39]/20 text-[#b4ff39] border border-[#b4ff39]/40 font-bold">
                ADMIN RESTRICTED // AI STUDIO
              </span>
              <span className="text-xs text-white/40 font-mono">STRICTLY ISOLATED TO /ADMIN</span>
            </div>
            <h1 className="text-2xl font-bold tracking-wider font-display text-white">
              REAL-TIME AI STICKER & STAMP CLASSIFIER
            </h1>
            <p className="text-xs text-white/60 mt-1 max-w-2xl font-body">
              Real-time multimodal visual intelligence classifier powered by Google Gemini Vision. Deeply inspects sticker artwork to recognize exact subjects (Sneakers, Nike Dunks, Anime, Van Gogh Art, Postage Stamps, JDM Cars, Gaming, Music, Tech), and extracts vast, non-repeating tags and names across all fields.
            </p>
          </div>

          {/* Active Model Indicator */}
          <div className="flex flex-col gap-1 items-start lg:items-end font-mono">
            <span className="text-[10px] text-white/40 tracking-widest uppercase">ACTIVE REASONING ENGINE</span>
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                  hasConfiguredKey ? "bg-[#b4ff39] shadow-[0_0_12px_#b4ff39]" : "bg-cyan-400 shadow-[0_0_12px_#38bdf8]"
                }`}
              />
              <span className="text-sm font-bold text-white tracking-wider">
                {hasConfiguredKey ? "GEMINI 3.5 FLASH (REAL-TIME MULTIMODAL AI)" : "DOTT VAST AESTHETIC ENGINE"}
              </span>
            </div>
            <span className="text-[10px] text-white/50">
              {hasConfiguredKey ? "Live Multimodal Neural Vision Active (All Fields)" : "Diverse Offline Taxonomy Fallback"}
            </span>
          </div>
        </div>

        {/* Gemini Vision API Key Box & Test Controls */}
        <div className="mt-6 pt-2 flex flex-col md:flex-row items-stretch md:items-center gap-4">
          <div className="flex-1">
            <label className="text-[11px] font-mono text-white/70 block mb-1.5 flex items-center justify-between">
              <span>GOOGLE GEMINI MULTIMODAL VISION API KEY (ACTIVE // REAL-TIME NEURAL AI)</span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[#b4ff39] hover:underline text-[10px]"
              >
                Get Free Gemini Key ↗
              </a>
            </label>
            <div className="relative">
              <input
                type={showKeyText ? "text" : "password"}
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="AIzaSy... (API Key is saved in system)"
                className="w-full bg-black border border-white/20 px-3 py-2 text-xs font-mono text-white outline-none focus:border-[#b4ff39] transition-colors pr-16"
              />
              <button
                type="button"
                onClick={() => setShowKeyText(!showKeyText)}
                className="absolute right-2 top-2 text-[10px] text-white/50 hover:text-white font-mono px-1.5"
              >
                {showKeyText ? "HIDE" : "SHOW"}
              </button>
            </div>
          </div>

          <div className="flex items-end gap-2 pt-5">
            <button
              onClick={() => handleSaveGeminiKey(false)}
              disabled={isSavingKey}
              className="bg-white text-black hover:bg-[#b4ff39] text-xs font-bold px-4 py-2 transition-colors disabled:opacity-50 tracking-wider font-mono h-[35px]"
            >
              {isSavingKey ? "SAVING..." : "SAVE KEY"}
            </button>
            
            <button
              onClick={handleTestConnection}
              disabled={isTestingConnection}
              className="border border-[#b4ff39] text-[#b4ff39] hover:bg-[#b4ff39] hover:text-black text-xs font-bold px-3 py-2 transition-colors disabled:opacity-50 tracking-wider font-mono h-[35px] flex items-center gap-1.5"
            >
              {isTestingConnection ? "TESTING..." : "⚡ TEST AI"}
            </button>

            {hasConfiguredKey && (
              <button
                onClick={() => handleSaveGeminiKey(true)}
                disabled={isSavingKey}
                className="border border-red-500/50 text-red-400 hover:bg-red-500/20 text-xs font-bold px-3 py-2 transition-colors disabled:opacity-50 font-mono h-[35px]"
              >
                REMOVE
              </button>
            )}
          </div>
        </div>

        {/* Live Connection Test Banner */}
        {connectionResult && (
          <div
            className={`mt-4 p-3 border font-mono text-xs flex items-center justify-between ${
              connectionResult.success
                ? "bg-[#b4ff39]/10 border-[#b4ff39] text-[#b4ff39]"
                : "bg-red-950/20 border-red-500/50 text-red-400"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="font-bold">{connectionResult.success ? "✓ REAL AI MODEL ONLINE:" : "✕ CONNECTION ERROR:"}</span>
              <span>{connectionResult.message}</span>
            </div>
            {connectionResult.latencyMs && (
              <span className="text-[10px] bg-black px-2 py-0.5 border border-white/20 text-white">
                {connectionResult.latencyMs}ms LATENCY
              </span>
            )}
          </div>
        )}
      </div>

      {/* 2. Catalog Insights Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#111] border border-white/10 p-4">
          <div className="text-[10px] text-white/50 tracking-widest font-mono">TOTAL CATALOG ITEMS</div>
          <div className="text-2xl font-bold text-white mt-1 font-display">{stats.total}</div>
          <div className="text-[10px] text-white/40 mt-1 font-mono">Stickers + Stamps</div>
        </div>

        <div className="bg-[#111] border border-white/10 p-4">
          <div className="text-[10px] text-white/50 tracking-widest font-mono">POSTAGE STAMPS</div>
          <div className="text-2xl font-bold text-[#b4ff39] mt-1 font-display">{stats.stamps}</div>
          <div className="text-[10px] text-white/40 mt-1 font-mono">Tagged or Slot Match</div>
        </div>

        <div className="bg-[#111] border border-white/10 p-4">
          <div className="text-[10px] text-white/50 tracking-widest font-mono">NEEDS CATEGORIZATION</div>
          <div className="text-2xl font-bold text-amber-400 mt-1 font-display">{stats.generic}</div>
          <div className="text-[10px] text-white/40 mt-1 font-mono">Generic names or empty tags</div>
        </div>

        <div className="bg-[#111] border border-white/10 p-4">
          <div className="text-[10px] text-white/50 tracking-widest font-mono">CATEGORIZED & NAMED</div>
          <div className="text-2xl font-bold text-cyan-400 mt-1 font-display">{stats.categorized}</div>
          <div className="text-[10px] text-white/40 mt-1 font-mono">Curated aesthetic tags</div>
        </div>
      </div>

      {/* 3. Batch Action & Filtering Toolbar */}
      <div className="bg-[#111] border border-white/15 p-5 flex flex-col gap-4">
        {/* Row 1: Filter Pills & Search */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono text-white/50 tracking-widest mr-1">FILTER:</span>
            {(
              [
                { id: "ALL", label: `ALL (${stats.total})` },
                { id: "STAMPS", label: `✉️ STAMPS (${stats.stamps})` },
                { id: "GENERIC", label: `⚠️ NEEDS TAGGING (${stats.generic})` },
                { id: "STANDARD", label: "STANDARD (1-250)" },
                { id: "BOOT", label: "BOOT DROP" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`text-[11px] font-mono px-3 py-1.5 border transition-colors ${
                  filterType === tab.id
                    ? "border-[#b4ff39] bg-[#b4ff39] text-black font-bold"
                    : "border-white/20 bg-black text-white/70 hover:border-white/50 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="w-full lg:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by slot #, name, or tag..."
              className="w-full bg-black border border-white/20 px-3 py-1.5 text-xs font-mono text-white outline-none focus:border-white placeholder:text-white/30"
            />
          </div>
        </div>

        {/* Row 2: Batch Execution & Overall Save Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="text-xs font-mono text-white/60">
              Showing <span className="font-bold text-white">{filteredStickers.length}</span> matching items
            </div>
            {pendingProposals.length > 0 && (
              <span className="text-[10px] font-mono px-2 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold animate-pulse">
                ⚡ {pendingProposals.length} PROPOSALS PENDING REVIEW
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {pendingProposals.length > 0 && (
              <>
                <button
                  onClick={handleSaveAllProposals}
                  disabled={isSavingAll}
                  className="bg-[#b4ff39] hover:bg-white text-black text-xs font-black px-5 py-2 transition-all font-mono tracking-wider cursor-pointer shadow-[0_0_15px_rgba(180,255,57,0.3)] flex items-center gap-2"
                >
                  <span>{isSavingAll ? "SAVING ALL..." : `💾 SAVE ALL (${pendingProposals.length} PROPOSALS)`}</span>
                </button>
                <button
                  onClick={handleDismissAllProposals}
                  className="border border-white/20 hover:border-red-500 hover:text-red-400 text-white/60 text-xs font-mono px-3 py-2 transition-colors cursor-pointer"
                >
                  DISMISS ALL
                </button>
              </>
            )}

            <button
              disabled={isBatchRunning || filteredStickers.length === 0}
              onClick={() => handleBatchRun(false)}
              className="border border-white/30 hover:border-white text-white text-xs font-bold px-4 py-2 transition-colors disabled:opacity-40 font-mono tracking-wider cursor-pointer"
            >
              {isBatchRunning ? "SCANNING..." : "👁️ PREVIEW BATCH AI"}
            </button>

            <button
              disabled={isBatchRunning || filteredStickers.length === 0}
              onClick={() => handleBatchRun(true)}
              className="bg-white/10 hover:bg-[#b4ff39] hover:text-black text-white text-xs font-bold px-4 py-2 transition-colors disabled:opacity-40 font-mono tracking-wider cursor-pointer flex items-center gap-2"
            >
              <span>⚡ AUTO-TAG & APPLY ALL</span>
            </button>
          </div>
        </div>

        {/* Batch Progress Bar */}
        {batchProgress && (
          <div className="mt-2 bg-black border border-white/20 p-3">
            <div className="flex justify-between text-xs font-mono mb-1 text-white/70">
              <span>{batchProgress.message}</span>
              <span>
                {batchProgress.current} / {batchProgress.total}
              </span>
            </div>
            <div className="w-full bg-white/10 h-2 overflow-hidden">
              <div
                className="bg-[#b4ff39] h-full transition-all duration-300"
                style={{
                  width: `${
                    batchProgress.total > 0 ? (batchProgress.current / batchProgress.total) * 100 : 0
                  }%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 4. Batch Result Logs Console (If present) */}
      {batchLogs.length > 0 && (
        <div className="bg-[#0a0a0a] border border-[#b4ff39]/30 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono font-bold text-[#b4ff39] tracking-widest">
              BATCH CLASSIFICATION OUTPUT ({batchLogs.length} ITEMS PROCESSED)
            </span>
            <button
              onClick={() => setBatchLogs([])}
              className="text-[10px] text-white/50 hover:text-white font-mono"
            >
              CLOSE LOGS
            </button>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1 font-mono text-[11px] pr-2">
            {batchLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between py-1 px-2 border-b border-white/5 hover:bg-white/5 text-white/80"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[#b4ff39] font-bold">✓</span>
                  <span className="text-white font-bold">{log.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white/40 text-[10px]">[{log.model}]</span>
                  <div className="flex gap-1">
                    {log.tags.map((t) => (
                      <span
                        key={t}
                        className="bg-white/10 text-white/80 px-1.5 py-0.2 rounded text-[9px]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Interactive Stickers & Stamps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredStickers.map((sticker) => {
          const isStamp =
            (sticker.tags || []).includes("STAMP") ||
            (sticker.slot_number !== null && STAMP_SLOTS.includes(sticker.slot_number));
          const proposal = proposals[sticker.id];
          const isScanning = scanningId === sticker.id;

          return (
            <div
              key={sticker.id}
              className={`bg-[#0d0d0d] border p-4 flex flex-col justify-between transition-all ${
                proposal?.applied
                  ? "border-[#b4ff39]/50 shadow-[0_0_15px_rgba(180,255,57,0.1)]"
                  : proposal
                  ? "border-cyan-400/50"
                  : "border-white/10 hover:border-white/30"
              }`}
            >
              <div>
                {/* Header row: Slot & Type Badges */}
                <div className="flex items-center justify-between mb-3 font-mono text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <span className="bg-white/10 text-white px-2 py-0.5 font-bold">
                      {sticker.collection === "BOOT"
                        ? `BOOT #${sticker.slot_number || "X"}`
                        : `SLOT #${sticker.slot_number || "?"}`}
                    </span>
                    {isStamp && (
                      <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 font-bold">
                        ✉️ STAMP
                      </span>
                    )}
                  </div>
                  <span className="text-white/40 font-mono">₹{sticker.price / 100}</span>
                </div>

                {/* Sticker Visual Preview */}
                <div className="relative aspect-video bg-black/60 border border-white/5 rounded flex items-center justify-center p-3 mb-3 overflow-hidden group">
                  <img
                    src={sticker.image_url}
                    alt={sticker.name}
                    className="max-h-full max-w-full object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] group-hover:scale-105 transition-transform"
                  />
                  {isScanning && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-[#b4ff39] border-t-transparent rounded-full animate-spin" />
                      <span className="text-[10px] font-mono text-[#b4ff39] tracking-widest">
                        AI SCANNING...
                      </span>
                    </div>
                  )}
                </div>

                {/* Current Item Name & Description */}
                <div className="mb-3">
                  <div className="text-xs text-white/40 font-mono uppercase text-[9px] mb-0.5">CURRENT NAME</div>
                  <h3 className="font-bold text-white text-sm tracking-wide truncate" title={sticker.name}>
                    {sticker.name}
                  </h3>
                  {sticker.description && (
                    <p className="text-[11px] text-white/50 line-clamp-1 mt-0.5 font-body">
                      {sticker.description}
                    </p>
                  )}
                </div>

                {/* Current Tags */}
                <div className="mb-4">
                  <div className="text-[9px] text-white/40 font-mono uppercase mb-1">ACTIVE TAGS</div>
                  <div className="flex flex-wrap gap-1">
                    {sticker.tags && sticker.tags.length > 0 ? (
                      sticker.tags.map((tag) => (
                        <span
                          key={tag}
                          className={`text-[9px] font-mono px-1.5 py-0.5 border ${getTagBadgeStyle(tag)}`}
                        >
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-amber-400/80 font-mono italic">
                        No tags assigned
                      </span>
                    )}
                  </div>
                </div>

                {/* AI Proposal Card (If generated) */}
                {proposal && (
                  <div
                    className={`p-3.5 border mb-4 font-mono transition-all ${
                      proposal.applied
                        ? "bg-[#b4ff39]/5 border-[#b4ff39]/40"
                        : "bg-[#0b131e] border-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[9px] mb-2">
                      <span className={proposal.applied ? "text-[#b4ff39] font-bold" : "text-cyan-300 font-bold tracking-wider"}>
                        {proposal.applied ? "✓ SAVED TO DATABASE" : "AI PROPOSAL (LIVE PREVIEW)"}
                      </span>
                      <span className="text-white/40">{proposal.model}</span>
                    </div>

                    {/* If proposal is applied: show saved name */}
                    {proposal.applied ? (
                      <div className="text-xs font-bold text-white mb-2">{proposal.name}</div>
                    ) : (
                      /* If proposal is pending: allow editing name directly AND removing words on the spot */
                      <div className="mb-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[9px] font-mono text-cyan-300/90 uppercase tracking-wider font-bold">
                            EDIT NAME ON THE SPOT:
                          </label>
                          {proposal.originalAiName && proposal.originalAiName !== proposal.name && (
                            <button
                              type="button"
                              onClick={() => handleResetProposalName(sticker.id)}
                              className="text-[9px] text-[#b4ff39] hover:underline font-mono"
                              title="Reset back to original AI suggestion"
                            >
                              ↺ RESTORE AI
                            </button>
                          )}
                        </div>

                        {/* Direct text input for the name */}
                        <input
                          type="text"
                          value={proposal.name}
                          onChange={(e) => handleUpdateProposalName(sticker.id, e.target.value)}
                          className="w-full bg-black border border-cyan-500/40 focus:border-cyan-300 px-2.5 py-1.5 text-xs font-mono font-bold text-white outline-none"
                          placeholder="Sticker name..."
                        />

                        {/* Word chips with one-click ✕ removal buttons */}
                        <div className="pt-0.5">
                          <div className="text-[9px] text-white/50 mb-1 flex items-center justify-between">
                            <span>CLICK ANY WORD TO REMOVE:</span>
                            <span className="text-[8px] text-cyan-400/80">1-CLICK STRIP</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {proposal.name.split(/\s+/).filter(Boolean).map((word, wordIdx) => (
                              <button
                                key={`${word}-${wordIdx}`}
                                type="button"
                                onClick={() => handleRemoveWordFromProposal(sticker.id, wordIdx)}
                                className="group inline-flex items-center gap-1 px-1.5 py-0.5 bg-black/90 border border-white/25 hover:border-red-400 hover:bg-red-950/40 text-white text-[10px] font-mono transition-all rounded-xs cursor-pointer"
                                title={`Click to remove '${word}' from name`}
                              >
                                <span>{word}</span>
                                <span className="text-red-400 group-hover:text-red-300 font-bold text-[9px] leading-none">✕</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Proposal Tags with remove button on each tag */}
                    <div className="mb-2">
                      <div className="text-[9px] text-white/40 mb-1 flex items-center justify-between">
                        <span>TAGS:</span>
                        {!proposal.applied && (
                          <span className="text-[8px] text-white/30">CLICK ✕ TO REMOVE</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {proposal.tags.map((t) => (
                          <span
                            key={t}
                            className={`text-[9px] px-1.5 py-0.5 border ${getTagBadgeStyle(t)} font-bold inline-flex items-center gap-1`}
                          >
                            <span>{t}</span>
                            {!proposal.applied && (
                              <button
                                type="button"
                                onClick={() => handleRemoveTagFromProposal(sticker.id, t)}
                                className="hover:text-red-400 text-white/50 text-[9px] ml-0.5 font-bold cursor-pointer"
                                title={`Remove tag ${t}`}
                              >
                                ✕
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>

                    {proposal.description && (
                      <p className="text-[10px] text-white/60 font-body line-clamp-2 mb-2">
                        {proposal.description}
                      </p>
                    )}

                    {!proposal.applied && (
                      <div className="mt-3 pt-2 border-t border-white/10 flex items-center gap-2">
                        <button
                          onClick={() => handleAcceptProposal(sticker)}
                          disabled={isScanning || isSavingAll}
                          className="flex-1 bg-[#b4ff39] hover:bg-white text-black font-bold text-[10px] py-1.5 transition-colors tracking-wider cursor-pointer"
                        >
                          ACCEPT & SAVE
                        </button>
                        <button
                          onClick={() => {
                            setProposals((prev) => {
                              const next = { ...prev };
                              delete next[sticker.id];
                              return next;
                            });
                          }}
                          className="text-[10px] text-white/50 hover:text-white px-2 py-1.5 cursor-pointer"
                        >
                          DISMISS
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-white/10">
                <button
                  onClick={() => handleScanSingle(sticker, false)}
                  disabled={isScanning || isBatchRunning}
                  className="w-full border border-white/20 hover:border-[#b4ff39] hover:text-[#b4ff39] text-white text-xs font-mono font-bold py-2 transition-all disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isScanning ? (
                    <>
                      <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      <span>AI SCANNING...</span>
                    </>
                  ) : (
                    <span>🤖 AI SCAN</span>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredStickers.length === 0 && (
        <div className="text-center py-12 border border-white/10 text-white/40 font-mono text-xs">
          No stickers match current filter or search criteria.
        </div>
      )}

      {/* 6. Sticky Floating Overall Save Bar */}
      <AnimatePresence>
        {pendingProposals.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#0d0d0d]/95 backdrop-blur-md border-2 border-[#b4ff39] p-3 md:px-6 md:py-3.5 shadow-[0_0_35px_rgba(0,0,0,0.95),0_0_20px_rgba(180,255,57,0.3)] flex items-center justify-between gap-5 max-w-xl w-[92vw]"
          >
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#b4ff39] animate-ping shrink-0" />
              <div>
                <div className="text-xs font-bold text-white font-mono flex items-center gap-2">
                  <span>OVERALL PAGE SAVE READY</span>
                  <span className="text-[10px] text-[#b4ff39] bg-[#b4ff39]/15 px-1.5 py-0.2 border border-[#b4ff39]/40 font-bold">
                    {pendingProposals.length} TO COMMIT
                  </span>
                </div>
                <div className="text-[10px] text-white/60 font-mono hidden sm:block">
                  Saves all modified names, stripped words, and tags to the store at once
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveAllProposals}
                disabled={isSavingAll}
                className="bg-[#b4ff39] hover:bg-white text-black font-black text-xs px-5 py-2.5 font-mono tracking-wider transition-all cursor-pointer shadow-[0_0_15px_rgba(180,255,57,0.4)] whitespace-nowrap"
              >
                {isSavingAll ? "SAVING ALL..." : `💾 SAVE ALL (${pendingProposals.length})`}
              </button>
              <button
                onClick={handleDismissAllProposals}
                title="Dismiss all pending proposals"
                className="text-[11px] text-white/50 hover:text-red-400 font-mono px-2 py-1 transition-colors"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
