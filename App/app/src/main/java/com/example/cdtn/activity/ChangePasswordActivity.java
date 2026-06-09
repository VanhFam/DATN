package com.example.cdtn.activity;

import android.os.Bundle;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.example.cdtn.R;
import com.example.cdtn.api.ApiService;
import com.example.cdtn.api.RetrofitClient;
import com.example.cdtn.model.ApiResponse;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.textfield.TextInputEditText;

import java.util.HashMap;
import java.util.Map;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class ChangePasswordActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_change_password);

        TextInputEditText edtCurrent = findViewById(R.id.edtCurrentPassword);
        TextInputEditText edtNew = findViewById(R.id.edtNewPassword);
        MaterialButton btnSubmit = findViewById(R.id.btnSubmit);

        btnSubmit.setOnClickListener(v -> {
            String currentPwd = edtCurrent.getText().toString().trim();
            String newPwd = edtNew.getText().toString().trim();

            if (currentPwd.isEmpty() || newPwd.isEmpty()) {
                Toast.makeText(this, "Vui lòng nhập đầy đủ thông tin", Toast.LENGTH_SHORT).show();
                return;
            }

            Map<String, String> request = new HashMap<>();
            request.put("currentPassword", currentPwd);
            request.put("newPassword", newPwd);

            ApiService apiService = RetrofitClient.getClient(this).create(ApiService.class);
            apiService.changePassword(request).enqueue(new Callback<ApiResponse<Object>>() {
                @Override
                public void onResponse(Call<ApiResponse<Object>> call, Response<ApiResponse<Object>> response) {
                    if (response.isSuccessful()) {
                        Toast.makeText(ChangePasswordActivity.this, "Đổi mật khẩu thành công!", Toast.LENGTH_SHORT).show();
                        finish();
                    } else {
                        Toast.makeText(ChangePasswordActivity.this, "Lỗi: " + response.message(), Toast.LENGTH_SHORT).show();
                    }
                }

                @Override
                public void onFailure(Call<ApiResponse<Object>> call, Throwable t) {
                    Toast.makeText(ChangePasswordActivity.this, "Lỗi kết nối: " + t.getMessage(), Toast.LENGTH_SHORT).show();
                }
            });
        });
    }
}
