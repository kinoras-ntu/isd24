import { legacy_createStore as createStore } from 'redux'

import { Action, State } from '@/types/state'

import { createDefaultObject, defaultColor, defaultStage, defaultStrokeWidth } from '@/constants/defaults'

const initialState: State = {
    displayMode: 'Normal',
    tool: 'Binding',
    stage: defaultStage,
    color: defaultColor,
    strokeWidth: defaultStrokeWidth,
    outline: false,
    isolatedObjectId: undefined,
    currentObject: createDefaultObject(),
    currentFrameIndex: 0,
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
        case 'SET_DISPLAY_MODE':
            return { ...state, displayMode: action.payload }
        case 'SET_TOOL':
            return {
                ...state,
                tool: action.payload,
                stage: defaultStage,
                currentObject: {
                    ...createDefaultObject(),
                    localColor: state.color,
                    localStrokeWidth: state.strokeWidth
                }
            }
        case 'SET_STAGE':
            return { ...state, stage: action.payload }
        case 'SET_CURRENT_OBJECT':
            return { ...state, currentObject: action.payload }
        case 'SET_COLOR':
            return {
                ...state,
                color: action.payload,
                currentObject: { ...state.currentObject, localColor: action.payload }
            }
        case 'SET_STROKE_WIDTH':
            return {
                ...state,
                strokeWidth: action.payload,
                currentObject: { ...state.currentObject, localStrokeWidth: action.payload }
            }
        case 'SET_OUTLINE':
            return { ...state, outline: action.payload }
        case 'SAVE_FRAME':
            return {
                ...state,
                currentFrameIndex: state.currentFrameIndex + 1,
                currentObject: {
                    ...state.currentObject,
                    frames: [...state.currentObject.frames, []]
                }
            }
        case 'SAVE_CURRENT_OBJECT':
            return {
                ...state,
                stage: defaultStage,
                currentFrameIndex: 0,
                currentObject: {
                    ...createDefaultObject(),
                    localColor: state.color,
                    localStrokeWidth: state.strokeWidth
                },
                finishedObjects: {
                    ...state.finishedObjects,
                    [state.tool]: [
                        ...state.finishedObjects[state.tool].filter(({ id }) => id !== state.currentObject.id),
                        state.currentObject
                    ]
                }
            }
        case 'SET_CURRENT_FRAME':
            return { ...state, currentFrameIndex: action.payload }
        case 'DELETE_CURRENT_OBJECT_FRAME':
            return {
                ...state,
                currentFrameIndex: action.payload <= state.currentFrameIndex ? state.currentFrameIndex - 1 : state.currentFrameIndex,
                currentObject: {
                    ...state.currentObject,
                    frames: state.currentObject.frames.filter((_, i) => i !== action.payload)
                }
            }
        case 'EDIT_OBJECT':
            return {
                ...state,
                currentFrameIndex: 0,
                currentObject:
                    state.finishedObjects[state.tool].find(({ id }) => id === action.payload) ?? createDefaultObject()
            }
        case 'ISOLATE_OBJECT':
            return { ...state, isolatedObjectId: action.payload }
        case 'DELETE_OBJECT':
            return {
                ...state,
                isolatedObjectId: state.isolatedObjectId === action.payload ? undefined : state.isolatedObjectId,
                finishedObjects: {
                    ...state.finishedObjects,
                    [state.tool]: state.finishedObjects[state.tool].filter(({ id }) => id !== action.payload)
                }
            }
        default:
            return state
    }
}

const store = createStore(reducer)

export default store
