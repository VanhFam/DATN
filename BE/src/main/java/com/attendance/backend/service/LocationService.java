package com.attendance.backend.service;

import com.attendance.backend.entity.Location;
import com.attendance.backend.repository.LocationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class LocationService {

    @Autowired
    private LocationRepository locationRepository;

    public List<Location> getAllLocations() {
        return locationRepository.findAll();
    }

    public List<Location> getActiveLocations() {
        return locationRepository.findByIsActive(true);
    }

    public Optional<Location> getLocationById(String id) {
        return locationRepository.findById(id);
    }

    public Location saveLocation(Location location) {
        return locationRepository.save(location);
    }

    public void deleteLocation(String id) {
        locationRepository.deleteById(id);
    }

    public Location updateLocation(String id, Location locationDetails) {
        return locationRepository.findById(id).map(location -> {
            location.setName(locationDetails.getName());
            location.setAddress(locationDetails.getAddress());
            location.setLat(locationDetails.getLat());
            location.setLng(locationDetails.getLng());
            location.setRadius(locationDetails.getRadius());
            location.setIsActive(locationDetails.getIsActive());
            return locationRepository.save(location);
        }).orElseThrow(() -> new RuntimeException("Location not found with id " + id));
    }
}
