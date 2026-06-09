package com.example.cdtn.utils;

import android.content.Context;
import android.content.SharedPreferences;

import com.example.cdtn.model.LoginResponse;

public class SharedPrefManager {

    private static final String PREF_NAME =
            "attendance_app";

    private SharedPreferences pref;

    public SharedPrefManager(Context context) {

        pref = context.getSharedPreferences(
                PREF_NAME,
                Context.MODE_PRIVATE
        );
    }

    public void saveLogin(LoginResponse response) {

        pref.edit()
                .putString("token", response.getToken())
                .putString("role", response.getRole())
                .putString("name", response.getName())
                .apply();
    }

    public String getToken() {
        return pref.getString("token", "");
    }

    public String getName() {
        return pref.getString("name", "Sinh viên");
    }

    public void logout() {
        pref.edit().clear().apply();
    }
}