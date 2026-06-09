package com.example.cdtn.fragment;

import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

import com.example.cdtn.R;
import com.example.cdtn.activity.AttendanceActivity;
import com.example.cdtn.activity.HistoryActivity;
import com.example.cdtn.activity.RegisterFaceActivity;
import com.example.cdtn.activity.UpdateFaceActivity;
import com.example.cdtn.utils.SharedPrefManager;

public class HomeFragment extends Fragment {

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_home, container, false);

        SharedPrefManager pref = new SharedPrefManager(requireContext());
        TextView tvTitle = view.findViewById(R.id.tvTitle);
        tvTitle.setText("Xin chào, " + pref.getName());

        Button btnRegister = view.findViewById(R.id.btnRegisterFace);
        Button btnUpdate = view.findViewById(R.id.btnUpdateFace);
        Button btnAttendance = view.findViewById(R.id.btnAttendance);
        Button btnHistory = view.findViewById(R.id.btnHistory);

        btnRegister.setOnClickListener(v -> {
            startActivity(new Intent(requireContext(), RegisterFaceActivity.class));
        });

        btnUpdate.setOnClickListener(v -> {
            startActivity(new Intent(requireContext(), UpdateFaceActivity.class));
        });

        btnAttendance.setOnClickListener(v -> {
            startActivity(new Intent(requireContext(), AttendanceActivity.class));
        });

        btnHistory.setOnClickListener(v -> {
            startActivity(new Intent(requireContext(), HistoryActivity.class));
        });

        return view;
    }
}
