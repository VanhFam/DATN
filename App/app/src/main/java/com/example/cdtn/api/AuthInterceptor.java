package com.example.cdtn.api;

import android.content.Context;

import com.example.cdtn.utils.SharedPrefManager;

import java.io.IOException;

import okhttp3.Interceptor;
import okhttp3.Request;
import okhttp3.Response;

public class AuthInterceptor implements Interceptor {

    private final Context context;

    public AuthInterceptor(Context context) {
        this.context = context;
    }

    @Override
    public Response intercept(Chain chain)
            throws IOException {

        SharedPrefManager pref =
                new SharedPrefManager(context);

        String token = pref.getToken();

        Request request = chain.request()
                .newBuilder()
                .addHeader(
                        "Authorization",
                        "Bearer " + token
                )
                .build();

        return chain.proceed(request);
    }
}