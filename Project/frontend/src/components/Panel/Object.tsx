import type { FC } from 'react'
import { ListGroupItem, type ListGroupItemProps } from 'react-bootstrap'
import { useSelector } from 'react-redux'

import { faPenNib, faStar, faTrash } from '@fortawesome/free-solid-svg-icons'

import type { RCObject } from '@/types/drawing'
import type { State } from '@/types/state'

import { poseLandmarks } from '@/constants/mediapipe'

import ObjectButton from './ObjectButton'

interface ObjectEntryProps extends ListGroupItemProps {
    object: RCObject
    isCurrent?: boolean
    onEditClick?: () => void
    onIsolateClick?: () => void
    onDeleteClick?: () => void
}

const ObjectEntry: FC<ObjectEntryProps> = ({
    object: { id, refNode, frames },
    isCurrent = false,
    onEditClick = () => console.log('Edit clicked'),
    onIsolateClick = () => console.log('Isolate clicked'),
    onDeleteClick = () => console.log('Delete clicked'),
    ...restProps
}) => {
    const tool = useSelector((state: State) => state.tool)
    const isNew = !useSelector((state: State) => state.finishedObjects[tool].map(({ id }) => id)).includes(id)
    const isEditing = useSelector((state: State) => state.currentObject.id) === id
    const isolatedObjectId = useSelector((state: State) => state.isolatedObjectId)

    const lineCount = frames.reduce((count, frame) => count + frame.length, 0)

    const nodeNames = refNode.map(({ nodeId }) => poseLandmarks[nodeId])
    const statusText = isNew ? 'New' : 'Editing'
    const lineCountText = lineCount === 0 ? 'Empty drawing' : lineCount > 1 ? `${lineCount} lines` : `${lineCount} line`
    return (
        <ListGroupItem style={{ display: 'flex', alignItems: 'center', padding: '4px 8px' }} {...restProps}>
            <div style={{ flex: 1 }}>
                {nodeNames.length === 0 ? (
                    <span style={{ display: 'block', marginBottom: -2 }}>No node</span>
                ) : (
                    nodeNames.map((name) => <span style={{ display: 'block', marginBottom: -2 }}>{name}</span>)
                )}
                <div className="text-muted" style={{ fontSize: 14 }}>
                    {isCurrent ? statusText : lineCountText}
                </div>
            </div>
            {!isCurrent && (
                <div style={{ display: 'flex', alignItems: 'center', marginRight: -4 }}>
                    <ObjectButton icon={faPenNib} onClick={onEditClick} disabled={isEditing} />
                    <ObjectButton
                        icon={faStar}
                        onClick={onIsolateClick}
                        iconStyle={isolatedObjectId === id ? 'warning' : undefined}
                        disabled={isEditing}
                    />
                    <ObjectButton icon={faTrash} onClick={onDeleteClick} iconStyle="danger" disabled={isEditing} />
                </div>
            )}
        </ListGroupItem>
    )
}

export default ObjectEntry
