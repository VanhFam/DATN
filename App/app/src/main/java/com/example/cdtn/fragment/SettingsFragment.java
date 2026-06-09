package com.example.cdtn.fragment;

import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

import com.example.cdtn.R;
import com.example.cdtn.activity.ChangePasswordActivity;
import com.example.cdtn.activity.LoginActivity;
import com.example.cdtn.utils.SharedPrefManager;

public class SettingsFragment extends Fragment {

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_settings, container, false);

        view.findViewById(R.id.btnChangePassword).setOnClickListener(v -> {
            startActivity(new Intent(requireContext(), ChangePasswordActivity.class));
        });

        view.findViewById(R.id.btnLogout).setOnClickListener(v -> {
            new SharedPrefManager(requireContext()).logout();
            Intent intent = new Intent(requireContext(), LoginActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
            startActivity(intent);
            requireActivity().finish();
        });

        return view;
    }
}
