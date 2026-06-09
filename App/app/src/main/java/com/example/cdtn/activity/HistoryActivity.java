package com.example.cdtn.activity;

import android.os.Bundle;

import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.example.cdtn.R;
import com.example.cdtn.adapter.AttendanceAdapter;
import com.example.cdtn.api.ApiService;
import com.example.cdtn.api.RetrofitClient;
import com.example.cdtn.model.ApiResponse;
import com.example.cdtn.model.StudentAttendanceResponse;

import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class HistoryActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_history);

        RecyclerView recyclerView = findViewById(R.id.recyclerView);

        recyclerView.setLayoutManager(
                new LinearLayoutManager(this)
        );

        ApiService apiService = RetrofitClient
                .getClient(this)
                .create(ApiService.class);

        apiService.getHistory()
                .enqueue(new Callback<ApiResponse<List<StudentAttendanceResponse>>>() {
                    @Override
                    public void onResponse(
                            Call<ApiResponse<List<StudentAttendanceResponse>>> call,
                            Response<ApiResponse<List<StudentAttendanceResponse>>> response
                    ) {

                        if (!response.isSuccessful() || response.body() == null) {
                            return;
                        }

                        List<StudentAttendanceResponse> list =
                                response.body().getData();

                        AttendanceAdapter adapter =
                                new AttendanceAdapter(list);

                        recyclerView.setAdapter(adapter);
                    }

                    @Override
                    public void onFailure(
                            Call<ApiResponse<List<StudentAttendanceResponse>>> call,
                            Throwable t
                    ) {
                        android.widget.Toast.makeText(HistoryActivity.this,
                                "Không tải được lịch sử: " + t.getMessage(),
                                android.widget.Toast.LENGTH_SHORT).show();
                    }
                });
    }
}