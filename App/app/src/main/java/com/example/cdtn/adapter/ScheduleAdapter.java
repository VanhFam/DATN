package com.example.cdtn.adapter;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.cdtn.R;
import com.example.cdtn.model.ScheduleDTO;

import java.util.List;

public class ScheduleAdapter extends RecyclerView.Adapter<RecyclerView.ViewHolder> {

    private List<Object> items;
    private static final int TYPE_HEADER = 0;
    private static final int TYPE_ITEM = 1;

    public ScheduleAdapter(List<Object> items) {
        this.items = items;
    }

    @Override
    public int getItemViewType(int position) {
        if (items.get(position) instanceof String) {
            return TYPE_HEADER;
        }
        return TYPE_ITEM;
    }

    @NonNull
    @Override
    public RecyclerView.ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        if (viewType == TYPE_HEADER) {
            View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_schedule_header, parent, false);
            return new HeaderViewHolder(view);
        } else {
            View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_schedule, parent, false);
            return new ItemViewHolder(view);
        }
    }

    @Override
    public void onBindViewHolder(@NonNull RecyclerView.ViewHolder holder, int position) {
        if (getItemViewType(position) == TYPE_HEADER) {
            ((HeaderViewHolder) holder).tvDayHeader.setText((String) items.get(position));
        } else {
            ScheduleDTO schedule = (ScheduleDTO) items.get(position);
            ItemViewHolder itemHolder = (ItemViewHolder) holder;
            itemHolder.tvSubject.setText(schedule.getSubject() != null ? schedule.getSubject() : "Lớp " + schedule.getClassId());
            itemHolder.tvTime.setText(schedule.getStartTime() + " - " + schedule.getEndTime());
            itemHolder.tvRoom.setText("Phòng: " + (schedule.getRoom() != null ? schedule.getRoom() : "Chưa xếp"));
        }
    }

    @Override
    public int getItemCount() {
        return items.size();
    }

    public static class HeaderViewHolder extends RecyclerView.ViewHolder {
        TextView tvDayHeader;
        public HeaderViewHolder(@NonNull View itemView) {
            super(itemView);
            tvDayHeader = itemView.findViewById(R.id.tvDayHeader);
        }
    }

    public static class ItemViewHolder extends RecyclerView.ViewHolder {
        TextView tvSubject, tvTime, tvRoom;
        public ItemViewHolder(@NonNull View itemView) {
            super(itemView);
            tvSubject = itemView.findViewById(R.id.tvSubject);
            tvTime = itemView.findViewById(R.id.tvTime);
            tvRoom = itemView.findViewById(R.id.tvRoom);
        }
    }
}
