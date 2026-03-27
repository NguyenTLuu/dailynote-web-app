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

    @GetMapping
    public ResponseEntity<List<Tag>> getAllTags() {
        return ResponseEntity.ok(tagRepository.findAll());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Tag> createTag(@RequestBody TagRequest request) {

        Tag newTag = new Tag();
        newTag.setName(request.getName());
        newTag.setCategory(request.getCategory().toUpperCase());
        newTag.setEmoji(request.getEmoji());

        Tag savedTag = tagRepository.save(newTag);
        return ResponseEntity.ok(savedTag);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Tag> updateTag(
            @PathVariable Long id,
            @RequestBody TagRequest request) {

        Tag existingTag = tagRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy Tag với ID này"));

        existingTag.setName(request.getName());
        existingTag.setCategory(request.getCategory().toUpperCase());
        existingTag.setEmoji(request.getEmoji());

        Tag updatedTag = tagRepository.save(existingTag);
        return ResponseEntity.ok(updatedTag);
    }


    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteTag(@PathVariable Long id) {
        try {
            tagRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            throw new IllegalArgumentException("Không thể xoá Tag này vì nó đang được dùng trong các ghi chú cũ!");
        }
    }
}