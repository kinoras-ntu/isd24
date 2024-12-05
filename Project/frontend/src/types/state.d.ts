import type { RCObject } from '@/types/drawing'

export type Tool = 'Binding' | 'Flipbook' | 'Triggering' | 'Emission' | 'Trajectory'

export type Stage = 'Idle' | 'Select' | 'Draw'

export type Action =
    | { type: 'SET_TOOL'; payload: Tool }
    | { type: 'SET_STAGE'; payload: Stage }
    | { type: 'SET_CURRENT_OBJECT'; payload: RCObject }
    | { type: 'SAVE_CURRENT_OBJECT' }
    | { type: 'SELECT'; payload: string }
    | { type: 'RESET' }

export interface State {
    tool: Tool
    stage: Stage
    currentObject: RCObject
    finishedObjects: {
        Binding: RCObject[]
        Trajectory: RCObject[]
        Flipbook: RCObject[]
        Triggering: RCObject[]
        Emission: RCObject[]
    }
}
