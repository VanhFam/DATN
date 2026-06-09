package com.example.cdtn.api;

import com.example.cdtn.model.ApiResponse;
import com.example.cdtn.model.AttendanceRequest;
import com.example.cdtn.model.AttendanceResponse;
import com.example.cdtn.model.FaceRequest;
import com.example.cdtn.model.LoginRequest;
import com.example.cdtn.model.LoginResponse;
import com.example.cdtn.model.StudentAttendanceResponse;

import java.util.List;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.GET;
import retrofit2.http.POST;
import retrofit2.http.PUT;

public interface ApiService {

    @POST("auth/login")
    Call<LoginResponse> login(
            @Body LoginRequest request
    );

    @POST("students/me/face")
    Call<ApiResponse<Object>> registerFace(
            @Body FaceRequest request
    );

    @PUT("students/me/face-update")
    Call<ApiResponse<Object>> updateFace(
            @Body FaceRequest request
    );

    @POST("attendance/face")
    Call<ApiResponse<AttendanceResponse>> attendance(
            @Body AttendanceRequest request
    );

    @GET("students/me/attendance")
    Call<ApiResponse<List<StudentAttendanceResponse>>> getHistory();

    @GET("students/me/schedules/available")
    Call<ApiResponse<List<com.example.cdtn.model.AvailableSchedule>>> getAvailableSchedules();

    @GET("students/me/schedules")
    Call<ApiResponse<List<com.example.cdtn.model.ScheduleDTO>>> getMyWeeklySchedules();

    @POST("users/change-password")
    Call<ApiResponse<Object>> changePassword(@Body java.util.Map<String, String> request);
}