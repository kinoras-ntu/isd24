import type { RCObject } from '@/types/drawing'
import type { Stage } from '@/types/state'

export const defauleStage: Stage = 'Idle'

export const defaultObject: RCObject = {
    nodeId: [],
    refPoint: { x: 0, y: 0 },
    frames: []
}
