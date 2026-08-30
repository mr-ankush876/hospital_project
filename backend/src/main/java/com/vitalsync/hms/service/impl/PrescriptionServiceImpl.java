package com.vitalsync.hms.service.impl;

import com.vitalsync.hms.dto.DoctorDto;
import com.vitalsync.hms.dto.PatientDto;
import com.vitalsync.hms.dto.PrescriptionDto;
import com.vitalsync.hms.dto.PrescriptionMedicineDto;
import com.vitalsync.hms.entity.Doctor;
import com.vitalsync.hms.entity.Patient;
import com.vitalsync.hms.entity.Prescription;
import com.vitalsync.hms.entity.PrescriptionMedicine;
import com.vitalsync.hms.exception.BadRequestException;
import com.vitalsync.hms.exception.ResourceNotFoundException;
import com.vitalsync.hms.repository.DoctorRepository;
import com.vitalsync.hms.repository.PatientRepository;
import com.vitalsync.hms.repository.PrescriptionRepository;
import com.vitalsync.hms.service.PrescriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PrescriptionServiceImpl implements PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;

    @Override
    public List<PrescriptionDto> getAll(Long patientId, Long doctorId, LocalDate date, String search) {
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;

        return prescriptionRepository.filterPrescriptions(patientId, doctorId, date, cleanSearch)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    public PrescriptionDto getById(Long id) {
        Prescription prescription = prescriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found with ID: " + id));
        return mapToDto(prescription);
    }

    @Override
    @Transactional
    public PrescriptionDto create(PrescriptionDto dto) {
        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + dto.getPatientId()));

        Doctor doctor = doctorRepository.findById(dto.getDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with ID: " + dto.getDoctorId()));

        if (dto.getMedicines() == null || dto.getMedicines().isEmpty()) {
            throw new BadRequestException("A prescription must include at least one medication item");
        }

        Prescription prescription = new Prescription();
        prescription.setPatient(patient);
        prescription.setDoctor(doctor);
        prescription.setPrescriptionDate(dto.getPrescriptionDate() != null ? dto.getPrescriptionDate() : LocalDate.now());
        prescription.setSymptoms(dto.getSymptoms());
        prescription.setDiagnosis(dto.getDiagnosis());
        prescription.setInstructions(dto.getInstructions());
        prescription.setFollowUpDate(dto.getFollowUpDate());

        List<PrescriptionMedicine> medicines = new ArrayList<>();
        for (PrescriptionMedicineDto medDto : dto.getMedicines()) {
            if (medDto.getMedicineName() != null && !medDto.getMedicineName().trim().isEmpty()) {
                PrescriptionMedicine pm = new PrescriptionMedicine();
                pm.setMedicineName(medDto.getMedicineName().trim());
                pm.setDosage(medDto.getDosage() != null ? medDto.getDosage() : "1 Tab");
                pm.setFrequency(medDto.getFrequency() != null ? medDto.getFrequency() : "1-0-1");
                pm.setDuration(medDto.getDuration() != null ? medDto.getDuration() : "5 Days");
                medicines.add(pm);
            }
        }
        prescription.setMedicines(medicines);

        long count = prescriptionRepository.count();
        prescription.setPrescriptionCode(String.format("RX-%04d", 5000 + count + (System.currentTimeMillis() % 9000)));

        Prescription saved = prescriptionRepository.save(prescription);
        return mapToDto(saved);
    }

    @Override
    @Transactional
    public PrescriptionDto update(Long id, PrescriptionDto dto) {
        Prescription prescription = prescriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found with ID: " + id));

        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + dto.getPatientId()));

        Doctor doctor = doctorRepository.findById(dto.getDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with ID: " + dto.getDoctorId()));

        prescription.setPatient(patient);
        prescription.setDoctor(doctor);
        prescription.setPrescriptionDate(dto.getPrescriptionDate());
        prescription.setSymptoms(dto.getSymptoms());
        prescription.setDiagnosis(dto.getDiagnosis());
        prescription.setInstructions(dto.getInstructions());
        prescription.setFollowUpDate(dto.getFollowUpDate());

        if (dto.getMedicines() != null && !dto.getMedicines().isEmpty()) {
            prescription.getMedicines().clear();
            for (PrescriptionMedicineDto medDto : dto.getMedicines()) {
                if (medDto.getMedicineName() != null && !medDto.getMedicineName().trim().isEmpty()) {
                    PrescriptionMedicine pm = new PrescriptionMedicine();
                    pm.setMedicineName(medDto.getMedicineName().trim());
                    pm.setDosage(medDto.getDosage());
                    pm.setFrequency(medDto.getFrequency());
                    pm.setDuration(medDto.getDuration());
                    prescription.getMedicines().add(pm);
                }
            }
        }

        Prescription updated = prescriptionRepository.save(prescription);
        return mapToDto(updated);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Prescription prescription = prescriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found with ID: " + id));
        prescriptionRepository.delete(prescription);
    }

    private PrescriptionDto mapToDto(Prescription p) {
        Patient pat = p.getPatient();
        Doctor doc = p.getDoctor();

        PatientDto patientDto = (pat != null) ? PatientDto.builder()
                .id(pat.getId())
                .patientCode(pat.getPatientCode())
                .fullName(pat.getFullName())
                .phone(pat.getPhone())
                .gender(pat.getGender())
                .age(pat.getAge())
                .bloodGroup(pat.getBloodGroup())
                .build() : null;

        DoctorDto doctorDto = (doc != null) ? DoctorDto.builder()
                .id(doc.getId())
                .doctorCode(doc.getDoctorCode())
                .fullName(doc.getFullName())
                .specialization(doc.getSpecialization())
                .qualification(doc.getQualification())
                .build() : null;

        List<PrescriptionMedicineDto> medDtos = (p.getMedicines() != null) ? p.getMedicines().stream()
                .map(m -> PrescriptionMedicineDto.builder()
                        .id(m.getId())
                        .medicineName(m.getMedicineName())
                        .dosage(m.getDosage())
                        .frequency(m.getFrequency())
                        .duration(m.getDuration())
                        .build())
                .collect(Collectors.toList()) : new ArrayList<>();

        return PrescriptionDto.builder()
                .id(p.getId())
                .prescriptionCode(p.getPrescriptionCode())
                .patientId(pat != null ? pat.getId() : null)
                .patientName(pat != null ? pat.getFullName() : null)
                .patientCode(pat != null ? pat.getPatientCode() : null)
                .patient(patientDto)
                .doctorId(doc != null ? doc.getId() : null)
                .doctorName(doc != null ? doc.getFullName() : null)
                .doctor(doctorDto)
                .prescriptionDate(p.getPrescriptionDate())
                .symptoms(p.getSymptoms())
                .diagnosis(p.getDiagnosis())
                .instructions(p.getInstructions())
                .followUpDate(p.getFollowUpDate())
                .medicines(medDtos)
                .createdAt(p.getCreatedAt())
                .build();
    }
}
