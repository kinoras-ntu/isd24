import type { FC } from 'react'
import { Badge, ListGroupItem, type ListGroupItemProps } from 'react-bootstrap'
import { useSelector } from 'react-redux'

import { faPenNib, faStar, faTrash } from '@fortawesome/free-solid-svg-icons'

import type { Frame } from '@/types/drawing'
import type { State } from '@/types/state'

import EntryButton from './EntryButton'

interface FrameEntryProps extends ListGroupItemProps {
    index: number
    frame: Frame
    onEditClick?: () => void
    onIsolateClick?: () => void
    onDeleteClick?: () => void
}

const FrameEntry: FC<FrameEntryProps> = ({
    index,
    frame,
    onEditClick = () => console.log('Edit clicked'),
    onIsolateClick = () => console.log('Isolate clicked'),
    onDeleteClick = () => console.log('Delete clicked'),
    ...restProps
}) => {
    const isEditing = useSelector((state: State) => state.currentObject.id) === '0'
    const isolatedObjectId = useSelector((state: State) => state.isolatedObjectId)

    return (
        <ListGroupItem style={{ display: 'flex', alignItems: 'center', padding: '4px 8px' }} {...restProps}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <Badge bg="secondary" style={{ marginRight: 8, width: 24 }}>
                    {index + 1}
                </Badge>
                {frame.length === 0 ? 'Empty' : frame.length > 1 ? `${frame.length} lines` : `${frame.length} line`}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginRight: -4 }}>
                <EntryButton icon={faPenNib} onClick={onEditClick} disabled={isEditing} />
                <EntryButton
                    icon={faStar}
                    onClick={onIsolateClick}
                    iconStyle={isolatedObjectId === 'id' ? 'warning' : undefined}
                    disabled={isEditing}
                />
                <EntryButton icon={faTrash} onClick={onDeleteClick} iconStyle="danger" disabled={isEditing} />
            </div>
        </ListGroupItem>
    )
}

export default FrameEntry
