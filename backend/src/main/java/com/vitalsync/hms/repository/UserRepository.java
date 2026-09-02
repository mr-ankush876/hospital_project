package com.vitalsync.hms.repository;

import com.vitalsync.hms.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    Optional<User> findByUsernameIgnoreCase(String username);
    Optional<User> findByEmailIgnoreCase(String email);
    Optional<User> findByUsernameIgnoreCaseOrEmailIgnoreCase(String username, String email);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);

    @Query("SELECT u FROM User u WHERE " +
           "(:role IS NULL OR u.role = :role) " +
           "AND (:status IS NULL OR u.status = :status) " +
           "AND (:search IS NULL OR LOWER(u.username) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(u.role) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(u.status) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR CAST(u.id as string) LIKE CONCAT('%', :search, '%') " +
           "OR u.phone LIKE CONCAT('%', :search, '%')) " +
           "ORDER BY u.id DESC")
    List<User> searchUsers(
            @Param("role") String role,
            @Param("status") String status,
            @Param("search") String search);

    @Query("SELECT u FROM User u WHERE " +
           "(:role IS NULL OR u.role = :role) " +
           "AND (:status IS NULL OR u.status = :status) " +
           "AND (:search IS NULL OR LOWER(u.username) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(u.role) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(u.status) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR CAST(u.id as string) LIKE CONCAT('%', :search, '%') " +
           "OR u.phone LIKE CONCAT('%', :search, '%'))")
    Page<User> searchUsersPaged(
            @Param("role") String role,
            @Param("status") String status,
            @Param("search") String search,
            Pageable pageable);

    @Query("SELECT u FROM User u WHERE " +
           ":query IS NULL OR LOWER(u.username) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(u.role) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(u.status) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR CAST(u.id as string) LIKE CONCAT('%', :query, '%') " +
           "OR u.phone LIKE CONCAT('%', :query, '%') " +
           "ORDER BY u.id DESC")
    List<User> searchByQuery(@Param("query") String query);

    long countByRole(String role);
    long countByStatus(String status);
}
