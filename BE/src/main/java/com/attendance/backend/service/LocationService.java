package com.attendance.backend.service;

import com.attendance.backend.dto.PaginatedResponse;
import com.attendance.backend.entity.Location;
import com.attendance.backend.repository.LocationRepository;
import com.attendance.backend.repository.ScheduleRepository;
import com.attendance.backend.utils.PaginationUtils;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class LocationService {

    private final LocationRepository locationRepository;
    private final ScheduleRepository scheduleRepository;

    public LocationService(LocationRepository locationRepository, ScheduleRepository scheduleRepository) {
        this.locationRepository = locationRepository;
        this.scheduleRepository = scheduleRepository;
    }

    public List<Location> getAllLocations() {
        return locationRepository.findAll();
    }

    public PaginatedResponse<Location> getLocationsPage(String search, Integer page, Integer limit) {
        Pageable pageable = PaginationUtils.toPageable(page, limit, Sort.by("id").ascending());
        return PaginationUtils.fromPage(locationRepository.search(search, pageable));
    }

    public List<Location> getActiveLocations() {
        return locationRepository.findByIsActive(true);
    }

    public Optional<Location> getLocationById(String id) {
        return locationRepository.findById(id);
    }

    public Location saveLocation(Location location) {
        validateLocation(location);
        return locationRepository.save(location);
    }

    public void deleteLocation(String id) {
        locationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy vị trí: " + id));

        long usedCount = scheduleRepository.findByLocationId(id).size();
        if (usedCount > 0) {
            throw new RuntimeException(
                "Không thể xóa vị trí đang được sử dụng bởi " + usedCount + " lịch học. " +
                "Vui lòng gỡ vị trí khỏi các lịch học trước.");
        }

        locationRepository.deleteById(id);
    }

    public Location updateLocation(String id, Location locationDetails) {
        validateLocation(locationDetails);
        return locationRepository.findById(id).map(location -> {
            location.setName(locationDetails.getName());
            location.setAddress(locationDetails.getAddress());
            location.setLat(locationDetails.getLat());
            location.setLng(locationDetails.getLng());
            location.setRadius(locationDetails.getRadius());
            location.setIsActive(locationDetails.getIsActive());
            return locationRepository.save(location);
        }).orElseThrow(() -> new RuntimeException("Không tìm thấy vị trí: " + id));
    }

    private void validateLocation(Location location) {
        if (location.getName() == null || location.getName().isBlank())
            throw new RuntimeException("Tên vị trí không được để trống");
        if (location.getLat() == null)
            throw new RuntimeException("Vĩ độ (lat) không được để trống");
        if (location.getLng() == null)
            throw new RuntimeException("Kinh độ (lng) không được để trống");
        if (location.getRadius() == null || location.getRadius() <= 0)
            throw new RuntimeException("Bán kính phải lớn hơn 0");
    }
}
