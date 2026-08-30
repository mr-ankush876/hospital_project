package com.vitalsync.hms.repository;

import com.vitalsync.hms.entity.HospitalSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface HospitalSettingRepository extends JpaRepository<HospitalSetting, Long> {
    Optional<HospitalSetting> findFirstByOrderByIdAsc();
}
