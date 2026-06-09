package com.example.cdtn.adapter;

import android.graphics.Color;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.cdtn.R;
import com.example.cdtn.model.StudentAttendanceResponse;

import java.util.List;

public class AttendanceAdapter
        extends RecyclerView.Adapter<AttendanceAdapter.ViewHolder> {

    private final List<StudentAttendanceResponse> list;

    public AttendanceAdapter(List<StudentAttendanceResponse> list) {
        this.list = list;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_attendance, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        StudentAttendanceResponse item = list.get(position);

        holder.txtClass.setText(item.getClassName() != null ? item.getClassName() : "—");
        holder.txtSubject.setText(item.getSubjectName() != null ? item.getSubjectName() : "—");
        holder.txtTime.setText(item.getAttendanceTime() != null ? item.getAttendanceTime() : "—");

        // Status badge
        String status = item.getStatus() != null ? item.getStatus().toLowerCase() : "absent";
        switch (status) {
            case "present":
                holder.txtStatus.setText("Có mặt");
                holder.txtStatus.setTextColor(Color.parseColor("#10B981"));
                holder.txtStatus.setBackgroundColor(Color.parseColor("#D1FAE5"));
                break;
            case "late":
                holder.txtStatus.setText("Muộn");
                holder.txtStatus.setTextColor(Color.parseColor("#F97316"));
                holder.txtStatus.setBackgroundColor(Color.parseColor("#FFEDD5"));
                break;
            case "half":
                holder.txtStatus.setText("Nửa buổi");
                holder.txtStatus.setTextColor(Color.parseColor("#6366F1"));
                holder.txtStatus.setBackgroundColor(Color.parseColor("#EDE9FE"));
                break;
            default: // absent
                holder.txtStatus.setText("Vắng");
                holder.txtStatus.setTextColor(Color.parseColor("#EF4444"));
                holder.txtStatus.setBackgroundColor(Color.parseColor("#FEE2E2"));
                break;
        }

        // Method badge
        String method = item.getMethod() != null ? item.getMethod().toUpperCase() : "MANUAL";
        if ("FACE_ID".equals(method)) {
            holder.tvMethod.setText("Nhận diện khuôn mặt");
            holder.tvMethod.setTextColor(Color.parseColor("#7C3AED"));
            holder.tvMethod.setBackgroundColor(Color.parseColor("#EDE9FE"));
        } else {
            holder.tvMethod.setText("Điểm danh thủ công");
            holder.tvMethod.setTextColor(Color.parseColor("#6B7280"));
            holder.tvMethod.setBackgroundColor(Color.parseColor("#F3F4F6"));
        }
    }

    @Override
    public int getItemCount() {
        return list.size();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {

        TextView txtClass, txtSubject, txtTime, txtStatus, tvMethod;

        public ViewHolder(@NonNull View itemView) {
            super(itemView);
            txtClass   = itemView.findViewById(R.id.txtClassName);
            txtSubject = itemView.findViewById(R.id.txtSubject);
            txtTime    = itemView.findViewById(R.id.txtTime);
            txtStatus  = itemView.findViewById(R.id.txtStatus);
            tvMethod   = itemView.findViewById(R.id.tvMethod);
        }
    }
}
