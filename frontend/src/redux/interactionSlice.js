import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  hcpName: '',
  interactionType: 'Meeting',
  date: new Date().toISOString().split('T')[0],
  time: new Date().toTimeString().slice(0, 5),
  attendees: '',
  topicsDiscussed: '',
  materialsShared: '',
  samplesDistributed: '',
  sentiment: 'Neutral',
  outcomes: '',
  followUp: '',
  aiSuggestions: [],
  savedId: null,
}

const interactionSlice = createSlice({
  name: 'interaction',
  initialState,
  reducers: {
    setInteraction: (state, action) => {
      return { ...state, ...action.payload }
    },
    updateField: (state, action) => {
      const { field, value } = action.payload
      state[field] = value
    },
    resetForm: () => initialState,
    setSavedId: (state, action) => {
      state.savedId = action.payload
    },
  },
})

export const { setInteraction, updateField, resetForm, setSavedId } = interactionSlice.actions
export default interactionSlice.reducer
