package com.project.demo.service;

import com.project.demo.dto.request.DailyNoteRequest;
import com.project.demo.dto.request.DailyNoteUpdateRequest;
import com.project.demo.dto.response.CalendarNoteResponse;
import com.project.demo.dto.response.DailyNoteResponse;
import com.project.demo.dto.response.MonthlySummaryResponse;

import java.util.List;

public interface DailyNoteService {
    DailyNoteResponse createNote(Long userId, DailyNoteRequest request);
    DailyNoteResponse updateNote(Long userId, Long noteId, DailyNoteUpdateRequest request);
    DailyNoteResponse getNoteById(Long userId, Long noteId);
    List<CalendarNoteResponse> getCalendarNotes(Long userId, int year, int month);
    MonthlySummaryResponse getMonthlySummary(Long userId, int year, int month);
}