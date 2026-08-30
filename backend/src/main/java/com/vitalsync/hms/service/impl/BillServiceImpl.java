package com.vitalsync.hms.service.impl;

import com.vitalsync.hms.dto.BillDto;
import com.vitalsync.hms.dto.DoctorDto;
import com.vitalsync.hms.dto.PatientDto;
import com.vitalsync.hms.entity.Bill;
import com.vitalsync.hms.entity.Doctor;
import com.vitalsync.hms.entity.Patient;
import com.vitalsync.hms.exception.BadRequestException;
import com.vitalsync.hms.exception.ResourceNotFoundException;
import com.vitalsync.hms.repository.BillRepository;
import com.vitalsync.hms.repository.DoctorRepository;
import com.vitalsync.hms.repository.PatientRepository;
import com.vitalsync.hms.service.BillService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Year;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BillServiceImpl implements BillService {

    private final BillRepository billRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;

    private static final List<String> VALID_PAYMENT_STATUSES = Arrays.asList(
            "Pending", "Paid", "Partially Paid", "Cancelled"
    );

    @Override
    public List<BillDto> getAll(Long patientId, String status, LocalDate date, String search) {
        String cleanStatus = (status != null && !status.trim().isEmpty()) ? status.trim() : null;
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;

        return billRepository.filterBills(patientId, cleanStatus, date, cleanSearch)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    public BillDto getById(Long id) {
        Bill bill = billRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found with ID: " + id));
        return mapToDto(bill);
    }

    @Override
    @Transactional
    public BillDto create(BillDto dto) {
        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + dto.getPatientId()));

        Doctor doctor = null;
        if (dto.getDoctorId() != null) {
            doctor = doctorRepository.findById(dto.getDoctorId()).orElse(null);
        }

        BigDecimal consultationFee = dto.getConsultationFee() != null ? dto.getConsultationFee() : BigDecimal.ZERO;
        BigDecimal medicineCharges = dto.getMedicineCharges() != null ? dto.getMedicineCharges() : BigDecimal.ZERO;
        BigDecimal otherCharges = dto.getOtherCharges() != null ? dto.getOtherCharges() : BigDecimal.ZERO;
        BigDecimal discount = dto.getDiscount() != null ? dto.getDiscount() : BigDecimal.ZERO;
        BigDecimal tax = dto.getTax() != null ? dto.getTax() : BigDecimal.ZERO;

        // Authoritative Backend Financial Calculation:
        // subtotal = consultationFee + medicineCharges + otherCharges
        // taxableAmount = max(0, subtotal - discount)
        // totalAmount = taxableAmount + tax
        BigDecimal subtotal = consultationFee.add(medicineCharges).add(otherCharges);
        BigDecimal taxableAmount = subtotal.subtract(discount).max(BigDecimal.ZERO);
        BigDecimal totalAmount = taxableAmount.add(tax);

        Bill bill = new Bill();
        bill.setPatient(patient);
        bill.setDoctor(doctor);
        bill.setBillDate(dto.getBillDate() != null ? dto.getBillDate() : LocalDate.now());
        bill.setConsultationFee(consultationFee);
        bill.setMedicineCharges(medicineCharges);
        bill.setOtherCharges(otherCharges);
        bill.setDiscount(discount);
        bill.setTax(tax);
        bill.setTotalAmount(totalAmount);
        bill.setPaymentMethod(dto.getPaymentMethod() != null ? dto.getPaymentMethod() : "Cash");

        String status = (dto.getPaymentStatus() != null && VALID_PAYMENT_STATUSES.contains(dto.getPaymentStatus()))
                ? dto.getPaymentStatus() : "Pending";
        bill.setPaymentStatus(status);

        long count = billRepository.count();
        int currentYear = Year.now().getValue();
        bill.setBillCode(String.format("INV-%d-%04d", currentYear, 2000 + count + (System.currentTimeMillis() % 8000)));

        Bill saved = billRepository.save(bill);
        return mapToDto(saved);
    }

    @Override
    @Transactional
    public BillDto update(Long id, BillDto dto) {
        Bill bill = billRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found with ID: " + id));

        if (dto.getPatientId() != null) {
            Patient patient = patientRepository.findById(dto.getPatientId())
                    .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + dto.getPatientId()));
            bill.setPatient(patient);
        }

        if (dto.getDoctorId() != null) {
            Doctor doctor = doctorRepository.findById(dto.getDoctorId()).orElse(null);
            bill.setDoctor(doctor);
        }

        BigDecimal consultationFee = dto.getConsultationFee() != null ? dto.getConsultationFee() : bill.getConsultationFee();
        BigDecimal medicineCharges = dto.getMedicineCharges() != null ? dto.getMedicineCharges() : bill.getMedicineCharges();
        BigDecimal otherCharges = dto.getOtherCharges() != null ? dto.getOtherCharges() : bill.getOtherCharges();
        BigDecimal discount = dto.getDiscount() != null ? dto.getDiscount() : bill.getDiscount();
        BigDecimal tax = dto.getTax() != null ? dto.getTax() : bill.getTax();

        BigDecimal subtotal = consultationFee.add(medicineCharges).add(otherCharges);
        BigDecimal taxableAmount = subtotal.subtract(discount).max(BigDecimal.ZERO);
        BigDecimal totalAmount = taxableAmount.add(tax);

        bill.setConsultationFee(consultationFee);
        bill.setMedicineCharges(medicineCharges);
        bill.setOtherCharges(otherCharges);
        bill.setDiscount(discount);
        bill.setTax(tax);
        bill.setTotalAmount(totalAmount);

        if (dto.getBillDate() != null) bill.setBillDate(dto.getBillDate());
        if (dto.getPaymentMethod() != null) bill.setPaymentMethod(dto.getPaymentMethod());
        if (dto.getPaymentStatus() != null && VALID_PAYMENT_STATUSES.contains(dto.getPaymentStatus())) {
            bill.setPaymentStatus(dto.getPaymentStatus());
        }

        Bill updated = billRepository.save(bill);
        return mapToDto(updated);
    }

    @Override
    @Transactional
    public BillDto updateStatus(Long id, String status, String paymentMethod) {
        Bill bill = billRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found with ID: " + id));

        if (!VALID_PAYMENT_STATUSES.contains(status)) {
            throw new BadRequestException("Invalid payment status: " + status + ". Allowed: " + VALID_PAYMENT_STATUSES);
        }

        bill.setPaymentStatus(status);
        if (paymentMethod != null && !paymentMethod.trim().isEmpty()) {
            bill.setPaymentMethod(paymentMethod);
        }

        Bill updated = billRepository.save(bill);
        return mapToDto(updated);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Bill bill = billRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found with ID: " + id));
        billRepository.delete(bill);
    }

    private BillDto mapToDto(Bill b) {
        Patient pat = b.getPatient();
        Doctor doc = b.getDoctor();

        PatientDto patientDto = (pat != null) ? PatientDto.builder()
                .id(pat.getId())
                .patientCode(pat.getPatientCode())
                .fullName(pat.getFullName())
                .phone(pat.getPhone())
                .address(pat.getAddress())
                .build() : null;

        DoctorDto doctorDto = (doc != null) ? DoctorDto.builder()
                .id(doc.getId())
                .doctorCode(doc.getDoctorCode())
                .fullName(doc.getFullName())
                .specialization(doc.getSpecialization())
                .build() : null;

        return BillDto.builder()
                .id(b.getId())
                .billCode(b.getBillCode())
                .patientId(pat != null ? pat.getId() : null)
                .patientName(pat != null ? pat.getFullName() : null)
                .patientCode(pat != null ? pat.getPatientCode() : null)
                .patient(patientDto)
                .doctorId(doc != null ? doc.getId() : null)
                .doctorName(doc != null ? doc.getFullName() : null)
                .doctor(doctorDto)
                .billDate(b.getBillDate())
                .consultationFee(b.getConsultationFee())
                .medicineCharges(b.getMedicineCharges())
                .otherCharges(b.getOtherCharges())
                .discount(b.getDiscount())
                .tax(b.getTax())
                .totalAmount(b.getTotalAmount())
                .paymentMethod(b.getPaymentMethod())
                .paymentStatus(b.getPaymentStatus())
                .createdAt(b.getCreatedAt())
                .build();
    }
}
