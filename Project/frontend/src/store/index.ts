import { legacy_createStore as createStore } from 'redux'

import { Action, State } from '@/types/state'

import { defauleStage, defaultObject } from '@/constants/defaults'

const initialState: State = {
    tool: 'Binding',
    stage: defauleStage,
    outline: false,
    currentObject: structuredClone(defaultObject),
    finishedObjects: {
        Binding: [],
        Trajectory: [],
        Flipbook: [],
        Triggering: [],
        Emission: []
    }
}

const reducer = (state: State = initialState, action: Action) => {
    switch (action.type) {
        case 'SET_TOOL':
            return {
                ...state,
                tool: action.payload,
                stage: defauleStage,
                currentObject: structuredClone(defaultObject)
            }
        case 'SET_STAGE':
            return { ...state, stage: action.payload }
        case 'SET_CURRENT_OBJECT':
            return { ...state, currentObject: action.payload }
        case 'SET_OUTLINE':
            return { ...state, outline: action.payload }
        case 'SAVE_CURRENT_OBJECT':
            return {
                ...state,
                currentObject: structuredClone(defaultObject),
                finishedObjects: {
                    ...state.finishedObjects,
                    [state.tool]: [...state.finishedObjects[state.tool], state.currentObject]
                }
            }
        default:
            return state
    }
}

const store = createStore(reducer)

export default store
