"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isAfter,
  startOfDay,
} from "date-fns";
import { ChevronLeft, ChevronRight, Loader2, LogOut, Calendar as CalendarIcon, BarChart2, Settings } from "lucide-react";
import NoteModal from "@/components/NoteModal";
import Twemoji from "react-twemoji";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from "recharts";
import TagManagerModal from "@/components/TagManagerModal";

type CalendarNote = {
  id: number;
  recordDate: string; // YYYY-MM-DD
  rate: number;
  emojis: string[];
};

export default function HomePage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"calendar" | "stats">("calendar");
  const [userRole, setUserRole] = useState<string>("USER");
  const queryClient = useQueryClient();

  useEffect(() => {
    let isExpired = false;
    const token = localStorage.getItem("token");

    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          isExpired = true;
        }
        if (payload.role) {
          localStorage.setItem("role", payload.role);
          setUserRole(payload.role);
        }
      } catch (e) {
        isExpired = true;
      }
    }

    if (!token || isExpired) {
      if (isExpired) {
        sessionStorage.setItem('sessionExpired', 'true');
      }
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      localStorage.removeItem("username");
      localStorage.removeItem("role");
      queryClient.clear();
      router.push("/login");
    } else {
      setIsAuthenticated(true);
      const role = localStorage.getItem("role");
      if (role) setUserRole(role);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    queryClient.clear();
    router.push("/login");
  };

  const year = format(currentDate, "yyyy");
  const month = format(currentDate, "M"); // 1-12

  // Call API based on current year and month
  const { data: notes = [], isLoading } = useQuery<CalendarNote[]>({
    queryKey: ["calendar-notes", year, month],
    enabled: isAuthenticated,
    queryFn: async () => {
      const response = await api.get(`/api/notes/calendar?year=${year}&month=${month}`);
      return response.data || [];
    },
  });

  const { data: summary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ["monthly-summary", year, month],
    enabled: isAuthenticated && viewMode === "stats",
    queryFn: async () => {
      const response = await api.get(`/api/notes/summary?year=${year}&month=${month}`);
      return response.data;
    },
  });

  const { data: tags = [] } = useQuery({
    queryKey: ["tags"],
    enabled: isAuthenticated && viewMode === "stats",
    queryFn: async () => {
      const response = await api.get("/api/tags");
      return response.data || [];
    },
  });

  const getEmojiForTagName = (name: string) => {
    const tag = tags.find((t: any) => t.name === name);
    return tag ? tag.emoji : null;
  };

  const CustomYAxisTick = (props: any) => {
    const { x, y, payload } = props;
    const emoji = getEmojiForTagName(payload.value);

    if (!emoji) {
      return (
        <text x={x} y={y} dy={4} textAnchor="end" fill="#78716c" fontSize={13} fontWeight={500}>
          {payload.value}
        </text>
      );
    }

    return (
      <foreignObject x={x - 32} y={y - 12} width={24} height={24}>
        <div className="flex items-center justify-end w-full h-full text-base" title={payload.value}>
          <Twemoji options={{ className: 'twemoji' }}>{emoji}</Twemoji>
        </div>
      </foreignObject>
    );
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  // Calendar grid logic
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  
  // Lịch bắt đầu từ Thứ 2 (weekStartsOn: 1)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  // Lịch kết thúc vào Chủ nhật tương ứng
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const getNoteForDate = (day: Date) => {
    if (!notes || notes.length === 0) return null;
    const formattedDate = format(day, "yyyy-MM-dd");
    return notes.find((note) => note.recordDate === formattedDate);
  };

  const handleDateClick = (day: Date) => {
    if (isAfter(startOfDay(day), startOfDay(new Date()))) {
      return;
    }
    setSelectedDate(day);
    const note = getNoteForDate(day);
    setSelectedNoteId(note ? note.id : null);
    setIsModalOpen(true);
  };

  const renderStats = () => {
    if (isLoadingSummary) {
      return (
        <div className="flex items-center justify-center py-32 bg-white rounded-[2rem] border border-orange-50/50 shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
        </div>
      );
    }

    // Line Chart Data
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const lineChartData = daysInMonth.map((day) => {
      const note = getNoteForDate(day);
      return {
        date: format(day, "dd/MM"),
        rate: note && note.rate ? note.rate : null,
      };
    });

    // Pie Chart Data
    const pieChartData = [
      { name: "Rất tệ (1)", value: 0, fill: "#f87171" }, // red-400
      { name: "Tệ (2)", value: 0, fill: "#fb923c" },     // orange-400
      { name: "Bình thường (3)", value: 0, fill: "#facc15" },// yellow-400
      { name: "Tốt (4)", value: 0, fill: "#a3e635" },    // lime-400
      { name: "Tuyệt vời (5)", value: 0, fill: "#34d399" }, // emerald-400
    ];
    let hasNotes = false;
    notes.forEach((note) => {
      if (note.rate >= 1 && note.rate <= 5) {
        pieChartData[note.rate - 1].value++;
        hasNotes = true;
      }
    });

    // Bar Chart Tag Data
    const tagData = summary?.tagCounts
      ? Object.entries(summary.tagCounts)
          .map(([name, count]) => ({ name, count: Number(count) }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
      : [];

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-6 flex flex-col justify-center items-center">
            <h3 className="text-stone-500 font-medium text-sm uppercase tracking-wide">Số ngày ghi chép</h3>
            <p className="text-4xl font-bold text-stone-800 mt-2">{summary?.totalNotes || 0} <span className="text-lg text-stone-400 font-normal">ngày</span></p>
          </div>
          <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-6 flex flex-col justify-center items-center">
            <h3 className="text-stone-500 font-medium text-sm uppercase tracking-wide">Điểm trung bình</h3>
            <p className="text-4xl font-bold text-orange-500 mt-2">{summary?.averageRate ? summary.averageRate.toFixed(1) : "-"} </p>
          </div>
          <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-6 flex flex-col justify-center items-center">
            <h3 className="text-stone-500 font-medium text-sm uppercase tracking-wide">Tag yêu thích</h3>
            <div className="mt-2 flex items-center justify-center">
              {tagData.length > 0 ? (
                getEmojiForTagName(tagData[0].name) ? (
                  <div className="text-4xl" title={tagData[0].name}>
                    <Twemoji options={{ className: 'twemoji' }}>{getEmojiForTagName(tagData[0].name)}</Twemoji>
                  </div>
                ) : (
                  <p className="text-2xl font-bold text-blue-500 truncate max-w-full">{tagData[0].name}</p>
                )
              ) : (
                <p className="text-2xl font-bold text-stone-300">Chưa có</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-[2rem] shadow-sm border border-stone-100 p-6 lg:p-8">
            <h3 className="text-xl font-bold text-stone-800 mb-6">Biến động cảm xúc</h3>
            {!hasNotes ? (
              <p className="text-stone-400 text-center py-20">Chưa có dữ liệu tháng này</p>
            ) : (
              <div className="h-64 sm:h-80 w-full min-w-0">
                <ResponsiveContainer width="99%" height="100%" minWidth={0}>
                  <LineChart data={lineChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                    <XAxis dataKey="date" tick={{ fill: "#a8a29e", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[1, 5]} ticks={[1,2,3,4,5]} tick={{ fill: "#a8a29e", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', padding: '12px' }}
                      itemStyle={{ color: '#fb923c', fontWeight: 'bold' }}
                    />
                    <Line type="monotone" dataKey="rate" stroke="#fb923c" strokeWidth={3} dot={{ r: 4, fill: "#fb923c", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="bg-white rounded-[2rem] shadow-sm border border-stone-100 p-6 lg:p-8">
            <h3 className="text-xl font-bold text-stone-800 mb-6">Tỉ lệ cảm xúc</h3>
            {!hasNotes ? (
              <p className="text-stone-400 text-center py-20">Chưa có dữ liệu tháng này</p>
            ) : (
              <div className="h-64 sm:h-80 w-full min-w-0">
                <ResponsiveContainer width="99%" height="100%" minWidth={0}>
                  <PieChart>
                    <Pie
                      data={pieChartData.filter(d => d.value > 0)}
                      cx="50%"
                      cy="45%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieChartData.filter(d => d.value > 0).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36} 
                      iconType="circle" 
                      wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {tagData.length > 0 && (
          <div className="bg-white rounded-[2rem] shadow-sm border border-stone-100 p-6 lg:p-8">
            <h3 className="text-xl font-bold text-stone-800 mb-6">Tần suất sử dụng Tag</h3>
            <div className="h-64 sm:h-80 w-full min-w-0">
              <ResponsiveContainer width="99%" height="100%" minWidth={0}>
                <BarChart data={tagData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f5f5f4" />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" tick={<CustomYAxisTick />} axisLine={false} tickLine={false} width={60} />
                  <RechartsTooltip 
                    cursor={{fill: '#f5f5f4'}}
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="count" fill="#93c5fd" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    );
  };

  const weekDays = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fdfbf7]">
        <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfbf7] p-4 sm:p-8">
      <div className="max-w-4xl mx-auto mt-4">
        <header className="flex items-center justify-between mb-8 flex-col lg:flex-row gap-4">
          <div>
            <h1 className="text-3xl font-bold text-stone-800 tracking-tight">Daily Note</h1>
            <p className="text-stone-500 mt-2 text-sm font-medium">Theo dõi cảm xúc của bạn từng ngày</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">

            {/* View Mode Toggle */}
            <div className="flex items-center bg-stone-100 p-1 rounded-full border border-stone-200/50">
              <button
                onClick={() => setViewMode("calendar")}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  viewMode === "calendar" ? "bg-white text-stone-800 shadow-sm" : "text-stone-500 hover:text-stone-700"
                }`}
              >
                <CalendarIcon className="w-4 h-4" />
                <span>Lịch</span>
              </button>
              <button
                onClick={() => setViewMode("stats")}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  viewMode === "stats" ? "bg-white text-stone-800 shadow-sm" : "text-stone-500 hover:text-stone-700"
                }`}
              >
                <BarChart2 className="w-4 h-4" />
                <span>Thống kê</span>
              </button>
            </div>

            <div className="flex items-center space-x-4 bg-white px-5 py-2.5 rounded-full shadow-sm border border-orange-100/40">
              <button 
              onClick={prevMonth}
              className="p-1.5 hover:bg-orange-50 text-stone-400 hover:text-orange-500 rounded-full transition-colors focus:ring-2 focus:ring-orange-200 outline-none"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-lg font-semibold text-stone-700 min-w-[130px] text-center">
              Tháng {format(currentDate, "M, yyyy")}
            </span>
              <button 
              onClick={nextMonth}
              className="p-1.5 hover:bg-orange-50 text-stone-400 hover:text-orange-500 rounded-full transition-colors focus:ring-2 focus:ring-orange-200 outline-none"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            </div>

            {/* Settings Menu */}
            <div className="relative">
              <button
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className="flex items-center justify-center p-2.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-full transition-colors outline-none focus:ring-2 focus:ring-stone-200"
                title="Cài đặt"
              >
                <Settings className="w-5 h-5" />
              </button>

              {isSettingsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsSettingsOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-lg border border-stone-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    {userRole === "ADMIN" && (
                      <button
                        onClick={() => { setIsSettingsOpen(false); setIsTagManagerOpen(true); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 hover:text-stone-900 transition-colors flex items-center space-x-3"
                      >
                        <Settings className="w-4 h-4 text-stone-500" />
                        <span className="font-medium">Quản lý Tag</span>
                      </button>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors flex items-center space-x-3"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="font-medium">Đăng xuất</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {viewMode === "stats" ? (
          renderStats()
        ) : (
          <div className="bg-white rounded-[2rem] shadow-sm border border-orange-50/50 p-6 sm:p-8 mb-8">
            {/* Header các thứ trong tuần */}
            <div className="grid grid-cols-7 gap-2 sm:gap-4 mb-4">
              {weekDays.map((day) => (
                <div key={day} className="text-center font-semibold text-stone-400 text-xs sm:text-sm uppercase tracking-wider">
                  {day}
                </div>
              ))}
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-32">
                <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-2 sm:gap-4 lg:gap-5">
                {days.map((day, idx) => {
                  const note = getNoteForDate(day);
                  const isCurrentMonth = isSameMonth(day, monthStart);
                  const isTodayDate = isToday(day);
                  const isFutureDate = isAfter(startOfDay(day), startOfDay(new Date()));

                  return (
                    <div
                      key={day.toString()}
                      onClick={() => handleDateClick(day)}
                      className={`
                        aspect-square rounded-[1.25rem] p-2 flex flex-col items-center justify-between relative border-2 transition-all duration-200 group
                        ${isFutureDate ? "cursor-not-allowed opacity-30 bg-stone-50" : "cursor-pointer hover:-translate-y-1 hover:shadow-md"}
                        ${!isCurrentMonth && !isFutureDate ? "opacity-40" : ""}
                        ${!isFutureDate && note?.rate === 1 ? "bg-red-50/60 hover:bg-red-100 border-red-100" :
                          !isFutureDate && note?.rate === 2 ? "bg-orange-50/60 hover:bg-orange-100 border-orange-100" :
                          !isFutureDate && note?.rate === 3 ? "bg-yellow-50/60 hover:bg-yellow-100 border-yellow-100" :
                          !isFutureDate && note?.rate === 4 ? "bg-lime-50/60 hover:bg-lime-100 border-lime-100" :
                          !isFutureDate && note?.rate === 5 ? "bg-emerald-50/60 hover:bg-emerald-100 border-emerald-100" :
                          !isFutureDate && isTodayDate 
                          ? "border-stone-200 shadow-[0_4px_12px_rgba(168,162,158,0.15)] bg-stone-100 hover:bg-stone-200" 
                          : !isFutureDate ? "bg-transparent border-transparent hover:border-stone-200 hover:bg-stone-50/50" : "border-transparent"}
                      `}
                    >
                      <span 
                        className={`text-sm sm:text-base font-semibold mt-1 transition-colors
                        ${isTodayDate && !note ? "text-stone-800" : (isCurrentMonth ? "text-stone-600" : "text-stone-400")}
                        ${note ? "group-hover:text-stone-800" : "group-hover:text-orange-600"}
                        `}
                      >
                        {format(day, "d")}
                      </span>

                      {/* Vùng hiển thị Icon tĩnh */}
                    <div className="flex-1 flex items-center justify-center mb-1">
                      {note && note.emojis && note.emojis.length > 0 && (
                        <div 
                          key={note.emojis[0]} 
                          className="flex animate-in zoom-in duration-300 text-xl sm:text-2xl"
                        >
                          <Twemoji options={{ className: 'twemoji' }}>
                            {note.emojis[0]}
                          </Twemoji>
                        </div>
                      )}
                    </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <NoteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedDate={selectedDate || new Date()}
        noteId={selectedNoteId}
      />
      <TagManagerModal
        isOpen={isTagManagerOpen}
        onClose={() => setIsTagManagerOpen(false)}
      />
    </div>
  );
}
