package com.project.demo.service.impl;

import com.project.demo.dto.request.DailyNoteRequest;
import com.project.demo.dto.request.DailyNoteUpdateRequest;
import com.project.demo.dto.response.CalendarNoteResponse;
import com.project.demo.dto.response.DailyNoteResponse;
import com.project.demo.dto.response.MonthlySummaryResponse;
import com.project.demo.entity.DailyNote;
import com.project.demo.entity.Tag;
import com.project.demo.entity.User;
import com.project.demo.mapper.DailyNoteMapper;
import com.project.demo.repository.DailyNoteRepository;
import com.project.demo.repository.TagRepository;
import com.project.demo.repository.UserRepository;
import com.project.demo.service.AiAdviceService;
import com.project.demo.service.DailyNoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DailyNoteServiceImpl implements DailyNoteService {

    private final DailyNoteRepository dailyNoteRepository;
    private final TagRepository tagRepository;
    private final UserRepository userRepository;
    private final DailyNoteMapper dailyNoteMapper;
    private final AiAdviceService aiAdviceService; // Gọi AI Service

    @Override
    @Transactional
    public DailyNoteResponse createNote(Long userId, DailyNoteRequest request) {
        // 1. Kiểm tra xem ngày này đã viết nhật ký chưa
        if (dailyNoteRepository.existsByUserIdAndRecordDate(userId, request.getRecordDate())) {
            throw new IllegalArgumentException("Bạn đã viết nhật ký cho ngày này rồi!");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User không tồn tại"));

        // 2. Map từ Request sang Entity
        DailyNote note = dailyNoteMapper.toEntity(request);
        note.setUser(user);

        // 3. Lấy danh sách Tag từ Database dựa trên list ID gửi lên
        if (request.getTagIds() != null && !request.getTagIds().isEmpty()) {
            List<Tag> tags = tagRepository.findAllById(request.getTagIds());
            note.setTags(new HashSet<>(tags));
        }

        // 4. Lưu vào Database lần 1 (để có ID)
        DailyNote savedNote = dailyNoteRepository.save(note);

        // 5. Xin lời khuyên từ Gemini và tự lưu vào DB
        if (request.getNoteText() != null && !request.getNoteText().isEmpty()) {

            // Lôi tên các Tag ra (VD: "Trời mưa", "Buồn bã") để ghim vào phong bì gửi cho Gemini
            List<String> tagNames = savedNote.getTags().stream()
                    .map(Tag::getName)
                    .collect(Collectors.toList());

            // Nhận kết quả từ chuyên gia (Trả về một chuỗi String)
            String advice = aiAdviceService.generateAdvice(request.getRate(), request.getNoteText(), tagNames);

            // Tự tay nhét lời khuyên đó vào entity và update DB lần 2
            // LƯU Ý: Nếu trong file DailyNote.java bạn đặt tên trường khác thì hãy đổi chữ setAiAdvice cho khớp nhé!
            savedNote.setAiAdvice(advice);
            dailyNoteRepository.save(savedNote);
        }

        return dailyNoteMapper.toResponse(savedNote);
    }

    @Override
    @Transactional
    public DailyNoteResponse updateNote(Long userId, Long noteId, DailyNoteUpdateRequest request) {
        DailyNote note = dailyNoteRepository.findByIdAndUserId(noteId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy nhật ký"));

        // Cập nhật các trường
        note.setRate(request.getRate());
        note.setNoteText(request.getNoteText());

        // Cập nhật Tags nếu có thay đổi
        if (request.getTagIds() != null) {
            List<Tag> newTags = tagRepository.findAllById(request.getTagIds());
            note.setTags(new HashSet<>(newTags));
        }

        // Xin lời khuyên tự động mới từ Gemini mỗi khi cập nhật lại Ghi chú
        if (request.getNoteText() != null && !request.getNoteText().isEmpty()) {
            List<String> tagNames = note.getTags().stream()
                    .map(Tag::getName)
                    .collect(Collectors.toList());

            String advice = aiAdviceService.generateAdvice(request.getRate(), request.getNoteText(), tagNames);
            note.setAiAdvice(advice);
        }

        DailyNote updatedNote = dailyNoteRepository.save(note);
        return dailyNoteMapper.toResponse(updatedNote);
    }

    @Override
    public DailyNoteResponse getNoteById(Long userId, Long noteId) {
        DailyNote note = dailyNoteRepository.findByIdAndUserId(noteId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy nhật ký"));
        return dailyNoteMapper.toResponse(note);
    }

    @Override
    public List<CalendarNoteResponse> getCalendarNotes(Long userId, int year, int month) {
        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDate startDate = yearMonth.atDay(1);
        LocalDate endDate = yearMonth.atEndOfMonth();

        List<DailyNote> notes = dailyNoteRepository.findByUserIdAndRecordDateBetweenOrderByRecordDateAsc(userId, startDate, endDate);

        // Chuyển đổi Entity sang CalendarNoteResponse bằng Java Stream
        return notes.stream().map(note -> {
            CalendarNoteResponse res = new CalendarNoteResponse();
            res.setId(note.getId());
            res.setRecordDate(note.getRecordDate());
            res.setRate(note.getRate());

            // Lấy danh sách Emoji từ các Tag
            List<String> emojis = note.getTags().stream()
                    .map(Tag::getEmoji)
                    .collect(Collectors.toList());
            res.setEmojis(emojis);

            return res;
        }).collect(Collectors.toList());
    }

    @Override
    public MonthlySummaryResponse getMonthlySummary(Long userId, int year, int month) {
        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDate startDate = yearMonth.atDay(1);
        LocalDate endDate = yearMonth.atEndOfMonth();

        Integer totalNotes = dailyNoteRepository.countNotesByDateRange(userId, startDate, endDate);
        Double averageRate = dailyNoteRepository.getAverageRateByDateRange(userId, startDate, endDate);

        // Lấy danh sách notes để đếm các Tag dùng cho biểu đồ Pie Chart
        List<DailyNote> notes = dailyNoteRepository.findByUserIdAndRecordDateBetweenOrderByRecordDateAsc(userId, startDate, endDate);

        // Nhóm và đếm số lượng mỗi tag name xuất hiện trong tháng
        Map<String, Long> tagCounts = notes.stream()
                .flatMap(note -> note.getTags().stream())
                .collect(Collectors.groupingBy(Tag::getName, Collectors.counting()));

        return MonthlySummaryResponse.builder()
                .month(year + "-" + String.format("%02d", month))
                .totalNotes(totalNotes != null ? totalNotes : 0)
                .averageRate(averageRate != null ? Math.round(averageRate * 10.0) / 10.0 : 0.0)
                .tagCounts(tagCounts)
                .build();
    }
}