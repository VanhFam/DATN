package com.example.cdtn.activity;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Bitmap;
import android.os.Bundle;
import android.provider.MediaStore;
import android.widget.Button;
import android.widget.ImageView;

import androidx.appcompat.app.AppCompatActivity;

import com.example.cdtn.R;
import com.example.cdtn.api.ApiService;
import com.example.cdtn.api.RetrofitClient;
import com.example.cdtn.model.ApiResponse;
import com.example.cdtn.model.FaceRequest;
import com.example.cdtn.utils.ImageUtils;
import com.google.android.material.snackbar.Snackbar;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import android.content.pm.PackageManager;
import android.Manifest;
public class RegisterFaceActivity extends AppCompatActivity {
    private static final int CAMERA_REQUEST = 100;

    private Bitmap bitmap;
    private ImageView imageView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_register_face);
        imageView = findViewById(R.id.imageView);
        Button btnCapture = findViewById(R.id.btnCapture);
        Button btnRegister = findViewById(R.id.btnRegister);
        btnCapture.setOnClickListener(v -> openCamera());

        btnRegister.setOnClickListener(v -> registerFace());
    }

    private void openCamera() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.CAMERA}, 102);
        } else {
            Intent intent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
            intent.putExtra("android.intent.extras.CAMERA_FACING", 1); // Camera trước
            startActivityForResult(intent, CAMERA_REQUEST);
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == 102 && grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
            openCamera();
        } else {
            showMessage("Cần cấp quyền camera để chụp ảnh");
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode == CAMERA_REQUEST && resultCode == Activity.RESULT_OK) {

            bitmap = (Bitmap) data.getExtras().get("data");
            imageView.setImageBitmap(bitmap);
        }
    }
    private void registerFace() {

        if (bitmap == null) {
            showMessage("Chưa chụp ảnh");
            return;
        }

        String base64 = ImageUtils.bitmapToBase64(bitmap);

        FaceRequest request = new FaceRequest(base64);

        ApiService apiService = RetrofitClient
                .getClient(this)
                .create(ApiService.class);

        apiService.registerFace(request)
                .enqueue(new Callback<ApiResponse<Object>>() {
                    @Override
                    public void onResponse(Call<ApiResponse<Object>> call,
                                           Response<ApiResponse<Object>> response) {
                        if (response.isSuccessful()) {
                            showMessageAndFinish("Đăng ký thành công");
                        } else {
                            String errorMsg = "Lỗi hệ thống";
                            try {
                                if (response.errorBody() != null) {
                                    String errorJson = response.errorBody().string();
                                    if (errorJson.contains("\"message\":\"")) {
                                        errorMsg = errorJson.split("\"message\":\"")[1].split("\"")[0];
                                    }
                                }
                            } catch (Exception e) {}
                            showMessage("Thất bại: " + errorMsg);
                        }
                    }

                    @Override
                    public void onFailure(Call<ApiResponse<Object>> call,
                                          Throwable t) {

                        showMessage(t.getMessage());
                    }
                });
    }

    private void showMessage(String message) {
        Snackbar snackbar = Snackbar
                .make(findViewById(android.R.id.content), message, Snackbar.LENGTH_LONG)
                .setAction("Đóng", v -> {});

        snackbar.setTextMaxLines(Integer.MAX_VALUE);
        snackbar.setDuration(6000);
        snackbar.show();
    }

    private void showMessageAndFinish(String message) {
        Snackbar snackbar = Snackbar
                .make(findViewById(android.R.id.content), message, Snackbar.LENGTH_LONG)
                .setAction("Đóng", v -> finish());

        snackbar.setTextMaxLines(Integer.MAX_VALUE);
        snackbar.setDuration(3000);
        snackbar.addCallback(new Snackbar.Callback() {
            @Override
            public void onDismissed(Snackbar transientBottomBar, int event) {
                finish();
            }
        });
        snackbar.show();
    }

}
