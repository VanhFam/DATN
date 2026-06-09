package com.example.cdtn.activity;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.example.cdtn.R;
import com.example.cdtn.api.ApiService;
import com.example.cdtn.api.RetrofitClient;
import com.example.cdtn.model.LoginRequest;
import com.example.cdtn.model.LoginResponse;
import com.example.cdtn.utils.SharedPrefManager;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class LoginActivity
        extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {

        super.onCreate(savedInstanceState);

        setContentView(R.layout.activity_login);

        EditText edtUsername =
                findViewById(R.id.edtUsername);

        EditText edtPassword =
                findViewById(R.id.edtPassword);

        Button btnLogin =
                findViewById(R.id.btnLogin);

        btnLogin.setOnClickListener(v -> {

            String username =
                    edtUsername.getText().toString();

            String password =
                    edtPassword.getText().toString();

            if (username.trim().isEmpty()) {
                edtUsername.setError("Vui lòng nhập tên đăng nhập");
                edtUsername.requestFocus();
                return;
            }
            if (password.trim().isEmpty()) {
                edtPassword.setError("Vui lòng nhập mật khẩu");
                edtPassword.requestFocus();
                return;
            }

            LoginRequest request =
                    new LoginRequest(
                            username.trim(),
                            password
                    );

            ApiService apiService =
                    RetrofitClient
                            .getClient(this)
                            .create(ApiService.class);

            apiService.login(request)
                    .enqueue(new Callback<LoginResponse>() {

                        @Override
                        public void onResponse(
                                Call<LoginResponse> call,
                                Response<LoginResponse> response
                        ) {

                            if (response.isSuccessful()
                                    && response.body() != null) {

                                LoginResponse loginResponse = response.body();

                                // Kiểm tra vai trò
                                if (!"STUDENT".equalsIgnoreCase(loginResponse.getRole())) {
                                    Toast.makeText(
                                            LoginActivity.this,
                                            "Ứng dụng này chỉ dành cho Sinh viên!",
                                            Toast.LENGTH_LONG
                                    ).show();
                                    return;
                                }

                                SharedPrefManager pref =
                                        new SharedPrefManager(
                                                LoginActivity.this
                                        );

                                pref.saveLogin(loginResponse);

                                startActivity(
                                        new Intent(
                                                LoginActivity.this,
                                                MainActivity.class
                                        )
                                );

                                finish();
                            } else {
                                Toast.makeText(
                                        LoginActivity.this,
                                        "Sai tài khoản hoặc mật khẩu",
                                        Toast.LENGTH_SHORT
                                ).show();
                            }
                        }

                        @Override
                        public void onFailure(
                                Call<LoginResponse> call,
                                Throwable t
                        ) {

                            Toast.makeText(
                                    LoginActivity.this,
                                    t.getMessage(),
                                    Toast.LENGTH_SHORT
                            ).show();
                        }
                    });
        });
    }
}