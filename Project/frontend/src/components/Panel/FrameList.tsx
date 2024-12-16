import type { FC } from 'react'
import { ListGroup, type ListGroupProps } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'

import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import type { State } from '@/types/state'

import FrameEntry from './FrameEntry'

const FrameList: FC<ListGroupProps> = ({ style, ...restProps }) => {
    const currentObject = useSelector((state: State) => state.currentObject)
    const currentFrameIndex = useSelector((state: State) => state.currentFrameIndex)

    const dispatch = useDispatch()
    const handleEditClick = (index: number) => dispatch({ type: 'SET_CURRENT_FRAME', payload: index })
    const handleDeleteClick = (index: number) => dispatch({ type: 'DELETE_CURRENT_OBJECT_FRAME', payload: index })

    return (
        <ListGroup style={{ marginBlock: 4, ...style }} {...restProps}>
            {currentObject.frames.map((frame, index) => (
                <FrameEntry
                    key={index}
                    index={index}
                    frame={frame}
                    active={index === currentFrameIndex}
                    onEditClick={() => handleEditClick(index)}
                    onDeleteClick={() => handleDeleteClick(index)}
                />
            ))}
            <ListGroup.Item
                onClick={() => dispatch({ type: 'SAVE_FRAME' })}
                disabled={currentObject.refNode.length !== 1}
                style={{ padding: 6, textAlign: 'center', cursor: 'pointer' }}
            >
                <FontAwesomeIcon icon={faPlus} width={12} />
                <span style={{ marginLeft: 8 }}>Frame</span>
            </ListGroup.Item>
        </ListGroup>
    )
}

export default FrameList
