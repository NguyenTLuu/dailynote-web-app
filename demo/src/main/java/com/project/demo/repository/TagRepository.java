package com.project.demo.repository;

import com.project.demo.entity.Tag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TagRepository extends JpaRepository<Tag, Long> {
    // Không cần viết thêm gì, JpaRepository đã có sẵn:
    // findAll(), findById(), save(), deleteAllById() v.v...
}