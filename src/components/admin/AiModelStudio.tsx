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
  tags: string[];
  description: string;
  model: string;
  applied?: boolean;
}

const STAMP_SLOTS = [9, 13, 20, 25, 47, 65, 66, 67, 74, 86, 90, 174, 221, 222, 223, 224, 225, 226, 227, 233, 245, 253, 268, 275, 286, 334, 340, 341, 342];

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

  // Accept and apply a generated proposal to DB
  const handleAcceptProposal = async (sticker: StickerItem) => {
    const prop = proposals[sticker.id];
    if (!prop) return;

    setScanningId(sticker.id);
    try {
      const res = await fetch("/api/admin/stickers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: sticker.id,
          name: prop.name,
          tags: prop.tags,
          description: prop.description,
          slug: `${prop.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${sticker.slot_number || sticker.id}`,
        }),
      });

      if (res.ok) {
        setStickers((prev) =>
          prev.map((s) =>
            s.id === sticker.id
              ? {
                  ...s,
                  name: prop.name,
                  tags: prop.tags,
                  description: prop.description,
                }
              : s
          )
        );

        setProposals((prev) => ({
          ...prev,
          [sticker.id]: { ...prop, applied: true },
        }));

        showToast(`Saved: ${prop.name}`);
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
              AI STICKER & STAMP CLASSIFIER
            </h1>
            <p className="text-xs text-white/60 mt-1 max-w-2xl font-body">
              Automated visual understanding and semantic categorization model. Inspects sticker artwork, classifies iconography (Cyberpunk, Neo-Tokyo, Rave, Y2K, Mecha, Acid), tags postal stamps, and generates high-impact naming.
            </p>
          </div>

          {/* Active Model Indicator */}
          <div className="flex flex-col gap-1 items-start lg:items-end font-mono">
            <span className="text-[10px] text-white/40 tracking-widest uppercase">ACTIVE REASONING ENGINE</span>
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  hasConfiguredKey ? "bg-[#b4ff39] shadow-[0_0_12px_#b4ff39]" : "bg-cyan-400 shadow-[0_0_12px_#38bdf8]"
                }`}
              />
              <span className="text-sm font-bold text-white tracking-wider">
                {hasConfiguredKey ? "GEMINI 1.5 FLASH VISION" : "DOTT AESTHETIC VISION (BUILT-IN)"}
              </span>
            </div>
            <span className="text-[10px] text-white/50">
              {hasConfiguredKey ? "Multimodal Vision API Enabled" : "Deterministic Aesthetic Vision Classifier"}
            </span>
          </div>
        </div>

        {/* Gemini Vision API Key Box */}
        <div className="mt-6 pt-2 flex flex-col md:flex-row items-stretch md:items-center gap-4">
          <div className="flex-1">
            <label className="text-[11px] font-mono text-white/70 block mb-1.5 flex items-center justify-between">
              <span>GOOGLE GEMINI API KEY (OPTIONAL // ENABLES LIVE NEURAL VISION)</span>
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
                placeholder="AIzaSy... (leave blank to run Built-in Aesthetic Classifier)"
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

        {/* Row 2: Batch Execution Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-white/10">
          <div className="text-xs font-mono text-white/60">
            Showing <span className="font-bold text-white">{filteredStickers.length}</span> matching items
          </div>

          <div className="flex items-center gap-3">
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
              className="bg-[#b4ff39] hover:bg-white text-black text-xs font-bold px-5 py-2 transition-colors disabled:opacity-40 font-mono tracking-wider cursor-pointer flex items-center gap-2"
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
                          className="text-[9px] font-mono px-1.5 py-0.5 bg-white/10 text-white/80 border border-white/10"
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
                    className={`p-3 border mb-4 font-mono ${
                      proposal.applied
                        ? "bg-[#b4ff39]/5 border-[#b4ff39]/40"
                        : "bg-cyan-950/20 border-cyan-400/30"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[9px] mb-1.5">
                      <span className={proposal.applied ? "text-[#b4ff39] font-bold" : "text-cyan-300 font-bold"}>
                        {proposal.applied ? "✓ SAVED TO DATABASE" : "AI PROPOSAL (PREVIEW)"}
                      </span>
                      <span className="text-white/40">{proposal.model}</span>
                    </div>

                    <div className="text-xs font-bold text-white mb-1.5">{proposal.name}</div>

                    <div className="flex flex-wrap gap-1 mb-2">
                      {proposal.tags.map((t) => (
                        <span
                          key={t}
                          className={`text-[9px] px-1.5 py-0.5 border ${
                            proposal.applied
                              ? "bg-[#b4ff39]/20 text-[#b4ff39] border-[#b4ff39]/40"
                              : "bg-cyan-400/20 text-cyan-200 border-cyan-400/40"
                          }`}
                        >
                          {t}
                        </span>
                      ))}
                    </div>

                    {proposal.description && (
                      <p className="text-[10px] text-white/60 font-body line-clamp-2">
                        {proposal.description}
                      </p>
                    )}

                    {!proposal.applied && (
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          onClick={() => handleAcceptProposal(sticker)}
                          disabled={isScanning}
                          className="flex-1 bg-[#b4ff39] hover:bg-white text-black font-bold text-[10px] py-1.5 transition-colors tracking-wider"
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
                          className="text-[10px] text-white/50 hover:text-white px-2 py-1.5"
                        >
                          DISMISS
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-white/10 flex items-center gap-2">
                <button
                  onClick={() => handleScanSingle(sticker, false)}
                  disabled={isScanning || isBatchRunning}
                  className="flex-1 border border-white/20 hover:border-white text-white text-[10px] font-mono font-bold py-1.5 transition-colors disabled:opacity-40"
                >
                  {isScanning ? "SCANNING..." : "🤖 AI SCAN"}
                </button>
                <button
                  onClick={() => handleScanSingle(sticker, true)}
                  disabled={isScanning || isBatchRunning}
                  title="Scan with AI model and apply directly to database"
                  className="bg-white/10 hover:bg-[#b4ff39] hover:text-black text-white text-[10px] font-mono font-bold px-3 py-1.5 transition-colors disabled:opacity-40"
                >
                  ⚡ SCAN & SAVE
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
    </div>
  );
}
