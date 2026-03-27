import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Loader2, Plus, Edit2, Trash2, X, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import Twemoji from "react-twemoji";

type Tag = {
  id: number;
  name: string;
  category: string;
  emoji: string;
};

const CATEGORY_MAP: Record<string, string> = {
  EMOTION: "Cảm xúc",
  WEATHER: "Thời tiết",
  ACTIVITY: "Hoạt động",
  PEOPLE: "Mọi người",
};

export default function TagManagerModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const topRef = useRef<HTMLDivElement>(null);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({ name: "", category: "EMOTION", emoji: "" });

  const { data: tags = [], isLoading } = useQuery<Tag[]>({
    queryKey: ["tags"],
    enabled: isOpen,
    queryFn: async () => {
      const response = await api.get("/api/tags");
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (newTag: any) => api.post("/api/tags", newTag),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      toast.success("Thêm Tag thành công");
      setIsCreating(false);
      setFormData({ name: "", category: "EMOTION", emoji: "" });
    },
    onError: () => toast.error("Có lỗi xảy ra khi thêm Tag"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => api.put(`/api/tags/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      toast.success("Cập nhật Tag thành công");
      setEditingTag(null);
    },
    onError: () => toast.error("Có lỗi xảy ra khi cập nhật Tag"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/api/tags/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      toast.success("Đã xoá Tag");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Không thể xoá Tag (có thể đang được dùng).");
    },
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.emoji) {
      toast.error("Vui lòng điền đủ Tên và Icon");
      return;
    }
    if (editingTag) {
      updateMutation.mutate({ id: editingTag.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const openEdit = (tag: Tag) => {
    setEditingTag(tag);
    setIsCreating(false);
    setFormData({ name: tag.name, category: tag.category, emoji: tag.emoji });
    setTimeout(() => {
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const cancelEdit = () => {
    setEditingTag(null);
    setIsCreating(false);
    setFormData({ name: "", category: "EMOTION", emoji: "" });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-orange-100 flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 flex justify-between items-center bg-stone-50 border-b border-stone-100">
          <h2 className="text-xl font-bold text-stone-800">Quản lý Tags (Admin)</h2>
          <button onClick={onClose} className="p-2 bg-white rounded-full hover:bg-stone-100 transition-colors shadow-sm">
            <X className="w-5 h-5 text-stone-500" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-8">
          <div ref={topRef} />
          {/* Form */}
          <div className="w-full">
            <div className="bg-stone-50 p-5 rounded-2xl border border-stone-100 max-w-xl mx-auto shadow-sm">
              <h3 className="text-sm font-bold text-stone-800 uppercase tracking-wide mb-4 text-center">
                {editingTag ? "Chỉnh sửa Tag" : "Thêm Tag Mới"}
              </h3>
              
              {!editingTag && !isCreating ? (
                <button 
                  onClick={() => setIsCreating(true)}
                  className="w-full py-3 flex items-center justify-center space-x-2 bg-stone-800 text-white rounded-xl hover:bg-stone-900 transition-colors text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tạo Mới Tag</span>
                </button>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <label className="text-xs font-bold text-stone-700 block mb-1">Tên Tag</label>
                      <input 
                        type="text" 
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm text-stone-900 outline-none focus:border-orange-400" 
                        placeholder="vd: Vui vẻ"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">Emoji</label>
                      <input 
                        type="text" 
                        value={formData.emoji}
                        onChange={e => setFormData({...formData, emoji: e.target.value})}
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm text-stone-900 outline-none focus:border-orange-400" 
                        placeholder="vd: 😄"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">Nhóm</label>
                      <select 
                        value={formData.category}
                        onChange={e => setFormData({...formData, category: e.target.value})}
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm text-stone-900 outline-none focus:border-orange-400"
                      >
                        <option value="EMOTION">Cảm xúc</option>
                        <option value="WEATHER">Thời tiết</option>
                        <option value="ACTIVITY">Hoạt động</option>
                        <option value="PEOPLE">Mọi người</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 pt-2 md:justify-end">
                    <button type="button" onClick={cancelEdit} className="flex-1 md:flex-none md:w-24 py-2 text-sm font-semibold text-stone-700 bg-stone-200/50 rounded-lg hover:bg-stone-200 transition-colors">
                      Huỷ
                    </button>
                    <button 
                      type="submit" 
                      disabled={createMutation.isPending || updateMutation.isPending}
                      className="flex-1 md:flex-none md:w-32 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 flex justify-center transition-colors"
                    >
                      {createMutation.isPending || updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Lưu"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* List */}
          <div className="w-full">
            <h3 className="text-sm font-bold text-stone-800 uppercase tracking-wide mb-4">Danh sách hiện tại</h3>
            {isLoading ? (
              <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-orange-400" /></div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {tags.map((tag) => (
                  <div key={tag.id} className="flex items-center justify-between p-3 bg-stone-50 border border-stone-100 rounded-xl hover:border-stone-200 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="text-xl">
                        <Twemoji options={{ className: 'twemoji' }}>{tag.emoji}</Twemoji>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-stone-900">{tag.name}</p>
                        <p className="text-[10px] uppercase font-bold text-stone-500">{CATEGORY_MAP[tag.category] || tag.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button onClick={() => openEdit(tag)} className="p-1.5 text-stone-400 hover:text-blue-500 bg-white shadow-sm rounded-md border border-stone-200">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => { if (confirm("Bạn có chắc muốn xoá Tag này?")) deleteMutation.mutate(tag.id) }} className="p-1.5 text-stone-400 hover:text-red-500 bg-white shadow-sm rounded-md border border-stone-200">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
