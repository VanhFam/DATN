package com.attendance.backend.service;

import com.attendance.backend.entity.User;
import com.attendance.backend.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;


@Service
public class    UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Map<String, String> getProfile(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        Map<String, String> profile = new HashMap<>();
        profile.put("name", user.getName() != null ? user.getName() : "");
        profile.put("email", user.getEmail() != null ? user.getEmail() : "");
        profile.put("phone", user.getPhone() != null ? user.getPhone() : "");
        profile.put("username", user.getUsername());
        profile.put("role", user.getRole() != null ? user.getRole().name() : "");
        return profile;
    }

    @Transactional
    public void updateProfile(String username, String name, String email, String phone) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        
        user.setName(name);
        user.setEmail(email);
        user.setPhone(phone);
        userRepository.saveAndFlush(user);
    }

    @Transactional
    public void changePassword(String username, String currentPassword, String newPassword) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new RuntimeException("Mật khẩu hiện tại không chính xác");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.saveAndFlush(user);
    }

    @Transactional
    public void toggleActive(Long id, String currentUsername) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        
        if (user.getUsername().equals(currentUsername)) {
            throw new RuntimeException("Bạn không thể tự khóa tài khoản của chính mình");
        }
        
        user.setIsActive(!user.getIsActive());
        userRepository.saveAndFlush(user);
    }
}
