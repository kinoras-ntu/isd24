import { v4 as uuid } from 'uuid'

import type { Node, RCObject } from '@/types/drawing'
import type { Stage } from '@/types/state'

export const defaultStrokeWidth = 2

export const defaultColor = '#ffffff'

export const defaultStage: Stage = 'Idle'

export const defaultNode: Node = {
    nodeId: -1,
    x: 0,
    y: 0
}

export const createDefaultObject = (): RCObject => ({
    id: uuid(),
    localColor: defaultColor,
    localStrokeWidth: defaultStrokeWidth,
    refNode: [],
    frames: [[]]
})
