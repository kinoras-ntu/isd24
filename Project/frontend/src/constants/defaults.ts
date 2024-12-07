import type { Line, Node, RCObject } from '@/types/drawing'
import type { Stage } from '@/types/state'

export const defaultStrokeWidth = 2

export const defaultColor = '#ffffff'

export const defaultStage: Stage = 'Idle'

export const defaultNode: Node = {
    nodeId: -1,
    x: 0,
    y: 0
}

export const defaultObject: RCObject = {
    refNode: [],
    frames: [[]]
}
