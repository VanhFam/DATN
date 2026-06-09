package com.attendance.backend.controller;

import com.attendance.backend.entity.Location;
import com.attendance.backend.service.LocationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/locations")
public class LocationController {

    private final LocationService locationService;

    public LocationController(LocationService locationService) {
        this.locationService = locationService;
    }

    @GetMapping
    public Object getAllLocations(@RequestParam(required = false) Integer page,
                                  @RequestParam(required = false) Integer limit,
                                  @RequestParam(required = false, defaultValue = "") String search) {
        if (page != null || limit != null) {
            return locationService.getLocationsPage(search, page, limit);
        }
        return locationService.getAllLocations();
    }

    @GetMapping("/active")
    public List<Location> getActiveLocations() {
        return locationService.getActiveLocations();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Location> getLocationById(@PathVariable String id) {
        return locationService.getLocationById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Location createLocation(@RequestBody Location location) {
        return locationService.saveLocation(location);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Location> updateLocation(@PathVariable String id, @RequestBody Location locationDetails) {
        try {
            return ResponseEntity.ok(locationService.updateLocation(id, locationDetails));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteLocation(@PathVariable String id) {
        locationService.deleteLocation(id);
        return ResponseEntity.noContent().build();
    }
}
