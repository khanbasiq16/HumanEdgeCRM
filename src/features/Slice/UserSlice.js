import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
};

const UserSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
  
    loginSuccess: (state, action) => {
      state.user = action.payload;
    },
    UpdateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },

      updateCheckIn: (state, action) => {
      if (state.user) {
        state.user = {
          ...state.user,
          isCheckedin: true,
          isCheckedout: false,
          startTime: action.payload.startTime,
          attendanceid: action.payload.attendanceid,
        };
      }
    },

       updateCheckOut: (state, action) => {
      if (state.user) {
        state.user = {
          ...state.user,
          isCheckedin: false,
          isCheckedout: true,
          startTime: null,
          attendanceid: null,
          
        };
      }
    },

    logout: (state) => {
      state.user = null;
    },

  },
});

export const {  loginSuccess,UpdateUser , logout , updateCheckIn , updateCheckOut } = UserSlice.actions;

export default UserSlice.reducer;
