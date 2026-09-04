package com.vitalsync.hms.service;

import com.vitalsync.hms.dto.CreateNurseRequest;
import com.vitalsync.hms.dto.NurseDto;
import com.vitalsync.hms.dto.UpdateNurseRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface NurseService {

    List<NurseDto> getAllNurses(Long departmentId, String status, String shift, String search);

    Page<NurseDto> getAllNursesPaged(Long departmentId, String status, String shift, String search, Pageable pageable);

    NurseDto getNurseById(Long id);

    NurseDto createNurse(CreateNurseRequest request, String adminUsername);

    NurseDto updateNurse(Long id, UpdateNurseRequest request, String adminUsername);

    NurseDto updateNurseStatus(Long id, String status, String adminUsername);

    void deleteNurse(Long id, String adminUsername);
}
