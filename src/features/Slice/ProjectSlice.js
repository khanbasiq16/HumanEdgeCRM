import { createSlice } from "@reduxjs/toolkit";

const initialState = { projects: [] };

const ProjectSlice = createSlice({
  name: "project",
  initialState,
  reducers: {
    setProjects: (state, action) => { state.projects = action.payload; },
  },
});

export const { setProjects } = ProjectSlice.actions;
export default ProjectSlice.reducer;
