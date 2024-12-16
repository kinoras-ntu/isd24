import type { FC } from 'react'
import { ListGroupItem, type ListGroupItemProps } from 'react-bootstrap'
import { useSelector } from 'react-redux'

import { faPenNib, faStar, faTrash } from '@fortawesome/free-solid-svg-icons'

import type { RCObject } from '@/types/drawing'
import type { State } from '@/types/state'

import { poseLandmarks } from '@/constants/mediapipe'

import EntryButton from './EntryButton'

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
    children,
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

    return (
        <ListGroupItem style={{ paddingBlock: 4, paddingInline: 8 }} {...restProps}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                    {nodeNames.length === 0 ? (
                        <span style={{ display: 'block', marginBottom: -2 }}>No node</span>
                    ) : (
                        nodeNames.map((name) => <span style={{ display: 'block', marginBottom: -2 }}>{name}</span>)
                    )}
                    <div className="text-muted" style={{ fontSize: 14 }}>
                        {isCurrent && (isNew ? 'New' : 'Editing')}
                        {isCurrent && tool !== 'Trajectory' && ' · '}
                        {tool !== 'Trajectory' &&
                            (lineCount === 0
                                ? 'Empty drawing'
                                : lineCount > 1
                                  ? `${lineCount} lines`
                                  : `${lineCount} line`)}
                    </div>
                </div>
                {!isCurrent && (
                    <div style={{ display: 'flex', alignItems: 'center', marginRight: -4 }}>
                        <EntryButton icon={faPenNib} onClick={onEditClick} disabled={isEditing} />
                        <EntryButton
                            icon={faStar}
                            onClick={onIsolateClick}
                            iconStyle={isolatedObjectId === id ? 'warning' : undefined}
                            disabled={isEditing}
                        />
                        <EntryButton icon={faTrash} onClick={onDeleteClick} iconStyle="danger" disabled={isEditing} />
                    </div>
                )}
            </div>
            {children}
        </ListGroupItem>
    )
}

export default ObjectEntry
