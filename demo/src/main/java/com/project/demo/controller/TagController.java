package com.project.demo.controller;

import com.project.demo.dto.request.TagRequest;
import com.project.demo.entity.Tag;
import com.project.demo.repository.TagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tags")
@RequiredArgsConstructor
public class TagController {

    private final TagRepository tagRepository;

    /**
     * LẤY DANH SÁCH TẤT CẢ CÁC ICON (TAGS)
     * GET /api/tags
     */
    @GetMapping
    public ResponseEntity<List<Tag>> getAllTags() {
        return ResponseEntity.ok(tagRepository.findAll());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')") // Phép thuật chặn cửa những ai không phải ADMIN
    public ResponseEntity<Tag> createTag(@RequestBody TagRequest request) {

        // Không cần check Category, vì Frontend gửi lên Category mới thì DB sẽ tự lưu thành nhóm mới luôn
        Tag newTag = new Tag();
        newTag.setName(request.getName());
        newTag.setCategory(request.getCategory().toUpperCase()); // Viết hoa cho đồng bộ chuẩn
        newTag.setEmoji(request.getEmoji());

        Tag savedTag = tagRepository.save(newTag);
        return ResponseEntity.ok(savedTag);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')") // Vẫn giữ bùa bảo vệ này
    public ResponseEntity<Tag> updateTag(
            @PathVariable Long id,
            @RequestBody TagRequest request) {

        // 1. Tìm xem Tag có tồn tại trong Database không
        Tag existingTag = tagRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy Tag với ID này"));

        // 2. Cập nhật các trường dữ liệu
        existingTag.setName(request.getName());
        existingTag.setCategory(request.getCategory().toUpperCase()); // Giữ category luôn viết hoa
        existingTag.setEmoji(request.getEmoji());

        // 3. Lưu lại vào Database
        Tag updatedTag = tagRepository.save(existingTag);
        return ResponseEntity.ok(updatedTag);
    }

    /**
     * XOÁ TAG
     * DELETE /api/tags/{id}
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteTag(@PathVariable Long id) {
        try {
            tagRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            // Lỗi foreign key do Tag đang được nhắc đến trong bài viết
            throw new IllegalArgumentException("Không thể xoá Tag này vì nó đang được dùng trong các ghi chú cũ!");
        }
    }
}