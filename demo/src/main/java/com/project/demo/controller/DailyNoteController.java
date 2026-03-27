package com.project.demo.controller;

import com.project.demo.dto.request.DailyNoteRequest;
import com.project.demo.dto.request.DailyNoteUpdateRequest;
import com.project.demo.dto.response.CalendarNoteResponse;
import com.project.demo.dto.response.DailyNoteResponse;
import com.project.demo.dto.response.MonthlySummaryResponse;
import com.project.demo.service.DailyNoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notes")
@RequiredArgsConstructor
public class DailyNoteController {

    private final DailyNoteService dailyNoteService;

    /**
     * TẠO MỚI NHẬT KÝ
     * POST /api/notes
     */
    @PostMapping
    public ResponseEntity<DailyNoteResponse> createNote(
            @AuthenticationPrincipal Long userId, // Magic happens here! Spring tự động lấy userId từ JWT
            @RequestBody DailyNoteRequest request) {

        DailyNoteResponse response = dailyNoteService.createNote(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * CẬP NHẬT NHẬT KÝ (EDIT)
     * PUT /api/notes/{noteId}
     */
    @PutMapping("/{noteId}")
    public ResponseEntity<DailyNoteResponse> updateNote(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long noteId,
            @RequestBody DailyNoteUpdateRequest request) {

        DailyNoteResponse response = dailyNoteService.updateNote(userId, noteId, request);
        return ResponseEntity.ok(response);
    }

    /**
     * XEM CHI TIẾT 1 NGÀY NHẬT KÝ
     * GET /api/notes/{noteId}
     */
    @GetMapping("/{noteId}")
    public ResponseEntity<DailyNoteResponse> getNoteById(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long noteId) {

        DailyNoteResponse response = dailyNoteService.getNoteById(userId, noteId);
        return ResponseEntity.ok(response);
    }

    /**
     * LẤY DỮ LIỆU ĐỂ VẼ LỊCH (CALENDAR VIEW)
     * GET /api/notes/calendar?year=2026&month=3
     */
    @GetMapping("/calendar")
    public ResponseEntity<List<CalendarNoteResponse>> getCalendarNotes(
            @AuthenticationPrincipal Long userId,
            @RequestParam int year,
            @RequestParam int month) {

        List<CalendarNoteResponse> responses = dailyNoteService.getCalendarNotes(userId, year, month);
        return ResponseEntity.ok(responses);
    }

    /**
     * LẤY DỮ LIỆU ĐỂ VẼ BIỂU ĐỒ THỐNG KÊ (SUMMARY)
     * GET /api/notes/summary?year=2026&month=3
     */
    @GetMapping("/summary")
    public ResponseEntity<MonthlySummaryResponse> getMonthlySummary(
            @AuthenticationPrincipal Long userId,
            @RequestParam int year,
            @RequestParam int month) {

        MonthlySummaryResponse response = dailyNoteService.getMonthlySummary(userId, year, month);
        return ResponseEntity.ok(response);
    }
}