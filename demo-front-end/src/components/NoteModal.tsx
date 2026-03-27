"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { X, Star, Loader2, Sparkles } from "lucide-react";
import Twemoji from "react-twemoji";

type NoteModalProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  noteId?: number | null;
};

type Tag = {
  id: number;
  name: string;
  category: string;
  emoji: string;
};

const CATEGORY_MAP: Record<string, string> = {
  WEATHER: "Thời tiết",
  ACTIVITY: "Hoạt động",
  EMOTION: "Cảm xúc",
};

export default function NoteModal({ isOpen, onClose, selectedDate, noteId }: NoteModalProps) {
  const queryClient = useQueryClient();
  
  const [rate, setRate] = useState<number>(0);

  const { data: tags = [], isLoading: isLoadingTags } = useQuery<Tag[]>({
    queryKey: ["tags"],
    queryFn: async () => {
      const response = await api.get("/api/tags");
      return response.data || [];
    },
    enabled: isOpen,
  });

  const tagsByCategory = tags.reduce((acc, tag) => {
    if (!acc[tag.category]) {
      acc[tag.category] = [];
    }
    acc[tag.category].push(tag);
    return acc;
  }, {} as Record<string, Tag[]>);
  const [noteText, setNoteText] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [localAiAdvice, setLocalAiAdvice] = useState<string | null>(null);

  // Fetch existing note if in edit mode
  const { data: existingNote, isLoading: isFetchingNote } = useQuery({
    queryKey: ["note", noteId],
    queryFn: async () => {
      const response = await api.get(`/api/notes/${noteId}`);
      return response.data;
    },
    enabled: !!noteId && isOpen,
  });

  // Reset or populate state when opened with a new date or noteId changes
  useEffect(() => {
    if (!isOpen) return;
    setLocalAiAdvice(null);

    if (noteId && existingNote) {
      setRate(existingNote.rate || 0);
      setNoteText(existingNote.noteText || "");

      let parsedIds: number[] = [];
      if (Array.isArray(existingNote.tagIds)) {
        parsedIds = existingNote.tagIds;
      } else if (Array.isArray(existingNote.tags) && existingNote.tags.length > 0 && ("id" in existingNote.tags[0] || "tagId" in existingNote.tags[0])) {
        parsedIds = existingNote.tags.map((t: any) => t.id || t.tagId).filter(Boolean);
      } else if (Array.isArray(existingNote.noteTags)) {
        parsedIds = existingNote.noteTags.map((nt: any) => nt.tagId || nt.tag?.id).filter(Boolean);
      } else if (tags.length > 0) {
        // Fallback: match by emojis if the API returns an array of emojis or tag objects without IDs
        let emojiList: string[] = [];
        if (Array.isArray(existingNote.emojis)) {
          emojiList = existingNote.emojis;
        } else if (Array.isArray(existingNote.tags)) {
          emojiList = existingNote.tags.map((t: any) => typeof t === 'string' ? t : t.emoji).filter(Boolean);
        }
        const matched = tags
          .filter((t) => emojiList.includes(t.emoji))
          .map((t) => t.id);
        if (matched.length > 0) parsedIds = matched;
      }

      setSelectedTagIds(parsedIds);
    } else if (!noteId) {
      setRate(0);
      setNoteText("");
      setSelectedTagIds([]);
    }
  }, [isOpen, noteId, existingNote, selectedDate, tags]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDate) return;
      const payload = {
        recordDate: format(selectedDate, "yyyy-MM-dd"),
        rate,
        noteText,
        tagIds: selectedTagIds,
      };

      if (noteId) {
        const response = await api.put(`/api/notes/${noteId}`, payload);
        return response.data;
      } else {
        const response = await api.post("/api/notes", payload);
        return response.data;
      }
    },
    onSuccess: (data) => {
      toast.success("Lưu nhật ký thành công!");
      queryClient.invalidateQueries({ queryKey: ["calendar-notes"] });
      
      if (data && data.aiAdvice) {
        setLocalAiAdvice(data.aiAdvice);
        // Do not close immediately, let the user read the AI advice
      } else {
        onClose();
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Có lỗi xảy ra khi lưu");
    },
  });

  if (!isOpen || !selectedDate) return null;

  const handleToggleTag = (id: number) => {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((tId) => tId !== id) : [...prev, id]
    );
  };

  const isSaving = saveMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-orange-100">
        <div className="flex items-center justify-between p-5 border-b border-stone-100 bg-[#fdfbf7]">
          <h2 className="text-xl font-bold text-stone-800">
            {noteId ? "Sửa Nhật Ký" : "Thêm mới"} {format(selectedDate, "dd/MM/yyyy")}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 relative">
          {isFetchingNote && (
            <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-sm flex items-center justify-center rounded-b-3xl">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
          )}
          
          {/* Rate Selector */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-stone-700">Mức độ hài lòng</label>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRate(value)}
                  className={`p-2 rounded-full transition-all ${
                    rate >= value
                      ? "text-orange-400 hover:text-orange-500 hover:scale-110"
                      : "text-stone-300 hover:text-orange-300 hover:scale-110"
                  }`}
                >
                  <Star
                    className="w-8 h-8"
                    fill={rate >= value ? "currentColor" : "none"}
                    strokeWidth={1.5}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Textarea */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-stone-700">Ghi chú</label>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Hôm nay của bạn thế nào?"
              className="w-full p-4 border-transparent bg-stone-50 text-stone-800 rounded-2xl resize-none focus:bg-white focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all outline-none h-32"
            />
          </div>

          {/* Tags */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-stone-700">Gắn thẻ</label>
              {selectedTagIds.length > 0 && (
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full uppercase tracking-wide">
                  Đã chọn {selectedTagIds.length}
                </span>
              )}
            </div>
            
            {isLoadingTags ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-orange-400" />
              </div>
            ) : (
              <div className="space-y-3">
                {/* Category Tabs */}
                <div className="flex space-x-2 overflow-x-auto pb-1 custom-scrollbar">
                  {Object.keys(tagsByCategory).map((category) => {
                    const isActive = activeCategory ? activeCategory === category : Object.keys(tagsByCategory)[0] === category;
                    return (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setActiveCategory(category)}
                        className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all uppercase tracking-wide ${
                          isActive
                            ? "bg-stone-800 text-white shadow-sm"
                            : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                        }`}
                      >
                        {CATEGORY_MAP[category] || category}
                      </button>
                    );
                  })}
                </div>

                {/* Tags for active category */}
                <div className="h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                  {(() => {
                    const currentCategory = activeCategory || Object.keys(tagsByCategory)[0];
                    if (!currentCategory || !tagsByCategory[currentCategory]) return null;

                    return (
                      <div className="flex flex-wrap gap-2 animate-in fade-in duration-200">
                        {tagsByCategory[currentCategory].map((tag) => {
                          const isSelected = selectedTagIds.includes(tag.id);
                          return (
                            <button
                              key={tag.id}
                              type="button"
                              onClick={() => handleToggleTag(tag.id)}
                              className={`group flex items-center py-1.5 px-3 focus:outline-none transition-colors border rounded-xl space-x-2
                                ${isSelected 
                                  ? "bg-blue-50 border-blue-500 text-blue-800" 
                                  : "bg-gray-100 border-transparent text-stone-600 hover:bg-gray-200"}
                              `}
                            >
                              <span className="text-base leading-none flex items-center">
                                <Twemoji options={{ className: 'twemoji' }}>
                                  {tag.emoji}
                                </Twemoji>
                              </span>
                              <span className="text-sm font-medium">{tag.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>

          {/* AI Advice Display */}
          {(localAiAdvice || existingNote?.aiAdvice) && (
            <div className="mt-2 p-4 bg-orange-50 border border-orange-200/60 rounded-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
              <div className="absolute -top-4 -right-2 p-3 opacity-[0.08]">
                <Sparkles className="w-24 h-24 text-orange-500" />
              </div>
              <div className="flex items-center space-x-2 mb-2">
                <Sparkles className="w-5 h-5 text-orange-500" />
                <h3 className="font-bold text-orange-800 text-sm">Lời khuyên từ AI</h3>
              </div>
              <p className="text-orange-900/80 text-sm leading-relaxed relative z-10 italic">
                "{localAiAdvice || existingNote?.aiAdvice}"
              </p>
            </div>
          )}

          {/* Save Button */}
          {localAiAdvice && !noteId ? (
            <button
              onClick={onClose}
              className="w-full flex items-center justify-center py-3.5 px-4 rounded-xl text-stone-600 bg-stone-100 hover:bg-stone-200 focus:outline-none transition-all font-medium mt-4"
            >
              Đóng
            </button>
          ) : (
            <button
              onClick={() => saveMutation.mutate()}
              disabled={isSaving || rate === 0 || isFetchingNote}
              className="w-full flex items-center justify-center py-3.5 px-4 rounded-xl text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm mt-4"
            >
              {isSaving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : noteId ? (
                "Cập nhật"
              ) : (
                "Lưu nhật ký"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
