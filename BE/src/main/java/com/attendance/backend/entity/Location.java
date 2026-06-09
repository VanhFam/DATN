package com.attendance.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "locations")
public class Location {

    @Id
    @Column(length = 20)
    private String id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(length = 300)
    private String address;

    @Column(nullable = false)
    private Double lat;

    @Column(nullable = false)
    private Double lng;

    /** Bán kính GPS hợp lệ (mét) */
    @Column(nullable = false)
    private Integer radius = 200;

    @Column(nullable = false)
    private Boolean isActive = true;

    public Location() {
    }

    public Location(String id, String name, String address, Double lat, Double lng, Integer radius, Boolean isActive) {
        this.id = id;
        this.name = name;
        this.address = address;
        this.lat = lat;
        this.lng = lng;
        this.radius = radius;
        this.isActive = isActive;
    }

    public static LocationBuilder builder() {
        return new LocationBuilder();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public Double getLat() {
        return lat;
    }

    public void setLat(Double lat) {
        this.lat = lat;
    }

    public Double getLng() {
        return lng;
    }

    public void setLng(Double lng) {
        this.lng = lng;
    }

    public Integer getRadius() {
        return radius;
    }

    public void setRadius(Integer radius) {
        this.radius = radius;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public static class LocationBuilder {
        private String id;
        private String name;
        private String address;
        private Double lat;
        private Double lng;
        private Integer radius = 200;
        private Boolean isActive = true;

        LocationBuilder() {
        }

        public LocationBuilder id(String id) {
            this.id = id;
            return this;
        }

        public LocationBuilder name(String name) {
            this.name = name;
            return this;
        }

        public LocationBuilder address(String address) {
            this.address = address;
            return this;
        }

        public LocationBuilder lat(Double lat) {
            this.lat = lat;
            return this;
        }

        public LocationBuilder lng(Double lng) {
            this.lng = lng;
            return this;
        }

        public LocationBuilder radius(Integer radius) {
            this.radius = radius;
            return this;
        }

        public LocationBuilder isActive(Boolean isActive) {
            this.isActive = isActive;
            return this;
        }

        public Location build() {
            return new Location(id, name, address, lat, lng, radius, isActive);
        }
    }
}
