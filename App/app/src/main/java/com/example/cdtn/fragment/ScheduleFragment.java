package com.example.cdtn.fragment;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ProgressBar;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.example.cdtn.R;
import com.example.cdtn.api.ApiService;
import com.example.cdtn.api.RetrofitClient;
import com.example.cdtn.model.ApiResponse;
import com.example.cdtn.model.ScheduleDTO;

import java.util.ArrayList;
import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class ScheduleFragment extends Fragment {

    private RecyclerView rvSchedules;
    private ProgressBar progressBar;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_schedule, container, false);

        rvSchedules = view.findViewById(R.id.rvSchedules);
        progressBar = view.findViewById(R.id.progressBar);

        rvSchedules.setLayoutManager(new LinearLayoutManager(requireContext()));

        loadSchedules();

        return view;
    }

    private void loadSchedules() {
        progressBar.setVisibility(View.VISIBLE);
        ApiService apiService = RetrofitClient.getClient(requireContext()).create(ApiService.class);
        
        apiService.getMyWeeklySchedules().enqueue(new Callback<ApiResponse<List<ScheduleDTO>>>() {
            @Override
            public void onResponse(Call<ApiResponse<List<ScheduleDTO>>> call, Response<ApiResponse<List<ScheduleDTO>>> response) {
                progressBar.setVisibility(View.GONE);
                if (response.isSuccessful() && response.body() != null) {
                    List<ScheduleDTO> rawSchedules = response.body().getData();
                    List<Object> groupedItems = groupSchedulesByDay(rawSchedules);
                    rvSchedules.setAdapter(new com.example.cdtn.adapter.ScheduleAdapter(groupedItems));
                } else {
                    String errorStr = "HTTP " + response.code();
                    try {
                        if (response.errorBody() != null) {
                            errorStr += ": " + response.errorBody().string();
                        }
                    } catch (Exception e) {}
                    Toast.makeText(requireContext(), "Lỗi: " + errorStr, Toast.LENGTH_LONG).show();
                    android.util.Log.e("ScheduleFragment", "Error: " + errorStr);
                }
            }

            @Override
            public void onFailure(Call<ApiResponse<List<ScheduleDTO>>> call, Throwable t) {
                progressBar.setVisibility(View.GONE);
                android.util.Log.e("ScheduleFragment", "API Call failed", t);
                Toast.makeText(requireContext(), "Lỗi kết nối: " + t.getMessage(), Toast.LENGTH_LONG).show();
            }
        });
    }

    private List<Object> groupSchedulesByDay(List<ScheduleDTO> schedules) {
        List<Object> grouped = new ArrayList<>();
        if (schedules == null || schedules.isEmpty()) return grouped;

        // Map for day sorting - Backend uses "Thứ 2", "Thứ 3", ..., "Chủ Nhật"
        java.util.Map<String, Integer> dayOrder = new java.util.HashMap<>();
        dayOrder.put("Thứ 2", 2);
        dayOrder.put("Thứ 3", 3);
        dayOrder.put("Thứ 4", 4);
        dayOrder.put("Thứ 5", 5);
        dayOrder.put("Thứ 6", 6);
        dayOrder.put("Thứ 7", 7);
        dayOrder.put("Chủ Nhật", 8);

        // Sort schedules
        schedules.sort((s1, s2) -> {
            int d1 = dayOrder.getOrDefault(s1.getDayOfWeek(), 9);
            int d2 = dayOrder.getOrDefault(s2.getDayOfWeek(), 9);
            if (d1 != d2) return Integer.compare(d1, d2);
            return s1.getStartTime().compareTo(s2.getStartTime());
        });

        String currentDay = "";
        for (ScheduleDTO s : schedules) {
            String day = s.getDayOfWeek() != null ? s.getDayOfWeek() : "Ngày khác";
            if (!day.equals(currentDay)) {
                currentDay = day;
                grouped.add(currentDay);
            }
            grouped.add(s);
        }

        return grouped;
    }
}
