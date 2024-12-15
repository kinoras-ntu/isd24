import type { FC, HTMLAttributes } from 'react'
import { ListGroupItem, type ListGroupItemProps } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'

import { faArrowPointer, faPencil } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import type { RCObject } from '@/types/drawing'
import type { State } from '@/types/state'

import { poseLandmarks } from '@/constants/mediapipe'

interface ObjectItemProps extends ListGroupItemProps {
    object: RCObject
}

const ObjectItem: FC<ObjectItemProps> = ({ object, ...restProps }) => {
    const tool = useSelector((state: State) => state.tool)
    const finishedObjects = useSelector((state: State) => state.finishedObjects[tool])
    const outline = useSelector((state: State) => state.outline)
    const color = useSelector((state: State) => state.color)

    const dispatch = useDispatch()
    return (
        <ListGroupItem style={{ padding: 8 }}>
            <div>{object.refNode.map(({ nodeId }) => poseLandmarks[nodeId]).join(' / ')}</div>
            <div className="text-muted" style={{ fontSize: 14 }}>
                1 frame, 2 lines
            </div>
        </ListGroupItem>
    )
}

export default ObjectItem
