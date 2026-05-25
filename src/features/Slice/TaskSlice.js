import { createSlice } from "@reduxjs/toolkit";

const initialState = { tasks: [] };

const TaskSlice = createSlice({
  name: "task",
  initialState,
  reducers: {
    setTasks: (state, action) => { state.tasks = action.payload; },
  },
});

export const { setTasks } = TaskSlice.actions;
export default TaskSlice.reducer;
