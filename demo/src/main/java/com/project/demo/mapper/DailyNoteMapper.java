package com.project.demo.mapper;

import com.project.demo.dto.request.DailyNoteRequest;
import com.project.demo.dto.response.DailyNoteResponse;
import com.project.demo.entity.DailyNote;
import com.project.demo.entity.Tag;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface DailyNoteMapper {

    @Mapping(target = "tags", ignore = true)
    @Mapping(target = "user", ignore = true)
    DailyNote toEntity(DailyNoteRequest request);

    DailyNoteResponse toResponse(DailyNote note);

    DailyNoteResponse.TagDto tagToTagDto(Tag tag);
}