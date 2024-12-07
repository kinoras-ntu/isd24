import type { RCObject } from '@/types/drawing'
import type { Stage } from '@/types/state'

export const defaultStrokeWidth = 2

export const defaultColor = '#ffffff'

export const defaultStage: Stage = 'Idle'

export const defaultObject: RCObject = {
    nodeId: [],
    refPoint: { x: 0, y: 0 },
    frames: []
}
