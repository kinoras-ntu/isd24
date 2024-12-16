import type { FC } from 'react'
import { Badge, ListGroupItem, type ListGroupItemProps } from 'react-bootstrap'

import { faPenNib, faTrash } from '@fortawesome/free-solid-svg-icons'

import type { Frame } from '@/types/drawing'

import EntryButton from './EntryButton'

interface FrameEntryProps extends ListGroupItemProps {
    index: number
    frame: Frame
    active: boolean
    onEditClick?: () => void
    onDeleteClick?: () => void
}

const FrameEntry: FC<FrameEntryProps> = ({
    index,
    frame,
    active,
    onEditClick = () => console.log('Isolate clicked'),
    onDeleteClick = () => console.log('Delete clicked'),
    ...restProps
}) => {
    return (
        <ListGroupItem
            style={{
                display: 'flex',
                alignItems: 'center',
                paddingBlock: 4,
                paddingInline: 8
            }}
            {...restProps}
        >
            <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <Badge bg={active ? 'primary' : 'secondary'} style={{ marginRight: 8, width: 24 }}>
                    {index + 1}
                </Badge>
                {frame.length === 0 ? 'Empty' : frame.length > 1 ? `${frame.length} lines` : `${frame.length} line`}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginRight: -4 }}>
                <EntryButton icon={faPenNib} onClick={onEditClick} disabled={active} />
                <EntryButton icon={faTrash} onClick={onDeleteClick} iconStyle="danger" disabled={active} />
            </div>
        </ListGroupItem>
    )
}

export default FrameEntry
