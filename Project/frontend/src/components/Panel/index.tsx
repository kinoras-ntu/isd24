import type { FC } from 'react'
import { ListGroup, type ListGroupProps } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'

import type { ObjectId } from '@/types/drawing'
import type { State } from '@/types/state'

import FrameList from './FrameList'
import ObjectEntry from './ObjectEntry'
import ObjectList from './ObjectList'

const Panel: FC<ListGroupProps> = ({ ...restProps }) => {
    const tool = useSelector((state: State) => state.tool)
    const currentObject = useSelector((state: State) => state.currentObject)
    const finishedObjects = useSelector((state: State) => state.finishedObjects[tool])
    const isolatedObjectId = useSelector((state: State) => state.isolatedObjectId)

    const dispatch = useDispatch()
    const handleEditClick = (id: ObjectId) => dispatch({ type: 'EDIT_OBJECT', payload: id })
    const handleIsolateClick = (id: ObjectId) =>
        dispatch({ type: 'ISOLATE_OBJECT', payload: isolatedObjectId === id ? undefined : id })
    const handleDeleteClick = (id: ObjectId) => dispatch({ type: 'DELETE_OBJECT', payload: id })

    return (
        <ListGroup data-bs-theme="dark" style={{ display: 'flex', flexDirection: 'column' }} {...restProps}>
            <ObjectList name="Current Drawing">
                <ObjectEntry object={currentObject} isCurrent>
                    {tool === 'Flipbook' && <FrameList />}
                </ObjectEntry>
            </ObjectList>
            <ObjectList name="Finished Drawings" style={{ flex: 1 }}>
                {finishedObjects.map((object) => (
                    <ObjectEntry
                        key={object.id}
                        object={object}
                        onEditClick={() => handleEditClick(object.id)}
                        onIsolateClick={() => handleIsolateClick(object.id)}
                        onDeleteClick={() => handleDeleteClick(object.id)}
                    />
                ))}
            </ObjectList>
        </ListGroup>
    )
}

export default Panel
