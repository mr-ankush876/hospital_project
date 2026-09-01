package com.vitalsync.hms.controller;

import com.vitalsync.hms.dto.DepartmentDto;
import com.vitalsync.hms.dto.HospitalSettingDto;
import com.vitalsync.hms.dto.PublicBedStatsDto;
import com.vitalsync.hms.dto.PublicDoctorDto;
import com.vitalsync.hms.service.PublicService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicController {

    private final PublicService publicService;

    @GetMapping("/hospital-info")
    public ResponseEntity<HospitalSettingDto> getHospitalInfo() {
        return ResponseEntity.ok(publicService.getPublicHospitalInfo());
    }

    @GetMapping("/doctors")
    public ResponseEntity<List<PublicDoctorDto>> getDoctors() {
        return ResponseEntity.ok(publicService.getPublicDoctors());
    }

    @GetMapping("/doctors/{id}")
    public ResponseEntity<PublicDoctorDto> getDoctorById(@PathVariable Long id) {
        return ResponseEntity.ok(publicService.getPublicDoctorById(id));
    }

    @GetMapping("/departments")
    public ResponseEntity<List<DepartmentDto>> getDepartments() {
        return ResponseEntity.ok(publicService.getPublicDepartments());
    }

    @GetMapping("/beds/availability")
    public ResponseEntity<PublicBedStatsDto> getBedAvailability() {
        return ResponseEntity.ok(publicService.getPublicBedAvailability());
    }
}
