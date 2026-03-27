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
        if (dailyNoteRepository.existsByUserIdAndRecordDate(userId, request.getRecordDate())) {
            throw new IllegalArgumentException("Bạn đã viết nhật ký cho ngày này rồi!");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User không tồn tại"));

        DailyNote note = dailyNoteMapper.toEntity(request);
        note.setUser(user);

        if (request.getTagIds() != null && !request.getTagIds().isEmpty()) {
            List<Tag> tags = tagRepository.findAllById(request.getTagIds());
            note.setTags(new HashSet<>(tags));
        }

        DailyNote savedNote = dailyNoteRepository.save(note);

        if (request.getNoteText() != null && !request.getNoteText().isEmpty()) {

            List<String> tagNames = savedNote.getTags().stream()
                    .map(Tag::getName)
                    .collect(Collectors.toList());

            String advice = aiAdviceService.generateAdvice(request.getRate(), request.getNoteText(), tagNames);

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

        note.setRate(request.getRate());
        note.setNoteText(request.getNoteText());

        if (request.getTagIds() != null) {
            List<Tag> newTags = tagRepository.findAllById(request.getTagIds());
            note.setTags(new HashSet<>(newTags));
        }

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

        return notes.stream().map(note -> {
            CalendarNoteResponse res = new CalendarNoteResponse();
            res.setId(note.getId());
            res.setRecordDate(note.getRecordDate());
            res.setRate(note.getRate());

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

        List<DailyNote> notes = dailyNoteRepository.findByUserIdAndRecordDateBetweenOrderByRecordDateAsc(userId, startDate, endDate);

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